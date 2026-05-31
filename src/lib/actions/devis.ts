'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/supabase'
import type { ActionResult } from '@/lib/types/actions'

type Devis = Database['public']['Tables']['devis']['Row']

export async function createDevis(
  formData: FormData,
): Promise<ActionResult<Devis>> {
  const demande_id = formData.get('demande_id') as string
  const sous_total_ht = parseFloat(formData.get('sous_total_ht') as string)
  const message_client = (formData.get('message_client') as string) || null
  const item_libelle = (formData.get('item_libelle') as string).trim()
  const item_quantite = parseInt(formData.get('item_quantite') as string, 10) || 1
  const item_prix_unitaire = parseFloat(formData.get('item_prix_unitaire') as string)

  if (!demande_id || isNaN(sous_total_ht) || !item_libelle || isNaN(item_prix_unitaire)) {
    return { data: null, error: 'Tous les champs obligatoires sont requis.' }
  }

  const supabase = await createClient()

  const { data: etablissementId, error: rpcError } = await supabase.rpc('get_etablissement_id')
  if (rpcError || !etablissementId) {
    console.error('get_etablissement_id error:', rpcError)
    return { data: null, error: 'Profil établissement introuvable.' }
  }

  // Récupère la demande pour copier bde_id, dates, nb_participants
  const { data: demande, error: demandeError } = await supabase
    .from('demandes_devis')
    .select('bde_id, date_debut, date_fin, nb_participants')
    .eq('id', demande_id)
    .single()

  if (demandeError || !demande) {
    console.error('Demande fetch error:', demandeError)
    return { data: null, error: 'Demande introuvable.' }
  }

  // Récupère le taux de commission (le trigger set_devis_commission_rate le snapshote aussi)
  const { data: etablissement } = await supabase
    .from('etablissement_profiles')
    .select('commission_rate')
    .eq('id', etablissementId)
    .single()

  const commission_taux = etablissement?.commission_rate ?? 0

  // Crée le devis — numero est généré par le trigger generate_devis_numero
  const { data: devisData, error: devisError } = await supabase
    .from('devis')
    .insert({
      demande_id,
      bde_id: demande.bde_id,
      etablissement_id: etablissementId,
      date_evenement_debut: demande.date_debut,
      date_evenement_fin: demande.date_fin,
      nb_participants: demande.nb_participants,
      sous_total_ht,
      message_client,
      commission_taux,
      numero: '', // remplacé par le trigger generate_devis_numero
    })
    .select()
    .single()

  if (devisError || !devisData) {
    console.error('createDevis insert error:', devisError)
    return { data: null, error: devisError?.message ?? 'Erreur lors de la création du devis.' }
  }

  // Crée la ligne de prestation
  const { error: itemError } = await supabase.from('devis_items').insert({
    devis_id: devisData.id,
    libelle: item_libelle,
    quantite: item_quantite,
    prix_unitaire: item_prix_unitaire,
    ordre: 1,
  })

  if (itemError) {
    console.error('createDevis item error:', itemError)
    // Le devis existe déjà — on redirige quand même
  }

  redirect('/etablissement/demandes')
}

export async function getDevisByBde(): Promise<ActionResult<Devis[]>> {
  const supabase = await createClient()

  const { data: bdeId, error: rpcError } = await supabase.rpc('get_bde_id')
  if (rpcError || !bdeId) {
    console.error('get_bde_id error:', rpcError)
    return { data: null, error: 'Profil BDE introuvable.' }
  }

  const { data, error } = await supabase
    .from('devis')
    .select('*')
    .eq('bde_id', bdeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getDevisByBde error:', error)
    return { data: null, error: error.message }
  }

  return { data: data ?? [], error: null }
}
