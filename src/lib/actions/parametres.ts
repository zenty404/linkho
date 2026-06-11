'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/supabase'
import type { ActionResult } from '@/lib/types/actions'
import type { ParamState } from '@/lib/types/params'

type EtabUpdate = Database['public']['Tables']['etablissement_profiles']['Update']
type EtabPhoto = Database['public']['Tables']['etablissement_photos']['Row']
export type Indisponibilite = Database['public']['Tables']['indisponibilites']['Row']

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

  // Construit le patch dynamiquement — seuls les champs soumis sont mis à jour.
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

  // Type et visibilité
  set('type_lieu', str('type_lieu'))
  const visibleRaw = formData.get('visible') as string | null
  if (visibleRaw !== null) set('visible', visibleRaw === 'true')

  // Capacités et tarifs
  set('capacite_max', int('capacite_max'))
  set('nb_couchages', int('nb_couchages'))
  set('nb_chambres', int('nb_chambres'))
  set('nb_salles_de_bain', int('nb_salles_de_bain'))
  set('superficie_m2', num('superficie_m2'))
  set('prix_base', num('prix_base'))

  // Localisation
  set('latitude', num('latitude'))
  set('longitude', num('longitude'))

  // Coordonnées bancaires
  set('titulaire_compte', str('titulaire_compte'))
  set('iban', str('iban'))
  set('bic', str('bic'))

  // Caution
  set('caution_montant', num('caution_montant'))

  // Informations légales
  set('siret', str('siret'))
  set('forme_juridique', str('forme_juridique'))
  set('capital_social', str('capital_social'))
  set('tva_intracommunautaire', str('tva_intracommunautaire'))
  set('conditions_paiement', str('conditions_paiement'))
  set('delai_validite_devis', int('delai_validite_devis'))

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

// ─── Équipements ──────────────────────────────────────────────────────────────

export async function updateEquipements(
  equipements: string[],
): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Non authentifié.' }

  const { error } = await supabase
    .from('etablissement_profiles')
    .update({ equipements })
    .eq('user_id', user.id)

  if (error) {
    console.error('updateEquipements error:', error)
    return { data: null, error: error.message }
  }

  return { data: null, error: null }
}

export async function updateTagsEquipements(
  tags: string[],
): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Non authentifié.' }

  const { error } = await supabase
    .from('etablissement_profiles')
    .update({ tags_equipements: tags })
    .eq('user_id', user.id)

  if (error) {
    console.error('updateTagsEquipements error:', error)
    return { data: null, error: error.message }
  }

  return { data: null, error: null }
}

export async function updateTypesEvenements(
  types: string[],
): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Non authentifié.' }

  const { error } = await supabase
    .from('etablissement_profiles')
    .update({ types_evenements: types })
    .eq('user_id', user.id)

  if (error) {
    console.error('updateTypesEvenements error:', error)
    return { data: null, error: error.message }
  }

  return { data: null, error: null }
}

// ─── Indisponibilités ─────────────────────────────────────────────────────────

export async function getIndisponibilites(): Promise<ActionResult<Indisponibilite[]>> {
  const supabase = await createClient()
  const { data: etabId } = await supabase.rpc('get_etablissement_id')
  if (!etabId) return { data: null, error: 'Profil établissement introuvable.' }

  const { data, error } = await supabase
    .from('indisponibilites')
    .select('*')
    .eq('etablissement_id', etabId)
    .order('date_debut', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

export async function ajouterIndisponibilite(
  dateDebut: string,
  dateFin: string,
  motif?: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { data: etabId } = await supabase.rpc('get_etablissement_id')
  if (!etabId) return { data: null, error: 'Profil établissement introuvable.' }

  const { error } = await supabase
    .from('indisponibilites')
    .insert({
      etablissement_id: etabId,
      date_debut: dateDebut,
      date_fin: dateFin,
      motif: motif ?? null,
    })

  if (error) {
    console.error('ajouterIndisponibilite error:', error)
    return { data: null, error: error.message }
  }

  return { data: null, error: null }
}

export async function supprimerIndisponibilite(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { data: etabId } = await supabase.rpc('get_etablissement_id')
  if (!etabId) return { data: null, error: 'Profil établissement introuvable.' }

  const { error } = await supabase
    .from('indisponibilites')
    .delete()
    .eq('id', id)
    .eq('etablissement_id', etabId)

  if (error) {
    console.error('supprimerIndisponibilite error:', error)
    return { data: null, error: error.message }
  }

  return { data: null, error: null }
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export async function getPhotosEtablissement(): Promise<ActionResult<EtabPhoto[]>> {
  const supabase = await createClient()

  const { data: etabId } = await supabase.rpc('get_etablissement_id')
  if (!etabId) return { data: null, error: 'Profil établissement introuvable.' }

  const { data, error } = await supabase
    .from('etablissement_photos')
    .select('*')
    .eq('etablissement_id', etabId)
    .order('ordre', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

export async function ajouterPhoto(
  url: string,
  ordre: number,
): Promise<ActionResult<EtabPhoto>> {
  const supabase = await createClient()

  const { data: etabId } = await supabase.rpc('get_etablissement_id')
  if (!etabId) return { data: null, error: 'Profil établissement introuvable.' }

  const { data, error } = await supabase
    .from('etablissement_photos')
    .insert({
      etablissement_id: etabId,
      url,
      ordre,
      est_principale: ordre === 0,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('ajouterPhoto error:', error)
    return { data: null, error: error?.message ?? 'Erreur ajout photo.' }
  }

  return { data, error: null }
}

export async function supprimerPhoto(
  photoId: string,
  url: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient()

  // Extraire le chemin relatif depuis l'URL publique Supabase Storage
  const match = url.match(/\/storage\/v1\/object\/public\/etablissement-photos\/(.+)$/)
  if (match?.[1]) {
    const { error: storageErr } = await supabase.storage
      .from('etablissement-photos')
      .remove([decodeURIComponent(match[1])])
    if (storageErr) console.error('Storage delete error:', storageErr)
  }

  const { error } = await supabase
    .from('etablissement_photos')
    .delete()
    .eq('id', photoId)

  if (error) {
    console.error('supprimerPhoto error:', error)
    return { data: null, error: error.message }
  }

  return { data: null, error: null }
}
