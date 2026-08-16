'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { getEvenementById, type EvenementComplet } from '@/lib/actions/evenements'
import type { LieuPublic } from '@/lib/actions/public'
import { accepterDevis, refuserDevis } from '@/lib/actions/devis'
import { sendMessage } from '@/lib/actions/messages'
import { creerReservation } from '@/lib/actions/reservations'
import { creerFormulaire } from '@/lib/actions/formulaires'

import { initierSignatureYousign } from '@/lib/actions/devis-prestataires'
import { laisserAvisLieu } from '@/lib/actions/avis'
import { getInscriptionsByEvenement, type InscriptionWithDetails } from '@/lib/actions/inscriptions'
import { CountdownTimer } from '@/components/ui/countdown-timer'
import { InscriptionsClient } from '@/app/(bde)/bde/inscriptions/inscriptions-client'
import { FormBuilder } from '@/app/(bde)/bde/formulaires/[id]/form-builder-client'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/supabase'

type EvenementRow = Database['public']['Tables']['evenements']['Row']
type FormulaireRow = Database['public']['Tables']['formulaire_inscriptions']['Row']

type Props = { evenement: EvenementComplet; suggestions: LieuPublic[] }

type ActiveView = number | 'inscrits' | 'formulaire'

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtEuros(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

// ─── Icônes ───────────────────────────────────────────────────────────────────

function IconEnvelope() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  )
}

function IconCalendarCheck() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 14.25 2.25 2.25 4.5-4.5" />
    </svg>
  )
}

function IconDocumentText() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function IconCreditCard() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5h-15A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
    </svg>
  )
}

function IconCheckCircle() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function IconKey() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
  )
}

function IconDoorExit() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H3" />
    </svg>
  )
}

function IconBanknotes() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a1.125 1.125 0 0 1-1.125 1.125H3.375A1.125 1.125 0 0 1 2.25 18V8.625c0-.621.504-1.125 1.125-1.125H6.75m9 0V6a2.25 2.25 0 0 0-2.25-2.25h-4.5A2.25 2.25 0 0 0 6.75 6v1.5m9 0h-9" />
    </svg>
  )
}

function IconStar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  )
}

function IconTrophy() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
    </svg>
  )
}

// ─── Card d'étape ─────────────────────────────────────────────────────────────

function StepCard({
  icon,
  title,
  subtitle,
  children,
  tone = 'white',
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  children: React.ReactNode
  tone?: 'white' | 'green' | 'amber'
}) {
  const toneCls =
    tone === 'green' ? 'bg-green-50' :
    tone === 'amber' ? 'bg-amber-50' :
    'bg-white'
  const iconBoxCls =
    tone === 'green' ? 'bg-green-500/10 text-green-700' :
    tone === 'amber' ? 'bg-amber-500/10 text-amber-700' :
    'bg-navy/5 text-navy'
  return (
    <div className={`rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${toneCls}`}>
      <div className="px-6 py-5 border-b border-gray-100/80">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBoxCls}`}>
            {icon}
          </div>
          <div>
            <h2 className="text-base font-bold text-navy">{title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: 'Demande' },
  { n: 2, label: 'Dispo confirmée' },
  { n: 3, label: 'Validée LINKHO' },
  { n: 4, label: 'Acompte à régler' },
  { n: 5, label: 'Acompte payé' },
  { n: 6, label: 'Devis presta' },
  { n: 7, label: 'EDL arrivée' },
  { n: 8, label: 'EDL départ' },
  { n: 9, label: 'Solde à régler' },
  { n: 10, label: 'Terminé' },
]

function RoadmapTimeline({ currentStep, selectedStep, onSelect, cancelled }: {
  currentStep: number
  selectedStep: ActiveView
  onSelect: (n: number) => void
  cancelled?: boolean
}) {
  void cancelled
  return (
    <div className="bg-white border-b border-gray-100 w-full px-6 py-4 sticky top-0 z-10 shadow-sm">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center w-full">
          {STEPS.map((step, i) => {
            const done = currentStep > step.n
            const current = currentStep === step.n
            const selected = selectedStep === step.n
            const clickable = done || current
            return (
              <div key={step.n} className="flex items-center flex-1">
                <button
                  onClick={() => clickable && onSelect(step.n)}
                  disabled={!clickable}
                  className="flex flex-col items-center gap-1 flex-shrink-0 disabled:cursor-not-allowed"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all
                    ${selected ? 'scale-125 shadow-lg' : ''}
                    ${done ? 'bg-green-500 border-green-500 text-white' :
                      current ? 'bg-brand border-brand text-white' :
                      'bg-white border-gray-200 text-gray-300'}`}>
                    {done ? '✓' : step.n}
                  </div>
                  <span className={`text-[8px] font-medium text-center leading-tight w-12
                    ${done ? 'text-green-600' : current ? 'text-brand' : 'text-gray-300'}`}>
                    {step.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-0.5 mb-3 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Étape courante ─────────────────────────────────────────────────────────────

function getCurrentStep(evt: EvenementComplet): number {
  const { demande, reservation, etats_des_lieux, devis_prestataires } = evt
  if (!demande) return 1
  if (reservation?.statut === 'annulee') return 0
  if (demande.statut_disponibilite !== 'disponible') return 1
  if (!reservation) return 2
  const acompte = reservation.paiements?.find(p => p.type === 'acompte')
  if (!acompte?.confirme) return 4
  const devisTraites = devis_prestataires.length === 0 || devis_prestataires.every(dp => dp.statut !== 'en_attente')
  if (!devisTraites) return 6
  const edlArrivee = etats_des_lieux?.find(e => e.type === 'arrivee')
  if (!edlArrivee || edlArrivee.statut !== 'signe') return 7
  const edlDepart = etats_des_lieux?.find(e => e.type === 'depart')
  if (!edlDepart || edlDepart.statut !== 'signe') return 8
  const solde = reservation.paiements?.find(p => p.type === 'solde')
  if (!solde?.confirme) return 9
  return 10
}

// ─── Étape 1 — Demande ────────────────────────────────────────────────────────

function StepDemande({
  demande,
  dateDebut,
  dateFin,
  suggestions,
}: {
  demande: EvenementComplet['demande']
  dateDebut: string | null
  dateFin: string | null
  suggestions: LieuPublic[]
}) {
  return (
    <StepCard icon={<IconEnvelope />} title="Demande" subtitle="Demande envoyée à l'établissement">
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
              <p className="font-medium text-navy">{fmtDate(dateDebut)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Fin</p>
              <p className="font-medium text-navy">{fmtDate(dateFin)}</p>
            </div>
          </div>
          {demande.message && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Message</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">
                {demande.message}
              </p>
            </div>
          )}
          {demande.statut_disponibilite === 'en_attente' && (
            <p className="text-sm text-gray-500">En attente de réponse de l&apos;établissement.</p>
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
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          En attente de réponse de l&apos;établissement.
        </p>
      )}
    </StepCard>
  )
}

// ─── Étape 2 — Disponibilité ──────────────────────────────────────────────────

function StepDispo({ demande }: { demande: EvenementComplet['demande'] }) {
  return (
    <StepCard icon={<IconCalendarCheck />} title="Disponibilité" subtitle="L'établissement a confirmé sa disponibilité">
      {demande?.statut_disponibilite === 'disponible' ? (
        <div className="space-y-2">
          <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">✓ Disponibilité confirmée</span>
          <p className="text-sm text-gray-500">En attente de validation par l&apos;équipe LINKHO avant génération de la facture.</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">En attente de confirmation de disponibilité par l&apos;établissement.</p>
      )}
    </StepCard>
  )
}

// ─── Étape 3 — Validée par LINKHO (devis) ─────────────────────────────────────

function StepValidation({
  devis,
  reservation,
  isPending,
  showRefusForm,
  setShowRefusForm,
  motifRefus,
  setMotifRefus,
  onAccepter,
  onRefuser,
  onReserver,
}: {
  devis: EvenementComplet['devis']
  reservation: EvenementComplet['reservation']
  isPending: boolean
  showRefusForm: boolean
  setShowRefusForm: (v: boolean) => void
  motifRefus: string
  setMotifRefus: (v: string) => void
  onAccepter: () => void
  onRefuser: () => void
  onReserver: () => void
}) {
  return (
    <StepCard icon={<IconDocumentText />} title="Devis" subtitle="LINKHO a validé votre demande">
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
            className="inline-block bg-gray-50 text-navy font-semibold rounded-xl py-3 px-6 hover:bg-gray-100 transition-colors border border-gray-200 text-sm"
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

          {devis.statut === 'envoye' && !showRefusForm && (
            <div className="flex gap-3">
              <button
                onClick={onAccepter}
                disabled={isPending}
                className="flex-1 bg-brand text-white font-semibold rounded-xl py-3 px-6 hover:bg-brand/90 transition-colors disabled:opacity-50 text-sm"
              >
                Accepter
              </button>
              <button
                onClick={() => setShowRefusForm(true)}
                disabled={isPending}
                className="flex-1 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-semibold rounded-xl py-3 px-6 transition-colors disabled:opacity-50 text-sm"
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
                  className="flex-1 bg-gray-50 text-navy font-semibold rounded-xl py-3 px-6 hover:bg-gray-100 transition-colors border border-gray-200 text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={onRefuser}
                  disabled={isPending || motifRefus.trim().length < 20}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl py-3 px-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isPending ? 'Envoi…' : 'Confirmer le refus'}
                </button>
              </div>
            </div>
          )}
          {devis.statut === 'accepte' && !reservation && (
            <button
              onClick={onReserver}
              disabled={isPending}
              className="w-full bg-brand text-white font-semibold rounded-xl py-3 px-6 hover:bg-brand/90 transition-colors disabled:opacity-50 text-sm"
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
    </StepCard>
  )
}

// ─── Étape 4 — Acompte à régler ───────────────────────────────────────────────

function StepAcompte({
  reservation,
  evenementId,
  calLink,
}: {
  reservation: EvenementComplet['reservation']
  evenementId: string
  calLink: string | null
}) {
  if (!reservation) return <p className="text-sm text-gray-500">Aucune réservation en cours.</p>
  const acomptePaiement = reservation.paiements.find((p) => p.type === 'acompte') ?? null

  return (
    <div className="flex flex-col gap-5">
      <StepCard icon={<IconCreditCard />} title="Paiement de l'acompte" subtitle="Réglez l'acompte pour confirmer">
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
            {reservation.statut === 'confirmee' || acomptePaiement?.confirme ? (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                Acompte reçu ✅
              </span>
            ) : (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
                En attente
              </span>
            )}
          </div>
          {!acomptePaiement?.confirme && reservation.statut === 'en_attente_acompte' && (
            <Link
              href={`/bde/evenements/${evenementId}/paiement`}
              className="flex items-center justify-center w-full bg-brand text-white font-semibold rounded-xl py-3 px-6 hover:bg-brand/90 transition-colors text-sm"
            >
              Payer l&apos;acompte
            </Link>
          )}
          {acomptePaiement?.confirme && (
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
      </StepCard>

      {reservation.statut === 'en_attente_acompte' && calLink && (
        <div className="rounded-2xl border border-navy/10 bg-navy/5 p-6 space-y-3">
          <p className="text-sm font-bold text-navy">📞 Prochaine étape — Réserver un appel avec notre équipe</p>
          <p className="text-sm text-gray-600">
            Notre équipe vous accompagne dans l&apos;organisation de votre événement. Prenez rendez-vous pour préparer la suite.
          </p>
          <a
            href={calLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-brand text-white font-semibold rounded-xl py-3 px-6 hover:bg-brand/90 transition-colors text-sm"
          >
            Prendre rendez-vous
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Étape 5 — Acompte payé (+ caution solidaire BDE) ─────────────────────────

function StepAcomptePaye({
  reservation,
  demande,
}: {
  reservation: EvenementComplet['reservation']
  demande: EvenementComplet['demande']
}) {
  const montant = demande?.etablissement?.caution_montant ?? null

  return (
    <div className="flex flex-col gap-5">
      <StepCard icon={<IconCheckCircle />} title="Acompte payé" subtitle="Votre acompte a bien été reçu" tone="green">
        <p className="text-sm text-gray-600">
          {reservation ? `Acompte de ${fmtEuros(reservation.acompte_montant)} confirmé. ✅` : 'Acompte confirmé.'}
        </p>
      </StepCard>

      {montant && montant > 0 && (() => {
        const paliers = [0.25, 0.5, 0.75, 1]
        return (
          <div className="rounded-2xl border border-amber-200 shadow-sm bg-amber-50 p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-xl">🔒</span>
              <div>
                <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Caution solidaire BDE</h2>
                <p className="text-sm text-amber-700 mt-1">
                  Vous devrez apporter <strong>{montant.toLocaleString('fr-FR')} €</strong> de caution sous forme de chèques à remettre à l&apos;établissement le jour J à votre arrivée.
                </p>
              </div>
            </div>
            <div className="bg-white/60 rounded-lg p-4 space-y-2 mb-4">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">Chèques à préparer</p>
              {paliers.map((ratio) => (
                <div key={ratio} className="flex justify-between text-sm text-amber-700">
                  <span>Chèque de {Math.round(ratio * 100)}%</span>
                  <span className="font-bold">{Math.round(montant * ratio).toLocaleString('fr-FR')} €</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-600">
              En cas de dégâts constatés à l&apos;état des lieux de départ, seul le chèque le plus proche du montant des dégâts sera encaissé. Les autres vous seront rendus.
            </p>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Étape 6 — Devis prestataires (+ formulaire d'inscription) ────────────────
// Le formulaire d'inscription n'a pas d'étape dédiée dans la timeline à 10 étapes ;
// il partage la même condition d'affichage que les devis prestataires, donc il est
// regroupé ici.

function StepDevisPresta({
  devis_prestataires,
  dpError,
  dpPendingId,
  dpRefusModalId,
  dpRefusMotif,
  isPending,
  setDpRefusMotif,
  onSigner,
  onOuvrirRefus,
  onAnnulerRefus,
  onEnvoyerRefus,
}: {
  devis_prestataires: EvenementComplet['devis_prestataires']
  dpError: string | null
  dpPendingId: string | null
  dpRefusModalId: string | null
  dpRefusMotif: string
  isPending: boolean
  setDpRefusMotif: (v: string) => void
  onSigner: (dpId: string) => void
  onOuvrirRefus: (dpId: string) => void
  onAnnulerRefus: () => void
  onEnvoyerRefus: (dp: EvenementComplet['devis_prestataires'][number]) => void
}) {
  return (
    <StepCard icon={<IconUsers />} title="Devis prestataires" subtitle="Prestataires externes à valider">
      {devis_prestataires.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun devis prestataire pour le moment.</p>
        ) : (
          <>
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
                      dpRefusModalId === dp.id ? (
                        <div className="pt-3 border-t border-gray-100 space-y-3">
                          <div>
                            <p className="text-sm font-semibold text-navy">Contacter le support LINKHO</p>
                            <p className="text-xs text-gray-500 mt-0.5">Expliquez pourquoi vous souhaitez refuser ce devis</p>
                          </div>
                          <div>
                            <textarea
                              value={dpRefusMotif}
                              onChange={(e) => setDpRefusMotif(e.target.value)}
                              placeholder="Décrivez la raison de votre refus…"
                              rows={3}
                              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
                            />
                            <p className={`text-xs mt-1 ${dpRefusMotif.trim().length < 20 ? 'text-red-400' : 'text-gray-400'}`}>
                              {dpRefusMotif.trim().length} / 20 caractères minimum
                            </p>
                          </div>
                          {dpError && (
                            <p className="text-xs text-red-500">{dpError}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={onAnnulerRefus}
                              className="flex-1 bg-gray-50 text-navy border border-gray-200 text-xs font-semibold rounded-xl py-2.5 px-4 hover:bg-gray-100 transition-colors"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => onEnvoyerRefus(dp)}
                              disabled={isPending || dpRefusMotif.trim().length < 20}
                              className="flex-1 bg-navy hover:bg-navy/90 text-white text-xs font-semibold rounded-xl py-2.5 px-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isPending ? 'Envoi…' : 'Envoyer'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => onSigner(dp.id)}
                            disabled={isPending}
                            className="bg-brand text-white text-xs font-semibold rounded-xl py-2.5 px-4 hover:bg-brand/90 transition-colors disabled:opacity-50"
                          >
                            {dpPendingId === dp.id && isPending ? 'Préparation…' : 'Signer électroniquement'}
                          </button>
                          <button
                            onClick={() => onOuvrirRefus(dp.id)}
                            className="bg-gray-50 border border-gray-200 text-navy text-xs font-semibold rounded-xl py-2.5 px-4 hover:bg-gray-100 transition-colors"
                          >
                            Refuser / Contacter le support
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
    </StepCard>
  )
}

// ─── Étape 7 — État des lieux d'arrivée ────────────────────────────────────────

function StepEdlArrivee({ etats_des_lieux }: { etats_des_lieux: EvenementComplet['etats_des_lieux'] }) {
  const edlArrivee = etats_des_lieux.find((e) => e.type === 'arrivee') ?? null
  return (
    <StepCard icon={<IconKey />} title="État des lieux d'arrivée" subtitle="À signer le jour de votre arrivée">
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            {!edlArrivee && (
              <p className="text-xs text-gray-400">L&apos;établissement lancera cet état des lieux le jour J.</p>
            )}
            {edlArrivee?.statut === 'en_attente_signature' && (
              <div className="space-y-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 inline-block">
                  En attente de signature
                </span>
                <p className="text-xs text-gray-500">
                  BDE {edlArrivee.bde_signe_le ? '✓ signé' : '○ en attente'} · Établissement {edlArrivee.etab_signe_le ? '✓ signé' : '○ en attente'}
                </p>
              </div>
            )}
            {edlArrivee?.statut === 'signe' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 inline-block">
                Signé par les deux parties ✓
              </span>
            )}
          </div>
          {edlArrivee?.statut === 'en_attente_signature' && edlArrivee.yousign_bde_signature_link && !edlArrivee.bde_signe_le && (
            <a
              href={edlArrivee.yousign_bde_signature_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-brand text-white text-xs font-semibold rounded-xl py-2.5 px-4 hover:bg-brand/90 transition-colors"
            >
              Signer
            </a>
          )}
        </div>
      </div>
    </StepCard>
  )
}

// ─── Étape 8 — État des lieux de départ ────────────────────────────────────────

function StepEdlDepart({ etats_des_lieux }: { etats_des_lieux: EvenementComplet['etats_des_lieux'] }) {
  const edlArrivee = etats_des_lieux.find((e) => e.type === 'arrivee') ?? null
  const edlDepart = etats_des_lieux.find((e) => e.type === 'depart') ?? null
  return (
    <StepCard icon={<IconDoorExit />} title="État des lieux de départ" subtitle="À signer avant de quitter le lieu">
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            {!edlDepart && (
              <p className="text-xs text-gray-400">
                {edlArrivee?.statut === 'signe'
                  ? "L'établissement lancera cet état des lieux en fin d'événement."
                  : "Disponible après signature de l'état des lieux d'arrivée."}
              </p>
            )}
            {edlDepart?.statut === 'en_attente_signature' && (
              <div className="space-y-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 inline-block">
                  En attente de signature
                </span>
                <p className="text-xs text-gray-500">
                  BDE {edlDepart.bde_signe_le ? '✓ signé' : '○ en attente'} · Établissement {edlDepart.etab_signe_le ? '✓ signé' : '○ en attente'}
                </p>
              </div>
            )}
            {edlDepart?.statut === 'signe' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 inline-block">
                Signé par les deux parties ✓
              </span>
            )}
          </div>
          {edlDepart?.statut === 'en_attente_signature' && edlDepart.yousign_bde_signature_link && !edlDepart.bde_signe_le && (
            <a
              href={edlDepart.yousign_bde_signature_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-brand text-white text-xs font-semibold rounded-xl py-2.5 px-4 hover:bg-brand/90 transition-colors"
            >
              Signer
            </a>
          )}
        </div>
      </div>
    </StepCard>
  )
}

// ─── Étape 9 — Solde à régler ──────────────────────────────────────────────────

function StepSolde({
  reservation,
  evenementId,
  edlDepartSigne,
}: {
  reservation: EvenementComplet['reservation']
  evenementId: string
  edlDepartSigne: boolean
}) {
  if (!reservation) return <p className="text-sm text-gray-500">Aucune réservation en cours.</p>
  const soldePaiement = reservation.paiements.find((p) => p.type === 'solde') ?? null

  return (
    <StepCard icon={<IconBanknotes />} title="Paiement du solde" subtitle="Dernière étape avant la clôture">
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Montant solde</p>
            <p className="text-lg font-bold text-navy">{fmtEuros(reservation.solde_montant)}</p>
          </div>
          {reservation.statut_solde === 'paye' || soldePaiement?.confirme ? (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
              Solde reçu ✅
            </span>
          ) : (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
              En attente
            </span>
          )}
        </div>
        {reservation.solde_expire_at && reservation.statut_solde !== 'paye' && !soldePaiement?.confirme && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-4">
            <p className="text-xs text-amber-800 font-medium">
              Réglez le solde de <span className="font-bold">{fmtEuros(reservation.solde_montant)}</span> avant cette date pour finaliser votre réservation.
            </p>
            <div className="flex-shrink-0">
              <CountdownTimer expireAt={reservation.solde_expire_at} />
            </div>
          </div>
        )}
        {!soldePaiement?.confirme && reservation.statut_solde === 'en_attente' && edlDepartSigne && (
          <Link
            href={`/bde/evenements/${evenementId}/paiement-solde`}
            className="flex items-center justify-center w-full bg-brand text-white font-semibold rounded-xl py-3 px-6 hover:bg-brand/90 transition-colors text-sm"
          >
            Payer le solde
          </Link>
        )}
        {!soldePaiement?.confirme && reservation.statut_solde === 'en_attente' && !edlDepartSigne && (
          <p className="text-xs text-gray-400 text-center py-2">
            Le paiement du solde sera débloqué après signature de l&apos;état des lieux de départ.
          </p>
        )}
        {soldePaiement?.confirme && (
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
    </StepCard>
  )
}

// ─── Étape 10 — Terminé ────────────────────────────────────────────────────────

function StepTermine({
  reservation,
  avis_lieu,
  avisNote,
  setAvisNote,
  avisCommentaire,
  setAvisCommentaire,
  avisSubmitted,
  avisError,
  isPending,
  onEnvoyerAvis,
}: {
  reservation: EvenementComplet['reservation']
  avis_lieu: EvenementComplet['avis_lieu']
  avisNote: number
  setAvisNote: (n: number) => void
  avisCommentaire: string
  setAvisCommentaire: (v: string) => void
  avisSubmitted: boolean
  avisError: string | null
  isPending: boolean
  onEnvoyerAvis: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <StepCard icon={<IconTrophy />} title="Clôture" subtitle="Événement clôturé avec succès" tone="green">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Votre événement est terminé. Merci d&apos;avoir utilisé LINKHO !</p>
          {reservation && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2 text-sm">
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
      </StepCard>

      {reservation && ['en_cours', 'terminee', 'commission_reversee'].includes(reservation.statut) && (
        <StepCard
          icon={<IconStar />}
          title={avis_lieu || avisSubmitted ? 'Votre avis sur ce lieu' : 'Laisser un avis'}
          subtitle="Aidez les autres BDE à choisir ce lieu"
        >
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
                onClick={onEnvoyerAvis}
                disabled={isPending || avisNote === 0}
                className="bg-brand text-white font-semibold rounded-xl py-3 px-6 hover:bg-brand/90 transition-colors disabled:opacity-50 text-sm"
              >
                {isPending ? 'Envoi…' : 'Envoyer mon avis'}
              </button>
            </div>
          )}
        </StepCard>
      )}
    </div>
  )
}


// ─── Panel Inscrits ───────────────────────────────────────────────────────────

function InscritsPanel({ evenementId, formulaireId }: { evenementId: string; formulaireId: string | null }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inscriptions, setInscriptions] = useState<InscriptionWithDetails[]>([])
  const [evenementRow, setEvenementRow] = useState<EvenementRow | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([getInscriptionsByEvenement(evenementId), getEvenementById(evenementId)]).then(
      ([insRes, evtRes]) => {
        if (cancelled) return
        if (insRes.error || !insRes.data) {
          setError(insRes.error ?? 'Erreur de chargement des inscrits.')
        } else {
          setInscriptions(insRes.data)
          setEvenementRow(evtRes.data ?? null)
        }
        setLoading(false)
      },
    )
    return () => {
      cancelled = true
    }
  }, [evenementId])

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {loading ? (
          <p className="text-sm text-gray-400">Chargement des inscrits…</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <InscriptionsClient
            evenements={evenementRow ? [evenementRow] : []}
            inscriptions={inscriptions}
            evenementId={evenementId}
            evenement={evenementRow}
            formulaireId={formulaireId}
          />
        )}
      </div>
    </div>
  )
}

// ─── Panel Formulaire ─────────────────────────────────────────────────────────

function FormulairePanel({ formulaireId }: { formulaireId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formulaireRow, setFormulaireRow] = useState<FormulaireRow | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const supabase = createClient()
    supabase
      .from('formulaire_inscriptions')
      .select('*')
      .eq('id', formulaireId)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err || !data) {
          setError(err?.message ?? 'Formulaire introuvable.')
        } else {
          setFormulaireRow(data)
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [formulaireId])

  const publicBase = typeof window !== 'undefined' ? window.location.origin : ''
  const inscriptionUrl = `${publicBase}/inscription/${formulaireId}`

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {loading ? (
          <p className="text-sm text-gray-400">Chargement du formulaire…</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : formulaireRow ? (
          <>
            {formulaireRow.publie && (
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => navigator.clipboard.writeText(inscriptionUrl)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-navy text-sm font-semibold rounded-xl border border-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copier le lien
                </button>
                <button
                  onClick={() => window.open(inscriptionUrl, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-navy text-sm font-semibold rounded-xl border border-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Aperçu
                </button>
              </div>
            )}
            <FormBuilder formulaire={formulaireRow} />
          </>
        ) : null}
      </div>
    </div>
  )
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function EvenementDetail({ evenement, suggestions }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [showRefusForm, setShowRefusForm] = useState(false)
  const [motifRefus, setMotifRefus] = useState('')
  const [dpPendingId, setDpPendingId] = useState<string | null>(null)
  const [dpError, setDpError] = useState<string | null>(null)
  const [dpRefusModalId, setDpRefusModalId] = useState<string | null>(null)
  const [dpRefusMotif, setDpRefusMotif] = useState('')
  const [avisNote, setAvisNote] = useState(0)
  const [avisCommentaire, setAvisCommentaire] = useState('')
  const [avisSubmitted, setAvisSubmitted] = useState(false)
  const [avisError, setAvisError] = useState<string | null>(null)

  const { demande, devis, reservation, formulaire, cal_link, devis_prestataires, avis_lieu } = evenement
  const currentStep = getCurrentStep(evenement)
  const [activeView, setActiveView] = useState<ActiveView>(currentStep)

  const edlDepartSigne = evenement.etats_des_lieux.find((e) => e.type === 'depart')?.statut === 'signe'
  const showSection4 = reservation != null && ['acompte_confirme', 'confirmee', 'en_cours', 'terminee', 'commission_reversee'].includes(reservation.statut)

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

  function handleAccepterDevis() {
    handleAction(() => accepterDevis(devis!.id))
  }

  function handleReserver() {
    handleAction(() => creerReservation(devis!.id))
  }

  function handleCreerFormulaire() {
    setActionError(null)
    startTransition(async () => {
      const res = await creerFormulaire(evenement.id)
      if (res.error) { setActionError(res.error); return }
      router.push('/bde/formulaires/' + res.data!.id)
    })
  }

  function handleSignerDp(dpId: string) {
    setDpError(null)
    setDpPendingId(dpId)
    startTransition(async () => {
      const res = await initierSignatureYousign(dpId)
      setDpPendingId(null)
      if (res.error) { setDpError(res.error); return }
      window.open(res.data!.signatureLink, '_blank')
    })
  }

  function handleOuvrirRefusDp(dpId: string) {
    setDpRefusModalId(dpId)
    setDpRefusMotif('')
    setDpError(null)
  }

  function handleAnnulerRefusDp() {
    setDpRefusModalId(null)
    setDpRefusMotif('')
    setDpError(null)
  }

  function handleEnvoyerRefusDp(dp: EvenementComplet['devis_prestataires'][number]) {
    const motif = dpRefusMotif.trim()
    if (motif.length < 20) return
    setDpError(null)
    startTransition(async () => {
      const res = await sendMessage(null, `Refus devis prestataire ${dp.type} - ${dp.nom} : ${motif}`)
      if (res.error) { setDpError(res.error); return }
      setDpRefusModalId(null)
      setDpRefusMotif('')
      router.refresh()
    })
  }

  function handleEnvoyerAvis() {
    if (avisNote === 0) { setAvisError('Sélectionnez une note.'); return }
    setAvisError(null)
    startTransition(async () => {
      const res = await laisserAvisLieu(evenement.id, avisNote, avisCommentaire || undefined)
      if (res.error) { setAvisError(res.error); return }
      setAvisSubmitted(true)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header pleine largeur */}
      <div className="bg-navy w-full px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-6">
            <div>
              {demande?.etablissement && (
                <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-2">
                  {demande.etablissement.nom}
                  {demande.etablissement.ville ? ` · ${demande.etablissement.ville}` : ''}
                </p>
              )}
              <h1 className="text-2xl font-bold text-white mb-1">{evenement.nom}</h1>
              <p className="text-white/60 text-sm">
                {fmtDate(evenement.date_debut)} → {fmtDate(evenement.date_fin)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              {reservation && (() => {
                const statutLabels: Record<string, { label: string; cls: string }> = {
                  annulee: { label: 'Annulée', cls: 'bg-red-100 text-red-700' },
                  en_attente_acompte: { label: 'Acompte à régler', cls: 'bg-amber-100 text-amber-700' },
                  acompte_confirme: { label: 'Acompte payé', cls: 'bg-blue-100 text-blue-700' },
                  confirmee: { label: 'Solde à régler', cls: 'bg-orange-100 text-orange-700' },
                  en_cours: { label: 'Événement terminé', cls: 'bg-green-100 text-green-700' },
                  terminee: { label: 'Clôturé', cls: 'bg-gray-100 text-gray-600' },
                  commission_reversee: { label: 'Clôturé', cls: 'bg-gray-100 text-gray-600' },
                }
                const statutDisplay = statutLabels[reservation.statut] ?? { label: reservation.statut, cls: 'bg-gray-100 text-gray-600' }
                return (
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statutDisplay.cls}`}>
                    {statutDisplay.label}
                  </span>
                )
              })()}
              <p className="text-white/40 text-xs">Étape {currentStep} sur 10</p>
            </div>
          </div>

          {showSection4 && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setActiveView('inscrits')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors border
                  ${activeView === 'inscrits'
                    ? 'bg-white text-navy border-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Gérer les inscrits
              </button>
              {formulaire && (
                <button
                  onClick={() => setActiveView('formulaire')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors border
                    ${activeView === 'formulaire'
                      ? 'bg-white text-navy border-white'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Gérer le formulaire
                </button>
              )}
              {!formulaire && (
                <button
                  onClick={handleCreerFormulaire}
                  className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand/90 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  + Créer le formulaire d&apos;inscription
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Timeline sticky pleine largeur */}
      <RoadmapTimeline
        currentStep={currentStep}
        selectedStep={activeView}
        onSelect={setActiveView}
        cancelled={reservation?.statut === 'annulee'}
      />

      {/* Contenu centré */}
      <div className="w-full px-8 py-8 flex flex-col gap-6">
        {actionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {actionError}
          </div>
        )}

        {reservation?.statut === 'annulee' && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-2">
            <p className="text-sm font-semibold text-red-700 mb-0.5">Réservation annulée</p>
            <p className="text-sm text-red-600">
              Cette réservation a été annulée suite au non-paiement de l&apos;acompte dans les 72h.
              Vous pouvez soumettre une nouvelle demande.
            </p>
            <Link
              href="/rechercher"
              className="inline-flex items-center gap-1.5 bg-brand text-white font-semibold rounded-xl py-3 px-6 hover:bg-brand/90 transition-colors self-start text-sm"
            >
              Faire une nouvelle demande
            </Link>
          </div>
        )}

        {/* Contenu de la vue active */}
        <div>
        {typeof activeView === 'number' && activeView === 1 && (
          <StepDemande
            demande={demande}
            dateDebut={evenement.date_debut}
            dateFin={evenement.date_fin}
            suggestions={suggestions}
          />
        )}
        {typeof activeView === 'number' && activeView === 2 && <StepDispo demande={demande} />}
        {typeof activeView === 'number' && activeView === 3 && (
          <StepValidation
            devis={devis}
            reservation={reservation}
            isPending={isPending}
            showRefusForm={showRefusForm}
            setShowRefusForm={setShowRefusForm}
            motifRefus={motifRefus}
            setMotifRefus={setMotifRefus}
            onAccepter={handleAccepterDevis}
            onRefuser={handleRefus}
            onReserver={handleReserver}
          />
        )}
        {typeof activeView === 'number' && activeView === 4 && (
          <StepAcompte reservation={reservation} evenementId={evenement.id} calLink={cal_link} />
        )}
        {typeof activeView === 'number' && activeView === 5 && <StepAcomptePaye reservation={reservation} demande={demande} />}
        {typeof activeView === 'number' && activeView === 6 && (
          <StepDevisPresta
            devis_prestataires={devis_prestataires}
            dpError={dpError}
            dpPendingId={dpPendingId}
            dpRefusModalId={dpRefusModalId}
            dpRefusMotif={dpRefusMotif}
            isPending={isPending}
            setDpRefusMotif={setDpRefusMotif}
            onSigner={handleSignerDp}
            onOuvrirRefus={handleOuvrirRefusDp}
            onAnnulerRefus={handleAnnulerRefusDp}
            onEnvoyerRefus={handleEnvoyerRefusDp}
          />
        )}
        {typeof activeView === 'number' && activeView === 7 && <StepEdlArrivee etats_des_lieux={evenement.etats_des_lieux} />}
        {typeof activeView === 'number' && activeView === 8 && <StepEdlDepart etats_des_lieux={evenement.etats_des_lieux} />}
        {typeof activeView === 'number' && activeView === 9 && (
          <StepSolde reservation={reservation} evenementId={evenement.id} edlDepartSigne={edlDepartSigne} />
        )}
        {typeof activeView === 'number' && activeView === 10 && (
          <StepTermine
            reservation={reservation}
            avis_lieu={avis_lieu}
            avisNote={avisNote}
            setAvisNote={setAvisNote}
            avisCommentaire={avisCommentaire}
            setAvisCommentaire={setAvisCommentaire}
            avisSubmitted={avisSubmitted}
            avisError={avisError}
            isPending={isPending}
            onEnvoyerAvis={handleEnvoyerAvis}
          />
        )}
        {activeView === 'inscrits' && (
          <InscritsPanel evenementId={evenement.id} formulaireId={formulaire?.id ?? null} />
        )}
        {activeView === 'formulaire' && formulaire && (
          <FormulairePanel formulaireId={formulaire.id} />
        )}
        </div>
      </div>
    </div>
  )
}
