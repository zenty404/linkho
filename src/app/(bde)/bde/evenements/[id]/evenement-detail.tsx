'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { EvenementComplet } from '@/lib/actions/evenements'
import type { LieuPublic } from '@/lib/actions/public'
import { accepterDevis, refuserDevis } from '@/lib/actions/devis'
import { sendMessage } from '@/lib/actions/messages'
import { creerReservation } from '@/lib/actions/reservations'
import { creerFormulaire, publierFormulaire } from '@/lib/actions/formulaires'
import { uploadJustificatif } from '@/lib/actions/paiements'
import { signerDevisPrestataire, refuserDevisPrestataire } from '@/lib/actions/devis-prestataires'
import { laisserAvisLieu } from '@/lib/actions/avis'
import { CountdownTimer } from '@/components/ui/countdown-timer'

type Props = { evenement: EvenementComplet; suggestions: LieuPublic[] }

type SectionState = 'active' | 'completed' | 'future'

function sectionCls(state: SectionState) {
  if (state === 'active') return 'border-brand bg-brand/5'
  if (state === 'completed') return 'border-green-200 bg-green-50'
  return 'border-gray-200 bg-gray-50 opacity-60 pointer-events-none'
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtEuros(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function SectionHeader({ step, title, state }: { step: number; title: string; state: SectionState }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
        ${state === 'completed' ? 'bg-green-500 text-white' : state === 'active' ? 'bg-brand text-navy' : 'bg-gray-300 text-white'}`}>
        {state === 'completed' ? '✓' : step}
      </div>
      <h2 className="text-base font-bold text-navy">{title}</h2>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="text-xs text-brand hover:underline font-medium"
    >
      {copied ? '✓ Copié' : 'Copier'}
    </button>
  )
}

function getCurrentStep(evt: EvenementComplet): number {
  const { demande, devis, reservation } = evt
  if (!demande) return 1
  if (reservation?.statut === 'annulee') return 1
  if (!devis && !reservation) return 1
  if (!devis && reservation) {
    // Direct flow: reservation created from disponibilité validation, no devis
    const acompte = reservation.paiements.find((p) => p.type === 'acompte')
    if (!acompte?.confirme) return 3
    const statut = reservation.statut
    if (statut === 'confirmee') return 4
    if (['en_cours', 'terminee', 'commission_reversee'].includes(statut)) {
      const solde = reservation.paiements.find((p) => p.type === 'solde')
      return solde?.confirme ? 6 : 5
    }
    return 4
  }
  if (['brouillon', 'envoye', 'accepte'].includes(devis!.statut)) return 2
  if (!reservation) return 3
  const acompte = reservation.paiements.find((p) => p.type === 'acompte')
  if (!acompte?.confirme) return 3
  const statut = reservation.statut
  if (statut === 'confirmee') return 4
  if (['en_cours', 'terminee', 'commission_reversee'].includes(statut)) {
    const solde = reservation.paiements.find((p) => p.type === 'solde')
    return solde?.confirme ? 6 : 5
  }
  return 4
}

export default function EvenementDetail({ evenement, suggestions }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [showRefusForm, setShowRefusForm] = useState(false)
  const [motifRefus, setMotifRefus] = useState('')
  const [uploadFiles, setUploadFiles] = useState<Record<string, File | null>>({})
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const [showReplace, setShowReplace] = useState<Record<string, boolean>>({})
  const [dpPendingId, setDpPendingId] = useState<string | null>(null)
  const [dpError, setDpError] = useState<string | null>(null)
  const [avisNote, setAvisNote] = useState(0)
  const [avisCommentaire, setAvisCommentaire] = useState('')
  const [avisSubmitted, setAvisSubmitted] = useState(false)
  const [avisError, setAvisError] = useState<string | null>(null)

  const { demande, devis, reservation, formulaire, cal_link, devis_prestataires, avis_lieu } = evenement
  const currentStep = getCurrentStep(evenement)

  function stepState(step: number): SectionState {
    if (step < currentStep) return 'completed'
    if (step === currentStep) return 'active'
    return 'future'
  }

  function handleRefus() {
    const motif = motifRefus.trim()
    if (motif.length < 20) return
    setActionError(null)
    startTransition(async () => {
      const res = await refuserDevis(devis!.id)
      if (res.error) { setActionError(res.error); return }
      if (evenement.demande?.id) {
        await sendMessage(evenement.demande.id, `Motif du refus : ${motif}`)
      }
      router.push(`/bde/messagerie?conv=${evenement.demande?.id ?? 'support'}`)
    })
  }

  async function handleUpload(paiementId: string) {
    const file = uploadFiles[paiementId]
    if (!file) return
    setUploadingId(paiementId)
    setUploadErrors(prev => ({ ...prev, [paiementId]: '' }))
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadJustificatif(paiementId, fd)
    setUploadingId(null)
    if (res.error) {
      setUploadErrors(prev => ({ ...prev, [paiementId]: res.error }))
      return
    }
    setShowReplace(prev => ({ ...prev, [paiementId]: false }))
    setUploadFiles(prev => ({ ...prev, [paiementId]: null }))
    router.refresh()
  }

  function handleAction(fn: () => Promise<{ data: unknown; error: string | null }>) {
    setActionError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) {
        setActionError(res.error)
        return
      }
      router.refresh()
    })
  }

  const acomptePaiement = reservation?.paiements.find((p) => p.type === 'acompte') ?? null
  const soldePaiement = reservation?.paiements.find((p) => p.type === 'solde') ?? null
  const showSection4 = reservation != null && ['acompte_confirme', 'confirmee', 'en_cours', 'terminee', 'commission_reversee'].includes(reservation.statut)
  const showSection5 = reservation != null && ['en_cours', 'terminee'].includes(reservation.statut)
  const showSection6 = acomptePaiement?.confirme && soldePaiement?.confirme

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-navy">{evenement.nom}</h1>
            {demande?.etablissement && (
              <p className="text-sm text-gray-500 mt-1">
                {demande.etablissement.nom}
                {demande.etablissement.ville ? ` — ${demande.etablissement.ville}` : ''}
              </p>
            )}
            {(evenement.date_debut || evenement.date_fin) && (
              <p className="text-sm text-gray-400 mt-0.5">
                {fmtDate(evenement.date_debut)}
                {evenement.date_fin ? ` → ${fmtDate(evenement.date_fin)}` : ''}
              </p>
            )}
          </div>
          {reservation && (
            <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full
              ${reservation.statut === 'annulee' ? 'bg-red-100 text-red-700' :
                reservation.statut === 'confirmee' ? 'bg-green-100 text-green-700' :
                reservation.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' :
                reservation.statut === 'terminee' ? 'bg-gray-100 text-gray-600' :
                'bg-amber-100 text-amber-700'}`}>
              {reservation.statut === 'annulee' ? 'Annulée' :
               reservation.statut === 'confirmee' ? 'Confirmée' :
               reservation.statut === 'en_cours' ? 'En cours' :
               reservation.statut === 'terminee' ? 'Terminée' :
               reservation.statut}
            </span>
          )}
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {actionError}
        </div>
      )}

      {reservation?.statut === 'annulee' && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm font-semibold text-red-700 mb-0.5">Réservation annulée</p>
          <p className="text-sm text-red-600">
            Cette réservation a été annulée suite au non-paiement de l&apos;acompte dans les 72h.
            Vous pouvez soumettre une nouvelle demande.
          </p>
        </div>
      )}

      {/* SECTION 1 — DEMANDE */}
      <div className={`rounded-xl border p-6 ${sectionCls(stepState(1))}`}>
        <SectionHeader step={1} title="Demande" state={stepState(1)} />
        {demande ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Établissement</p>
                <p className="font-medium text-navy">{demande.etablissement?.nom ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Participants</p>
                <p className="font-medium text-navy">{demande.nb_participants}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Début</p>
                <p className="font-medium text-navy">{fmtDate(evenement.date_debut)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Fin</p>
                <p className="font-medium text-navy">{fmtDate(evenement.date_fin)}</p>
              </div>
            </div>
            {demande.message && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Message</p>
                <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-gray-100">
                  {demande.message}
                </p>
              </div>
            )}
            {/* Statut disponibilité / annulation */}
            {reservation?.statut === 'annulee' ? (
              <div className="flex flex-col gap-3 pt-1">
                <p className="text-sm text-gray-500">Votre réservation a été annulée.</p>
                <Link
                  href="/rechercher"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors self-start"
                >
                  Faire une nouvelle demande
                </Link>
              </div>
            ) : (
              <>
                {demande.statut_disponibilite === 'en_attente' && (
                  <p className="text-sm text-gray-500">En attente de réponse de l&apos;établissement.</p>
                )}
                {demande.statut_disponibilite === 'disponible' && (
                  <div className="space-y-2">
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">✓ Disponibilité confirmée</span>
                    <p className="text-sm text-gray-500">En attente de validation par l&apos;équipe LINKHO avant génération de la facture.</p>
                  </div>
                )}
                {demande.statut_disponibilite === 'non_disponible' && (
                  <div className="space-y-2">
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Non disponible</span>
                    {demande.motif_refus && (
                      <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                        <p className="text-xs font-semibold text-red-600 mb-1">Motif</p>
                        <p className="text-sm text-red-700">{demande.motif_refus}</p>
                      </div>
                    )}
                  </div>
                )}
                {demande.statut === 'refusee' && demande.motif_refus && demande.statut_disponibilite !== 'non_disponible' && (
                  <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                    <p className="text-xs font-semibold text-red-600 mb-1">Motif du refus</p>
                    <p className="text-sm text-red-700">{demande.motif_refus}</p>
                  </div>
                )}
                {(demande.statut === 'refusee' || demande.statut_disponibilite === 'non_disponible') && suggestions.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-navy mb-3">Ces lieux pourraient vous convenir</p>
                    <div className="flex flex-col gap-3">
                      {suggestions.map((lieu) => (
                        <Link
                          key={lieu.id}
                          href={`/lieux/${lieu.id}`}
                          className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 hover:border-brand/40 hover:bg-brand/5 transition-colors"
                        >
                          {lieu.photo_url ? (
                            <img
                              src={lieu.photo_url}
                              alt={lieu.nom}
                              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-xl">
                              🏛
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-navy truncate">{lieu.nom}</p>
                            {lieu.ville && <p className="text-xs text-gray-500">{lieu.ville}</p>}
                            {lieu.capacite_max != null && (
                              <p className="text-xs text-gray-400">jusqu&apos;à {lieu.capacite_max} personnes</p>
                            )}
                          </div>
                          <span className="ml-auto text-gray-300 flex-shrink-0">›</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            En attente de réponse de l&apos;établissement.
          </p>
        )}
      </div>

      {/* SECTION 2 — DEVIS : masqué si réservation créée directement sans devis */}
      {demande && demande.statut !== 'refusee' && !(reservation && !devis) && (
        <div className={`rounded-xl border p-6 ${sectionCls(stepState(2))}`}>
          <SectionHeader step={2} title="Devis" state={stepState(2)} />

          {/* Pas encore de devis */}
          {!devis ? (
            <p className="text-sm text-gray-500">En attente du devis de l&apos;établissement.</p>
          ) : devis.statut === 'refuse' ? (
            <div className="space-y-3">
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                Devis refusé
              </span>
              <p className="text-sm text-gray-500">
                L&apos;établissement peut vous proposer un nouveau devis suite à vos échanges.
              </p>
              <Link
                href="/rechercher"
                className="inline-block px-4 py-2 bg-white border border-gray-200 text-navy text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Rechercher un autre lieu
              </Link>
            </div>
          ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-mono">{devis.numero}</p>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                ${devis.statut === 'accepte' || devis.statut === 'signe' ? 'bg-green-100 text-green-700' :
                  devis.statut === 'envoye' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'}`}>
                {devis.statut}
              </span>
            </div>

            {/* Prestations */}
            {devis.items.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <span>Prestation</span>
                  <span className="text-right">Qté</span>
                  <span className="text-right">Prix</span>
                </div>
                {devis.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-3 border-b border-gray-50 last:border-0 text-sm">
                    <span className="text-navy">{item.libelle}</span>
                    <span className="text-right text-gray-500">{item.quantite}</span>
                    <span className="text-right text-navy font-medium">{fmtEuros(item.prix_unitaire)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Récap financier */}
            <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total HT</span>
                <span>{fmtEuros(devis.sous_total_ht)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>TVA ({Math.round(devis.tva_taux * 100)}%)</span>
                <span>{fmtEuros((devis.total_ttc ?? 0) - devis.sous_total_ht)}</span>
              </div>
              <div className="flex justify-between font-bold text-navy border-t border-gray-100 pt-2">
                <span>Total TTC</span>
                <span>{fmtEuros(devis.total_ttc ?? 0)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pt-1">
                <span>Acompte ({Math.round(devis.acompte_taux * 100)}%)</span>
                <span>{fmtEuros((devis.total_ttc ?? 0) * devis.acompte_taux)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Solde</span>
                <span>{fmtEuros((devis.total_ttc ?? 0) * (1 - devis.acompte_taux))}</span>
              </div>
            </div>

            {devis.message_client && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Message de l&apos;établissement</p>
                <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-gray-100 italic">
                  {devis.message_client}
                </p>
              </div>
            )}

            {/* Actions devis */}
            {devis.statut === 'envoye' && !showRefusForm && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction(() => accepterDevis(devis.id))}
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Accepter
                </button>
                <button
                  onClick={() => setShowRefusForm(true)}
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Refuser
                </button>
              </div>
            )}
            {devis.statut === 'envoye' && showRefusForm && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    Motif du refus <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={motifRefus}
                    onChange={(e) => setMotifRefus(e.target.value)}
                    placeholder="Expliquez la raison du refus à l'établissement…"
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-300/30 focus:border-red-300 resize-none"
                  />
                  <p className={`text-xs mt-1 ${motifRefus.trim().length < 20 ? 'text-red-400' : 'text-gray-400'}`}>
                    {motifRefus.trim().length} / 20 caractères minimum
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowRefusForm(false); setMotifRefus('') }}
                    className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleRefus}
                    disabled={isPending || motifRefus.trim().length < 20}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? 'Envoi…' : 'Confirmer le refus'}
                  </button>
                </div>
              </div>
            )}
            {devis.statut === 'accepte' && !reservation && (
              <button
                onClick={() => handleAction(() => creerReservation(devis.id))}
                disabled={isPending}
                className="w-full py-2.5 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Confirmer et réserver
              </button>
            )}
            <a
              href={`/api/pdf/devis/${devis.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-brand hover:underline font-medium"
            >
              ↓ Télécharger le devis PDF
            </a>
          </div>
          )}
        </div>
      )}

      {/* SECTION 3 — PAIEMENT ACOMPTE */}
      {reservation && reservation.statut !== 'annulee' && (
        <div className={`rounded-xl border p-6 ${sectionCls(stepState(3))}`}>
          <SectionHeader step={3} title="Paiement de l'acompte" state={stepState(3)} />
          <div className="space-y-4">
            {reservation.statut === 'en_attente_acompte' && reservation.expire_at && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Délai de paiement</p>
                  <CountdownTimer expireAt={reservation.expire_at} />
                </div>
                <p className="text-sm text-amber-800">
                  Réglez l&apos;acompte de <strong>{fmtEuros(reservation.acompte_montant)}</strong> avant expiration pour confirmer votre réservation.
                </p>
              </div>
            )}
            <div className="bg-white rounded-lg border border-gray-100 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Montant acompte</p>
                <p className="text-lg font-bold text-navy">{fmtEuros(reservation.acompte_montant)}</p>
              </div>
              {acomptePaiement?.confirme ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                  ✓ Acompte reçu
                </span>
              ) : (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
                  En attente
                </span>
              )}
            </div>
            {acomptePaiement ? (
              <div className="bg-white rounded-lg border border-gray-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">Référence virement</p>
                    <p className="text-sm font-mono text-navy truncate">{acomptePaiement.reference_virement}</p>
                  </div>
                  <CopyButton text={acomptePaiement.reference_virement} />
                </div>
                {acomptePaiement.confirme_le && (
                  <p className="text-xs text-gray-400 mt-2">Confirmé le {fmtDate(acomptePaiement.confirme_le)}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Référence de virement en cours de génération.</p>
            )}
            {!acomptePaiement?.confirme && reservation.statut === 'en_attente_acompte' && (
              <Link
                href={`/bde/evenements/${evenement.id}/paiement`}
                className="flex items-center justify-center w-full py-3 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors"
              >
                Payer l&apos;acompte
              </Link>
            )}
            {acomptePaiement && (
              <div>
                {(!acomptePaiement.justificatif_nom || showReplace[acomptePaiement.id]) ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-gray-500">Déposer un justificatif <span className="text-gray-400">(optionnel)</span></p>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setUploadFiles(prev => ({ ...prev, [acomptePaiement.id]: e.target.files?.[0] ?? null }))}
                        className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-navy cursor-pointer"
                      />
                      {uploadFiles[acomptePaiement.id] && (
                        <button
                          onClick={() => { void handleUpload(acomptePaiement.id) }}
                          disabled={uploadingId === acomptePaiement.id}
                          className="px-3 py-1.5 bg-navy text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                        >
                          {uploadingId === acomptePaiement.id ? 'Envoi…' : 'Envoyer'}
                        </button>
                      )}
                    </div>
                    {uploadErrors[acomptePaiement.id] && (
                      <p className="text-xs text-red-500">{uploadErrors[acomptePaiement.id]}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-green-700 font-medium">✓ Justificatif déposé — {acomptePaiement.justificatif_nom}</span>
                    <button
                      onClick={() => setShowReplace(prev => ({ ...prev, [acomptePaiement.id]: true }))}
                      className="text-xs text-brand hover:underline font-medium"
                    >
                      Remplacer
                    </button>
                  </div>
                )}
              </div>
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
        </div>
      )}

      {/* CAL.COM — RDV équipe, visible pendant l'attente de l'acompte */}
      {reservation?.statut === 'en_attente_acompte' && cal_link && (
        <div className="rounded-xl border border-navy/10 bg-navy/5 p-6 space-y-3">
          <p className="text-sm font-bold text-navy">📞 Prochaine étape — Réserver un appel avec notre équipe</p>
          <p className="text-sm text-gray-600">
            Notre équipe vous accompagne dans l&apos;organisation de votre événement. Prenez rendez-vous pour préparer la suite.
          </p>
          <a
            href={cal_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors"
          >
            Prendre rendez-vous
          </a>
        </div>
      )}

      {/* SECTION 4 — FORMULAIRE D'INSCRIPTION */}
      {showSection4 && (() => {
        const publicBase = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
        const inscriptionUrl = formulaire ? `${publicBase}/inscription/${formulaire.id}` : ''

        return (
          <div className={`rounded-xl border p-6 ${sectionCls(stepState(4))}`}>
            <SectionHeader step={4} title="Formulaire d'inscription" state={stepState(4)} />

            {/* CAS 1 — Pas de formulaire */}
            {!formulaire && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Aucun formulaire d&apos;inscription créé.</p>
                <button
                  onClick={() => {
                    setActionError(null)
                    startTransition(async () => {
                      const res = await creerFormulaire(evenement.id)
                      if (res.error) { setActionError(res.error); return }
                      router.push('/bde/formulaires/' + res.data!.id)
                    })
                  }}
                  disabled={isPending}
                  className="px-4 py-2 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Créer le formulaire d&apos;inscription
                </button>
              </div>
            )}

            {/* CAS 2 — Brouillon */}
            {formulaire && !formulaire.publie && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-navy">{formulaire.titre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formulaire.nb_inscriptions} inscription{formulaire.nb_inscriptions !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                    Brouillon
                  </span>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/bde/formulaires/${formulaire.id}`}
                    className="flex-1 py-2.5 text-center bg-white border border-gray-200 text-navy text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Configurer le formulaire
                  </Link>
                  <button
                    onClick={() => handleAction(() => publierFormulaire(formulaire.id))}
                    disabled={isPending}
                    className="flex-1 py-2.5 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Publier
                  </button>
                </div>
              </div>
            )}

            {/* CAS 3 — Publié */}
            {formulaire && formulaire.publie && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-navy">{formulaire.titre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formulaire.nb_inscriptions} inscription{formulaire.nb_inscriptions !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                    Publié
                  </span>
                </div>

                {/* Lien public */}
                <div className="bg-white rounded-lg border border-gray-100 p-4">
                  <p className="text-xs text-gray-400 mb-1.5">Lien d&apos;inscription</p>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-mono text-navy truncate flex-1">{inscriptionUrl}</p>
                    <CopyButton text={inscriptionUrl} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/bde/formulaires/${formulaire.id}`}
                    className="flex-1 py-2.5 text-center bg-white border border-gray-200 text-navy text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Gérer le formulaire
                  </Link>
                  <Link
                    href={`/bde/inscriptions?evenement_id=${evenement.id}`}
                    className="flex-1 py-2.5 text-center bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors"
                  >
                    Voir les inscrits ({formulaire.nb_inscriptions})
                  </Link>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* SECTION 5 — PAIEMENT SOLDE */}
      {showSection5 && (
        <div className={`rounded-xl border p-6 ${sectionCls(stepState(5))}`}>
          <SectionHeader step={5} title="Paiement du solde" state={stepState(5)} />
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-100 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Montant solde</p>
                <p className="text-lg font-bold text-navy">{fmtEuros(reservation!.solde_montant)}</p>
              </div>
              {soldePaiement?.confirme ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                  ✓ Solde reçu
                </span>
              ) : (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
                  En attente
                </span>
              )}
            </div>
            {reservation!.solde_expire_at && !soldePaiement?.confirme && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-4">
                <p className="text-xs text-amber-800 font-medium">
                  Réglez le solde de <span className="font-bold">{fmtEuros(reservation!.solde_montant)}</span> avant cette date pour finaliser votre réservation.
                </p>
                <div className="flex-shrink-0">
                  <CountdownTimer expireAt={reservation!.solde_expire_at} />
                </div>
              </div>
            )}
            {soldePaiement ? (
              <div className="bg-white rounded-lg border border-gray-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">Référence virement</p>
                    <p className="text-sm font-mono text-navy truncate">{soldePaiement.reference_virement}</p>
                  </div>
                  <CopyButton text={soldePaiement.reference_virement} />
                </div>
                {soldePaiement.confirme_le && (
                  <p className="text-xs text-gray-400 mt-2">Confirmé le {fmtDate(soldePaiement.confirme_le)}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Référence de virement en cours de génération.</p>
            )}
            {(() => {
              const etab = evenement.demande?.etablissement
              if (etab?.iban || etab?.titulaire_compte) {
                return (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Virement à effectuer</p>
                    {etab.titulaire_compte && (
                      <div className="flex gap-2 text-sm">
                        <span className="text-gray-400 w-24 shrink-0">Titulaire</span>
                        <span className="text-navy font-medium">{etab.titulaire_compte}</span>
                      </div>
                    )}
                    {etab.iban && (
                      <div className="flex gap-2 text-sm">
                        <span className="text-gray-400 w-24 shrink-0">IBAN</span>
                        <span className="text-navy font-mono">{etab.iban}</span>
                      </div>
                    )}
                    {etab.bic && (
                      <div className="flex gap-2 text-sm">
                        <span className="text-gray-400 w-24 shrink-0">BIC</span>
                        <span className="text-navy font-mono">{etab.bic}</span>
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <p className="text-sm text-gray-400">Coordonnées bancaires non renseignées — contactez l&apos;établissement.</p>
              )
            })()}
            {soldePaiement && (
              <div>
                {(!soldePaiement.justificatif_nom || showReplace[soldePaiement.id]) ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-gray-500">Déposer un justificatif <span className="text-gray-400">(optionnel)</span></p>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setUploadFiles(prev => ({ ...prev, [soldePaiement.id]: e.target.files?.[0] ?? null }))}
                        className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-navy cursor-pointer"
                      />
                      {uploadFiles[soldePaiement.id] && (
                        <button
                          onClick={() => { void handleUpload(soldePaiement.id) }}
                          disabled={uploadingId === soldePaiement.id}
                          className="px-3 py-1.5 bg-navy text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                        >
                          {uploadingId === soldePaiement.id ? 'Envoi…' : 'Envoyer'}
                        </button>
                      )}
                    </div>
                    {uploadErrors[soldePaiement.id] && (
                      <p className="text-xs text-red-500">{uploadErrors[soldePaiement.id]}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-green-700 font-medium">✓ Justificatif déposé — {soldePaiement.justificatif_nom}</span>
                    <button
                      onClick={() => setShowReplace(prev => ({ ...prev, [soldePaiement.id]: true }))}
                      className="text-xs text-brand hover:underline font-medium"
                    >
                      Remplacer
                    </button>
                  </div>
                )}
              </div>
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
        </div>
      )}

      {/* SECTION 6 — CLÔTURE */}
      {showSection6 && (
        <div className={`rounded-xl border p-6 ${sectionCls('completed')}`}>
          <SectionHeader step={6} title="Clôture" state="completed" />
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Votre événement est terminé. Merci d&apos;avoir utilisé LINKHO !</p>
            {reservation && (
              <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-2 text-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Résumé financier</p>
                <div className="flex justify-between text-gray-600">
                  <span>Total TTC</span>
                  <span>{fmtEuros(reservation.montant_ttc)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Acompte versé</span>
                  <span>{fmtEuros(reservation.acompte_montant)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Solde versé</span>
                  <span>{fmtEuros(reservation.solde_montant)}</span>
                </div>
                <div className="flex justify-between text-gray-500 pt-1 border-t border-gray-100">
                  <span>Commission LINKHO</span>
                  <span>{fmtEuros(reservation.commission_montant)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION AVIS LIEU */}
      {reservation && ['terminee', 'commission_reversee'].includes(reservation.statut) && (
        <div className="rounded-xl border border-gray-200 p-6 bg-white">
          <h2 className="text-base font-bold text-navy mb-5">
            {avis_lieu || avisSubmitted ? 'Votre avis sur ce lieu' : 'Laisser un avis'}
          </h2>

          {avis_lieu || avisSubmitted ? (
            <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`text-xl ${i < (avis_lieu?.note ?? avisNote) ? 'text-brand' : 'text-gray-300'}`}>★</span>
                ))}
              </div>
              {(avis_lieu?.commentaire || avisCommentaire) && (
                <p className="text-sm text-gray-600">{avis_lieu?.commentaire ?? avisCommentaire}</p>
              )}
              <p className="text-xs text-green-600 font-medium mt-2">✓ Avis enregistré</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Étoiles cliquables */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Note</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAvisNote(n)}
                      className={`text-3xl transition-colors ${n <= avisNote ? 'text-brand' : 'text-gray-300 hover:text-brand/60'}`}
                      aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                  {avisNote > 0 && (
                    <span className="ml-2 text-sm text-gray-500">{avisNote}/5</span>
                  )}
                </div>
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Commentaire <span className="text-gray-400">(optionnel)</span>
                </label>
                <textarea
                  value={avisCommentaire}
                  onChange={(e) => setAvisCommentaire(e.target.value)}
                  rows={3}
                  placeholder="Partagez votre expérience avec ce lieu…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
                />
              </div>

              {avisError && (
                <p className="text-xs text-red-500">{avisError}</p>
              )}

              <button
                onClick={() => {
                  if (avisNote === 0) { setAvisError('Sélectionnez une note.'); return }
                  setAvisError(null)
                  startTransition(async () => {
                    const res = await laisserAvisLieu(evenement.id, avisNote, avisCommentaire || undefined)
                    if (res.error) { setAvisError(res.error); return }
                    setAvisSubmitted(true)
                  })
                }}
                disabled={isPending || avisNote === 0}
                className="px-5 py-2.5 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? 'Envoi…' : 'Envoyer mon avis'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* SECTION DEVIS PRESTATAIRES */}
      {devis_prestataires.length > 0 && (
        <div className="rounded-xl border border-gray-200 p-6 bg-white">
          <h2 className="text-base font-bold text-navy mb-5">Devis prestataires</h2>

          {dpError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-4 py-3">
              {dpError}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {devis_prestataires.map((dp) => {
              const badgeCls =
                dp.statut === 'signe'
                  ? 'bg-green-100 text-green-700'
                  : dp.statut === 'refuse'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
              const badgeLabel =
                dp.statut === 'signe' ? 'Signé' : dp.statut === 'refuse' ? 'Refusé' : 'En attente'
              const typeLabel =
                dp.type === 'transport'
                  ? 'Transport'
                  : dp.type === 'securite'
                    ? 'Sécurité'
                    : 'Autre'

              return (
                <div key={dp.id} className="bg-gray-50 rounded-lg border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                          {typeLabel}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>
                          {badgeLabel}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-navy">{dp.nom}</p>
                      {dp.montant != null && (
                        <p className="text-xs text-gray-500 mt-0.5">{fmtEuros(dp.montant)}</p>
                      )}
                    </div>
                    <a
                      href={`/api/devis-prestataire/${dp.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-xs text-brand hover:underline font-medium"
                    >
                      ↓ Voir le PDF
                    </a>
                  </div>

                  {dp.statut === 'en_attente' && (
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setDpError(null)
                          setDpPendingId(dp.id)
                          startTransition(async () => {
                            const res = await signerDevisPrestataire(dp.id)
                            setDpPendingId(null)
                            if (res.error) { setDpError(res.error); return }
                            router.refresh()
                          })
                        }}
                        disabled={isPending}
                        className="px-4 py-2 bg-brand hover:bg-brand-light text-navy text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {dpPendingId === dp.id && isPending ? 'En cours…' : '✓ Signer'}
                      </button>
                      <button
                        onClick={() => {
                          setDpError(null)
                          setDpPendingId(dp.id)
                          startTransition(async () => {
                            const res = await refuserDevisPrestataire(dp.id)
                            setDpPendingId(null)
                            if (res.error) { setDpError(res.error); return }
                            router.refresh()
                          })
                        }}
                        disabled={isPending}
                        className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {dpPendingId === dp.id && isPending ? 'En cours…' : 'Refuser'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
