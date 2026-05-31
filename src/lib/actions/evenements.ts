'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/supabase'
import type { ActionResult } from '@/lib/types/actions'

type Evenement = Database['public']['Tables']['evenements']['Row']

export async function creerEvenement(formData: FormData): Promise<ActionResult<Evenement>> {
  const nom = (formData.get('nom') as string).trim()
  const type = formData.get('type') as string
  const date_debut = (formData.get('date_debut') as string) || null
  const date_fin = (formData.get('date_fin') as string) || null
  const nbPlaces = formData.get('nb_places_max') as string
  const nb_places_max = nbPlaces ? parseInt(nbPlaces, 10) : null
  const description = (formData.get('description') as string) || null

  if (!nom || !type) {
    return { data: null, error: 'Nom et type sont requis.' }
  }

  const supabase = await createClient()

  const { data: bdeId, error: rpcError } = await supabase.rpc('get_bde_id')
  if (rpcError || !bdeId) {
    console.error('get_bde_id error:', rpcError)
    return { data: null, error: 'Profil BDE introuvable.' }
  }

  const { data, error } = await supabase
    .from('evenements')
    .insert({ bde_id: bdeId, nom, type, date_debut, date_fin, nb_places_max, description })
    .select()
    .single()

  if (error || !data) {
    console.error('creerEvenement error:', error)
    return { data: null, error: error?.message ?? 'Erreur création événement.' }
  }

  redirect(`/bde/evenements/${data.id}`)
}

export async function getEvenementsByBde(): Promise<ActionResult<Evenement[]>> {
  const supabase = await createClient()

  const { data: bdeId, error: rpcError } = await supabase.rpc('get_bde_id')
  if (rpcError || !bdeId) {
    console.error('get_bde_id error:', rpcError)
    return { data: null, error: 'Profil BDE introuvable.' }
  }

  const { data, error } = await supabase
    .from('evenements')
    .select('*')
    .eq('bde_id', bdeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getEvenementsByBde error:', error)
    return { data: null, error: error.message }
  }

  return { data: data ?? [], error: null }
}

export async function getEvenementById(id: string): Promise<ActionResult<Evenement>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('evenements')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('getEvenementById error:', error)
    return { data: null, error: error?.message ?? 'Événement introuvable.' }
  }

  return { data, error: null }
}
