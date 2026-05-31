'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/supabase'
import type { ActionResult } from '@/lib/types/actions'

type Reservation = Database['public']['Tables']['reservations']['Row']
type Paiement = Database['public']['Tables']['paiements']['Row']

export type ReservationWithDetails = Reservation & {
  devis: { numero: string; message_client: string | null }
  bde: { nom: string; ecole: string }
  etablissement: { nom: string; ville: string | null; iban: string | null }
  paiements: Paiement[]
}

const SELECT = `
  *,
  devis:devis(numero, message_client),
  bde:bde_profiles(nom, ecole),
  etablissement:etablissement_profiles(nom, ville, iban),
  paiements(*)
`

// ─── Création ────────────────────────────────────────────────────────────────

export async function creerReservation(devisId: string): Promise<ActionResult<Reservation>> {
  const supabase = await createClient()

  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .select('*')
    .eq('id', devisId)
    .eq('statut', 'accepte')
    .single()

  if (devisError || !devis) {
    console.error('creerReservation - devis:', devisError)
    return { data: null, error: 'Devis introuvable ou non accepté.' }
  }

  // Snapshot financier immuable
  const montant_ht = devis.sous_total_ht
  const montant_tva = montant_ht * devis.tva_taux
  const montant_ttc = montant_ht + montant_tva
  const acompte_montant = montant_ttc * devis.acompte_taux
  const solde_montant = montant_ttc * (1 - devis.acompte_taux)
  const commission_montant = montant_ttc * devis.commission_taux

  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .insert({
      devis_id: devisId,
      bde_id: devis.bde_id,
      etablissement_id: devis.etablissement_id,
      date_debut: devis.date_evenement_debut,
      date_fin: devis.date_evenement_fin,
      nb_participants: devis.nb_participants,
      montant_ht,
      montant_tva,
      montant_ttc,
      acompte_montant,
      solde_montant,
      commission_taux: devis.commission_taux,
      commission_montant,
      reference: `LINKHO-${devis.numero}`,
      statut: 'devis_signe',
    })
    .select()
    .single()

  if (resError || !reservation) {
    console.error('creerReservation - insert:', resError)
    return { data: null, error: resError?.message ?? 'Erreur création réservation.' }
  }

  // 3 entrées de paiement avec références de virement
  const { error: paiementsError } = await supabase.from('paiements').insert([
    {
      reservation_id: reservation.id,
      type: 'acompte',
      montant: acompte_montant,
      reference_virement: `LINKHO-${devis.numero}-ACOMPTE`,
    },
    {
      reservation_id: reservation.id,
      type: 'solde',
      montant: solde_montant,
      reference_virement: `LINKHO-${devis.numero}-SOLDE`,
    },
    {
      reservation_id: reservation.id,
      type: 'commission',
      montant: commission_montant,
      reference_virement: `LINKHO-${devis.numero}-COMMISSION`,
    },
  ])

  if (paiementsError) console.error('creerReservation - paiements:', paiementsError)

  // Devis → 'signe'
  const { error: updateError } = await supabase
    .from('devis')
    .update({ statut: 'signe' })
    .eq('id', devisId)

  if (updateError) console.error('creerReservation - devis update:', updateError)

  return { data: reservation, error: null }
}

// ─── Lecture ─────────────────────────────────────────────────────────────────

export async function getReservationsByBde(): Promise<ActionResult<ReservationWithDetails[]>> {
  const supabase = await createClient()

  const { data: bdeId, error: rpcError } = await supabase.rpc('get_bde_id')
  if (rpcError || !bdeId) {
    console.error('get_bde_id error:', rpcError)
    return { data: null, error: 'Profil BDE introuvable.' }
  }

  const { data, error } = await supabase
    .from('reservations')
    .select(SELECT)
    .eq('bde_id', bdeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getReservationsByBde error:', error)
    return { data: null, error: error.message }
  }

  return { data: (data ?? []) as unknown as ReservationWithDetails[], error: null }
}

export async function getReservationsByEtablissement(): Promise<
  ActionResult<ReservationWithDetails[]>
> {
  const supabase = await createClient()

  const { data: etablissementId, error: rpcError } = await supabase.rpc('get_etablissement_id')
  if (rpcError || !etablissementId) {
    console.error('get_etablissement_id error:', rpcError)
    return { data: null, error: 'Profil établissement introuvable.' }
  }

  const { data, error } = await supabase
    .from('reservations')
    .select(SELECT)
    .eq('etablissement_id', etablissementId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getReservationsByEtablissement error:', error)
    return { data: null, error: error.message }
  }

  return { data: (data ?? []) as unknown as ReservationWithDetails[], error: null }
}

export async function getReservationById(id: string): Promise<ActionResult<ReservationWithDetails>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reservations')
    .select(SELECT)
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('getReservationById error:', error)
    return { data: null, error: error?.message ?? 'Réservation introuvable.' }
  }

  return { data: data as unknown as ReservationWithDetails, error: null }
}

// ─── Confirmation paiement ────────────────────────────────────────────────────

export async function confirmerPaiement(paiementId: string): Promise<ActionResult<Paiement>> {
  const supabase = await createClient()

  const { data: paiement } = await supabase
    .from('paiements')
    .select('reservation_id, type')
    .eq('id', paiementId)
    .single()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('paiements')
    .update({
      confirme: true,
      confirme_le: new Date().toISOString(),
      confirme_par: user?.id ?? null,
    })
    .eq('id', paiementId)
    .select()
    .single()

  if (error || !data) {
    console.error('confirmerPaiement error:', error)
    return { data: null, error: error?.message ?? 'Erreur confirmation paiement.' }
  }

  // Mise à jour statut réservation selon le type
  if (paiement?.reservation_id) {
    let newStatut: string | null = null
    if (paiement.type === 'acompte') newStatut = 'acompte_confirme'
    else if (paiement.type === 'commission') newStatut = 'terminee'

    if (newStatut) {
      await supabase
        .from('reservations')
        .update({ statut: newStatut })
        .eq('id', paiement.reservation_id)
    }
  }

  return { data, error: null }
}
