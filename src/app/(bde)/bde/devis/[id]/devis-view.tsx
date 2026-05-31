'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { accepterDevis, refuserDevis } from '@/lib/actions/devis'
import type { DevisWithItems } from '@/lib/actions/devis'

// ─── Utilitaires ─────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR')

const STATUS_META: Record<string, { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  envoye:    { label: 'Envoyé',    cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
  accepte:   { label: 'Accepté',   cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  refuse:    { label: 'Refusé',    cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
  signe:     { label: 'Signé',     cls: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-300' },
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

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-navy">{value}</p>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

type Props = { devis: DevisWithItems }

export function DevisView({ devis }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const statut = devis.statut
  const isEnvoye = statut === 'envoye'
  const statusMeta = STATUS_META[statut] ?? { label: statut, cls: 'bg-gray-100 text-gray-600' }

  const sousTotal = devis.sous_total_ht
  const tvaTaux = devis.tva_taux
  const totalTtc = sousTotal * (1 + tvaTaux)
  const tvaMontant = totalTtc - sousTotal
  const acompteTaux = devis.acompte_taux
  const acompteMontant = totalTtc * acompteTaux
  const soldeMontant = totalTtc * (1 - acompteTaux)

  const handleAccepter = () => {
    setError(null)
    startTransition(async () => {
      const res = await accepterDevis(devis.id)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  const handleRefuser = () => {
    setError(null)
    startTransition(async () => {
      const res = await refuserDevis(devis.id)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="flex gap-6 items-start">
      {/* ── Colonne gauche ── */}
      <div className="flex-[7] min-w-0 flex flex-col gap-4">

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-navy font-mono">
                {devis.numero || '(numéro en attente)'}
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusMeta.cls}`}>
                {statusMeta.label}
              </span>
            </div>
            {devis.envoye_le && (
              <p className="text-xs text-gray-400">
                Reçu le {fmtDate(devis.envoye_le)}
              </p>
            )}
          </div>

          {error && (
            <div className="mt-3 px-4 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Informations établissement */}
        <SectionCard title="Établissement">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            <InfoField
              label="Lieu"
              value={devis.etablissement?.nom ?? '—'}
            />
            <InfoField
              label="Ville"
              value={devis.etablissement?.ville ?? '—'}
            />
            <InfoField
              label="Dates de l'événement"
              value={`${fmtDate(devis.date_evenement_debut)} → ${fmtDate(devis.date_evenement_fin)}`}
            />
            <InfoField
              label="Participants"
              value={String(devis.nb_participants)}
            />
          </div>
        </SectionCard>

        {/* Prestations */}
        <SectionCard title="Prestations incluses">
          <div
            className="grid gap-x-4 text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 border-b border-gray-100"
            style={{ gridTemplateColumns: 'minmax(0,1fr) 100px 150px 120px' }}
          >
            <span>Prestation</span>
            <span className="text-center">Quantité</span>
            <span className="text-right">Prix unitaire HT</span>
            <span className="text-right">Total HT</span>
          </div>

          {devis.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Aucune prestation.</p>
          ) : (
            devis.items.map((item) => (
              <div
                key={item.id}
                className="grid gap-x-4 py-3.5 border-b border-gray-50 last:border-0 items-start"
                style={{ gridTemplateColumns: 'minmax(0,1fr) 100px 150px 120px' }}
              >
                <div>
                  <p className="text-sm font-medium text-navy">{item.libelle}</p>
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                  )}
                </div>
                <p className="text-sm text-navy text-center font-semibold tabular-nums">
                  {item.quantite}
                </p>
                <p className="text-sm text-gray-700 text-right tabular-nums">
                  {fmt(item.prix_unitaire)}
                </p>
                <p className="text-sm font-semibold text-navy text-right tabular-nums">
                  {fmt(item.quantite * item.prix_unitaire)}
                </p>
              </div>
            ))
          )}
        </SectionCard>

        {/* Message */}
        {devis.message_client && (
          <SectionCard title="Message de l'établissement">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {devis.message_client}
            </p>
          </SectionCard>
        )}
      </div>

      {/* ── Colonne droite — sticky ── */}
      <div className="w-72 shrink-0">
        <div className="sticky top-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Récapitulatif
            </h2>
          </div>

          <div className="px-5 py-5 space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Sous-total HT</span>
              <span className="font-medium text-navy tabular-nums">{fmt(sousTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">TVA {Math.round(tvaTaux * 100)}%</span>
              <span className="font-medium text-navy tabular-nums">{fmt(tvaMontant)}</span>
            </div>

            <div className="!mt-4 pt-4 border-t border-gray-100 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-navy">Total TTC</span>
              <span className="text-2xl font-bold text-brand tabular-nums">{fmt(totalTtc)}</span>
            </div>
          </div>

          <div className="px-5 pb-5 pt-1 space-y-2.5 text-sm border-t border-gray-50">
            <div className="flex justify-between items-center pt-3">
              <span className="text-gray-500">Acompte {Math.round(acompteTaux * 100)}%</span>
              <span className="font-medium text-navy tabular-nums">{fmt(acompteMontant)}</span>
            </div>
            <p className="text-xs text-gray-400 -mt-1.5">À régler à la signature</p>

            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-500">Solde {Math.round((1 - acompteTaux) * 100)}%</span>
              <span className="font-medium text-navy tabular-nums">{fmt(soldeMontant)}</span>
            </div>
            <p className="text-xs text-gray-400 -mt-1.5">À régler après l&apos;événement</p>
          </div>

          <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-2">
            <button
              type="button"
              onClick={handleAccepter}
              disabled={!isEnvoye || isPending}
              className="w-full px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? 'En cours…' : 'Accepter le devis'}
            </button>
            <button
              type="button"
              onClick={handleRefuser}
              disabled={!isEnvoye || isPending}
              className="w-full px-4 py-2.5 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Refuser le devis
            </button>
            {!isEnvoye && (
              <p className="text-xs text-gray-400 text-center pt-1">
                {statut === 'accepte' && 'Vous avez accepté ce devis.'}
                {statut === 'refuse' && 'Vous avez refusé ce devis.'}
                {statut === 'brouillon' && 'Ce devis n\'a pas encore été envoyé.'}
                {statut === 'signe' && 'Ce devis est signé.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
