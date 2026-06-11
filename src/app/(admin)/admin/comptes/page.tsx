import { getComptesEnAttente } from '@/lib/actions/admin'
import ComptesClient from './comptes-client'

export default async function ComptesPage() {
  const result = await getComptesEnAttente()
  const comptes = result.data ?? []

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-navy">Comptes à valider</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {comptes.length > 0
            ? `${comptes.length} compte${comptes.length > 1 ? 's' : ''} en attente de validation`
            : 'Aucun compte en attente'}
        </p>
      </div>

      {result.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {result.error}
        </div>
      )}

      <ComptesClient initialComptes={comptes} />
    </div>
  )
}
