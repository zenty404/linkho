'use server'

import { createElement } from 'react'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, getBdeEmail } from '@/lib/emails/send'
import { CompteValideEmail } from '@/emails/compte-valide'
import { CompteRefuseEmail } from '@/emails/compte-refuse'
import { ReservationCreeBdeEmail } from '@/emails/reservation-creee-bde'
import type { ActionResult } from '@/lib/types/actions'

// ─── Comptes en attente ───────────────────────────────────────────────────────

export type CompteEnAttente = {
  userId: string
  profileId: string
  email: string
  role: 'bde' | 'etablissement'
  nom: string
  createdAt: string
  ecole?: string
  ville?: string | null
  adresse?: string | null
  capacite_max?: number | null
}

export async function getComptesEnAttente(): Promise<ActionResult<CompteEnAttente[]>> {
  const supabase = await createClient()
  const { data: role } = await supabase.rpc('get_user_role')
  if (role !== 'admin') return { data: null, error: 'Non autorisé.' }

  const [bdeResult, etabResult] = await Promise.all([
    supabase
      .from('bde_profiles')
      .select('id, nom, ecole, ville, created_at, user_id, users(email)')
      .eq('compte_valide', false)
      .order('created_at', { ascending: true }),
    supabase
      .from('etablissement_profiles')
      .select('id, nom, ville, adresse, capacite_max, created_at, user_id, users(email)')
      .eq('compte_valide', false)
      .order('created_at', { ascending: true }),
  ])

  if (bdeResult.error) return { data: null, error: bdeResult.error.message }
  if (etabResult.error) return { data: null, error: etabResult.error.message }

  type UserRow = { email: string }

  const comptes: CompteEnAttente[] = [
    ...(bdeResult.data ?? []).map((b) => ({
      userId: b.user_id,
      profileId: b.id,
      email: (b.users as UserRow | null)?.email ?? '',
      role: 'bde' as const,
      nom: b.nom,
      ecole: b.ecole,
      ville: b.ville,
      createdAt: b.created_at,
    })),
    ...(etabResult.data ?? []).map((e) => ({
      userId: e.user_id,
      profileId: e.id,
      email: (e.users as UserRow | null)?.email ?? '',
      role: 'etablissement' as const,
      nom: e.nom,
      ville: e.ville,
      adresse: e.adresse,
      capacite_max: e.capacite_max,
      createdAt: e.created_at,
    })),
  ]

  comptes.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  return { data: comptes, error: null }
}

export async function getPendingAccountsCount(): Promise<number> {
  const supabase = await createClient()
  const { data: role } = await supabase.rpc('get_user_role')
  if (role !== 'admin') return 0

  const [bdeResult, etabResult] = await Promise.all([
    supabase.from('bde_profiles').select('id', { count: 'exact', head: true }).eq('compte_valide', false),
    supabase.from('etablissement_profiles').select('id', { count: 'exact', head: true }).eq('compte_valide', false),
  ])

  return (bdeResult.count ?? 0) + (etabResult.count ?? 0)
}

export async function validerCompte(
  userId: string,
  role: 'bde' | 'etablissement',
): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { data: adminRole } = await supabase.rpc('get_user_role')
  if (adminRole !== 'admin') return { data: null, error: 'Non autorisé.' }

  const table = role === 'bde' ? 'bde_profiles' : 'etablissement_profiles'
  const { error } = await supabase
    .from(table)
    .update({ compte_valide: true })
    .eq('user_id', userId)

  if (error) {
    return { data: null, error: error.message }
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()

  if (userRow?.email) {
    try {
      await sendEmail(
        userRow.email,
        'Votre compte LINKHO a été activé',
        createElement(CompteValideEmail, {}),
      )
    } catch (e) {
    }
  }

  return { data: null, error: null }
}

export async function refuserCompte(
  userId: string,
  role: 'bde' | 'etablissement',
  motif: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { data: adminRole } = await supabase.rpc('get_user_role')
  if (adminRole !== 'admin') return { data: null, error: 'Non autorisé.' }

  const { data: userRow } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()

  const table = role === 'bde' ? 'bde_profiles' : 'etablissement_profiles'
  await supabase.from(table).delete().eq('user_id', userId)

  const admin = createAdminClient()
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
  if (deleteError) {
    return { data: null, error: deleteError.message }
  }

  if (userRow?.email) {
    try {
      await sendEmail(
        userRow.email,
        "Votre demande d'accès LINKHO a été refusée",
        createElement(CompteRefuseEmail, { motif }),
      )
    } catch (e) {
    }
  }

  return { data: null, error: null }
}

// ─── Config ───────────────────────────────────────────────────────────────────

export async function getLinkhoConfig(): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data } = await supabase.from('linkho_config').select('cle, valeur')
  if (!data) return {}
  return Object.fromEntries(data.map(({ cle, valeur }) => [cle, valeur ?? '']))
}

export async function updateLinkhoConfig(
  config: Record<string, string>,
): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { data: role } = await supabase.rpc('get_user_role')
  if (role !== 'admin') return { data: null, error: 'Non autorisé.' }

  const rows = Object.entries(config).map(([cle, valeur]) => ({ cle, valeur }))
  const { error } = await supabase.from('linkho_config').upsert(rows, { onConflict: 'cle' })
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function getEtablissementsAvecTaux(): Promise<
  ActionResult<{ id: string; nom: string; taux_commission: number | null }[]>
> {
  const supabase = await createClient()
  const { data: role } = await supabase.rpc('get_user_role')
  if (role !== 'admin') return { data: null, error: 'Non autorisé.' }

  const { data, error } = await supabase
    .from('etablissement_profiles')
    .select('id, nom, taux_commission')
    .order('nom', { ascending: true })

  if (error) return { data: null, error: error.message }
  return {
    data: (data ?? []) as { id: string; nom: string; taux_commission: number | null }[],
    error: null,
  }
}

// ─── Disponibilités à valider ────────────────────────────────────────────────

export type DisponibiliteAValider = {
  id: string
  date_debut: string
  date_fin: string
  nb_participants: number
  type_evenement: string
  montant_propose: number | null
  bde: { nom: string; ecole: string } | null
  etablissement: { nom: string } | null
}

export async function getDisponibilitesAValider(): Promise<ActionResult<DisponibiliteAValider[]>> {
  const supabase = await createClient()
  const { data: role } = await supabase.rpc('get_user_role')
  if (role !== 'admin') return { data: null, error: 'Non autorisé.' }

  const { data, error } = await supabase
    .from('demandes_devis')
    .select('id, date_debut, date_fin, nb_participants, type_evenement, montant_propose, bde:bde_profiles(nom, ecole), etablissement:etablissement_profiles(nom)')
    .eq('statut_disponibilite', 'disponible')
    .eq('statut', 'en_attente')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  type BdeJoin = { nom: string; ecole: string }
  type EtabJoin = { nom: string }

  return {
    data: (data ?? []).map((d) => ({
      id: d.id,
      date_debut: d.date_debut,
      date_fin: d.date_fin,
      nb_participants: d.nb_participants,
      type_evenement: d.type_evenement,
      montant_propose: d.montant_propose,
      bde: d.bde as BdeJoin | null,
      etablissement: d.etablissement as EtabJoin | null,
    })),
    error: null,
  }
}

export async function validerDisponibiliteAdmin(
  demandeId: string,
  montantFinal: number,
): Promise<ActionResult<null>> {
  if (!montantFinal || montantFinal <= 0) return { data: null, error: 'Montant invalide.' }

  const supabase = await createClient()
  const { data: role } = await supabase.rpc('get_user_role')
  if (role !== 'admin') return { data: null, error: 'Non autorisé.' }

  const { data: demande, error: demandeError } = await supabase
    .from('demandes_devis')
    .select('bde_id, etablissement_id, date_debut, date_fin, nb_participants, statut_disponibilite, etablissement:etablissement_profiles(nom, taux_commission), bde:bde_profiles(nom)')
    .eq('id', demandeId)
    .single()

  if (demandeError || !demande) return { data: null, error: 'Demande introuvable.' }
  if (demande.statut_disponibilite !== 'disponible') {
    return { data: null, error: 'Cette demande n\'est pas en attente de validation.' }
  }

  type EtabJoin = { nom: string; taux_commission: number | null }
  type BdeJoin = { nom: string }
  const etabJoin = demande.etablissement as EtabJoin | null
  const bdeJoin = demande.bde as BdeJoin | null

  const commission_taux = ((etabJoin?.taux_commission ?? 12) / 100)
  const commission_montant = Math.round(montantFinal * commission_taux * 100) / 100
  const acompte_montant = Math.round(montantFinal * 0.3 * 100) / 100
  const solde_montant = Math.round(montantFinal * 0.7 * 100) / 100

  const year = new Date().getFullYear()
  const shortId = demandeId.slice(0, 8).toUpperCase()
  const reference = `LINKHO-DD-${year}-${shortId}`

  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .insert({
      demande_id: demandeId,
      devis_id: null,
      bde_id: demande.bde_id,
      etablissement_id: demande.etablissement_id,
      date_debut: demande.date_debut,
      date_fin: demande.date_fin,
      nb_participants: demande.nb_participants,
      montant_ht: montantFinal,
      montant_tva: 0,
      montant_ttc: montantFinal,
      acompte_montant,
      solde_montant,
      commission_taux,
      commission_montant,
      reference,
      statut: 'en_attente_acompte',
      expire_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single()

  if (resError || !reservation) return { data: null, error: resError?.message ?? 'Erreur création réservation.' }

  await supabase.from('paiements').insert([
    { reservation_id: reservation.id, type: 'acompte', montant: acompte_montant, reference_virement: `${reference}-ACOMPTE` },
    { reservation_id: reservation.id, type: 'solde', montant: solde_montant, reference_virement: `${reference}-SOLDE` },
    { reservation_id: reservation.id, type: 'commission', montant: commission_montant, reference_virement: `${reference}-COMMISSION` },
  ])

  await supabase
    .from('demandes_devis')
    .update({ statut: 'acceptee' })
    .eq('id', demandeId)

  try {
    const [bdeEmail, { data: calConfig }] = await Promise.all([
      getBdeEmail(demande.bde_id),
      supabase.from('linkho_config').select('valeur').eq('cle', 'cal_link').maybeSingle(),
    ])
    const calLink = calConfig?.valeur ?? undefined
    if (bdeEmail) {
      await sendEmail(
        bdeEmail,
        'Excellente nouvelle — Votre réservation est confirmée',
        createElement(ReservationCreeBdeEmail, {
          etabNom: etabJoin?.nom ?? '',
          bdeNom: bdeJoin?.nom ?? '',
          dateDebut: demande.date_debut,
          dateFin: demande.date_fin,
          montantAcompte: acompte_montant,
          reservationId: reservation.id,
          calLink,
        }),
      )
    }
  } catch (e) {
  }

  revalidatePath('/admin/reservations')
  revalidatePath('/bde/evenements')
  revalidatePath(`/etablissement/demandes/${demandeId}`)

  return { data: null, error: null }
}

export async function updateTauxCommission(
  etablissementId: string,
  taux: number,
): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { data: role } = await supabase.rpc('get_user_role')
  if (role !== 'admin') return { data: null, error: 'Non autorisé.' }

  const { error } = await supabase
    .from('etablissement_profiles')
    .update({ taux_commission: taux })
    .eq('id', etablissementId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function marquerAcompteReverseEtab(reservationId: string): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { data: role } = await supabase.rpc('get_user_role')
  if (role !== 'admin') return { data: null, error: 'Non autorisé.' }

  const { error } = await supabase
    .from('reservations')
    .update({ acompte_reverse_le: new Date().toISOString() })
    .eq('id', reservationId)

  if (error) return { data: null, error: error.message }
  revalidatePath('/admin/reservations')
  revalidatePath('/etablissement/demandes')
  return { data: null, error: null }
}

export async function marquerSoldeReverseEtab(reservationId: string): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { data: role } = await supabase.rpc('get_user_role')
  if (role !== 'admin') return { data: null, error: 'Non autorisé.' }

  const { error } = await supabase
    .from('reservations')
    .update({ solde_reverse_le: new Date().toISOString() })
    .eq('id', reservationId)

  if (error) return { data: null, error: error.message }
  revalidatePath('/admin/reservations')
  revalidatePath('/etablissement/demandes')
  return { data: null, error: null }
}
