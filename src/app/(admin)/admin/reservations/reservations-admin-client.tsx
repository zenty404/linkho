'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, useRef } from 'react'
import { cloturerReservation, confirmerPaiement } from '@/lib/actions/reservations'
import { validerDisponibiliteAdmin, marquerAcompteReverseEtab, marquerSoldeReverseEtab } from '@/lib/actions/admin'
import { deposerDevisPrestataire } from '@/lib/actions/devis-prestataires'
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
  const d = s.includes('T') ? new Date(s) : new Date(s + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtEuros(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

// ─── Modal dépôt devis prestataire ───────────────────────────────────────────

type DevisModalProps = {
  evenementId: string
  onClose: () => void
  onSuccess: () => void
}

function DevisPrestatairModal({ evenementId, onClose, onSuccess }: DevisModalProps) {
  const [isPending, startTransition] = useTransition()
  const [modalError, setModalError] = useState<string | null>(null)
  const [type, setType] = useState<'transport' | 'securite' | 'autre'>('transport')
  const [nom, setNom] = useState('')
  const [montant, setMontant] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) { setModalError('Le nom du prestataire est requis.'); return }
    if (!file) { setModalError('Veuillez sélectionner un fichier PDF.'); return }

    setModalError(null)
    const fd = new FormData()
    fd.append('file', file)
    const montantNum = montant.trim() ? parseFloat(montant) : null

    startTransition(async () => {
      const res = await deposerDevisPrestataire(evenementId, type, nom.trim(), montantNum, fd)
      if (res.error) { setModalError(res.error); return }
      onSuccess()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-navy">Déposer un devis prestataire</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type de prestation</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
            >
              <option value="transport">Transport</option>
              <option value="securite">Sécurité</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          {/* Nom prestataire */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom du prestataire</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex. : TransEvent SARL"
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>

          {/* Montant */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Montant TTC <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="0,00"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>

          {/* Fichier PDF */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fichier PDF</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-navy hover:file:bg-brand/20 cursor-pointer"
            />
            {file && (
              <p className="text-xs text-green-600 mt-1">✓ {file.name}</p>
            )}
          </div>

          {modalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
              {modalError}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {isPending ? 'Dépôt en cours…' : 'Déposer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

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
  // Modal dépôt devis prestataire : stocke l'evenement_id de la réservation ouverte
  const [openModalForEvenementId, setOpenModalForEvenementId] = useState<string | null>(null)

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

  function handleReverserAcompte(id: string) {
    setActionError(null)
    setPendingId(id)
    startTransition(async () => {
      const res = await marquerAcompteReverseEtab(id)
      setPendingId(null)
      if (res.error) { setActionError(res.error); return }
      router.refresh()
    })
  }

  function handleReverserSolde(id: string) {
    setActionError(null)
    setPendingId(id)
    startTransition(async () => {
      const res = await marquerSoldeReverseEtab(id)
      setPendingId(null)
      if (res.error) { setActionError(res.error); return }
      router.refresh()
    })
  }

  function handleConfirmerAcompte(paiementId: string) {
    setActionError(null)
    setPendingId(paiementId)
    startTransition(async () => {
      const res = await confirmerPaiement(paiementId)
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
      {openModalForEvenementId && (
        <DevisPrestatairModal
          evenementId={openModalForEvenementId}
          onClose={() => setOpenModalForEvenementId(null)}
          onSuccess={() => {
            setOpenModalForEvenementId(null)
            router.refresh()
          }}
        />
      )}

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
            <div className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto_auto] gap-x-4 px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
              <span>Référence</span>
              <span>BDE</span>
              <span>Établissement</span>
              <span>Dates</span>
              <span className="text-right">Montant</span>
              <span>Statut</span>
              <span></span>
            </div>
            {historique.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto_auto] gap-x-4 px-5 py-3.5 border-b border-gray-50 last:border-0 items-center text-sm"
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
                <div className="flex flex-col items-end gap-1.5">
                  {r.paiements?.find(p => p.type === 'acompte' && !p.confirme) && (
                    <button
                      onClick={() => handleConfirmerAcompte(r.paiements!.find(p => p.type === 'acompte')!.id)}
                      disabled={isPending}
                      className="px-3 py-1.5 border border-brand text-brand hover:bg-brand hover:text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      ✓ Confirmer acompte
                    </button>
                  )}
                  {r.paiements?.find(p => p.type === 'solde' && !p.confirme) && (
                    <button
                      onClick={() => handleConfirmerAcompte(r.paiements!.find(p => p.type === 'solde')!.id)}
                      disabled={isPending}
                      className="px-3 py-1.5 border border-brand text-brand hover:bg-brand hover:text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      ✓ Confirmer solde
                    </button>
                  )}
                  {(r.statut === 'confirmee' || r.statut === 'en_cours') && r.evenement_id && (
                    <button
                      onClick={() => setOpenModalForEvenementId(r.evenement_id!)}
                      className="px-3 py-1.5 border border-gray-200 hover:border-brand text-gray-600 hover:text-navy text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      + Devis prestataire
                    </button>
                  )}
                  {r.acompte_reverse_le ? (
                    <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                      Acompte reversé ✓ {fmtDate(r.acompte_reverse_le)}
                    </span>
                  ) : (r.statut === 'confirmee' || r.statut === 'en_cours') ? (
                    <button
                      onClick={() => handleReverserAcompte(r.id)}
                      disabled={isPending && pendingId === r.id}
                      className="px-3 py-1.5 border border-gray-200 hover:border-brand text-gray-600 hover:text-navy text-xs font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      Reverser acompte étab
                    </button>
                  ) : null}
                  {r.solde_reverse_le ? (
                    <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                      Solde reversé ✓ {fmtDate(r.solde_reverse_le)}
                    </span>
                  ) : r.statut_solde === 'paye' ? (
                    <button
                      onClick={() => handleReverserSolde(r.id)}
                      disabled={isPending && pendingId === r.id}
                      className="px-3 py-1.5 border border-gray-200 hover:border-brand text-gray-600 hover:text-navy text-xs font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      Reverser solde étab
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
