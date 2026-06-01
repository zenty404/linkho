import Link from 'next/link'
import { getDevisByBde } from '@/lib/actions/devis'

const STATUS_META: Record<string, { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  envoye:    { label: 'Envoyé',    cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
  accepte:   { label: 'Accepté',   cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  refuse:    { label: 'Refusé',    cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
  signe:     { label: 'Signé',     cls: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-300' },
}

const fmt = (n: number | null) =>
  n != null
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
    : '—'

const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR')

const COLS = '140px 220px 130px 130px'

export default async function BdeDevisPage() {
  const result = await getDevisByBde()
  const devis = result.data ?? []

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-bold text-navy">Devis reçus</h1>
        <p className="text-sm text-gray-400 mt-0.5">{devis.length} devis</p>
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
          <span>Numéro</span>
          <span>Dates événement</span>
          <span className="text-right">Montant TTC</span>
          <span className="text-center">Statut</span>
        </div>

        {devis.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-400">
            Aucun devis reçu pour l&apos;instant.
          </p>
        ) : (
          devis.map((d) => {
            const meta = STATUS_META[d.statut] ?? { label: d.statut, cls: 'bg-gray-100 text-gray-600' }
            return (
              <Link
                key={d.id}
                href={`/bde/devis/${d.id}`}
                className="grid gap-x-4 px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors items-center"
                style={{ gridTemplateColumns: COLS }}
              >
                <span className="font-mono text-sm font-medium text-navy">
                  {d.numero || '—'}
                </span>
                <span className="text-sm text-gray-500">
                  {fmtDate(d.date_evenement_debut)} → {fmtDate(d.date_evenement_fin)}
                </span>
                <span className="text-sm font-semibold text-navy text-right tabular-nums">
                  {fmt(d.total_ttc)}
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
