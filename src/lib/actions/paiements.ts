'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { getBdeEmail } from '@/lib/emails/send'
import type { ActionResult } from '@/lib/types/actions'

export async function uploadJustificatif(
  paiementId: string,
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Non autorisé.' }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { data: null, error: 'Aucun fichier fourni.' }

  const sanitizedName = file.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')

  const path = `${paiementId}/${Date.now()}_${sanitizedName}`

  const { error: uploadError } = await adminClient.storage
    .from('justificatifs')
    .upload(path, file, { upsert: true })

  if (uploadError) return { data: null, error: uploadError.message }

  const { error: updateError } = await supabase
    .from('paiements')
    .update({ justificatif_url: path, justificatif_nom: file.name })
    .eq('id', paiementId)

  if (updateError) return { data: null, error: updateError.message }

  const { data: signedData } = await adminClient.storage
    .from('justificatifs')
    .createSignedUrl(path, 3600)

  return { data: { url: signedData?.signedUrl ?? '' }, error: null }
}

export async function getJustificatifUrl(paiementId: string): Promise<string | null> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: paiement } = await supabase
    .from('paiements')
    .select('justificatif_url')
    .eq('id', paiementId)
    .single()

  if (!paiement?.justificatif_url) return null

  const { data } = await adminClient.storage
    .from('justificatifs')
    .createSignedUrl(paiement.justificatif_url, 3600)

  return data?.signedUrl ?? null
}

async function getOrCreateStripeCustomer(bdeId: string, adminClient: ReturnType<typeof createAdminClient>): Promise<string> {
  const { data: existing } = await adminClient
    .from('reservations')
    .select('stripe_customer_id')
    .eq('bde_id', bdeId)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .maybeSingle()

  if (existing?.stripe_customer_id) return existing.stripe_customer_id

  const email = await getBdeEmail(bdeId)
  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { bdeId },
  })
  return customer.id
}

function extractIbanFromPaymentIntent(pi: Awaited<ReturnType<typeof stripe.paymentIntents.retrieve>>): string | null {
  const addresses = pi.next_action?.display_bank_transfer_instructions?.financial_addresses
  const ibanAddr = addresses?.find((a) => a.type === 'iban')
  return ibanAddr?.iban?.iban ?? null
}

export async function creerPaymentIntentAcompte(
  reservationId: string,
): Promise<ActionResult<{ ibanVirtuel: string; reference: string }>> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Non autorisé.' }

  const { data: bdeId } = await supabase.rpc('get_bde_id')
  if (!bdeId) return { data: null, error: 'Profil BDE introuvable.' }

  const { data: reservation, error: resError } = await adminClient
    .from('reservations')
    .select('id, reference, bde_id, acompte_montant, stripe_payment_intent_acompte, stripe_customer_id')
    .eq('id', reservationId)
    .eq('bde_id', bdeId)
    .single()

  if (resError || !reservation) return { data: null, error: 'Réservation introuvable.' }

  if (reservation.stripe_payment_intent_acompte) {
    const pi = await stripe.paymentIntents.retrieve(reservation.stripe_payment_intent_acompte)
    const iban = extractIbanFromPaymentIntent(pi)
    if (!iban) return { data: null, error: 'IBAN virtuel indisponible.' }
    return { data: { ibanVirtuel: iban, reference: reservation.reference }, error: null }
  }

  const customerId = reservation.stripe_customer_id ?? await getOrCreateStripeCustomer(bdeId, adminClient)

  const pi = await stripe.paymentIntents.create({
    amount: Math.round(reservation.acompte_montant * 100),
    currency: 'eur',
    payment_method_types: ['customer_balance'],
    payment_method_data: { type: 'customer_balance' },
    confirm: true,
    customer: customerId,
    payment_method_options: {
      customer_balance: {
        funding_type: 'bank_transfer',
        bank_transfer: {
          type: 'eu_bank_transfer',
          eu_bank_transfer: { country: 'FR' },
        },
      },
    },
    metadata: { reservationId, type: 'acompte', bdeId },
  })

  const iban = extractIbanFromPaymentIntent(pi)
  if (!iban) return { data: null, error: "Impossible d'obtenir l'IBAN virtuel." }

  await adminClient
    .from('reservations')
    .update({ stripe_payment_intent_acompte: pi.id, stripe_customer_id: customerId })
    .eq('id', reservationId)

  return { data: { ibanVirtuel: iban, reference: reservation.reference }, error: null }
}

export async function creerPaymentIntentSolde(
  reservationId: string,
): Promise<ActionResult<{ ibanVirtuel: string; reference: string }>> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Non autorisé.' }

  const { data: bdeId } = await supabase.rpc('get_bde_id')
  if (!bdeId) return { data: null, error: 'Profil BDE introuvable.' }

  const { data: reservation, error: resError } = await adminClient
    .from('reservations')
    .select('id, reference, bde_id, solde_montant, stripe_payment_intent_solde, stripe_customer_id')
    .eq('id', reservationId)
    .eq('bde_id', bdeId)
    .single()

  if (resError || !reservation) return { data: null, error: 'Réservation introuvable.' }

  if (reservation.stripe_payment_intent_solde) {
    const pi = await stripe.paymentIntents.retrieve(reservation.stripe_payment_intent_solde)
    const iban = extractIbanFromPaymentIntent(pi)
    if (!iban) return { data: null, error: 'IBAN virtuel indisponible.' }
    return { data: { ibanVirtuel: iban, reference: reservation.reference }, error: null }
  }

  const customerId = reservation.stripe_customer_id ?? await getOrCreateStripeCustomer(bdeId, adminClient)

  const pi = await stripe.paymentIntents.create({
    amount: Math.round(reservation.solde_montant * 100),
    currency: 'eur',
    payment_method_types: ['customer_balance'],
    payment_method_data: { type: 'customer_balance' },
    confirm: true,
    customer: customerId,
    payment_method_options: {
      customer_balance: {
        funding_type: 'bank_transfer',
        bank_transfer: {
          type: 'eu_bank_transfer',
          eu_bank_transfer: { country: 'FR' },
        },
      },
    },
    metadata: { reservationId, type: 'solde', bdeId },
  })

  const iban = extractIbanFromPaymentIntent(pi)
  if (!iban) return { data: null, error: "Impossible d'obtenir l'IBAN virtuel." }

  await adminClient
    .from('reservations')
    .update({ stripe_payment_intent_solde: pi.id, stripe_customer_id: customerId })
    .eq('id', reservationId)

  return { data: { ibanVirtuel: iban, reference: reservation.reference }, error: null }
}
