'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { DemandeComplete } from '@/lib/actions/etablissement'
import { refuserDemande, confirmerDisponibilite, refuserDisponibilite } from '@/lib/actions/etablissement'
import { confirmerPaiement } from '@/lib/actions/reservations'
import { CountdownTimer } from '@/components/ui/countdown-timer'

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
  const [showRefusDemande, setShowRefusDemande] = useState(false)
  const [motifRefusDemande, setMotifRefusDemande] = useState('')
  const [showDispoForm, setShowDispoForm] = useState<'disponible' | 'non_disponible' | null>(null)
  const [motifNonDispo, setMotifNonDispo] = useState('')

  const { devis, reservation } = demande

  const headerStatut: { label: string; style: string } = (() => {
    if (reservation) {
      const styles: Record<string, string> = {
        en_attente_acompte: 'bg-yellow-100 text-yellow-700',
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
    if (demande.statut_disponibilite === 'en_attente') {
      return { label: 'En attente de réponse', style: 'bg-amber-100 text-amber-700' }
    }
    if (demande.statut_disponibilite === 'disponible') {
      return { label: 'Disponibilité confirmée', style: 'bg-green-100 text-green-700' }
    }
    if (demande.statut_disponibilite === 'non_disponible') {
      return { label: 'Non disponible', style: 'bg-red-100 text-red-700' }
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
            {demande.statut === 'refusee' && demande.motif_refus && (
              <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-red-600 mb-1">Motif du refus</p>
                <p className="text-sm text-red-700">{demande.motif_refus}</p>
              </div>
            )}
            {demande.statut === 'en_attente' && !devis && !showRefusDemande && (
              <button
                onClick={() => setShowRefusDemande(true)}
                className="mt-4 px-4 py-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors"
              >
                Refuser la demande
              </button>
            )}
            {demande.statut === 'en_attente' && !devis && showRefusDemande && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    Motif du refus <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={motifRefusDemande}
                    onChange={(e) => setMotifRefusDemande(e.target.value)}
                    placeholder="Expliquez la raison du refus au BDE…"
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-300/30 focus:border-red-300 resize-none"
                  />
                  <p className={`text-xs mt-1 ${motifRefusDemande.trim().length < 20 ? 'text-red-400' : 'text-gray-400'}`}>
                    {motifRefusDemande.trim().length} / 20 caractères minimum
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowRefusDemande(false); setMotifRefusDemande('') }}
                    className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const motif = motifRefusDemande.trim()
                      if (motif.length < 20) return
                      setError(null)
                      startTransition(async () => {
                        const res = await refuserDemande(demande.id, motif)
                        if (res.error) { setError(res.error); return }
                        router.push('/etablissement/demandes')
                      })
                    }}
                    disabled={isPending || motifRefusDemande.trim().length < 20}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? 'Envoi…' : 'Confirmer le refus'}
                  </button>
                </div>
              </div>
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

      {/* SECTION 1 — DISPONIBILITÉ */}
      <SectionCard>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Répondre à la demande</h2>

        {/* En attente — choix disponible / non disponible */}
        {demande.statut_disponibilite === 'en_attente' && !showDispoForm && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowDispoForm('disponible')}
              className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              ✓ Disponible
            </button>
            <button
              onClick={() => setShowDispoForm('non_disponible')}
              className="flex-1 py-2.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors"
            >
              ✗ Non disponible
            </button>
          </div>
        )}

        {/* Formulaire confirmation disponibilité */}
        {demande.statut_disponibilite === 'en_attente' && showDispoForm === 'disponible' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Confirmez votre disponibilité pour cette demande.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDispoForm(null)}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleAction(() => confirmerDisponibilite(demande.id))}
                disabled={isPending}
                className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? 'Envoi…' : 'Confirmer la disponibilité'}
              </button>
            </div>
          </div>
        )}

        {/* Formulaire refus disponibilité */}
        {demande.statut_disponibilite === 'en_attente' && showDispoForm === 'non_disponible' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Motif de l&apos;indisponibilité <span className="text-red-400">*</span>
              </label>
              <textarea
                value={motifNonDispo}
                onChange={(e) => setMotifNonDispo(e.target.value)}
                placeholder="Expliquez la raison de l'indisponibilité au BDE…"
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-300/30 focus:border-red-300 resize-none"
              />
              <p className={`text-xs mt-1 ${motifNonDispo.trim().length < 20 ? 'text-red-400' : 'text-gray-400'}`}>
                {motifNonDispo.trim().length} / 20 caractères minimum
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowDispoForm(null); setMotifNonDispo('') }}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const motif = motifNonDispo.trim()
                  if (motif.length < 20) return
                  handleAction(() => refuserDisponibilite(demande.id, motif))
                }}
                disabled={isPending || motifNonDispo.trim().length < 20}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Envoi…' : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        )}

        {/* Disponibilité confirmée */}
        {demande.statut_disponibilite === 'disponible' && (
          <div className="space-y-3">
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">✓ Disponibilité confirmée</span>
            {demande.montant_propose != null && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Montant proposé</p>
                <p className="text-lg font-bold text-navy">{fmtEuros(demande.montant_propose)}</p>
              </div>
            )}
            {reservation?.statut === 'en_attente_acompte' && reservation.expire_at ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-4">
                <p className="text-xs text-amber-700 font-semibold">Délai acompte BDE</p>
                <CountdownTimer expireAt={reservation.expire_at} />
              </div>
            ) : (
              <p className="text-sm text-gray-500">En attente de validation par l&apos;équipe LINKHO.</p>
            )}
          </div>
        )}

        {/* Non disponible */}
        {demande.statut_disponibilite === 'non_disponible' && (
          <div className="space-y-3">
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Non disponible</span>
            {demande.motif_refus && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-red-600 mb-1">Motif</p>
                <p className="text-sm text-red-700">{demande.motif_refus}</p>
              </div>
            )}
          </div>
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
            {acomptePaiement?.justificatif_url && (
              <a
                href={`/api/justificatif/${acomptePaiement.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline font-medium"
              >
                📎 Justificatif de virement disponible — <span>Voir le justificatif</span>
              </a>
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
            {soldePaiement?.justificatif_url && (
              <a
                href={`/api/justificatif/${soldePaiement.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline font-medium"
              >
                📎 Justificatif de virement disponible — <span>Voir le justificatif</span>
              </a>
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

