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

export type EvenementComplet = {
  id: string
  nom: string
  type: string
  date_debut: string | null
  date_fin: string | null
  nb_places_max: number | null
  description: string | null
  statut: string
  demande: {
    id: string
    etablissement_id: string
    statut: string
    statut_disponibilite: string
    montant_propose: number | null
    expire_at: string | null
    motif_refus: string | null
    type_evenement: string
    nb_participants: number
    message: string | null
    etablissement: { nom: string; ville: string | null; adresse: string | null; iban: string | null; bic: string | null; titulaire_compte: string | null } | null
  } | null
  devis: {
    id: string
    numero: string
    statut: string
    sous_total_ht: number
    total_ttc: number | null
    tva_taux: number
    acompte_taux: number
    message_client: string | null
    envoye_le: string | null
    items: { id: string; libelle: string; quantite: number; prix_unitaire: number }[]
  } | null
  reservation: {
    id: string
    reference: string
    statut: string
    montant_ttc: number
    acompte_montant: number
    solde_montant: number
    commission_montant: number
    expire_at: string | null
    solde_expire_at: string | null
    statut_solde: string | null
    paiements: {
      id: string
      type: string
      montant: number
      reference_virement: string
      confirme: boolean
      confirme_le: string | null
      justificatif_url: string | null
      justificatif_nom: string | null
    }[]
  } | null
  formulaire: {
    id: string
    titre: string
    publie: boolean
    prix_total: number | null
    nb_inscriptions: number
  } | null
  cal_link: string | null
  devis_prestataires: {
    id: string
    type: string
    nom: string
    montant: number | null
    statut: string
    pdf_nom: string
    created_at: string
  }[]
}

export async function getEvenementComplet(id: string): Promise<ActionResult<EvenementComplet>> {
  const supabase = await createClient()

  const { data: bdeId } = await supabase.rpc('get_bde_id')
  if (!bdeId) return { data: null, error: 'Profil BDE introuvable.' }

  const { data: evt, error: evtError } = await supabase
    .from('evenements')
    .select('*')
    .eq('id', id)
    .eq('bde_id', bdeId)
    .single()
  if (evtError || !evt) return { data: null, error: 'Événement introuvable.' }

  const evtExtra = evt as typeof evt & { demande_id?: string | null }
  const { data: demande } = evtExtra.demande_id
    ? await supabase
        .from('demandes_devis')
        .select('*, etablissement:etablissement_profiles(nom, ville, adresse, iban, bic, titulaire_compte)')
        .eq('id', evtExtra.demande_id)
        .maybeSingle()
    : { data: null }

  let devis = null
  if (demande) {
    const { data: devisData } = await supabase
      .from('devis')
      .select('*, items:devis_items(id, libelle, quantite, prix_unitaire)')
      .eq('demande_id', demande.id)
      .neq('statut', 'refuse')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    devis = devisData
  }

  let reservation = null
  if (devis) {
    const { data: resData } = await supabase
      .from('reservations')
      .select('*, paiements(id, type, montant, reference_virement, confirme, confirme_le, justificatif_url, justificatif_nom)')
      .eq('devis_id', devis.id)
      .maybeSingle()
    reservation = resData
  }
  if (!reservation && demande) {
    const { data: resData } = await supabase
      .from('reservations')
      .select('*, paiements(id, type, montant, reference_virement, confirme, confirme_le, justificatif_url, justificatif_nom)')
      .eq('demande_id', demande.id)
      .maybeSingle()
    reservation = resData
  }

  let formulaire = null
  const [{ data: formData }, { data: calConfig }, { data: devisPrestatairesData }] = await Promise.all([
    supabase.from('formulaire_inscriptions').select('id, titre, publie, prix_total').eq('evenement_id', id).maybeSingle(),
    supabase.from('linkho_config').select('valeur').eq('cle', 'cal_link').maybeSingle(),
    supabase
      .from('devis_prestataires')
      .select('id, type, nom, montant, statut, pdf_nom, created_at')
      .eq('evenement_id', id)
      .order('created_at', { ascending: true }),
  ])
  const cal_link = calConfig?.valeur ?? null
  if (formData) {
    const { count } = await supabase
      .from('inscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('evenement_id', id)
    formulaire = { ...formData, nb_inscriptions: count ?? 0 }
  }

  return {
    data: {
      ...evt,
      demande: demande as EvenementComplet['demande'],
      devis: devis as EvenementComplet['devis'],
      reservation: reservation as EvenementComplet['reservation'],
      formulaire,
      cal_link,
      devis_prestataires: (devisPrestatairesData ?? []) as EvenementComplet['devis_prestataires'],
    },
    error: null,
  }
}
