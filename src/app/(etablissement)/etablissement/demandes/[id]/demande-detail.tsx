'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { DemandeComplete } from '@/lib/actions/etablissement'
import { refuserDemande, confirmerDisponibilite, refuserDisponibilite } from '@/lib/actions/etablissement'
import { confirmerPaiement } from '@/lib/actions/reservations'
import { lancerEtatDesLieux } from '@/lib/actions/etats-des-lieux'
import { CountdownTimer } from '@/components/ui/countdown-timer'
import { getBadge, RESERVATION_STATUTS, DEMANDE_STATUTS } from '@/lib/statuts'

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
  const [edlPending, setEdlPending] = useState<'arrivee' | 'depart' | null>(null)
  const [edlError, setEdlError] = useState<string | null>(null)

  const { devis, reservation } = demande

  const headerStatut: { label: string; style: string } = (() => {
    if (reservation) {
      const b = getBadge(reservation.statut, RESERVATION_STATUTS)
      return { label: b.label, style: b.cls }
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
    const b = getBadge(demande.statut_disponibilite ?? demande.statut, DEMANDE_STATUTS)
    return { label: b.label, style: b.cls }
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

  const acompteConfirme = showSection4
  const edlArrivee = demande.etats_des_lieux.find((e) => e.type === 'arrivee') ?? null
  const edlDepart = demande.etats_des_lieux.find((e) => e.type === 'depart') ?? null

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
                <p className="text-xs text-gray-400 mb-0.5">Acompte net établissement</p>
                <p className="text-lg font-bold text-navy">{fmtEuros((reservation!.montant_ht - reservation!.commission_montant) * 0.3)}</p>
              </div>
              {reservation!.acompte_reverse_le ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                  Versé ✅ le {new Date(reservation!.acompte_reverse_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              ) : acomptePaiement?.confirme ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">Reçu par LINKHO — reversement en cours</span>
              ) : (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">En attente</span>
              )}
            </div>

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

      {/* SECTION ÉTATS DES LIEUX */}
      {showSection3 && (
        <SectionCard>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">États des lieux</h2>

          {edlError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-4 py-3">
              {edlError}
            </div>
          )}

          {!acompteConfirme ? (
            <p className="text-sm text-gray-400">Disponible après confirmation de l&apos;acompte.</p>
          ) : (
            <div className="space-y-4">
              {/* Arrivée */}
              <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-navy mb-0.5">État des lieux d&apos;arrivée</p>
                    {!edlArrivee && (
                      <p className="text-xs text-gray-500">Non lancé</p>
                    )}
                    {edlArrivee?.statut === 'en_attente_signature' && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          En attente de signature
                        </span>
                        <span className="text-xs text-gray-500">
                          BDE {edlArrivee.bde_signe_le ? '✓' : '○'} · Établissement {edlArrivee.etab_signe_le ? '✓' : '○'}
                        </span>
                      </div>
                    )}
                    {edlArrivee?.statut === 'signe' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 mt-1 inline-block">
                        Signé ✓
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {edlArrivee?.statut === 'en_attente_signature' && edlArrivee.yousign_etab_signature_link && !edlArrivee.etab_signe_le && (
                      <a
                        href={edlArrivee.yousign_etab_signature_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-brand hover:bg-brand-light text-navy text-xs font-semibold rounded-lg transition-colors"
                      >
                        Signer
                      </a>
                    )}
                    {!edlArrivee && (
                      <button
                        onClick={() => {
                          if (!reservation) return
                          setEdlError(null)
                          setEdlPending('arrivee')
                          startTransition(async () => {
                            const res = await lancerEtatDesLieux(reservation.id, 'arrivee')
                            setEdlPending(null)
                            if (res.error) { setEdlError(res.error); return }
                            router.refresh()
                          })
                        }}
                        disabled={isPending || !reservation}
                        className="px-3 py-1.5 bg-navy hover:bg-navy/90 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {edlPending === 'arrivee' && isPending ? 'Lancement…' : 'Lancer'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Départ */}
              <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-navy mb-0.5">État des lieux de départ</p>
                    {!edlDepart && edlArrivee?.statut !== 'signe' && (
                      <p className="text-xs text-gray-400">Disponible après signature de l&apos;état des lieux d&apos;arrivée.</p>
                    )}
                    {!edlDepart && edlArrivee?.statut === 'signe' && (
                      <p className="text-xs text-gray-500">Non lancé</p>
                    )}
                    {edlDepart?.statut === 'en_attente_signature' && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          En attente de signature
                        </span>
                        <span className="text-xs text-gray-500">
                          BDE {edlDepart.bde_signe_le ? '✓' : '○'} · Établissement {edlDepart.etab_signe_le ? '✓' : '○'}
                        </span>
                      </div>
                    )}
                    {edlDepart?.statut === 'signe' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 mt-1 inline-block">
                        Signé ✓
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {edlDepart?.statut === 'en_attente_signature' && edlDepart.yousign_etab_signature_link && !edlDepart.etab_signe_le && (
                      <a
                        href={edlDepart.yousign_etab_signature_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-brand hover:bg-brand-light text-navy text-xs font-semibold rounded-lg transition-colors"
                      >
                        Signer
                      </a>
                    )}
                    {!edlDepart && edlArrivee?.statut === 'signe' && (
                      <button
                        onClick={() => {
                          if (!reservation) return
                          setEdlError(null)
                          setEdlPending('depart')
                          startTransition(async () => {
                            const res = await lancerEtatDesLieux(reservation.id, 'depart')
                            setEdlPending(null)
                            if (res.error) { setEdlError(res.error); return }
                            router.refresh()
                          })
                        }}
                        disabled={isPending || !reservation}
                        className="px-3 py-1.5 bg-navy hover:bg-navy/90 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {edlPending === 'depart' && isPending ? 'Lancement…' : 'Lancer'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* SECTION 3 — SOLDE */}
      {showSection4 && (
        <SectionCard>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Paiement du solde</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Solde net établissement</p>
                <p className="text-lg font-bold text-navy">{fmtEuros((reservation!.montant_ht - reservation!.commission_montant) * 0.7)}</p>
              </div>
              {reservation!.solde_reverse_le ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                  Versé ✅ le {new Date(reservation!.solde_reverse_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              ) : soldePaiement?.confirme ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">Reçu par LINKHO — reversement en cours</span>
              ) : (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">En attente</span>
              )}
            </div>

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

