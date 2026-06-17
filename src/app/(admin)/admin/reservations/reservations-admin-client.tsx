'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { cloturerReservation } from '@/lib/actions/reservations'
import { validerDisponibiliteAdmin } from '@/lib/actions/admin'
import type { ReservationWithDetails } from '@/lib/actions/reservations'
import type { DisponibiliteAValider } from '@/lib/actions/admin'

type Props = {
  reservations: ReservationWithDetails[]
  error: string | null
  disponibilites: DisponibiliteAValider[]
}

const STATUT_STYLES: Record<string, string> = {
  en_attente_acompte: 'bg-yellow-100 text-yellow-700',
  devis_signe: 'bg-blue-100 text-blue-700',
  acompte_confirme: 'bg-amber-100 text-amber-700',
  confirmee: 'bg-green-100 text-green-700',
  en_cours: 'bg-blue-100 text-blue-700',
  commission_reversee: 'bg-orange-100 text-orange-700',
  terminee: 'bg-gray-100 text-gray-600',
  annulee: 'bg-red-100 text-red-700',
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtEuros(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function ReservationsAdminClient({ reservations, error, disponibilites }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [valideError, setValideError] = useState<string | null>(null)
  const [montants, setMontants] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    disponibilites.forEach((d) => {
      if (d.montant_propose != null) init[d.id] = d.montant_propose
    })
    return init
  })

  const aCloturer = reservations.filter((r) => r.statut === 'commission_reversee')
  const historique = reservations.filter((r) => r.statut !== 'commission_reversee')

  function handleCloturer(id: string, reference: string) {
    if (!window.confirm(`Clôturer la réservation ${reference} ?\nCette action est irréversible.`)) return
    setActionError(null)
    setPendingId(id)
    startTransition(async () => {
      const res = await cloturerReservation(id)
      setPendingId(null)
      if (res.error) { setActionError(res.error); return }
      router.refresh()
    })
  }

  function handleValider(demandeId: string) {
    const montant = montants[demandeId]
    if (!montant || montant <= 0) return
    setValideError(null)
    setPendingId(demandeId)
    startTransition(async () => {
      const res = await validerDisponibiliteAdmin(demandeId, montant)
      setPendingId(null)
      if (res.error) { setValideError(res.error); return }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-bold text-navy">Réservations</h1>
        <p className="text-sm text-gray-400 mt-0.5">{reservations.length} réservation{reservations.length !== 1 ? 's' : ''} au total</p>
      </div>

      {(error || actionError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error ?? actionError}
        </div>
      )}

      {/* ── Section 0 : Disponibilités à valider ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-navy">Disponibilités à valider</h2>
          {disponibilites.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              {disponibilites.length}
            </span>
          )}
        </div>

        {disponibilites.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-8 text-center">
            <p className="text-sm text-gray-400">Aucune disponibilité à valider.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {disponibilites.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border border-green-200 px-5 py-4">
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      ✓ Disponible
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-navy">
                    {d.etablissement?.nom ?? '—'}
                    {' → '}
                    <span className="font-normal text-gray-600">{d.bde?.nom} · {d.bde?.ecole}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fmtDate(d.date_debut)} → {fmtDate(d.date_fin)} · {d.nb_participants} pers.
                  </p>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1 max-w-xs">
                    <label className="block text-xs text-gray-500 mb-1">Montant total TTC (€)</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={montants[d.id] ?? ''}
                      onChange={(e) => setMontants((prev) => ({ ...prev, [d.id]: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    />
                  </div>
                  <button
                    onClick={() => handleValider(d.id)}
                    disabled={isPending || !montants[d.id] || montants[d.id] <= 0}
                    className="px-4 py-2 bg-brand hover:bg-brand-light text-navy text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {pendingId === d.id && isPending ? 'En cours…' : 'Valider et générer la facture'}
                  </button>
                </div>
                {valideError && pendingId === d.id && (
                  <p className="text-xs text-red-500 mt-2">{valideError}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 1 : À clôturer ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-navy">À clôturer</h2>
          {aCloturer.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
              {aCloturer.length}
            </span>
          )}
        </div>

        {aCloturer.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-8 text-center">
            <p className="text-sm text-gray-400">Aucune réservation à clôturer.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {aCloturer.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-orange-200 bg-orange-50/30 px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-navy font-mono">{r.reference}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                      commission_reversee
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">{r.bde?.nom}</span> · {r.bde?.ecole}
                    {' '}→ <span className="font-medium">{r.etablissement?.nom}</span>
                    {r.etablissement?.ville ? `, ${r.etablissement.ville}` : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fmtDate(r.date_debut)} → {fmtDate(r.date_fin)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <p className="text-sm font-bold text-navy">{fmtEuros(r.montant_ttc)}</p>
                  <p className="text-xs text-gray-500">Commission : {fmtEuros(r.commission_montant)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <a
                    href={`/api/pdf/commission/${r.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand hover:underline font-medium"
                  >
                    ↓ Facture commission
                  </a>
                  <button
                    onClick={() => handleCloturer(r.id, r.reference)}
                    disabled={isPending}
                    className="px-4 py-2 bg-brand hover:bg-brand-light text-navy text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Clôturer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 2 : Historique ── */}
      <section>
        <h2 className="text-sm font-bold text-navy mb-3">Historique ({historique.length})</h2>

        {historique.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-8 text-center">
            <p className="text-sm text-gray-400">Aucune réservation dans l&apos;historique.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-x-4 px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
              <span>Référence</span>
              <span>BDE</span>
              <span>Établissement</span>
              <span>Dates</span>
              <span className="text-right">Montant</span>
              <span>Statut</span>
            </div>
            {historique.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-x-4 px-5 py-3.5 border-b border-gray-50 last:border-0 items-center text-sm"
              >
                <p className="font-mono text-xs text-gray-600">{r.reference}</p>
                <div className="min-w-0">
                  <p className="font-medium text-navy truncate">{r.bde?.nom}</p>
                  <p className="text-xs text-gray-400 truncate">{r.bde?.ecole}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-navy truncate">{r.etablissement?.nom}</p>
                  <p className="text-xs text-gray-400">{r.etablissement?.ville}</p>
                </div>
                <p className="text-xs text-gray-500 whitespace-nowrap">
                  {fmtDate(r.date_debut)} → {fmtDate(r.date_fin)}
                </p>
                <p className="text-right font-semibold text-navy">{fmtEuros(r.montant_ttc)}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUT_STYLES[r.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                  {r.statut}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
