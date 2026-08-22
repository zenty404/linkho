'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types/actions'
import { getLastMonths, monthKey } from '@/lib/chart-months'

export type MonthlyPoint = { name: string; value: number }

// ─── Types BDE ────────────────────────────────────────────────────────────────

export type EvenementRecent = {
  id: string
  nom: string
  type: string
  date_debut: string | null
  date_fin: string | null
  statut: string
  nb_inscrits: number
}

export type ProchaineReservation = {
  date_debut: string
  etablissement: { nom: string } | null
} | null

export type DashboardBdeData = {
  evenementsEnCours: number
  prochaineReservation: ProchaineReservation
  inscriptionsTotal: number
  montantTotalDepense: number
  recentEvenements: EvenementRecent[]
  prochainsEvenements: EvenementRecent[]
  inscriptionsParMois: MonthlyPoint[]
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

export type DemandeRecente = {
  id: string
  type_evenement: string
  date_debut: string
  date_fin: string
  nb_participants: number
  statut: string
  bde: { nom: string; ecole: string } | null
}

export type DashboardEtablissementData = {
  demandesRecues: number
  reservationsConfirmees: number
  revenusNets: number
  tauxOccupation: number
  prochainesReservations: ReservationEtab[]
  recentDemandes: DemandeRecente[]
  revenusParMois: MonthlyPoint[]
}

// ─── Dashboard BDE ────────────────────────────────────────────────────────────

export async function getDashboardBde(): Promise<ActionResult<DashboardBdeData>> {
  const supabase = await createClient()

  const { data: bdeId, error: rpcError } = await supabase.rpc('get_bde_id')
  if (rpcError || !bdeId) {
    return { data: null, error: 'Profil BDE introuvable.' }
  }

  const today = new Date().toISOString().slice(0, 10)
  const months = getLastMonths(6)
  const rangeStart = months[0].start.toISOString()

  const [
    evtEnCours,
    prochaineRes,
    inscTotal,
    depenses,
    recentEvt,
    prochainsEvt,
    inscMensuelles,
  ] = await Promise.all([
    supabase
      .from('evenements')
      .select('id', { count: 'exact', head: true })
      .eq('bde_id', bdeId)
      .in('statut', ['publie', 'complet']),

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
      .select('montant_ttc')
      .eq('bde_id', bdeId)
      .neq('statut', 'annulee'),

    supabase
      .from('evenements')
      .select('id, nom, type, date_debut, date_fin, statut')
      .eq('bde_id', bdeId)
      .order('created_at', { ascending: false })
      .limit(3),

    supabase
      .from('evenements')
      .select('id, nom, type, date_debut, date_fin, statut')
      .eq('bde_id', bdeId)
      .gte('date_debut', today)
      .not('statut', 'in', '(termine,annule)')
      .order('date_debut', { ascending: true })
      .limit(3),

    supabase
      .from('inscriptions')
      .select('created_at')
      .eq('bde_id', bdeId)
      .gte('created_at', rangeStart),
  ])

  const montantTotalDepense = (depenses.data ?? []).reduce((sum, r) => sum + r.montant_ttc, 0)

  const inscMensuellesCounts: Record<string, number> = {}
  for (const row of inscMensuelles.data ?? []) {
    const k = monthKey(row.created_at)
    inscMensuellesCounts[k] = (inscMensuellesCounts[k] ?? 0) + 1
  }
  const inscriptionsParMois: MonthlyPoint[] = months.map((m) => ({
    name: m.label,
    value: inscMensuellesCounts[m.key] ?? 0,
  }))

  // Compter les inscrits pour les événements récupérés (récents + à venir)
  const eventIds = [
    ...(recentEvt.data ?? []).map((e) => e.id),
    ...(prochainsEvt.data ?? []).map((e) => e.id),
  ]
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
      evenementsEnCours: evtEnCours.count ?? 0,
      prochaineReservation: prochaineRes.data as ProchaineReservation,
      inscriptionsTotal: inscTotal.count ?? 0,
      montantTotalDepense,
      recentEvenements: (recentEvt.data ?? []).map((e) => ({
        ...e,
        nb_inscrits: inscCountMap[e.id] ?? 0,
      })),
      prochainsEvenements: (prochainsEvt.data ?? []).map((e) => ({
        ...e,
        nb_inscrits: inscCountMap[e.id] ?? 0,
      })),
      inscriptionsParMois,
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

  const today = new Date().toISOString().slice(0, 10)
  const months = getLastMonths(6)
  const rangeStart = months[0].start.toISOString()

  const [demandesRecuesRes, allRes, prochainesRes, recentDem] = await Promise.all([
    supabase
      .from('demandes_devis')
      .select('id', { count: 'exact', head: true })
      .eq('etablissement_id', etablissementId),

    supabase
      .from('reservations')
      .select('id, statut, montant_ttc, commission_montant, date_debut, date_fin')
      .eq('etablissement_id', etablissementId),

    supabase
      .from('reservations')
      .select('id, date_debut, date_fin, nb_participants, statut, bde:bde_profiles(nom, ecole)')
      .eq('etablissement_id', etablissementId)
      .gte('date_debut', today)
      .neq('statut', 'annulee')
      .order('date_debut', { ascending: true })
      .limit(3),

    supabase
      .from('demandes_devis')
      .select('id, type_evenement, date_debut, date_fin, nb_participants, statut, bde:bde_profiles(nom, ecole)')
      .eq('etablissement_id', etablissementId)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const resRows = allRes.data ?? []

  const reservationsConfirmees = resRows.filter((r) =>
    ['confirmee', 'en_cours', 'terminee', 'commission_reversee'].includes(r.statut),
  ).length

  const revenusNets = resRows
    .filter((r) => ['terminee', 'commission_reversee'].includes(r.statut))
    .reduce((sum, r) => sum + (r.montant_ttc - r.commission_montant), 0)

  const joursReserves = resRows
    .filter((r) => r.statut !== 'annulee')
    .reduce((sum, r) => {
      const jours = (new Date(r.date_fin).getTime() - new Date(r.date_debut).getTime()) / 86_400_000
      return sum + Math.max(0, jours)
    }, 0)
  const tauxOccupation = Math.min(100, Math.round((joursReserves / 365) * 100))

  const resIds = resRows.map((r) => r.id)
  let revenusParMois: MonthlyPoint[] = months.map((m) => ({ name: m.label, value: 0 }))
  if (resIds.length > 0) {
    const { data: paiementsConfirmes } = await supabase
      .from('paiements')
      .select('montant, confirme_le, created_at')
      .eq('confirme', true)
      .in('reservation_id', resIds)
      .gte('created_at', rangeStart)

    const sommesParMois: Record<string, number> = {}
    for (const p of paiementsConfirmes ?? []) {
      const k = monthKey(p.confirme_le ?? p.created_at)
      sommesParMois[k] = (sommesParMois[k] ?? 0) + p.montant
    }
    revenusParMois = months.map((m) => ({ name: m.label, value: sommesParMois[m.key] ?? 0 }))
  }

  return {
    data: {
      demandesRecues: demandesRecuesRes.count ?? 0,
      reservationsConfirmees,
      revenusNets,
      tauxOccupation,
      prochainesReservations: (prochainesRes.data ?? []) as unknown as ReservationEtab[],
      recentDemandes: (recentDem.data ?? []) as unknown as DemandeRecente[],
      revenusParMois,
    },
    error: null,
  }
}
