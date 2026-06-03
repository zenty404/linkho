'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { DemandeComplete } from '@/lib/actions/etablissement'
import { envoyerDevis } from '@/lib/actions/devis'
import { confirmerPaiement } from '@/lib/actions/reservations'

type Props = { demande: DemandeComplete }

const TYPE_LABELS: Record<string, string> = {
  soiree: 'Soirée', gala: 'Gala', wei: 'WEI', ski: 'Ski',
  sportif: 'Sportif', seminaire: 'Séminaire', autre: 'Autre',
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtEuros(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      {children}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="text-xs text-brand hover:underline font-medium"
    >
      {copied ? '✓ Copié' : 'Copier'}
    </button>
  )
}

export default function DemandeDetail({ demande }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { devis, reservation } = demande

  const headerStatut: { label: string; style: string } = (() => {
    if (reservation) {
      const styles: Record<string, string> = {
        terminee: 'bg-green-100 text-green-700',
        commission_reversee: 'bg-orange-100 text-orange-700',
        en_cours: 'bg-green-100 text-green-700',
        confirmee: 'bg-green-100 text-green-700',
        acompte_confirme: 'bg-amber-100 text-amber-700',
        devis_signe: 'bg-blue-100 text-blue-700',
        annulee: 'bg-red-100 text-red-700',
      }
      return { label: reservation.statut.replace(/_/g, ' '), style: styles[reservation.statut] ?? 'bg-gray-100 text-gray-600' }
    }
    if (devis) {
      const styles: Record<string, string> = {
        brouillon: 'bg-gray-100 text-gray-600',
        envoye: 'bg-blue-100 text-blue-700',
        accepte: 'bg-green-100 text-green-700',
        signe: 'bg-green-100 text-green-700',
        refuse: 'bg-red-100 text-red-700',
      }
      return { label: `Devis ${devis.statut}`, style: styles[devis.statut] ?? 'bg-gray-100 text-gray-600' }
    }
    const demStyles: Record<string, string> = {
      en_attente: 'bg-amber-100 text-amber-700',
      acceptee: 'bg-green-100 text-green-700',
      refusee: 'bg-red-100 text-red-700',
    }
    return { label: demande.statut, style: demStyles[demande.statut] ?? 'bg-gray-100 text-gray-600' }
  })()

  function handleAction(fn: () => Promise<{ data: unknown; error: string | null }>) {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  const acomptePaiement = reservation?.paiements.find((p) => p.type === 'acompte') ?? null
  const soldePaiement = reservation?.paiements.find((p) => p.type === 'solde') ?? null
  const commissionPaiement = reservation?.paiements.find((p) => p.type === 'commission') ?? null

  const showSection3 = reservation != null && reservation.statut !== 'annulee'
  const showSection4 = reservation != null && ['acompte_confirme', 'confirmee', 'en_cours', 'terminee', 'commission_reversee'].includes(reservation.statut)
  const showSection5 = commissionPaiement != null && (soldePaiement?.confirme ?? false)

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      {/* Header */}
      <SectionCard>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-navy">{demande.bde?.nom ?? '—'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{demande.bde?.ecole}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
              <span>{fmtDate(demande.date_debut)} → {fmtDate(demande.date_fin)}</span>
              <span>{demande.nb_participants} participants</span>
              <span>{TYPE_LABELS[demande.type_evenement] ?? demande.type_evenement}</span>
            </div>
            {demande.message && (
              <p className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100 italic">
                &ldquo;{demande.message}&rdquo;
              </p>
            )}
          </div>
          <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${headerStatut.style}`}>
            {headerStatut.label}
          </span>
        </div>
      </SectionCard>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {/* SECTION 1 — DEVIS */}
      <SectionCard>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Devis</h2>

        {/* Pas de devis */}
        {!devis && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Aucun devis créé pour cette demande.</p>
            <button
              onClick={() => router.push(`/etablissement/devis/nouveau?demande_id=${demande.id}`)}
              className="px-4 py-2 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors"
            >
              Créer un devis
            </button>
          </div>
        )}

        {/* Devis refusé */}
        {devis?.statut === 'refuse' && (
          <div className="space-y-3">
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Devis refusé par le BDE</span>
            <p className="text-sm text-gray-500">Vous pouvez proposer un nouveau devis au BDE.</p>
            <button
              onClick={() => router.push(`/etablissement/devis/nouveau?demande_id=${demande.id}`)}
              className="px-4 py-2 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors"
            >
              Proposer un nouveau devis
            </button>
          </div>
        )}

        {/* Devis brouillon */}
        {devis && devis.statut === 'brouillon' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-mono">{devis.numero}</p>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">Brouillon</span>
            </div>
            <DevisResume devis={devis} />
            <div className="flex gap-3">
              <Link
                href={`/etablissement/devis/${devis.id}`}
                className="flex-1 py-2.5 text-center bg-white border border-gray-200 text-navy text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Modifier le devis
              </Link>
              <button
                onClick={() => handleAction(() => envoyerDevis(devis.id))}
                disabled={isPending}
                className="flex-1 py-2.5 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Envoyer au BDE
              </button>
            </div>
          </div>
        )}

        {/* Devis envoyé */}
        {devis && devis.statut === 'envoye' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-mono">{devis.numero}</p>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">En attente de réponse du BDE</span>
            </div>
            <DevisResume devis={devis} />
            <Link
              href={`/etablissement/devis/${devis.id}`}
              className="inline-block px-4 py-2 bg-white border border-gray-200 text-navy text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Modifier le devis
            </Link>
          </div>
        )}

        {/* Devis accepté ou signé */}
        {devis && (devis.statut === 'accepte' || devis.statut === 'signe') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-mono">{devis.numero}</p>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">✓ Devis accepté</span>
            </div>
            <DevisResume devis={devis} />
            {!reservation && (
              <p className="text-xs text-gray-400">En attente de confirmation de réservation par le BDE.</p>
            )}
          </div>
        )}

        {/* Bouton PDF devis — visible dès que le devis existe */}
        {devis && (
          <a
            href={`/api/pdf/devis/${devis.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-brand hover:underline font-medium"
          >
            ↓ Télécharger le devis PDF
          </a>
        )}
      </SectionCard>

      {/* SECTION 2 — ACOMPTE */}
      {showSection3 && (
        <SectionCard>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Paiement de l&apos;acompte</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Montant acompte</p>
                <p className="text-lg font-bold text-navy">{fmtEuros(reservation!.acompte_montant)}</p>
              </div>
              {acomptePaiement?.confirme ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">✓ Acompte reçu</span>
              ) : (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">En attente</span>
              )}
            </div>

            {acomptePaiement && (
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Référence virement attendue</p>
                  <p className="text-sm font-mono text-navy truncate">{acomptePaiement.reference_virement}</p>
                </div>
                <CopyButton text={acomptePaiement.reference_virement} />
              </div>
            )}

            {acomptePaiement && !acomptePaiement.confirme && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => handleAction(() => confirmerPaiement(acomptePaiement.id))}
                  disabled={isPending}
                  className="w-4 h-4 accent-brand"
                />
                <span className="text-sm text-navy">J&apos;ai bien reçu le virement d&apos;acompte</span>
              </label>
            )}
            {acomptePaiement?.confirme && reservation && (
              <a
                href={`/api/pdf/facture/${reservation.id}/acompte`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-brand hover:underline font-medium"
              >
                ↓ Télécharger la facture d&apos;acompte
              </a>
            )}
          </div>
        </SectionCard>
      )}

      {/* SECTION 3 — SOLDE */}
      {showSection4 && (
        <SectionCard>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Paiement du solde</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Montant solde</p>
                <p className="text-lg font-bold text-navy">{fmtEuros(reservation!.solde_montant)}</p>
              </div>
              {soldePaiement?.confirme ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">✓ Solde reçu</span>
              ) : (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">En attente</span>
              )}
            </div>

            {soldePaiement && (
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Référence virement attendue</p>
                  <p className="text-sm font-mono text-navy truncate">{soldePaiement.reference_virement}</p>
                </div>
                <CopyButton text={soldePaiement.reference_virement} />
              </div>
            )}

            {soldePaiement && !soldePaiement.confirme && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => handleAction(() => confirmerPaiement(soldePaiement.id))}
                  disabled={isPending}
                  className="w-4 h-4 accent-brand"
                />
                <span className="text-sm text-navy">J&apos;ai bien reçu le solde</span>
              </label>
            )}
            {soldePaiement?.confirme && reservation && (
              <a
                href={`/api/pdf/facture/${reservation.id}/solde`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-brand hover:underline font-medium"
              >
                ↓ Télécharger la facture de solde
              </a>
            )}
          </div>
        </SectionCard>
      )}

      {/* SECTION 4 — COMMISSION */}
      {showSection5 && (
        <SectionCard>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Commission LINKHO</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Montant commission ({Math.round((reservation?.commission_taux ?? 0) * 100)}%)</p>
                <p className="text-lg font-bold text-navy">{fmtEuros(reservation!.commission_montant)}</p>
              </div>
              {reservation?.statut === 'terminee' ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">Clôturé ✓</span>
              ) : commissionPaiement?.confirme ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">En attente de validation LINKHO</span>
              ) : (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">À reverser</span>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">IBAN LINKHO</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-navy">FR76 XXXX XXXX XXXX XXXX XXXX XXX</p>
                  <CopyButton text="FR76 XXXX XXXX XXXX XXXX XXXX XXX" />
                </div>
              </div>
              {commissionPaiement && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Référence virement</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-navy">{commissionPaiement.reference_virement}</p>
                    <CopyButton text={commissionPaiement.reference_virement} />
                  </div>
                </div>
              )}
            </div>

            {commissionPaiement && !commissionPaiement.confirme && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => handleAction(() => confirmerPaiement(commissionPaiement.id))}
                  disabled={isPending}
                  className="w-4 h-4 accent-brand"
                />
                <span className="text-sm text-navy">J&apos;ai reversé la commission à LINKHO</span>
              </label>
            )}
            {reservation && (
              <a
                href={`/api/pdf/commission/${reservation.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-brand hover:underline font-medium"
              >
                ↓ Télécharger la facture de commission
              </a>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

function DevisResume({ devis }: { devis: NonNullable<DemandeComplete['devis']> }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
      {devis.items.map((item) => (
        <div key={item.id} className="flex justify-between text-gray-700">
          <span>{item.libelle} × {item.quantite}</span>
          <span>{(item.quantite * item.prix_unitaire).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
        </div>
      ))}
      <div className="border-t border-gray-200 pt-2 space-y-1">
        <div className="flex justify-between text-gray-600">
          <span>HT</span><span>{devis.sous_total_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>TVA ({Math.round(devis.tva_taux * 100)}%)</span>
          <span>{((devis.total_ttc ?? 0) - devis.sous_total_ht).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
        </div>
        <div className="flex justify-between font-bold text-navy">
          <span>TTC</span><span>{(devis.total_ttc ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
        </div>
        {devis.acompte_montant != null && (
          <div className="flex justify-between text-gray-500">
            <span>Acompte ({Math.round(devis.acompte_taux * 100)}%)</span>
            <span>{devis.acompte_montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
          </div>
        )}
      </div>
    </div>
  )
}
