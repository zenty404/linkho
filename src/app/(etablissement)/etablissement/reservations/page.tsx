import Link from 'next/link'
import { getReservationsByEtablissement } from '@/lib/actions/reservations'

const STATUS_META: Record<string, { label: string; cls: string }> = {
  devis_signe:      { label: 'Devis signé',  cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
  acompte_confirme: { label: 'Acompte reçu', cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  confirmee:        { label: 'Confirmée',    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  en_cours:         { label: 'En cours',     cls: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200' },
  terminee:         { label: 'Terminée',     cls: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-300' },
  annulee:          { label: 'Annulée',      cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR')

const COLS = '180px 1fr 220px 130px 130px'

export default async function EtablissementReservationsPage() {
  const result = await getReservationsByEtablissement()
  const reservations = result.data ?? []

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-bold text-navy">Réservations</h1>
        <p className="text-sm text-gray-400 mt-0.5">{reservations.length} réservation{reservations.length > 1 ? 's' : ''}</p>
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
          <span>Référence</span>
          <span>BDE</span>
          <span>Dates</span>
          <span className="text-right">Montant TTC</span>
          <span className="text-center">Statut</span>
        </div>

        {reservations.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-400">
            Aucune réservation pour l&apos;instant.
          </p>
        ) : (
          reservations.map((r) => {
            const meta = STATUS_META[r.statut] ?? { label: r.statut, cls: 'bg-gray-100 text-gray-600' }
            return (
              <Link
                key={r.id}
                href={`/etablissement/reservations/${r.id}`}
                className="grid gap-x-4 px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors items-center"
                style={{ gridTemplateColumns: COLS }}
              >
                <span className="font-mono text-sm font-medium text-navy truncate">
                  {r.reference}
                </span>
                <span className="text-sm text-gray-700 truncate">
                  {r.bde?.nom ?? '—'}
                </span>
                <span className="text-sm text-gray-500">
                  {fmtDate(r.date_debut)} → {fmtDate(r.date_fin)}
                </span>
                <span className="text-sm font-semibold text-navy text-right tabular-nums">
                  {fmt(r.montant_ttc)}
                </span>
                <span className="flex justify-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${meta.cls}`}>
                    {meta.label}
                  </span>
                </span>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
