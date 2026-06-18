import { createElement } from 'react'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, getBdeEmail } from '@/lib/emails/send'
import { RappelSoldeBdeEmail } from '@/emails/rappel-solde-bde'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Seuils de rappel en jours restants
const SEUILS = [
  { joursRestants: 15, statutActuel: 'en_attente',  statutApres: 'rappel_j15' },
  { joursRestants: 5,  statutActuel: 'rappel_j15',  statutApres: 'rappel_j25' },
  { joursRestants: 1,  statutActuel: 'rappel_j25',  statutApres: 'rappel_final' },
] as const

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()

  let rappels_envoyes = 0

  for (const seuil of SEUILS) {
    // Date limite = maintenant + joursRestants jours → toutes les réservations
    // dont solde_expire_at ≤ cette limite et statut_solde = seuil.statutActuel
    const limite = new Date(now)
    limite.setDate(limite.getDate() + seuil.joursRestants)

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select(
        'id, bde_id, etablissement_id, solde_montant, solde_expire_at, demande_id, devis_id, etablissement:etablissement_profiles(nom)',
      )
      .not('solde_expire_at', 'is', null)
      .eq('statut_solde', seuil.statutActuel)
      .lte('solde_expire_at', limite.toISOString())
      .gt('solde_expire_at', now.toISOString()) // pas encore expiré

    if (error) {
      console.error(`[rappels-solde] fetch error (seuil ${seuil.joursRestants}j):`, error)
      continue
    }

    if (!reservations || reservations.length === 0) continue

    // Vérifier que le solde n'est pas déjà confirmé
    const reservationIds = reservations.map((r) => r.id)
    const { data: paiementsConfirmes } = await supabase
      .from('paiements')
      .select('reservation_id')
      .in('reservation_id', reservationIds)
      .eq('type', 'solde')
      .eq('confirme', true)

    const soldePaids = new Set((paiementsConfirmes ?? []).map((p) => p.reservation_id))

    // Résoudre evenement_id via reservation_id ou demande_id
    const { data: evtByRes } = await supabase
      .from('evenements')
      .select('id, reservation_id')
      .in('reservation_id', reservationIds)

    const demandeIds = reservations.map((r) => r.demande_id).filter(Boolean) as string[]
    const { data: evtByDemande } = demandeIds.length > 0
      ? await supabase
          .from('evenements')
          .select('id, demande_id')
          .in('demande_id', demandeIds)
      : { data: [] }

    const evtMap = new Map<string, string>()
    ;(evtByRes ?? []).forEach((e) => { if (e.reservation_id) evtMap.set(e.reservation_id, e.id) })

    const demandeToRes = new Map(
      reservations.filter((r) => r.demande_id).map((r) => [r.demande_id as string, r.id]),
    )
    ;((evtByDemande ?? []) as unknown as { id: string; demande_id: string }[]).forEach((e) => {
      const resId = demandeToRes.get(e.demande_id)
      if (resId && !evtMap.has(resId)) evtMap.set(resId, e.id)
    })

    await Promise.all(
      reservations
        .filter((res) => !soldePaids.has(res.id))
        .map(async (res) => {
          const etabJoin = res.etablissement as { nom: string } | null
          const etabNom = etabJoin?.nom ?? 'l\'établissement'
          const evenementId = evtMap.get(res.id) ?? ''
          const expireAt = res.solde_expire_at as string
          const msRestants = new Date(expireAt).getTime() - now.getTime()
          const joursRestants = Math.max(1, Math.ceil(msRestants / 86400000))

          // Mise à jour statut avant l'email pour éviter les doublons si l'email échoue
          const { error: updateError } = await supabase
            .from('reservations')
            .update({ statut_solde: seuil.statutApres })
            .eq('id', res.id)

          if (updateError) {
            console.error(`[rappels-solde] update error for ${res.id}:`, updateError)
            return
          }

          try {
            const bdeEmail = await getBdeEmail(res.bde_id)
            if (bdeEmail && evenementId) {
              await sendEmail(
                bdeEmail,
                `Rappel — Solde à régler (${joursRestants} jour${joursRestants > 1 ? 's' : ''} restant${joursRestants > 1 ? 's' : ''})`,
                createElement(RappelSoldeBdeEmail, {
                  etabNom,
                  soldeMonant: res.solde_montant,
                  expireAt,
                  joursRestants,
                  evenementId,
                }),
              )
              rappels_envoyes++
            }
          } catch (e) {
            console.error(`[rappels-solde] email error for ${res.id}:`, e)
          }
        }),
    )
  }

  console.log(`[rappels-solde] rappels_envoyes: ${rappels_envoyes}`)
  return NextResponse.json({ rappels_envoyes })
}
