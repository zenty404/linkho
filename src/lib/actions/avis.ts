'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types/actions'

export type AvisLieu = {
  id: string
  note: number
  commentaire: string | null
  created_at: string
  bde: { nom: string; ecole: string } | null
}

export type AvisLinkho = {
  id: string
  note: number
  commentaire: string | null
  created_at: string
  bde: { nom: string; ecole: string } | null
}

// ─── Lecture publique ─────────────────────────────────────────────────────────

export async function getAvisLieu(etablissementId: string): Promise<ActionResult<AvisLieu[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('avis_lieux')
    .select('id, note, commentaire, created_at, bde:bde_profiles(nom, ecole)')
    .eq('etablissement_id', etablissementId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  return {
    data: (data ?? []).map((a) => ({
      ...a,
      bde: a.bde as AvisLieu['bde'],
    })),
    error: null,
  }
}

export async function getAvisLinkho(): Promise<ActionResult<AvisLinkho[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('avis_linkho')
    .select('id, note, commentaire, created_at, bde:bde_profiles(nom, ecole)')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  return {
    data: (data ?? []).map((a) => ({
      ...a,
      bde: a.bde as AvisLinkho['bde'],
    })),
    error: null,
  }
}

// ─── Écriture BDE ─────────────────────────────────────────────────────────────

export async function laisserAvisLieu(
  evenementId: string,
  note: number,
  commentaire?: string,
): Promise<ActionResult<null>> {
  if (note < 1 || note > 5) return { data: null, error: 'La note doit être entre 1 et 5.' }

  const supabase = await createClient()

  const { data: bdeId } = await supabase.rpc('get_bde_id')
  if (!bdeId) return { data: null, error: 'Profil BDE introuvable.' }

  // Vérifier que l'événement appartient au BDE
  const { data: evt } = await supabase
    .from('evenements')
    .select('id, reservation_id, demande_id, bde_id')
    .eq('id', evenementId)
    .eq('bde_id', bdeId)
    .single()

  if (!evt) return { data: null, error: 'Événement introuvable.' }

  // Résoudre la réservation :
  // - ancien workflow : evenements.reservation_id
  // - nouveau workflow : reservations.demande_id = evenements.demande_id
  let reservation: { id: string; statut: string; etablissement_id: string } | null = null

  if (evt.reservation_id) {
    const { data } = await supabase
      .from('reservations')
      .select('id, statut, etablissement_id')
      .eq('id', evt.reservation_id)
      .maybeSingle()
    reservation = data
  }

  if (!reservation && evt.demande_id) {
    const { data } = await supabase
      .from('reservations')
      .select('id, statut, etablissement_id')
      .eq('demande_id', evt.demande_id)
      .maybeSingle()
    reservation = data
  }

  if (!reservation) return { data: null, error: 'Aucune réservation liée à cet événement.' }
  if (!['terminee', 'commission_reversee'].includes(reservation.statut)) {
    return { data: null, error: "L'événement doit être terminé pour laisser un avis." }
  }

  // etablissement_id : depuis la réservation, ou depuis la demande en dernier recours
  let etablissementId = reservation.etablissement_id
  if (!etablissementId && evt.demande_id) {
    const { data: demande } = await supabase
      .from('demandes_devis')
      .select('etablissement_id')
      .eq('id', evt.demande_id)
      .maybeSingle()
    etablissementId = demande?.etablissement_id ?? ''
  }
  if (!etablissementId) return { data: null, error: "Établissement introuvable." }

  // Vérifier unicité (pas déjà laissé un avis pour cet événement)
  const { data: existing } = await supabase
    .from('avis_lieux')
    .select('id')
    .eq('evenement_id', evenementId)
    .eq('bde_id', bdeId)
    .maybeSingle()

  if (existing) return { data: null, error: 'Vous avez déjà laissé un avis pour cet événement.' }

  const { error } = await supabase.from('avis_lieux').insert({
    evenement_id: evenementId,
    bde_id: bdeId,
    etablissement_id: etablissementId,
    note,
    commentaire: commentaire?.trim() || null,
  })

  if (error) return { data: null, error: error.message }

  return { data: null, error: null }
}

export async function laisserAvisLinkho(
  note: number,
  commentaire?: string,
): Promise<ActionResult<null>> {
  if (note < 1 || note > 5) return { data: null, error: 'La note doit être entre 1 et 5.' }

  const supabase = await createClient()

  const { data: bdeId } = await supabase.rpc('get_bde_id')
  if (!bdeId) return { data: null, error: 'Profil BDE introuvable.' }

  const { error } = await supabase.from('avis_linkho').insert({
    bde_id: bdeId,
    note,
    commentaire: commentaire?.trim() || null,
  })

  if (error) return { data: null, error: error.message }

  return { data: null, error: null }
}
