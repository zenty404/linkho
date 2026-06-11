'use server'

import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types/actions'
import { sendEmail, getEtabEmail } from '@/lib/emails/send'
import { NouvelleDemandEmail } from '@/emails/nouvelle-demande'

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
  tags_equipements?: string[]
  types_evenements?: string[]
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
  if (filtres.tags_equipements && filtres.tags_equipements.length > 0) {
    query = query.contains('tags_equipements', filtres.tags_equipements)
  }
  if (filtres.types_evenements && filtres.types_evenements.length > 0) {
    query = query.overlaps('types_evenements', filtres.types_evenements)
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
  types_evenements: string[] | null
  photos: LieuPhoto[]
}

export async function getLieuById(id: string): Promise<LieuDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('etablissement_profiles')
    .select(
      'id, nom, ville, adresse, code_postal, type_lieu, description, capacite_max, nb_couchages, nb_chambres, nb_salles_de_bain, superficie_m2, prix_base, equipements, types_evenements, actif, visible, etablissement_photos(id, url, est_principale, ordre)',
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
    types_evenements: data.types_evenements,
    photos,
  }
}

// ─── Périodes occupées ────────────────────────────────────────────────────────

export type PeriodeOccupee = {
  date_debut: string
  date_fin: string
}

const STATUTS_BLOQUANTS = [
  'devis_signe',
  'acompte_en_attente',
  'acompte_confirme',
  'confirmee',
  'en_cours',
]

export async function getReservationsOccupees(
  etablissementId: string,
): Promise<PeriodeOccupee[]> {
  const supabase = await createClient()

  const [{ data: reservations }, { data: indispos }] = await Promise.all([
    supabase
      .from('reservations')
      .select('devis(date_evenement_debut, date_evenement_fin)')
      .eq('etablissement_id', etablissementId)
      .in('statut', STATUTS_BLOQUANTS),
    supabase
      .from('indisponibilites')
      .select('date_debut, date_fin')
      .eq('etablissement_id', etablissementId),
  ])

  type DevisRow = { date_evenement_debut: string; date_evenement_fin: string }

  const fromReservations: PeriodeOccupee[] = (reservations ?? []).flatMap((r) => {
    const d = r.devis as DevisRow | null
    if (!d) return []
    return [{ date_debut: d.date_evenement_debut, date_fin: d.date_evenement_fin }]
  })

  const fromIndispos: PeriodeOccupee[] = (indispos ?? []).map((i) => ({
    date_debut: i.date_debut,
    date_fin: i.date_fin,
  }))

  return [...fromReservations, ...fromIndispos]
}

// ─── Mapping type événement BDE → valeur prédéfinie ──────────────────────────

const TYPE_EVT_MAP: Record<string, string> = {
  wei: 'WEI',
  soiree: 'Soirée',
  gala: 'Gala',
  seminaire: 'Séminaire',
  weekend: 'Week-end',
  integration: "Journée d'intégration",
  autre: 'Autre',
  ski: 'Week-end',
  sportif: 'Autre',
  voyage: 'Autre',
  culturel: 'Autre',
  conference: 'Séminaire',
  atelier: 'Autre',
}

// ─── Suggestions de lieux alternatifs ────────────────────────────────────────

export async function getLieuxSuggeres(params: {
  lieuExcluId: string
  typeEvenement: string
  dateDebut: string
  dateFin: string
  nbParticipants: number
}): Promise<LieuPublic[]> {
  const supabase = await createClient()

  const { data: conflicting } = await supabase
    .from('reservations')
    .select('etablissement_id')
    .neq('statut', 'annulee')
    .lte('date_debut', params.dateFin)
    .gte('date_fin', params.dateDebut)

  const excludeIds = [
    params.lieuExcluId,
    ...((conflicting ?? []).map((r) => r.etablissement_id).filter((id): id is string => Boolean(id))),
  ]

  let query = supabase
    .from('etablissement_profiles')
    .select('id, nom, ville, capacite_max, nb_couchages, prix_base, description, equipements, etablissement_photos(url, est_principale)')
    .eq('actif', true)
    .eq('visible', true)
    .gte('capacite_max', params.nbParticipants)
    .not('id', 'in', `(${excludeIds.join(',')})`)

  const typeDisplay = TYPE_EVT_MAP[params.typeEvenement]
  if (typeDisplay) {
    query = query.overlaps('types_evenements', [typeDisplay])
  }

  const { data } = await query.limit(3)

  type PhotoRow = { url: string; est_principale: boolean | null }

  return (data ?? []).map((lieu) => {
    const photos = lieu.etablissement_photos as PhotoRow[] | null
    const photo_url = photos?.find((p) => p.est_principale)?.url ?? photos?.[0]?.url ?? null
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
}): Promise<ActionResult<{ evenementId: string; suggestions: LieuPublic[] }>> {
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

  try {
    const { data: bdeCtx } = await supabase
      .from('bde_profiles')
      .select('nom, ecole')
      .eq('id', bdeId)
      .single()
    const etabEmail = await getEtabEmail(input.lieuId)
    if (etabEmail) {
      await sendEmail(
        etabEmail,
        `Nouvelle demande de devis — ${bdeCtx?.nom ?? 'BDE'}`,
        createElement(NouvelleDemandEmail, {
          bdeNom: bdeCtx?.nom ?? 'BDE',
          ecole: bdeCtx?.ecole ?? '',
          typeEvenement: input.typeEvenement,
          dateDebut: input.date_debut,
          dateFin: input.date_fin,
          nbParticipants: input.participants,
          demandeId: demande.id,
        }),
      )
    }
  } catch (e) {
    console.error('[createDemandeEtEvenement] email error:', e)
  }

  const suggestions = await getLieuxSuggeres({
    lieuExcluId: input.lieuId,
    typeEvenement: input.typeEvenement,
    dateDebut: input.date_debut,
    dateFin: input.date_fin,
    nbParticipants: input.participants,
  }).catch(() => [] as LieuPublic[])

  return { data: { evenementId: evenement.id, suggestions }, error: null }
}
