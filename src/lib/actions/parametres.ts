'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/supabase'

type EtabUpdate = Database['public']['Tables']['etablissement_profiles']['Update']

export type ParamState = { success: boolean; error: string | null }

const INIT: ParamState = { success: false, error: null }
export { INIT as PARAM_INIT }

// ─── BDE ──────────────────────────────────────────────────────────────────────

export async function updateProfilBde(
  _prev: ParamState,
  formData: FormData,
): Promise<ParamState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié.' }

  const nom = (formData.get('nom') as string)?.trim()
  const ecole = (formData.get('ecole') as string)?.trim()
  const ville = (formData.get('ville') as string)?.trim() || null
  const telephone = (formData.get('telephone') as string)?.trim() || null

  if (!nom || !ecole) return { success: false, error: 'Nom et école sont requis.' }

  const { error } = await supabase
    .from('bde_profiles')
    .update({ nom, ecole, ville, telephone })
    .eq('user_id', user.id)

  if (error) {
    console.error('updateProfilBde error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

// ─── Établissement ────────────────────────────────────────────────────────────

export async function updateProfilEtablissement(
  _prev: ParamState,
  formData: FormData,
): Promise<ParamState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié.' }

  // Construit le patch à partir des seuls champs présents dans le FormData.
  // On utilise un Record<string, unknown> pour éviter les conflits entre
  // champs non-nullables (nom: string) et nullables (adresse: string | null).
  const raw: Record<string, unknown> = {}

  const str = (key: string) => {
    const v = formData.get(key) as string | null
    return v !== null ? v.trim() || null : undefined
  }
  const num = (key: string) => {
    const v = formData.get(key) as string | null
    return v !== null ? (v.trim() ? parseFloat(v) : null) : undefined
  }
  const int = (key: string) => {
    const v = formData.get(key) as string | null
    return v !== null ? (v.trim() ? parseInt(v, 10) : null) : undefined
  }

  const set = (key: string, val: unknown) => {
    if (val !== undefined) raw[key] = val
  }

  // Informations du lieu
  set('nom', str('nom'))
  set('description', str('description'))
  set('adresse', str('adresse'))
  set('ville', str('ville'))
  set('code_postal', str('code_postal'))
  set('telephone', str('telephone'))
  set('email_contact', str('email_contact'))
  set('site_web', str('site_web'))

  // Capacités et tarifs
  set('capacite_max', int('capacite_max'))
  set('nb_couchages', int('nb_couchages'))
  set('nb_chambres', int('nb_chambres'))
  set('nb_salles_de_bain', int('nb_salles_de_bain'))
  set('superficie_m2', num('superficie_m2'))
  set('prix_base', num('prix_base'))

  const updates = raw as EtabUpdate

  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'Aucune modification détectée.' }
  }

  if ('nom' in updates && !updates.nom) {
    return { success: false, error: 'Le nom du lieu est requis.' }
  }

  const { error } = await supabase
    .from('etablissement_profiles')
    .update(updates)
    .eq('user_id', user.id)

  if (error) {
    console.error('updateProfilEtablissement error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

// ─── IBAN ─────────────────────────────────────────────────────────────────────

export async function updateIban(
  _prev: ParamState,
  formData: FormData,
): Promise<ParamState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié.' }

  const iban = (formData.get('iban') as string)?.trim() || null

  const { error } = await supabase
    .from('etablissement_profiles')
    .update({ iban })
    .eq('user_id', user.id)

  if (error) {
    console.error('updateIban error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}
