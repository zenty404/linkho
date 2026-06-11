'use server'

import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/emails/send'
import { CompteValideEmail } from '@/emails/compte-valide'
import { CompteRefuseEmail } from '@/emails/compte-refuse'
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
    console.error('validerCompte error:', error)
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
      console.error('[validerCompte] email error:', e)
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
    console.error('refuserCompte deleteUser error:', deleteError)
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
      console.error('[refuserCompte] email error:', e)
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
