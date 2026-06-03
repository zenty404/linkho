import { getLinkhoConfig, getEtablissementsAvecTaux } from '@/lib/actions/admin'
import AdminParamsClient from './admin-params-client'

export default async function AdminParamsPage() {
  const [config, etablissementsResult] = await Promise.all([
    getLinkhoConfig(),
    getEtablissementsAvecTaux(),
  ])

  return (
    <AdminParamsClient
      config={config}
      etablissements={etablissementsResult.data ?? []}
    />
  )
}
