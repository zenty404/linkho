'use client'

import { Fragment, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { confirmerPaiement } from '@/lib/actions/reservations'
import type { ReservationWithDetails } from '@/lib/actions/reservations'
import type { Database } from '@/lib/types/supabase'

type Paiement = Database['public']['Tables']['paiements']['Row']

const LINKHO_IBAN = 'FR76 XXXX XXXX XXXX XXXX XXXX XXX'

// ─── Utilitaires ─────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR')

const STATUS_META: Record<string, { label: string; cls: string }> = {
  devis_signe:      { label: 'Devis signé',  cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
  acompte_confirme: { label: 'Acompte reçu', cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  confirmee:        { label: 'Confirmée',    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  en_cours:         { label: 'En cours',     cls: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200' },
  terminee:         { label: 'Terminée',     cls: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-300' },
}

const TIMELINE_STEPS = [
  { statut: 'devis_signe',      label: 'Devis signé' },
  { statut: 'acompte_confirme', label: 'Acompte reçu' },
  { statut: 'confirmee',        label: 'Confirmée' },
  { statut: 'en_cours',         label: 'En cours' },
  { statut: 'terminee',         label: 'Terminée' },
]

const STATUS_ORDER = TIMELINE_STEPS.map((s) => s.statut)

const PAIEMENT_ORDER = ['acompte', 'solde', 'commission']

const PAIEMENT_META: Record<
  string,
  { title: string; desc: string; confirmLabel: string }
> = {
  acompte:    { title: 'Acompte',           desc: 'Versé par le BDE à votre établissement',  confirmLabel: 'Acompte reçu' },
  solde:      { title: 'Solde',             desc: 'Versé par le BDE après l\'événement',     confirmLabel: 'Solde reçu' },
  commission: { title: 'Commission LINKHO', desc: 'À reverser à LINKHO depuis votre compte', confirmLabel: 'Commission reversée à LINKHO' },
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
      }}
      className="text-xs text-brand hover:text-brand-light font-medium shrink-0 transition-colors"
    >
      {copied ? 'Copié !' : 'Copier'}
    </button>
  )
}

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

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-navy">{value}</p>
    </div>
  )
}

function Timeline({ statut }: { statut: string }) {
  const currentIdx = Math.max(0, STATUS_ORDER.indexOf(statut))
  return (
    <div className="flex items-start">
      {TIMELINE_STEPS.map((step, idx) => {
        const isDone = idx <= currentIdx
        const lineAfterActive = idx < currentIdx
        const isLast = idx === TIMELINE_STEPS.length - 1
        return (
          <Fragment key={step.statut}>
            <div className="flex flex-col items-center min-w-0 max-w-[100px]">
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isDone ? 'bg-brand border-brand' : 'bg-white border-gray-200'
                }`}
              >
                {isDone && <span className="text-white text-xs font-bold leading-none">✓</span>}
              </div>
              <p
                className={`text-xs text-center mt-2 leading-snug px-1 ${
                  isDone ? 'text-navy font-medium' : 'text-gray-400'
                }`}
              >
                {step.label}
              </p>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mt-4 mx-1 transition-colors ${
                  lineAfterActive ? 'bg-brand' : 'bg-gray-200'
                }`}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ReservationManager({ reservation }: { reservation: ReservationWithDetails }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const statut = reservation.statut
  const statusMeta = STATUS_META[statut] ?? { label: statut, cls: 'bg-gray-100 text-gray-600' }

  const sortedPaiements = [...reservation.paiements].sort(
    (a, b) => PAIEMENT_ORDER.indexOf(a.type) - PAIEMENT_ORDER.indexOf(b.type),
  )

  const handleConfirmer = (paiementId: string) => {
    setError(null)
    startTransition(async () => {
      const res = await confirmerPaiement(paiementId)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-navy font-mono">{reservation.reference}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusMeta.cls}`}>
              {statusMeta.label}
            </span>
          </div>
          <p className="text-xs text-gray-400">Créée le {fmtDate(reservation.created_at)}</p>
        </div>

        {error && (
          <div className="mt-3 px-4 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Timeline */}
      <SectionCard title="Suivi de la réservation">
        <Timeline statut={statut} />
      </SectionCard>

      {/* Infos */}
      <SectionCard title="Détails">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          <InfoField label="BDE" value={reservation.bde?.nom ?? '—'} />
          <InfoField label="École" value={reservation.bde?.ecole ?? '—'} />
          <InfoField
            label="Dates"
            value={`${fmtDate(reservation.date_debut)} → ${fmtDate(reservation.date_fin)}`}
          />
          <InfoField label="Participants" value={String(reservation.nb_participants)} />
          <InfoField label="Devis" value={reservation.devis?.numero ?? '—'} />
        </div>

        <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Montant HT</p>
            <p className="font-medium text-navy tabular-nums">{fmt(reservation.montant_ht)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">TVA</p>
            <p className="font-medium text-navy tabular-nums">{fmt(reservation.montant_tva)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Total TTC</p>
            <p className="text-xl font-bold text-brand tabular-nums">{fmt(reservation.montant_ttc)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Commission</p>
            <p className="font-medium text-navy tabular-nums">{fmt(reservation.commission_montant)}</p>
          </div>
        </div>
      </SectionCard>

      {/* Paiements */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Paiements à confirmer
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {sortedPaiements.map((p) => {
            const meta = PAIEMENT_META[p.type] ?? { title: p.type, desc: '', confirmLabel: 'Confirmer' }
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {meta.title}
                  </span>
                  {p.confirme ? (
                    <span className="px-2 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 rounded-full">
                      Confirmé
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 rounded-full">
                      En attente
                    </span>
                  )}
                </div>

                <p className="text-2xl font-bold text-navy tabular-nums mb-1">{fmt(p.montant)}</p>
                <p className="text-xs text-gray-400 mb-4">{meta.desc}</p>

                {/* Référence de virement attendue */}
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-gray-400">Référence de virement attendue</p>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <code className="text-xs font-mono text-gray-700 flex-1 truncate">
                      {p.reference_virement}
                    </code>
                    <CopyButton text={p.reference_virement} />
                  </div>
                </div>

                {/* IBAN LINKHO pour la commission */}
                {p.type === 'commission' && (
                  <div className="space-y-1 mb-3">
                    <p className="text-xs text-gray-400">IBAN LINKHO (bénéficiaire)</p>
                    <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                      <code className="text-xs font-mono text-blue-700 flex-1">{LINKHO_IBAN}</code>
                      <CopyButton text={LINKHO_IBAN} />
                    </div>
                  </div>
                )}

                {p.confirme && p.confirme_le && (
                  <p className="text-xs text-gray-400 mb-3">
                    Confirmé le {fmtDate(p.confirme_le)}
                  </p>
                )}

                {/* Checkbox de confirmation */}
                <div className="mt-auto pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={p.confirme || isPending}
                    onClick={() => handleConfirmer(p.id)}
                    className={`flex items-center gap-2.5 w-full text-sm transition-colors ${
                      p.confirme
                        ? 'cursor-default text-emerald-700'
                        : 'cursor-pointer text-gray-700 hover:text-navy'
                    } disabled:opacity-60`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${
                        p.confirme
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {p.confirme && (
                        <span className="text-white text-xs font-bold leading-none">✓</span>
                      )}
                    </div>
                    <span className="font-medium">{meta.confirmLabel}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
