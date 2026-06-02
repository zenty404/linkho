'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types/actions'

export type DemandeComplete = {
  id: string
  statut: string
  type_evenement: string
  date_debut: string
  date_fin: string
  nb_participants: number
  message: string | null
  created_at: string
  bde: { nom: string; ecole: string; ville: string | null } | null
  devis: {
    id: string
    numero: string
    statut: string
    sous_total_ht: number
    total_ttc: number | null
    tva_taux: number
    acompte_taux: number
    acompte_montant: number | null
    solde_montant: number | null
    message_client: string | null
    envoye_le: string | null
    items: { id: string; libelle: string; description: string | null; quantite: number; prix_unitaire: number }[]
  } | null
  reservation: {
    id: string
    reference: string
    statut: string
    montant_ttc: number
    acompte_montant: number
    solde_montant: number
    commission_montant: number
    commission_taux: number
    paiements: {
      id: string
      type: string
      montant: number
      reference_virement: string
      confirme: boolean
      confirme_le: string | null
    }[]
  } | null
}

async function buildDemandeComplete(
  supabase: Awaited<ReturnType<typeof createClient>>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  demande: any,
): Promise<DemandeComplete> {
  // Fetch latest non-refused devis with items
  const { data: devisRaw } = await supabase
    .from('devis')
    .select('*, items:devis_items(id, libelle, description, quantite, prix_unitaire)')
    .eq('demande_id', demande.id)
    .neq('statut', 'refuse')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let devis: DemandeComplete['devis'] = null
  if (devisRaw) {
    const ttc = devisRaw.total_ttc ?? null
    devis = {
      id: devisRaw.id,
      numero: devisRaw.numero,
      statut: devisRaw.statut,
      sous_total_ht: devisRaw.sous_total_ht,
      total_ttc: ttc,
      tva_taux: devisRaw.tva_taux,
      acompte_taux: devisRaw.acompte_taux,
      acompte_montant: ttc != null ? ttc * devisRaw.acompte_taux : null,
      solde_montant: ttc != null ? ttc * (1 - devisRaw.acompte_taux) : null,
      message_client: devisRaw.message_client,
      envoye_le: devisRaw.envoye_le,
      items: devisRaw.items ?? [],
    }
  }

  let reservation: DemandeComplete['reservation'] = null
  if (devisRaw) {
    const { data: resRaw } = await supabase
      .from('reservations')
      .select('*, paiements(id, type, montant, reference_virement, confirme, confirme_le)')
      .eq('devis_id', devisRaw.id)
      .maybeSingle()
    if (resRaw) {
      reservation = {
        id: resRaw.id,
        reference: resRaw.reference,
        statut: resRaw.statut,
        montant_ttc: resRaw.montant_ttc,
        acompte_montant: resRaw.acompte_montant,
        solde_montant: resRaw.solde_montant,
        commission_montant: resRaw.commission_montant,
        commission_taux: resRaw.commission_taux,
        paiements: resRaw.paiements ?? [],
      }
    }
  }

  return {
    id: demande.id,
    statut: demande.statut,
    type_evenement: demande.type_evenement,
    date_debut: demande.date_debut,
    date_fin: demande.date_fin,
    nb_participants: demande.nb_participants,
    message: demande.message,
    created_at: demande.created_at,
    bde: demande.bde ?? null,
    devis,
    reservation,
  }
}

export async function getDemandesEtablissement(): Promise<ActionResult<DemandeComplete[]>> {
  const supabase = await createClient()
  const { data: etablissementId } = await supabase.rpc('get_etablissement_id')
  if (!etablissementId) return { data: null, error: 'Profil établissement introuvable.' }

  const { data: demandes, error } = await supabase
    .from('demandes_devis')
    .select('*, bde:bde_profiles(nom, ecole, ville)')
    .eq('etablissement_id', etablissementId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  const results = await Promise.all(
    (demandes ?? []).map((d) => buildDemandeComplete(supabase, d)),
  )
  return { data: results, error: null }
}

export async function getDemandeComplete(id: string): Promise<ActionResult<DemandeComplete>> {
  const supabase = await createClient()
  const { data: etablissementId } = await supabase.rpc('get_etablissement_id')
  if (!etablissementId) return { data: null, error: 'Profil établissement introuvable.' }

  const { data: demande, error } = await supabase
    .from('demandes_devis')
    .select('*, bde:bde_profiles(nom, ecole, ville)')
    .eq('id', id)
    .eq('etablissement_id', etablissementId)
    .single()

  if (error || !demande) return { data: null, error: 'Demande introuvable.' }

  const result = await buildDemandeComplete(supabase, demande)
  return { data: result, error: null }
}
