import { createElement } from 'react'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, getBdeEmail } from '@/lib/emails/send'
import { AcompteConfirmeEmail } from '@/emails/acompte-confirme'
import { SoldeConfirmeEmail } from '@/emails/solde-confirme'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.arrayBuffer()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(body),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object
      const { reservationId, type, bdeId } = pi.metadata ?? {}
      if (!reservationId || !type) break

      const adminClient = createAdminClient()

      if (type === 'acompte') {
        await adminClient
          .from('reservations')
          .update({ statut: 'confirmee' })
          .eq('id', reservationId)

        try {
          const bdeEmail = bdeId ? await getBdeEmail(bdeId) : null

          const { data: reservation } = await adminClient
            .from('reservations')
            .select('acompte_montant, demande_id, devis_id')
            .eq('id', reservationId)
            .single()

          let evenementId: string | null = null
          let evenementNom: string | null = null

          const demandeId = reservation?.demande_id
          if (demandeId) {
            const { data: evt } = await adminClient
              .from('evenements')
              .select('id, nom')
              .eq('demande_id', demandeId)
              .maybeSingle()
            evenementId = evt?.id ?? null
            evenementNom = evt?.nom ?? null
          } else if (reservation?.devis_id) {
            const { data: devis } = await adminClient
              .from('devis')
              .select('demande_id')
              .eq('id', reservation.devis_id)
              .single()
            if (devis?.demande_id) {
              const { data: evt } = await adminClient
                .from('evenements')
                .select('id, nom')
                .eq('demande_id', devis.demande_id)
                .maybeSingle()
              evenementId = evt?.id ?? null
              evenementNom = evt?.nom ?? null
            }
          }

          if (bdeEmail && evenementId) {
            await sendEmail(
              bdeEmail,
              'Acompte confirmé — LINKHO',
              createElement(AcompteConfirmeEmail, {
                evenementNom: evenementNom ?? 'votre événement',
                montantAcompte: reservation?.acompte_montant ?? 0,
                evenementId,
              }),
            )
          }
        } catch {
          // email failure must not fail the webhook
        }
      }

      if (type === 'solde') {
        await adminClient
          .from('reservations')
          .update({ statut_solde: 'paye' })
          .eq('id', reservationId)

        try {
          const bdeEmail = bdeId ? await getBdeEmail(bdeId) : null

          const { data: reservation } = await adminClient
            .from('reservations')
            .select('solde_montant, demande_id, devis_id')
            .eq('id', reservationId)
            .single()

          let evenementId: string | null = null
          let evenementNom: string | null = null

          const demandeId = reservation?.demande_id
          if (demandeId) {
            const { data: evt } = await adminClient
              .from('evenements')
              .select('id, nom')
              .eq('demande_id', demandeId)
              .maybeSingle()
            evenementId = evt?.id ?? null
            evenementNom = evt?.nom ?? null
          } else if (reservation?.devis_id) {
            const { data: devis } = await adminClient
              .from('devis')
              .select('demande_id')
              .eq('id', reservation.devis_id)
              .single()
            if (devis?.demande_id) {
              const { data: evt } = await adminClient
                .from('evenements')
                .select('id, nom')
                .eq('demande_id', devis.demande_id)
                .maybeSingle()
              evenementId = evt?.id ?? null
              evenementNom = evt?.nom ?? null
            }
          }

          if (bdeEmail && evenementId) {
            await sendEmail(
              bdeEmail,
              'Solde confirmé — LINKHO',
              createElement(SoldeConfirmeEmail, {
                evenementNom: evenementNom ?? 'votre événement',
                montantSolde: reservation?.solde_montant ?? 0,
                evenementId,
              }),
            )
          }
        } catch {
          // email failure must not fail the webhook
        }
      }

      break
    }

    case 'payment_intent.payment_failed':
      break
  }

  return NextResponse.json({ received: true })
}
