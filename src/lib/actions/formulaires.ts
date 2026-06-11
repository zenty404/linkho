'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/supabase'
import type { ActionResult } from '@/lib/types/actions'

type Formulaire = Database['public']['Tables']['formulaire_inscriptions']['Row']

export type PaiementDetails = {
  iban?: string | null
  ordre?: string | null
  lydia?: string | null
  helloasso?: string | null
}

export type ChampFormulaire = {
  id: string
  type:
    | 'text_court'
    | 'text_long'
    | 'email'
    | 'telephone'
    | 'date'
    | 'nombre'
    | 'selection_unique'
    | 'selection_multiple'
    | 'liste_deroulante'
    | 'oui_non'
    | 'fichier'
    | 'separateur'
  libelle: string
  obligatoire: boolean
  placeholder?: string
  aide?: string
  options?: string[]
  validation?: { min?: number; max?: number }
  ordre: number
}

export async function creerFormulaire(evenementId: string): Promise<ActionResult<Formulaire>> {
  const supabase = await createClient()

  const { data: bdeId, error: rpcError } = await supabase.rpc('get_bde_id')
  if (rpcError || !bdeId) {
    console.error('get_bde_id error:', rpcError)
    return { data: null, error: 'Profil BDE introuvable.' }
  }

  const { data, error } = await supabase
    .from('formulaire_inscriptions')
    .insert({
      bde_id: bdeId,
      evenement_id: evenementId,
      titre: "Formulaire d'inscription",
      champs: [],
    })
    .select()
    .single()

  if (error || !data) {
    console.error('creerFormulaire error:', error)
    return { data: null, error: error?.message ?? 'Erreur création formulaire.' }
  }

  return { data, error: null }
}

export async function getFormulaireByEvenement(
  evenementId: string,
): Promise<ActionResult<Formulaire>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('formulaire_inscriptions')
    .select('*')
    .eq('evenement_id', evenementId)
    .maybeSingle()

  if (error) {
    console.error('getFormulaireByEvenement error:', error)
    return { data: null, error: error.message }
  }

  if (!data) return { data: null, error: 'Aucun formulaire.' }

  return { data, error: null }
}

export async function getFormulaireById(id: string): Promise<ActionResult<Formulaire>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('formulaire_inscriptions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('getFormulaireById error:', error)
    return { data: null, error: error?.message ?? 'Formulaire introuvable.' }
  }

  return { data, error: null }
}

export async function updateFormulaire(
  id: string,
  champs: ChampFormulaire[],
  prix_total: number | null,
  titre: string,
  description: string | null,
  mode_paiement?: string | null,
  paiement_details?: PaiementDetails | null,
  caution_montant?: number | null,
  caution_mode?: string | null,
  caution_swikly_url?: string | null,
  message_confirmation?: string | null,
): Promise<ActionResult<Formulaire>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('formulaire_inscriptions')
    .update({
      champs: champs as unknown as Database['public']['Tables']['formulaire_inscriptions']['Row']['champs'],
      prix_total,
      titre,
      description,
      mode_paiement: mode_paiement ?? null,
      paiement_details: (paiement_details ?? null) as Database['public']['Tables']['formulaire_inscriptions']['Row']['paiement_details'],
      caution_montant: caution_montant ?? null,
      caution_mode: caution_mode ?? null,
      caution_swikly_url: caution_swikly_url ?? null,
      message_confirmation: message_confirmation ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    console.error('updateFormulaire error:', error)
    return { data: null, error: error?.message ?? 'Erreur mise à jour.' }
  }

  return { data, error: null }
}

export async function publierFormulaire(id: string): Promise<ActionResult<Formulaire>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('formulaire_inscriptions')
    .update({ publie: true, publie_le: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    console.error('publierFormulaire error:', error)
    return { data: null, error: error?.message ?? 'Erreur publication.' }
  }

  return { data, error: null }
}

export async function depublierFormulaire(id: string): Promise<ActionResult<Formulaire>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('formulaire_inscriptions')
    .update({ publie: false })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    console.error('depublierFormulaire error:', error)
    return { data: null, error: error?.message ?? 'Erreur dépublication.' }
  }

  return { data, error: null }
}
