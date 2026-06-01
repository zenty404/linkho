import Link from 'next/link'
import { getEvenementsByBde } from '@/lib/actions/evenements'

const TYPE_LABELS: Record<string, string> = {
  soiree: 'Soirée', gala: 'Gala', wei: "WEI", voyage: 'Voyage',
  sportif: 'Sportif', culturel: 'Culturel', conference: 'Conférence',
  atelier: 'Atelier', autre: 'Autre',
}

const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('fr-FR') : '—'

const COLS = '1fr 140px 220px 100px 120px'

export default async function BdeEvenementsPage() {
  const result = await getEvenementsByBde()
  const evenements = result.data ?? []

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-navy">Événements</h1>
          <p className="text-sm text-gray-400 mt-0.5">{evenements.length} événement{evenements.length > 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/bde/evenements/nouveau"
          className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-light text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Créer un événement
        </Link>
      </div>

      {result.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {result.error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div
          className="grid gap-x-4 px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100"
          style={{ gridTemplateColumns: COLS }}
        >
          <span>Nom</span>
          <span>Type</span>
          <span>Dates</span>
          <span className="text-center">Places</span>
          <span>Statut</span>
        </div>

        {evenements.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-400">
            Aucun événement.{' '}
            <Link href="/bde/evenements/nouveau" className="text-brand hover:underline font-medium">
              Créez votre premier événement
            </Link>
          </p>
        ) : (
          evenements.map((e) => (
            <Link
              key={e.id}
              href={`/bde/evenements/${e.id}`}
              className="grid gap-x-4 px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors items-center"
              style={{ gridTemplateColumns: COLS }}
            >
              <span className="text-sm font-medium text-navy truncate">{e.nom}</span>
              <span className="text-sm text-gray-500">{TYPE_LABELS[e.type] ?? e.type}</span>
              <span className="text-sm text-gray-500">
                {fmtDate(e.date_debut)}{e.date_fin ? ` → ${fmtDate(e.date_fin)}` : ''}
              </span>
              <span className="text-sm text-center text-gray-500">{e.nb_places_max ?? '—'}</span>
              <span className="text-sm text-gray-500 capitalize">{e.statut}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
