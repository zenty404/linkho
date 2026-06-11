'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type OnboardingState = { error: string | null }

export async function creerProfilBde(
  prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: existingId } = await supabase.rpc('get_bde_id')
  if (existingId) redirect('/bde/dashboard')

  const nom = (formData.get('nom') as string)?.trim()
  const ecole = (formData.get('ecole') as string)?.trim()
  const ville = (formData.get('ville') as string)?.trim() || null
  const telephone = (formData.get('telephone') as string)?.trim() || null

  if (!nom || !ecole) return { error: 'Nom du BDE et école sont obligatoires.' }

  const { error } = await supabase
    .from('bde_profiles')
    .insert({ user_id: user.id, nom, ecole, ville, telephone })

  if (error) {
    console.error('creerProfilBde error:', error)
    return { error: error.message }
  }

  redirect('/en-attente')
}

export async function creerProfilEtablissement(
  prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: existingId } = await supabase.rpc('get_etablissement_id')
  if (existingId) redirect('/etablissement/dashboard')

  const nom = (formData.get('nom') as string)?.trim()
  const adresse = (formData.get('adresse') as string)?.trim() || null
  const ville = (formData.get('ville') as string)?.trim()
  const code_postal = (formData.get('code_postal') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() || null
  const iban = (formData.get('iban') as string)?.trim() || null

  const capaciteRaw = formData.get('capacite_max') as string
  const capacite_max = capaciteRaw ? parseInt(capaciteRaw, 10) : null

  const couchagesRaw = formData.get('nb_couchages') as string
  const nb_couchages = couchagesRaw ? parseInt(couchagesRaw, 10) : null

  const prixRaw = formData.get('prix_base') as string
  const prix_base = prixRaw ? parseFloat(prixRaw) : null

  if (!nom || !adresse || !ville) {
    return { error: 'Nom, adresse et ville sont obligatoires.' }
  }

  const { error } = await supabase.from('etablissement_profiles').insert({
    user_id: user.id,
    nom,
    adresse,
    ville,
    code_postal,
    capacite_max,
    nb_couchages,
    prix_base,
    iban,
    description,
  })

  if (error) {
    console.error('creerProfilEtablissement error:', error)
    return { error: error.message }
  }

  redirect('/en-attente')
}
