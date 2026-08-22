import { getLinkhoConfig, getEtablissementsAvecTaux } from '@/lib/actions/admin'
import { createClient } from '@/lib/supabase/server'
import AdminParamsClient from './admin-params-client'

export default async function AdminParamsPage() {
  const supabase = await createClient()
  const [config, etablissementsResult, { data: { user } }] = await Promise.all([
    getLinkhoConfig(),
    getEtablissementsAvecTaux(),
    supabase.auth.getUser(),
  ])

  return (
    <AdminParamsClient
      config={config}
      etablissements={etablissementsResult.data ?? []}
      email={user?.email ?? ''}
    />
  )
}
