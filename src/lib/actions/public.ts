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
