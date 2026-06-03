'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types/actions'

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
