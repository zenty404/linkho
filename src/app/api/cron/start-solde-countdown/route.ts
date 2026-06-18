import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Réservations dont l'événement est terminé mais le compteur solde n'a pas encore démarré
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('id, date_fin, statut, bde_id')
    .in('statut', ['confirmee', 'en_cours'])
    .lt('date_fin', new Date().toISOString().split('T')[0]) // date_fin < today (date only)
    .is('solde_expire_at', null)

  if (error) {
    console.error('[start-solde-countdown] fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!reservations || reservations.length === 0) {
    return NextResponse.json({ mises_a_jour: 0 })
  }

  let mises_a_jour = 0

  await Promise.all(
    reservations.map(async (res) => {
      const dateFin = new Date(res.date_fin)
      const soldeExpireAt = new Date(dateFin)
      soldeExpireAt.setDate(soldeExpireAt.getDate() + 30)

      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          solde_expire_at: soldeExpireAt.toISOString(),
          statut: 'en_cours',
          statut_solde: 'en_attente',
        })
        .eq('id', res.id)

      if (updateError) {
        console.error(`[start-solde-countdown] update error for ${res.id}:`, updateError)
        return
      }

      mises_a_jour++
    }),
  )

  console.log(`[start-solde-countdown] mises_a_jour: ${mises_a_jour}/${reservations.length}`)
  return NextResponse.json({ mises_a_jour })
}
