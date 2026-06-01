'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { EvenementComplet } from '@/lib/actions/evenements'
import { accepterDevis, refuserDevis } from '@/lib/actions/devis'
import { creerReservation } from '@/lib/actions/reservations'
import { creerFormulaire } from '@/lib/actions/formulaires'

type Props = { evenement: EvenementComplet }

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
  if (!devis || ['brouillon', 'envoye', 'accepte'].includes(devis.statut)) return 2
  if (!reservation) return 3
  const acompte = reservation.paiements.find((p) => p.type === 'acompte')
  if (!acompte?.confirme) return 3
  const statut = reservation.statut
  if (statut === 'confirmee') return 4
  if (['en_cours', 'terminee'].includes(statut)) {
    const solde = reservation.paiements.find((p) => p.type === 'solde')
    return solde?.confirme ? 6 : 5
  }
  return 4
}

export default function EvenementDetail({ evenement }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  const { demande, devis, reservation, formulaire } = evenement
  const currentStep = getCurrentStep(evenement)

  function stepState(step: number): SectionState {
    if (step < currentStep) return 'completed'
    if (step === currentStep) return 'active'
    return 'future'
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
  const showSection4 = reservation != null && ['confirmee', 'en_cours', 'terminee'].includes(reservation.statut)
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
            <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full capitalize
              ${reservation.statut === 'confirmee' ? 'bg-green-100 text-green-700' :
                reservation.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' :
                reservation.statut === 'terminee' ? 'bg-gray-100 text-gray-600' :
                'bg-amber-100 text-amber-700'}`}>
              {reservation.statut}
            </span>
          )}
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {actionError}
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
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                ${demande.statut === 'acceptee' ? 'bg-green-100 text-green-700' :
                  demande.statut === 'refusee' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'}`}>
                {demande.statut}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            En attente de réponse de l&apos;établissement.
          </p>
        )}
      </div>

      {/* SECTION 2 — DEVIS */}
      {devis && (
        <div className={`rounded-xl border p-6 ${sectionCls(stepState(2))}`}>
          <SectionHeader step={2} title="Devis" state={stepState(2)} />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-mono">{devis.numero}</p>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                ${devis.statut === 'accepte' || devis.statut === 'signe' ? 'bg-green-100 text-green-700' :
                  devis.statut === 'refuse' ? 'bg-red-100 text-red-700' :
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
                <span>TVA ({devis.tva_taux}%)</span>
                <span>{fmtEuros((devis.total_ttc ?? 0) - devis.sous_total_ht)}</span>
              </div>
              <div className="flex justify-between font-bold text-navy border-t border-gray-100 pt-2">
                <span>Total TTC</span>
                <span>{fmtEuros(devis.total_ttc ?? 0)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pt-1">
                <span>Acompte ({devis.acompte_taux}%)</span>
                <span>{fmtEuros((devis.total_ttc ?? 0) * devis.acompte_taux / 100)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Solde</span>
                <span>{fmtEuros((devis.total_ttc ?? 0) * (1 - devis.acompte_taux / 100))}</span>
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
            {devis.statut === 'envoye' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction(() => accepterDevis(devis.id))}
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Accepter
                </button>
                <button
                  onClick={() => handleAction(() => refuserDevis(devis.id))}
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Refuser
                </button>
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
          </div>
        </div>
      )}

      {/* SECTION 3 — PAIEMENT ACOMPTE */}
      {reservation && (
        <div className={`rounded-xl border p-6 ${sectionCls(stepState(3))}`}>
          <SectionHeader step={3} title="Paiement de l'acompte" state={stepState(3)} />
          <div className="space-y-4">
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
          </div>
        </div>
      )}

      {/* SECTION 4 — FORMULAIRE D'INSCRIPTION */}
      {showSection4 && (
        <div className={`rounded-xl border p-6 ${sectionCls(stepState(4))}`}>
          <SectionHeader step={4} title="Formulaire d'inscription" state={stepState(4)} />
          {formulaire ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white rounded-lg border border-gray-100 p-4">
                <div>
                  <p className="text-sm font-semibold text-navy">{formulaire.titre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formulaire.nb_inscriptions} inscription{formulaire.nb_inscriptions !== 1 ? 's' : ''} ·{' '}
                    <span className={formulaire.publie ? 'text-green-600' : 'text-amber-600'}>
                      {formulaire.publie ? 'Publié' : 'Brouillon'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/bde/formulaires/${formulaire.id}`}
                  className="flex-1 py-2.5 text-center bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors"
                >
                  Gérer le formulaire
                </Link>
                <Link
                  href={`/bde/inscriptions?evenement_id=${evenement.id}`}
                  className="flex-1 py-2.5 text-center bg-white border border-gray-200 text-navy text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Voir les inscrits
                </Link>
              </div>
            </div>
          ) : (
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
                Créer le formulaire
              </button>
            </div>
          )}
        </div>
      )}

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
    </div>
  )
}
