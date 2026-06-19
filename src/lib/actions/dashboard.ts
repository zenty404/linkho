'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types/actions'

// ─── Types BDE ────────────────────────────────────────────────────────────────

export type ReservationRecente = {
  id: string
  reference: string
  date_debut: string
  date_fin: string
  statut: string
  montant_ttc: number
  etablissement: { nom: string } | null
}

export type DevisRecentBde = {
  id: string
  numero: string
  statut: string
  total_ttc: number | null
  sous_total_ht: number
  etablissement: { nom: string } | null
}

export type EvenementRecent = {
  id: string
  nom: string
  type: string
  date_debut: string | null
  date_fin: string | null
  nb_inscrits: number
}

export type ProchaineReservation = {
  date_debut: string
  etablissement: { nom: string } | null
} | null

export type DashboardBdeData = {
  reservationsEnCours: number
  devisEnAttente: number
  prochaineReservation: ProchaineReservation
  inscriptionsTotal: number
  recentReservations: ReservationRecente[]
  recentDevis: DevisRecentBde[]
  recentEvenements: EvenementRecent[]
}

// ─── Types Établissement ──────────────────────────────────────────────────────

export type ReservationEtab = {
  id: string
  date_debut: string
  date_fin: string
  nb_participants: number
  statut: string
  bde: { nom: string; ecole: string } | null
}

export type DevisRecentEtab = {
  id: string
  numero: string
  statut: string
  total_ttc: number | null
  sous_total_ht: number
  bde: { nom: string } | null
}

export type PaiementAConfirmer = {
  id: string
  type: string
  montant: number
  reference_virement: string
  reservation_id: string
}

export type DashboardEtablissementData = {
  reservationsEnCours: number
  devisEnAttente: number
  chiffreAffairesTotal: number
  paiementsEnAttente: number
  prochainesReservations: ReservationEtab[]
  recentDevis: DevisRecentEtab[]
  paiementsAConfirmer: PaiementAConfirmer[]
}

// ─── Dashboard BDE ────────────────────────────────────────────────────────────

export async function getDashboardBde(): Promise<ActionResult<DashboardBdeData>> {
  const supabase = await createClient()

  const { data: bdeId, error: rpcError } = await supabase.rpc('get_bde_id')
  if (rpcError || !bdeId) {
    return { data: null, error: 'Profil BDE introuvable.' }
  }

  const today = new Date().toISOString()

  const [
    resEnCours,
    devisEnAtt,
    prochaineRes,
    inscTotal,
    recentRes,
    recentDev,
    recentEvt,
  ] = await Promise.all([
    supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('bde_id', bdeId)
      .neq('statut', 'terminee')
      .neq('statut', 'annulee'),

    supabase
      .from('devis')
      .select('id', { count: 'exact', head: true })
      .eq('bde_id', bdeId)
      .eq('statut', 'envoye'),

    supabase
      .from('reservations')
      .select('date_debut, etablissement:etablissement_profiles(nom)')
      .eq('bde_id', bdeId)
      .gte('date_debut', today)
      .neq('statut', 'terminee')
      .neq('statut', 'annulee')
      .order('date_debut', { ascending: true })
      .limit(1)
      .maybeSingle(),

    supabase
      .from('inscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('bde_id', bdeId),

    supabase
      .from('reservations')
      .select('id, reference, date_debut, date_fin, statut, montant_ttc, etablissement:etablissement_profiles(nom)')
      .eq('bde_id', bdeId)
      .order('created_at', { ascending: false })
      .limit(3),

    supabase
      .from('devis')
      .select('id, numero, statut, total_ttc, sous_total_ht, etablissement:etablissement_profiles(nom)')
      .eq('bde_id', bdeId)
      .order('created_at', { ascending: false })
      .limit(3),

    supabase
      .from('evenements')
      .select('id, nom, type, date_debut, date_fin')
      .eq('bde_id', bdeId)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  // Compter les inscrits pour les 3 événements récupérés
  const eventIds = (recentEvt.data ?? []).map((e) => e.id)
  let inscCountMap: Record<string, number> = {}
  if (eventIds.length > 0) {
    const { data: inscByEvt } = await supabase
      .from('inscriptions')
      .select('evenement_id')
      .in('evenement_id', eventIds)
    inscCountMap = (inscByEvt ?? []).reduce<Record<string, number>>((acc, i) => {
      acc[i.evenement_id] = (acc[i.evenement_id] ?? 0) + 1
      return acc
    }, {})
  }

  return {
    data: {
      reservationsEnCours: resEnCours.count ?? 0,
      devisEnAttente: devisEnAtt.count ?? 0,
      prochaineReservation: prochaineRes.data as ProchaineReservation,
      inscriptionsTotal: inscTotal.count ?? 0,
      recentReservations: (recentRes.data ?? []) as unknown as ReservationRecente[],
      recentDevis: (recentDev.data ?? []) as unknown as DevisRecentBde[],
      recentEvenements: (recentEvt.data ?? []).map((e) => ({
        ...e,
        nb_inscrits: inscCountMap[e.id] ?? 0,
      })),
    },
    error: null,
  }
}

// ─── Dashboard Établissement ─────────────────────────────────────────────────

export async function getDashboardEtablissement(): Promise<
  ActionResult<DashboardEtablissementData>
> {
  const supabase = await createClient()

  const { data: etablissementId, error: rpcError } = await supabase.rpc('get_etablissement_id')
  if (rpcError || !etablissementId) {
    return { data: null, error: 'Profil établissement introuvable.' }
  }

  const today = new Date().toISOString()

  // Phase 1 — réservations + devis + prochaines réservations (tout en parallèle)
  const [allRes, devisEnAtt, prochainesRes, recentDev] = await Promise.all([
    supabase
      .from('reservations')
      .select('id, statut, montant_ttc')
      .eq('etablissement_id', etablissementId),

    supabase
      .from('devis')
      .select('id', { count: 'exact', head: true })
      .eq('etablissement_id', etablissementId)
      .in('statut', ['envoye', 'accepte']),

    supabase
      .from('reservations')
      .select('id, date_debut, date_fin, nb_participants, statut, bde:bde_profiles(nom, ecole)')
      .eq('etablissement_id', etablissementId)
      .gte('date_debut', today)
      .neq('statut', 'annulee')
      .order('date_debut', { ascending: true })
      .limit(3),

    supabase
      .from('devis')
      .select('id, numero, statut, total_ttc, sous_total_ht, bde:bde_profiles(nom)')
      .eq('etablissement_id', etablissementId)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const resRows = allRes.data ?? []
  const resIds = resRows.map((r) => r.id)
  const reservationsEnCours = resRows.filter(
    (r) => r.statut !== 'terminee' && r.statut !== 'annulee',
  ).length
  const chiffreAffairesTotal = resRows
    .filter((r) => r.statut === 'terminee')
    .reduce((s, r) => s + (r.montant_ttc ?? 0), 0)

  // Phase 2 — paiements (nécessite les IDs de réservations)
  let paiementsEnAttente = 0
  let paiementsAConfirmer: PaiementAConfirmer[] = []

  if (resIds.length > 0) {
    const [countPaie, fetchPaie] = await Promise.all([
      supabase
        .from('paiements')
        .select('id', { count: 'exact', head: true })
        .eq('confirme', false)
        .in('reservation_id', resIds),

      supabase
        .from('paiements')
        .select('id, type, montant, reference_virement, reservation_id')
        .eq('confirme', false)
        .in('reservation_id', resIds)
        .limit(5),
    ])
    paiementsEnAttente = countPaie.count ?? 0
    paiementsAConfirmer = (fetchPaie.data ?? []) as PaiementAConfirmer[]
  }

  return {
    data: {
      reservationsEnCours,
      devisEnAttente: devisEnAtt.count ?? 0,
      chiffreAffairesTotal,
      paiementsEnAttente,
      prochainesReservations: (prochainesRes.data ?? []) as unknown as ReservationEtab[],
      recentDevis: (recentDev.data ?? []) as unknown as DevisRecentEtab[],
      paiementsAConfirmer,
    },
    error: null,
  }
}
