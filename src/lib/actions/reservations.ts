'use server'

import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/supabase'
import type { ActionResult } from '@/lib/types/actions'
import { sendEmail, getBdeEmail, getEtabEmail } from '@/lib/emails/send'
import { ReservationConfirmeeEmail } from '@/emails/reservation-confirmee'
import { AcompteConfirmeEmail } from '@/emails/acompte-confirme'
import { SoldeConfirmeEmail } from '@/emails/solde-confirme'
import { RappelCommissionEmail } from '@/emails/rappel-commission'
import { CommissionReverseeEmail } from '@/emails/commission-reversee'

type Reservation = Database['public']['Tables']['reservations']['Row']
type Paiement = Database['public']['Tables']['paiements']['Row']

export type ReservationWithDetails = Reservation & {
  devis: { numero: string; message_client: string | null }
  bde: { nom: string; ecole: string }
  etablissement: { nom: string; ville: string | null; iban: string | null }
  paiements: Paiement[]
  evenement_id: string | null
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
    return { data: null, error: 'Devis introuvable ou non accepté.' }
  }

  // Snapshot financier immuable
  const montant_ht = devis.sous_total_ht
  const montant_tva = montant_ht * devis.tva_taux
  const montant_ttc = montant_ht + montant_tva
  const acompte_montant = montant_ttc * devis.acompte_taux
  const solde_montant = montant_ttc * (1 - devis.acompte_taux)

  const { data: etabProfile } = await supabase
    .from('etablissement_profiles')
    .select('taux_commission')
    .eq('id', devis.etablissement_id)
    .single()

  const commission_taux_pct = (etabProfile?.taux_commission ?? 12) / 100
  const commission_montant = Math.round(montant_ttc * commission_taux_pct * 100) / 100

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
      commission_taux: commission_taux_pct,
      commission_montant,
      reference: `LINKHO-${devis.numero}`,
      statut: 'devis_signe',
    })
    .select()
    .single()

  if (resError || !reservation) {
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

  void paiementsError

  // Devis → 'signe'
  const { error: updateError } = await supabase
    .from('devis')
    .update({ statut: 'signe' })
    .eq('id', devisId)

  void updateError

  try {
    const { data: bdeCtx } = await supabase
      .from('bde_profiles')
      .select('nom')
      .eq('id', devis.bde_id)
      .single()
    const etabEmail = await getEtabEmail(devis.etablissement_id)
    if (etabEmail) {
      await sendEmail(
        etabEmail,
        'Réservation confirmée',
        createElement(ReservationConfirmeeEmail, {
          bdeNom: bdeCtx?.nom ?? 'BDE',
          dateDebut: devis.date_evenement_debut,
          dateFin: devis.date_evenement_fin,
          demandeId: devis.demande_id ?? '',
        }),
      )
    }
  } catch (e) {
  }

  return { data: reservation, error: null }
}

// ─── Lecture ─────────────────────────────────────────────────────────────────

export async function getReservationsByBde(): Promise<ActionResult<ReservationWithDetails[]>> {
  const supabase = await createClient()

  const { data: bdeId, error: rpcError } = await supabase.rpc('get_bde_id')
  if (rpcError || !bdeId) {
    return { data: null, error: 'Profil BDE introuvable.' }
  }

  const { data, error } = await supabase
    .from('reservations')
    .select(SELECT)
    .eq('bde_id', bdeId)
    .order('created_at', { ascending: false })

  if (error) {
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
    return { data: null, error: 'Profil établissement introuvable.' }
  }

  const { data, error } = await supabase
    .from('reservations')
    .select(SELECT)
    .eq('etablissement_id', etablissementId)
    .order('created_at', { ascending: false })

  if (error) {
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
    return { data: null, error: error?.message ?? 'Erreur confirmation paiement.' }
  }

  // Mise à jour statut réservation selon le type
  if (paiement?.reservation_id) {
    let newStatut: string | null = null
    if (paiement.type === 'acompte') newStatut = 'acompte_confirme'
    else if (paiement.type === 'solde') newStatut = 'en_cours'
    else if (paiement.type === 'commission') newStatut = 'commission_reversee'

    if (newStatut) {
      await supabase
        .from('reservations')
        .update({ statut: newStatut })
        .eq('id', paiement.reservation_id)
    }
  }

  try {
    if (paiement?.reservation_id && (paiement.type === 'acompte' || paiement.type === 'solde')) {
      const { data: res } = await supabase
        .from('reservations')
        .select('bde_id, etablissement_id, acompte_montant, solde_montant, commission_montant, devis_id')
        .eq('id', paiement.reservation_id)
        .single()

      if (res) {
        const { data: devisCtx } = await supabase
          .from('devis')
          .select('demande_id')
          .eq('id', res.devis_id ?? '')
          .single()
        const { data: evt } = await supabase
          .from('evenements')
          .select('id, nom')
          .eq('bde_id', res.bde_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (paiement.type === 'acompte') {
          const bdeEmail = await getBdeEmail(res.bde_id)
          if (bdeEmail) {
            await sendEmail(
              bdeEmail,
              'Acompte confirmé — Facture disponible',
              createElement(AcompteConfirmeEmail, {
                evenementNom: evt?.nom ?? 'votre événement',
                montantAcompte: res.acompte_montant,
                evenementId: evt?.id ?? '',
              }),
            )
          }
        } else {
          const [bdeEmail, etabEmail] = await Promise.all([
            getBdeEmail(res.bde_id),
            getEtabEmail(res.etablissement_id),
          ])
          if (bdeEmail) {
            await sendEmail(
              bdeEmail,
              'Solde confirmé — Facture disponible',
              createElement(SoldeConfirmeEmail, {
                evenementNom: evt?.nom ?? 'votre événement',
                montantSolde: res.solde_montant,
                evenementId: evt?.id ?? '',
              }),
            )
          }
          if (etabEmail) {
            await sendEmail(
              etabEmail,
              'Rappel — Commission LINKHO à reverser',
              createElement(RappelCommissionEmail, {
                montantCommission: res.commission_montant,
                demandeId: devisCtx?.demande_id ?? '',
              }),
            )
          }
        }
      }
    }
  } catch (e) {
  }

  return { data, error: null }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getReservationsAdmin(): Promise<ActionResult<ReservationWithDetails[]>> {
  const supabase = await createClient()

  const { data: role } = await supabase.rpc('get_user_role')
  if (role !== 'admin') return { data: null, error: 'Non autorisé.' }

  const { data, error } = await supabase
    .from('reservations')
    .select(SELECT)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  const reservations = (data ?? []) as unknown as ReservationWithDetails[]

  // Résoudre l'evenement_id pour chaque réservation :
  // - workflow standard : evenements.reservation_id = reservation.id
  // - nouveau workflow  : evenements.demande_id = reservation.demande_id
  if (reservations.length > 0) {
    const reservationIds = reservations.map((r) => r.id)
    const demandeIds = reservations.map((r) => r.demande_id).filter(Boolean) as string[]

    const [{ data: evtByRes }, { data: evtByDemande }] = await Promise.all([
      supabase
        .from('evenements')
        .select('id, reservation_id')
        .in('reservation_id', reservationIds),
      demandeIds.length > 0
        ? supabase
            .from('evenements')
            .select('id, demande_id')
            .in('demande_id', demandeIds)
        : Promise.resolve({ data: [] }),
    ])

    const map = new Map<string, string>()

    // Workflow standard : clé = reservation.id
    ;(evtByRes ?? []).forEach((e) => {
      if (e.reservation_id) map.set(e.reservation_id, e.id)
    })

    // Nouveau workflow : clé = reservation.id retrouvé via demande_id
    const demandeToRes = new Map(
      reservations
        .filter((r) => r.demande_id)
        .map((r) => [r.demande_id as string, r.id]),
    )
    ;((evtByDemande ?? []) as unknown as { id: string; demande_id: string }[]).forEach((e) => {
      const resId = demandeToRes.get(e.demande_id)
      if (resId && !map.has(resId)) map.set(resId, e.id)
    })

    reservations.forEach((r) => {
      r.evenement_id = map.get(r.id) ?? null
    })
  }

  return { data: reservations, error: null }
}

export async function cloturerReservation(reservationId: string): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const { data: role } = await supabase.rpc('get_user_role')
  if (role !== 'admin') return { data: null, error: 'Non autorisé.' }

  const { data: reservation } = await supabase
    .from('reservations')
    .select('statut')
    .eq('id', reservationId)
    .single()

  if (!reservation) return { data: null, error: 'Réservation introuvable.' }
  if (reservation.statut !== 'commission_reversee') return { data: null, error: 'Statut invalide.' }

  const { error } = await supabase
    .from('reservations')
    .update({ statut: 'terminee' })
    .eq('id', reservationId)

  if (error) return { data: null, error: error.message }

  try {
    const { data: res } = await supabase
      .from('reservations')
      .select('montant_ttc, bde:bde_profiles(nom), etablissement:etablissement_profiles(nom)')
      .eq('id', reservationId)
      .single()
    if (res) {
      await sendEmail(
        'admin@linkho.fr',
        `Commission reçue — ${(res.etablissement as { nom: string } | null)?.nom ?? ''}`,
        createElement(CommissionReverseeEmail, {
          etabNom: (res.etablissement as { nom: string } | null)?.nom ?? '',
          bdeNom: (res.bde as { nom: string } | null)?.nom ?? '',
          montantReservation: res.montant_ttc,
          date: new Date().toISOString(),
        }),
      )
    }
  } catch (e) {
  }

  return { data: null, error: null }
}
