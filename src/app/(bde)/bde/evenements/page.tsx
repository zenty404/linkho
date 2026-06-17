import Link from 'next/link'
import { getEvenementsByBde, getEvenementComplet } from '@/lib/actions/evenements'
import type { EvenementComplet } from '@/lib/actions/evenements'

type DisplayStatut = { label: string; style: string }

function getDisplayStatut(evt: EvenementComplet): DisplayStatut {
  const { reservation, devis, demande } = evt
  if (demande?.statut === 'refusee')
    return { label: 'Demande refusée', style: 'bg-red-100 text-red-700' }
  if (reservation?.statut === 'terminee')
    return { label: 'Terminé', style: 'bg-green-100 text-green-700' }
  if (reservation?.statut === 'commission_reversee')
    return { label: 'Clôture en cours', style: 'bg-orange-100 text-orange-700' }
  if (reservation?.statut && ['confirmee', 'en_cours', 'acompte_confirme'].includes(reservation.statut))
    return { label: 'En cours', style: 'bg-blue-100 text-blue-700' }
  if (reservation?.statut === 'devis_signe')
    return { label: 'Réservé', style: 'bg-blue-100 text-blue-700' }
  if (devis?.statut === 'envoye')
    return { label: 'Devis reçu', style: 'bg-yellow-100 text-yellow-700' }
  if (devis?.statut === 'refuse')
    return { label: 'Devis refusé', style: 'bg-red-100 text-red-700' }
  if (demande?.statut_disponibilite === 'non_disponible')
    return { label: 'Non disponible', style: 'bg-red-100 text-red-700' }
  if (demande?.statut_disponibilite === 'disponible' && !devis)
    return { label: 'Disponibilité confirmée', style: 'bg-green-100 text-green-700' }
  if (demande && !devis)
    return { label: 'En attente de réponse', style: 'bg-amber-100 text-amber-700' }
  return { label: 'Nouveau', style: 'bg-gray-100 text-gray-600' }
}

function fmtDate(s: string | null) {
  if (!s) return null
  return new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function BdeEvenementsPage() {
  const listResult = await getEvenementsByBde()
  const ids = (listResult.data ?? []).map((e) => e.id)
  const completes = await Promise.all(ids.map((id) => getEvenementComplet(id)))
  const evenements = completes.filter((r) => r.data).map((r) => r.data!)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-navy">Événements</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {evenements.length} événement{evenements.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/rechercher"
          className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Nouvel événement
        </Link>
      </div>

      {listResult.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {listResult.error}
        </div>
      )}

      {evenements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-400 mb-4">Aucun événement pour le moment.</p>
          <Link
            href="/rechercher"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors"
          >
            Rechercher un lieu
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {evenements.map((e) => {
            const debut = fmtDate(e.date_debut)
            const fin = fmtDate(e.date_fin)
            const { label, style } = getDisplayStatut(e)
            return (
              <div
                key={e.id}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy truncate">{e.nom}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                  {(debut || fin) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {debut}{fin && debut !== fin ? ` → ${fin}` : ''}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${style}`}>
                  {label}
                </span>
                <Link
                  href={`/bde/evenements/${e.id}`}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-navy border border-navy/20 rounded-lg hover:bg-navy/5 transition-colors"
                >
                  Voir
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
