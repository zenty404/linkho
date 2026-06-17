import { createElement } from 'react'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, getBdeEmail, getEtabEmail } from '@/lib/emails/send'
import { ReservationExpireeBdeEmail } from '@/emails/reservation-expiree-bde'
import { ReservationExpireeEtabEmail } from '@/emails/reservation-expiree-etab'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: expired, error } = await supabase
    .from('reservations')
    .select('id, bde_id, etablissement_id, date_debut, date_fin, demande_id, bde:bde_profiles(nom), etablissement:etablissement_profiles(nom)')
    .eq('statut', 'en_attente_acompte')
    .lt('expire_at', new Date().toISOString())

  if (error) {
    console.error('[expire-reservations] fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!expired || expired.length === 0) {
    return NextResponse.json({ annulees: 0 })
  }

  type BdeJoin = { nom: string }
  type EtabJoin = { nom: string }

  let annulees = 0

  await Promise.all(
    expired.map(async (res) => {
      const bdeJoin = res.bde as BdeJoin | null
      const etabJoin = res.etablissement as EtabJoin | null
      const bdeNom = bdeJoin?.nom ?? ''
      const etabNom = etabJoin?.nom ?? ''

      // Annuler la réservation
      const { error: updateResError } = await supabase
        .from('reservations')
        .update({ statut: 'annulee' })
        .eq('id', res.id)

      if (updateResError) {
        console.error(`[expire-reservations] update reservation ${res.id} error:`, updateResError)
        return
      }

      // Remettre la demande en_attente pour libérer les dates
      if (res.demande_id) {
        await supabase
          .from('demandes_devis')
          .update({ statut_disponibilite: 'en_attente', statut: 'en_attente' })
          .eq('id', res.demande_id)
      }

      annulees++

      // Emails
      try {
        const [bdeEmail, etabEmail] = await Promise.all([
          getBdeEmail(res.bde_id),
          getEtabEmail(res.etablissement_id),
        ])

        if (bdeEmail) {
          await sendEmail(
            bdeEmail,
            'Votre réservation a expiré — LINKHO',
            createElement(ReservationExpireeBdeEmail, {
              etabNom,
              bdeNom,
              dateDebut: res.date_debut,
              dateFin: res.date_fin,
            }),
          )
        }

        if (etabEmail) {
          await sendEmail(
            etabEmail,
            'La réservation a expiré — dates remises à disposition',
            createElement(ReservationExpireeEtabEmail, {
              etabNom,
              bdeNom,
              dateDebut: res.date_debut,
              dateFin: res.date_fin,
            }),
          )
        }
      } catch (e) {
        console.error(`[expire-reservations] email error for reservation ${res.id}:`, e)
      }
    }),
  )

  console.log(`[expire-reservations] annulées: ${annulees}/${expired.length}`)
  return NextResponse.json({ annulees })
}
