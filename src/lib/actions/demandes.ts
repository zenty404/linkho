'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/supabase'
import type { ActionResult } from '@/lib/types/actions'

type DemandeDevis = Database['public']['Tables']['demandes_devis']['Row']

export async function createDemande(
  formData: FormData,
): Promise<ActionResult<DemandeDevis>> {
  const etablissement_id = formData.get('etablissement_id') as string
  const type_evenement = (formData.get('type_evenement') as string).trim()
  const date_debut = formData.get('date_debut') as string
  const date_fin = formData.get('date_fin') as string
  const nb_participants = parseInt(formData.get('nb_participants') as string, 10)
  const message = (formData.get('message') as string) || null

  if (!etablissement_id || !type_evenement || !date_debut || !date_fin || isNaN(nb_participants)) {
    return { data: null, error: 'Tous les champs obligatoires sont requis.' }
  }

  const supabase = await createClient()

  const { data: bdeId, error: rpcError } = await supabase.rpc('get_bde_id')
  if (rpcError || !bdeId) {
    console.error('get_bde_id error:', rpcError)
    return { data: null, error: 'Profil BDE introuvable. Vérifiez votre compte.' }
  }

  const { data, error } = await supabase
    .from('demandes_devis')
    .insert({
      bde_id: bdeId,
      etablissement_id,
      type_evenement,
      date_debut,
      date_fin,
      nb_participants,
      message,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('createDemande error:', error)
    return { data: null, error: error?.message ?? 'Erreur lors de la création.' }
  }

  redirect('/bde/demandes')
}

export async function getDemandesByBde(): Promise<ActionResult<DemandeDevis[]>> {
  const supabase = await createClient()

  // DEBUG TEMPORAIRE
  const { data: { user } } = await supabase.auth.getUser()
  console.log('Current user ID:', user?.id)
  const { data: testBdeId, error: testError } = await supabase.rpc('get_bde_id')
  console.log('BDE ID from RPC:', testBdeId, '| RPC error:', testError)
  // FIN DEBUG

  const { data: bdeId, error: rpcError } = await supabase.rpc('get_bde_id')
  if (rpcError || !bdeId) {
    console.error('get_bde_id error:', rpcError)
    return { data: null, error: 'Profil BDE introuvable.' }
  }

  const { data, error } = await supabase
    .from('demandes_devis')
    .select('*')
    .eq('bde_id', bdeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getDemandesByBde error:', error)
    return { data: null, error: error.message }
  }

  return { data: data ?? [], error: null }
}

export async function getDemandesByEtablissement(): Promise<ActionResult<DemandeDevis[]>> {
  const supabase = await createClient()

  const { data: etablissementId, error: rpcError } = await supabase.rpc('get_etablissement_id')
  if (rpcError || !etablissementId) {
    console.error('get_etablissement_id error:', rpcError)
    return { data: null, error: 'Profil établissement introuvable.' }
  }

  const { data, error } = await supabase
    .from('demandes_devis')
    .select('*')
    .eq('etablissement_id', etablissementId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getDemandesByEtablissement error:', error)
    return { data: null, error: error.message }
  }

  return { data: data ?? [], error: null }
}