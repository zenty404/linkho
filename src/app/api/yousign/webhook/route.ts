import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const payload = await request.json()

  const eventName = payload.event_name ?? payload.name
  if (eventName !== 'signer.done') {
    return NextResponse.json({ received: true })
  }

  const signatureRequestId = payload.data?.signature_request?.id
  if (!signatureRequestId) {
    return NextResponse.json({ received: true })
  }

  const adminClient = createAdminClient()
  await adminClient
    .from('devis_prestataires')
    .update({ statut: 'signe', signe_le: new Date().toISOString() })
    .eq('yousign_signature_request_id', signatureRequestId)

  const { data: dp } = await adminClient
    .from('devis_prestataires')
    .select('evenement_id, montant')
    .eq('yousign_signature_request_id', signatureRequestId)
    .maybeSingle()

  if (dp?.evenement_id) {
    const { data: evt } = await adminClient
      .from('evenements')
      .select('demande_id')
      .eq('id', dp.evenement_id)
      .maybeSingle()

    if (evt?.demande_id) {
      const { data: reservation } = await adminClient
        .from('reservations')
        .select('id, acompte_montant, solde_montant, stripe_payment_intent_solde, demande_id')
        .eq('demande_id', evt.demande_id)
        .maybeSingle()

      if (reservation) {
        const { data: devisSignes } = await adminClient
          .from('devis_prestataires')
          .select('montant')
          .eq('evenement_id', dp.evenement_id)
          .eq('statut', 'signe')

        const totalPrestataires = (devisSignes ?? [])
          .reduce((sum, d) => sum + (d.montant ?? 0), 0)

        const montantHebergement = Math.round(reservation.acompte_montant / 0.3 * 100) / 100
        const nouveauSolde = Math.round((montantHebergement * 0.7 + totalPrestataires) * 100) / 100
        const nouveauMontantTtc = Math.round((montantHebergement + totalPrestataires) * 100) / 100

        await adminClient
          .from('reservations')
          .update({
            solde_montant: nouveauSolde,
            montant_ttc: nouveauMontantTtc,
          })
          .eq('id', reservation.id)

        if (reservation.stripe_payment_intent_solde) {
          try {
            const { stripe } = await import('@/lib/stripe')
            await stripe.paymentIntents.update(reservation.stripe_payment_intent_solde, {
              amount: Math.round(nouveauSolde * 100),
            })
          } catch {
            // silent — DB déjà mise à jour
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
