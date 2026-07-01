'use server'
import { createClient } from '@/lib/supabase/server'

export async function getHomeStats() {
  const supabase = await createClient()
  const [{ count: lieux }, { count: bde }] = await Promise.all([
    supabase.from('etablissement_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('bde_profiles').select('*', { count: 'exact', head: true }),
  ])
  return { lieux: lieux ?? 0, bde: bde ?? 0 }
}
