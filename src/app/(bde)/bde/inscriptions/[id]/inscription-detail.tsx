'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { InscriptionWithDetails } from '@/lib/actions/inscriptions'
import type { ChampFormulaire } from '@/lib/actions/formulaires'
import {
  updateStatutInscription,
  ajouterEcheance,
  confirmerEcheance,
} from '@/lib/actions/inscriptions'

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUT_META: Record<string, { label: string; cls: string }> = {
  en_attente: { label: 'En attente', cls: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200' },
  validee:    { label: 'Validée',    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  annulee:    { label: 'Annulée',    cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
}

const PAIEMENT_META: Record<string, { label: string; cls: string }> = {
  en_attente: { label: 'Non payé',  cls: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200' },
  partiel:    { label: 'Partiel',   cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  paye_total: { label: 'Payé',      cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('fr-FR') : '—'

function renderReponse(champ: ChampFormulaire, reponses: Record<string, unknown>): string {
  const val = reponses[champ.id]
  if (val === undefined || val === null || val === '') return '—'
  if (Array.isArray(val)) return val.join(', ')
  if (champ.type === 'oui_non') return val === 'true' || val === true ? 'Oui' : 'Non'
  return String(val)
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Badge({
  statut,
  meta,
}: {
  statut: string
  meta: Record<string, { label: string; cls: string }>
}) {
  const m = meta[statut] ?? { label: statut, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${m.cls}`}>
      {m.label}
    </span>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  inscription: InscriptionWithDetails
  champs: ChampFormulaire[]
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function InscriptionDetail({ inscription, champs }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showAddEcheance, setShowAddEcheance] = useState(false)
  const [montant, setMontant] = useState('')
  const [dateEcheance, setDateEcheance] = useState('')

  const reponses = inscription.reponses as Record<string, unknown>
  const visibleChamps = champs.filter((c) => c.type !== 'separateur')

  const sortedEcheances = [...inscription.echeances].sort((a, b) => a.numero - b.numero)
  const totalPaye = sortedEcheances.filter((e) => e.paye).reduce((s, e) => s + e.montant, 0)
  const totalEcheances = sortedEcheances.reduce((s, e) => s + e.montant, 0)

  function handleStatut(statut: 'validee' | 'annulee') {
    setError(null)
    startTransition(async () => {
      const res = await updateStatutInscription(inscription.id, statut)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  function handleAjouterEcheance(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const fd = new FormData()
    fd.append('montant', montant)
    if (dateEcheance) fd.append('date_echeance', dateEcheance)
    startTransition(async () => {
      const res = await ajouterEcheance(inscription.id, fd)
      if (res.error) {
        setError(res.error)
      } else {
        setMontant('')
        setDateEcheance('')
        setShowAddEcheance(false)
        router.refresh()
      }
    })
  }

  function handleConfirmerEcheance(echeanceId: string) {
    setError(null)
    startTransition(async () => {
      const res = await confirmerEcheance(echeanceId)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      {/* Fil d'ariane */}
      <div>
        <Link href="/bde/inscriptions" className="text-sm text-gray-400 hover:text-navy transition-colors">
          ← Inscriptions
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-navy">
              {inscription.prenom} {inscription.nom}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{inscription.email}</p>
            <p className="text-xs text-gray-400 mt-1">Inscrit le {fmtDate(inscription.created_at)}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge statut={inscription.statut} meta={STATUT_META} />
            <Badge statut={inscription.statut_paiement} meta={PAIEMENT_META} />
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {inscription.statut === 'en_attente' && (
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStatut('validee')}
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Valider l&apos;inscription
            </button>
            <button
              type="button"
              onClick={() => handleStatut('annulee')}
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Annuler l&apos;inscription
            </button>
          </div>
        )}
      </div>

      {/* Informations */}
      <SectionCard title="Informations">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Montant total</p>
            <p className="text-sm font-medium text-navy tabular-nums">{fmt(inscription.montant_total)}</p>
          </div>
          {inscription.caution_montant !== null && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Caution</p>
              <p className="text-sm font-medium text-navy tabular-nums">
                {fmt(inscription.caution_montant)}{' '}
                <span className={inscription.caution_payee ? 'text-emerald-600' : 'text-amber-600'}>
                  ({inscription.caution_payee ? 'payée' : 'non payée'})
                </span>
              </p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Réponses au formulaire */}
      {visibleChamps.length > 0 && (
        <SectionCard title="Réponses au formulaire">
          <div className="space-y-4">
            {visibleChamps.map((champ) => (
              <div key={champ.id}>
                <p className="text-xs text-gray-400 mb-0.5">
                  {champ.libelle}
                  {champ.obligatoire && (
                    <span className="text-red-400 ml-0.5">*</span>
                  )}
                </p>
                <p className="text-sm font-medium text-navy">{renderReponse(champ, reponses)}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Échéances de paiement */}
      <SectionCard title="Échéances de paiement">
        {sortedEcheances.length === 0 ? (
          <p className="text-sm text-gray-400 mb-4">Aucune échéance définie.</p>
        ) : (
          <>
            <div className="space-y-2 mb-3">
              {sortedEcheances.map((ech) => (
                <div
                  key={ech.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${ech.paye ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    />
                    <div>
                      <p className="text-sm font-medium text-navy tabular-nums">
                        Versement {ech.numero} — {fmt(ech.montant)}
                      </p>
                      {ech.date_echeance && (
                        <p className="text-xs text-gray-400">
                          Échéance&nbsp;: {fmtDate(ech.date_echeance)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {ech.paye ? (
                      <span className="text-xs text-emerald-600 font-medium">
                        Payé le {fmtDate(ech.paye_le)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConfirmerEcheance(ech.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50"
                      >
                        Confirmer le paiement
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
              <span className="text-xs text-gray-400">Total versé</span>
              <span className="text-sm font-bold text-navy tabular-nums">
                {fmt(totalPaye)}{' '}
                <span className="font-normal text-gray-400">/ {fmt(totalEcheances)}</span>
              </span>
            </div>
          </>
        )}

        {!showAddEcheance ? (
          <button
            type="button"
            onClick={() => setShowAddEcheance(true)}
            className="mt-2 text-sm text-brand hover:text-brand-light font-medium transition-colors"
          >
            + Ajouter une échéance
          </button>
        ) : (
          <form
            onSubmit={handleAjouterEcheance}
            className="mt-4 p-4 border border-gray-200 rounded-lg space-y-3"
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Nouvelle échéance
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Montant (€) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="50.00"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date d&apos;échéance</label>
                <input
                  type="date"
                  value={dateEcheance}
                  onChange={(e) => setDateEcheance(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-light rounded-lg transition-colors disabled:opacity-50"
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddEcheance(false)
                  setError(null)
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-navy transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </SectionCard>
    </div>
  )
}
