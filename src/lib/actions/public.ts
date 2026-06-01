'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types/actions'

export type LieuPublic = {
  id: string
  nom: string
  ville: string | null
  capacite_max: number | null
  nb_couchages: number | null
  prix_base: number | null
  description: string | null
  equipements: string[] | null
  photo_url: string | null
}

export type FiltresLieux = {
  ville?: string
  capacite_min?: number
  budget_max?: number
  equipements?: string[]
  avec_hebergement?: boolean
}

export async function getLieuxPublics(
  filtres: FiltresLieux,
): Promise<ActionResult<LieuPublic[]>> {
  const supabase = await createClient()

  let query = supabase
    .from('etablissement_profiles')
    .select(
      'id, nom, ville, capacite_max, nb_couchages, prix_base, description, equipements, etablissement_photos(url, est_principale)',
    )
    .eq('actif', true)
    .eq('visible', true)

  if (filtres.ville) {
    query = query.ilike('ville', `%${filtres.ville}%`)
  }
  if (filtres.capacite_min != null) {
    query = query.gte('capacite_max', filtres.capacite_min)
  }
  if (filtres.budget_max != null) {
    query = query.lte('prix_base', filtres.budget_max)
  }
  if (filtres.avec_hebergement) {
    query = query.gt('nb_couchages', 0)
  }
  if (filtres.equipements && filtres.equipements.length > 0) {
    query = query.contains('equipements', filtres.equipements)
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error: error.message }
  }

  type PhotoRow = { url: string; est_principale: boolean | null }

  const lieux: LieuPublic[] = (data ?? []).map((lieu) => {
    const photos = lieu.etablissement_photos as PhotoRow[] | null
    const photo_url =
      photos?.find((p) => p.est_principale)?.url ?? photos?.[0]?.url ?? null
    return {
      id: lieu.id,
      nom: lieu.nom,
      ville: lieu.ville,
      capacite_max: lieu.capacite_max,
      nb_couchages: lieu.nb_couchages,
      prix_base: lieu.prix_base,
      description: lieu.description,
      equipements: lieu.equipements,
      photo_url,
    }
  })

  return { data: lieux, error: null }
}

// ─── Détail d'un lieu ─────────────────────────────────────────────────────────

export type LieuPhoto = {
  id: string
  url: string
  est_principale: boolean | null
  ordre: number | null
}

export type LieuDetail = {
  id: string
  nom: string
  ville: string | null
  adresse: string | null
  code_postal: string | null
  type_lieu: string | null
  description: string | null
  capacite_max: number | null
  nb_couchages: number | null
  nb_chambres: number | null
  nb_salles_de_bain: number | null
  superficie_m2: number | null
  prix_base: number | null
  equipements: string[] | null
  photos: LieuPhoto[]
}

export async function getLieuById(id: string): Promise<LieuDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('etablissement_profiles')
    .select(
      'id, nom, ville, adresse, code_postal, type_lieu, description, capacite_max, nb_couchages, nb_chambres, nb_salles_de_bain, superficie_m2, prix_base, equipements, actif, visible, etablissement_photos(id, url, est_principale, ordre)',
    )
    .eq('id', id)
    .single()

  if (error || !data || !data.actif || !data.visible) return null

  const photos = (data.etablissement_photos as LieuPhoto[] | null) ?? []
  photos.sort((a, b) => (a.ordre ?? 999) - (b.ordre ?? 999))

  return {
    id: data.id,
    nom: data.nom,
    ville: data.ville,
    adresse: data.adresse,
    code_postal: data.code_postal,
    type_lieu: data.type_lieu,
    description: data.description,
    capacite_max: data.capacite_max,
    nb_couchages: data.nb_couchages,
    nb_chambres: data.nb_chambres,
    nb_salles_de_bain: data.nb_salles_de_bain,
    superficie_m2: data.superficie_m2,
    prix_base: data.prix_base,
    equipements: data.equipements,
    photos,
  }
}

// ─── Périodes occupées ────────────────────────────────────────────────────────

export type PeriodeOccupee = {
  date_debut: string
  date_fin: string
}

export async function getReservationsOccupees(
  etablissementId: string,
): Promise<PeriodeOccupee[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('reservations')
    .select('date_debut, date_fin')
    .eq('etablissement_id', etablissementId)
    .neq('statut', 'annulee')

  return data ?? []
}

// ─── Créer une demande de devis + événement ───────────────────────────────────

function mapTypeDemandeDevis(type: string): string {
  const allowed = ['wei', 'soiree', 'ski', 'gala', 'seminaire', 'sportif', 'autre']
  if (allowed.includes(type)) return type
  if (type === 'voyage') return 'autre'
  if (type === 'culturel') return 'autre'
  if (type === 'conference') return 'seminaire'
  if (type === 'atelier') return 'autre'
  return 'autre'
}

function mapTypeEvenement(type: string): string {
  const map: Record<string, string> = {
    voyage: 'autre',
    culturel: 'autre',
    conference: 'seminaire',
    atelier: 'autre',
  }
  return map[type] ?? type
}

export async function createDemandeEtEvenement(input: {
  lieuId: string
  date_debut: string
  date_fin: string
  participants: number
  typeEvenement: string
  message: string
}): Promise<ActionResult<{ evenementId: string }>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Non authentifié.' }

  const { data: bdeId } = await supabase.rpc('get_bde_id')
  if (!bdeId) return { data: null, error: 'Profil BDE introuvable.' }

  const { data: demande, error: demandeError } = await supabase
    .from('demandes_devis')
    .insert({
      bde_id: bdeId,
      etablissement_id: input.lieuId,
      type_evenement: mapTypeDemandeDevis(input.typeEvenement),
      date_debut: input.date_debut,
      date_fin: input.date_fin,
      nb_participants: input.participants,
      message: input.message || null,
      statut: 'en_attente',
    })
    .select('id')
    .single()

  if (demandeError || !demande) {
    return { data: null, error: demandeError?.message ?? 'Erreur lors de la création de la demande.' }
  }

  const { data: evenement, error: evenementError } = await supabase
    .from('evenements')
    .insert({
      bde_id: bdeId,
      nom: `Événement du ${input.date_debut} au ${input.date_fin}`,
      type: mapTypeEvenement(input.typeEvenement),
      date_debut: input.date_debut,
      date_fin: input.date_fin,
      statut: 'brouillon',
    })
    .select('id')
    .single()

  if (evenementError || !evenement) {
    return { data: null, error: evenementError?.message ?? 'Erreur lors de la création de l\'événement.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('evenements') as any)
    .update({ demande_id: demande.id })
    .eq('id', evenement.id)

  return { data: { evenementId: evenement.id }, error: null }
}
