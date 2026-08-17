'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { getEvenementById, type EvenementComplet } from '@/lib/actions/evenements'
import type { LieuPublic } from '@/lib/actions/public'
import { accepterDevis, refuserDevis } from '@/lib/actions/devis'
import { sendMessage } from '@/lib/actions/messages'
import { creerReservation } from '@/lib/actions/reservations'
import { creerFormulaire, getFormulaireById, type ChampFormulaire } from '@/lib/actions/formulaires'

import { initierSignatureYousign } from '@/lib/actions/devis-prestataires'
import { laisserAvisLieu } from '@/lib/actions/avis'
import {
  getInscriptionsByEvenement,
  getInscriptionById,
  validerInscription,
  refuserInscription,
  ajouterEcheance,
  confirmerEcheance,
  type InscriptionWithDetails,
} from '@/lib/actions/inscriptions'
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

function IconCheckMini() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75 9 17.25 19.5 6.75" />
    </svg>
  )
}

function IconBuilding() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3.75h9a.75.75 0 0 1 .75.75V21H4.5V4.5a.75.75 0 0 1 0-.75Zm0 0v.75M15 9.75h4.5a.75.75 0 0 1 .75.75V21h-5.25M7.5 6.75h.008v.008H7.5V6.75Zm3 0h.008v.008h-.008V6.75Zm-3 3h.008v.008H7.5V9.75Zm3 0h.008v.008h-.008V9.75Zm-3 3h.008v.008H7.5v-.008Zm3 0h.008v.008h-.008v-.008Zm7.5-2.25h.008v.008H18v-.008Zm0 3h.008v.008H18v-.008Z" />
    </svg>
  )
}

function IconLockClosed() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}

function IconPhone() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h1.5a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  )
}

function IconCalendarPlain() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 9h18M4.5 5.25h15a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z" />
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
  const accentCls =
    tone === 'green' ? 'bg-success' :
    tone === 'amber' ? 'bg-amber-400' :
    'bg-navy/10'
  const iconBoxCls =
    tone === 'green' ? 'bg-success/10 text-success' :
    tone === 'amber' ? 'bg-amber-500/10 text-amber-700' :
    'bg-navy/5 text-navy'
  return (
    <section className="rounded-2xl border border-line bg-white shadow-sm overflow-hidden">
      <div className={`h-[3px] w-full ${accentCls}`} />
      <div className="px-6 sm:px-8 pt-6 pb-5 flex items-center gap-3.5">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBoxCls}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-navy tracking-tight">{title}</h2>
          <p className="text-xs text-ink mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="px-6 sm:px-8 pb-7 sm:pb-8">
        {children}
      </div>
    </section>
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
  return (
    <nav aria-label="Progression de la réservation" className="flex items-start w-full">
      {STEPS.map((step, i) => {
        const done = !cancelled && currentStep > step.n
        const current = !cancelled && currentStep === step.n
        const selected = selectedStep === step.n
        const clickable = done || current
        const isLast = i === STEPS.length - 1
        return (
          <div key={step.n} className="flex items-start flex-1">
            <button
              onClick={() => clickable && onSelect(step.n)}
              disabled={!clickable}
              className="relative z-10 flex flex-col items-center gap-1.5 flex-shrink-0 disabled:cursor-not-allowed group"
            >
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border transition-all
                  ${done ? 'bg-green-400 border-green-400 text-navy' :
                    current ? 'bg-brand border-brand text-white ring-4 ring-brand/30' :
                    'bg-white/10 border-white/20 text-white/30'}
                  ${selected && clickable ? 'scale-110' : ''}`}
              >
                {done ? <IconCheckMini /> : step.n}
              </span>
              <span className={`text-[11px] font-semibold text-center leading-tight w-16 sm:w-20
                ${done ? 'text-green-300' : current ? 'text-brand font-bold' : 'text-white/30'}`}>
                {step.label}
              </span>
            </button>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mt-4 mx-1.5 rounded-full
                  ${done ? 'bg-green-400/60' : 'bg-white/20'}`}
              />
            )}
          </div>
        )
      })}
    </nav>
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
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <div>
              <p className="text-xs text-ink mb-0.5">Établissement</p>
              <p className="font-medium text-navy">{demande.etablissement?.nom ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ink mb-0.5">Participants</p>
              <p className="font-medium text-navy">{demande.nb_participants}</p>
            </div>
            <div>
              <p className="text-xs text-ink mb-0.5">Début</p>
              <p className="font-medium text-navy">{fmtDate(dateDebut)}</p>
            </div>
            <div>
              <p className="text-xs text-ink mb-0.5">Fin</p>
              <p className="font-medium text-navy">{fmtDate(dateFin)}</p>
            </div>
          </div>
          {demande.message && (
            <div>
              <p className="text-xs text-ink mb-1.5">Message</p>
              <p className="text-sm text-navy/80 bg-mist rounded-2xl p-4 border border-line">
                {demande.message}
              </p>
            </div>
          )}
          {demande.statut_disponibilite === 'en_attente' && (
            <p className="text-sm text-ink">En attente de réponse de l&apos;établissement.</p>
          )}
          {demande.statut_disponibilite === 'non_disponible' && (
            <div className="space-y-3">
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Non disponible</span>
              {demande.motif_refus && (
                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3.5">
                  <p className="text-xs font-semibold text-red-600 mb-1">Motif</p>
                  <p className="text-sm text-red-700">{demande.motif_refus}</p>
                </div>
              )}
            </div>
          )}
          {demande.statut === 'refusee' && demande.motif_refus && demande.statut_disponibilite !== 'non_disponible' && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3.5">
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
                    className="flex items-center gap-3 bg-white border border-line rounded-2xl p-3 hover:border-brand/40 hover:bg-brand/5 transition-colors"
                  >
                    {lieu.photo_url ? (
                      <img
                        src={lieu.photo_url}
                        alt={lieu.nom}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-mist flex-shrink-0 flex items-center justify-center text-ink/30">
                        <IconBuilding />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{lieu.nom}</p>
                      {lieu.ville && <p className="text-xs text-ink">{lieu.ville}</p>}
                      {lieu.capacite_max != null && (
                        <p className="text-xs text-ink/60">jusqu&apos;à {lieu.capacite_max} personnes</p>
                      )}
                    </div>
                    <span className="ml-auto text-ink/40 flex-shrink-0">›</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-ink">
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
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success">
            <IconCheckMini /> Disponibilité confirmée
          </span>
          <p className="text-sm text-ink">En attente de validation par l&apos;équipe LINKHO avant génération de la facture.</p>
        </div>
      ) : (
        <p className="text-sm text-ink">En attente de confirmation de disponibilité par l&apos;établissement.</p>
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
        <p className="text-sm text-ink">En attente du devis de l&apos;établissement.</p>
      ) : devis.statut === 'refuse' ? (
        <div className="space-y-3">
          <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
            Devis refusé
          </span>
          <p className="text-sm text-ink">
            L&apos;établissement peut vous proposer un nouveau devis suite à vos échanges.
          </p>
          <Link
            href="/rechercher"
            className="inline-block bg-mist text-navy font-semibold rounded-xl py-3 px-6 hover:bg-line/60 transition-colors border border-line text-sm"
          >
            Rechercher un autre lieu
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink font-mono">{devis.numero}</p>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
              ${devis.statut === 'accepte' || devis.statut === 'signe' ? 'bg-success/10 text-success' :
                devis.statut === 'envoye' ? 'bg-blue-100 text-blue-700' :
                'bg-mist text-ink'}`}>
              {devis.statut}
            </span>
          </div>

          {devis.items.length > 0 && (
            <div className="bg-mist/60 rounded-2xl border border-line overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2.5 text-xs font-semibold text-ink/70 uppercase tracking-wide border-b border-line">
                <span>Prestation</span>
                <span className="text-right">Qté</span>
                <span className="text-right">Prix</span>
              </div>
              {devis.items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-3 border-b border-line/70 last:border-0 text-sm">
                  <span className="text-navy">{item.libelle}</span>
                  <span className="text-right text-ink">{item.quantite}</span>
                  <span className="text-right text-navy font-medium">{fmtEuros(item.prix_unitaire)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-mist/60 rounded-2xl border border-line p-4 space-y-2 text-sm">
            <div className="flex justify-between text-ink">
              <span>Sous-total HT</span>
              <span>{fmtEuros(devis.sous_total_ht)}</span>
            </div>
            <div className="flex justify-between text-ink">
              <span>TVA ({Math.round(devis.tva_taux * 100)}%)</span>
              <span>{fmtEuros((devis.total_ttc ?? 0) - devis.sous_total_ht)}</span>
            </div>
            <div className="flex justify-between font-bold text-navy border-t border-line pt-2">
              <span>Total TTC</span>
              <span>{fmtEuros(devis.total_ttc ?? 0)}</span>
            </div>
            <div className="flex justify-between text-ink pt-1">
              <span>Acompte ({Math.round(devis.acompte_taux * 100)}%)</span>
              <span>{fmtEuros((devis.total_ttc ?? 0) * devis.acompte_taux)}</span>
            </div>
            <div className="flex justify-between text-ink">
              <span>Solde</span>
              <span>{fmtEuros((devis.total_ttc ?? 0) * (1 - devis.acompte_taux))}</span>
            </div>
          </div>

          {devis.message_client && (
            <div>
              <p className="text-xs text-ink mb-1.5">Message de l&apos;établissement</p>
              <p className="text-sm text-navy/80 bg-mist rounded-2xl p-4 border border-line italic">
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
                <label className="block text-xs text-ink mb-1.5">
                  Motif du refus <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={motifRefus}
                  onChange={(e) => setMotifRefus(e.target.value)}
                  placeholder="Expliquez la raison du refus à l'établissement…"
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-line rounded-xl outline-none focus:ring-2 focus:ring-red-300/30 focus:border-red-300 resize-none"
                />
                <p className={`text-xs mt-1 ${motifRefus.trim().length < 20 ? 'text-red-400' : 'text-ink/50'}`}>
                  {motifRefus.trim().length} / 20 caractères minimum
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowRefusForm(false); setMotifRefus('') }}
                  className="flex-1 bg-mist text-navy font-semibold rounded-xl py-3 px-6 hover:bg-line/60 transition-colors border border-line text-sm"
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
  if (!reservation) return <p className="text-sm text-ink">Aucune réservation en cours.</p>
  const acomptePaiement = reservation.paiements.find((p) => p.type === 'acompte') ?? null

  return (
    <div className="flex flex-col gap-5">
      <StepCard icon={<IconCreditCard />} title="Paiement de l'acompte" subtitle="Réglez l'acompte pour confirmer">
        <div className="space-y-4">
          {reservation.statut === 'en_attente_acompte' && reservation.expire_at && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Délai de paiement</p>
                <CountdownTimer expireAt={reservation.expire_at} />
              </div>
              <p className="text-sm text-amber-800">
                Réglez l&apos;acompte de <strong>{fmtEuros(reservation.acompte_montant)}</strong> avant expiration pour confirmer votre réservation.
              </p>
            </div>
          )}
          <div className="bg-mist/60 rounded-2xl border border-line p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-ink mb-0.5">Montant acompte</p>
              <p className="text-lg font-bold text-navy">{fmtEuros(reservation.acompte_montant)}</p>
            </div>
            {reservation.statut === 'confirmee' || acomptePaiement?.confirme ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-success/10 text-success">
                <IconCheckMini /> Acompte envoyé
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
        <div className="rounded-3xl border border-navy/10 bg-navy/[0.04] p-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-navy/5 text-navy flex items-center justify-center flex-shrink-0">
              <IconPhone />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold text-navy">Prochaine étape — Réserver un appel avec notre équipe</p>
                <p className="text-sm text-ink mt-1">
                  Notre équipe vous accompagne dans l&apos;organisation de votre événement. Prenez rendez-vous pour préparer la suite.
                </p>
              </div>
              <a
                href={calLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-brand text-white font-semibold rounded-xl py-3 px-6 hover:bg-brand/90 transition-colors text-sm"
              >
                Prendre rendez-vous
              </a>
            </div>
          </div>
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
        <p className="text-sm text-ink">
          {reservation ? `Acompte de ${fmtEuros(reservation.acompte_montant)} confirmé.` : 'Acompte confirmé.'}
        </p>
      </StepCard>

      {montant && montant > 0 && (() => {
        const paliers = [0.25, 0.5, 0.75, 1]
        return (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center flex-shrink-0">
                <IconLockClosed />
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Caution solidaire BDE</h2>
                <p className="text-sm text-amber-700 mt-1">
                  Vous devrez apporter <strong>{montant.toLocaleString('fr-FR')} €</strong> de caution sous forme de chèques à remettre à l&apos;établissement le jour J à votre arrivée.
                </p>
              </div>
            </div>
            <div className="bg-white/60 rounded-2xl p-4 space-y-2 mb-4">
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
          <p className="text-sm text-ink">Aucun devis prestataire pour le moment.</p>
        ) : (
          <>
            {dpError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">
                {dpError}
              </div>
            )}
            <div className="flex flex-col gap-3">
              {devis_prestataires.map((dp) => {
                const badgeCls =
                  dp.statut === 'signe'
                    ? 'bg-success/10 text-success'
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
                  <div key={dp.id} className="bg-mist/60 rounded-2xl border border-line p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-ink border border-line">
                            {typeLabel}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>
                            {badgeLabel}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-navy">{dp.nom}</p>
                        {dp.montant != null && (
                          <p className="text-xs text-ink mt-0.5">{fmtEuros(dp.montant)}</p>
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
                        <div className="pt-3 border-t border-line space-y-3">
                          <div>
                            <p className="text-sm font-semibold text-navy">Contacter le support LINKHO</p>
                            <p className="text-xs text-ink mt-0.5">Expliquez pourquoi vous souhaitez refuser ce devis</p>
                          </div>
                          <div>
                            <textarea
                              value={dpRefusMotif}
                              onChange={(e) => setDpRefusMotif(e.target.value)}
                              placeholder="Décrivez la raison de votre refus…"
                              rows={3}
                              className="w-full px-3 py-2 text-xs border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
                            />
                            <p className={`text-xs mt-1 ${dpRefusMotif.trim().length < 20 ? 'text-red-400' : 'text-ink/50'}`}>
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
                              className="flex-1 bg-white text-navy border border-line text-xs font-semibold rounded-xl py-2.5 px-4 hover:bg-mist transition-colors"
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
                        <div className="flex gap-2 pt-3 border-t border-line">
                          <button
                            onClick={() => onSigner(dp.id)}
                            disabled={isPending}
                            className="bg-brand text-white text-xs font-semibold rounded-xl py-2.5 px-4 hover:bg-brand/90 transition-colors disabled:opacity-50"
                          >
                            {dpPendingId === dp.id && isPending ? 'Préparation…' : 'Signer électroniquement'}
                          </button>
                          <button
                            onClick={() => onOuvrirRefus(dp.id)}
                            className="bg-white border border-line text-navy text-xs font-semibold rounded-xl py-2.5 px-4 hover:bg-mist transition-colors"
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

// ─── Sous-composant — ligne de statut de signature EDL ────────────────────────

function EdlSignataire({ label, signe }: { label: string; signe: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${signe ? 'text-success' : 'text-ink/50'}`}>
      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0
        ${signe ? 'bg-success text-white' : 'border border-line bg-white'}`}>
        {signe && <IconCheckMini />}
      </span>
      {label}
    </span>
  )
}

// ─── Étape 7 — État des lieux d'arrivée ────────────────────────────────────────

function StepEdlArrivee({ etats_des_lieux }: { etats_des_lieux: EvenementComplet['etats_des_lieux'] }) {
  const edlArrivee = etats_des_lieux.find((e) => e.type === 'arrivee') ?? null
  return (
    <StepCard icon={<IconKey />} title="État des lieux d'arrivée" subtitle="À signer le jour de votre arrivée">
      <div className="bg-mist/60 rounded-2xl border border-line p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            {!edlArrivee && (
              <p className="text-xs text-ink/70">L&apos;établissement lancera cet état des lieux le jour J.</p>
            )}
            {edlArrivee?.statut === 'en_attente_signature' && (
              <div className="space-y-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 inline-block">
                  En attente de signature
                </span>
                <div className="flex items-center gap-3">
                  <EdlSignataire label="BDE" signe={!!edlArrivee.bde_signe_le} />
                  <EdlSignataire label="Établissement" signe={!!edlArrivee.etab_signe_le} />
                </div>
              </div>
            )}
            {edlArrivee?.statut === 'signe' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
                <IconCheckMini /> Signé par les deux parties
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
      <div className="bg-mist/60 rounded-2xl border border-line p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            {!edlDepart && (
              <p className="text-xs text-ink/70">
                {edlArrivee?.statut === 'signe'
                  ? "L'établissement lancera cet état des lieux en fin d'événement."
                  : "Disponible après signature de l'état des lieux d'arrivée."}
              </p>
            )}
            {edlDepart?.statut === 'en_attente_signature' && (
              <div className="space-y-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 inline-block">
                  En attente de signature
                </span>
                <div className="flex items-center gap-3">
                  <EdlSignataire label="BDE" signe={!!edlDepart.bde_signe_le} />
                  <EdlSignataire label="Établissement" signe={!!edlDepart.etab_signe_le} />
                </div>
              </div>
            )}
            {edlDepart?.statut === 'signe' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
                <IconCheckMini /> Signé par les deux parties
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
  if (!reservation) return <p className="text-sm text-ink">Aucune réservation en cours.</p>
  const soldePaiement = reservation.paiements.find((p) => p.type === 'solde') ?? null

  return (
    <StepCard icon={<IconBanknotes />} title="Paiement du solde" subtitle="Dernière étape avant la clôture">
      <div className="space-y-4">
        <div className="bg-mist/60 rounded-2xl border border-line p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-ink mb-0.5">Montant solde</p>
            <p className="text-lg font-bold text-navy">{fmtEuros(reservation.solde_montant)}</p>
          </div>
          {reservation.statut_solde === 'paye' || soldePaiement?.confirme ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-success/10 text-success">
              <IconCheckMini /> Solde reçu
            </span>
          ) : (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
              En attente
            </span>
          )}
        </div>
        {reservation.solde_expire_at && reservation.statut_solde !== 'paye' && !soldePaiement?.confirme && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
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
          <p className="text-xs text-ink/60 text-center py-2">
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
          <p className="text-sm text-ink">Votre événement est terminé. Merci d&apos;avoir utilisé LINKHO !</p>
          {reservation && (
            <div className="bg-mist/60 rounded-2xl border border-line p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-ink/70 uppercase tracking-wide mb-3">Résumé financier</p>
              <div className="flex justify-between text-ink">
                <span>Total TTC</span>
                <span>{fmtEuros(reservation.montant_ttc)}</span>
              </div>
              <div className="flex justify-between text-ink">
                <span>Acompte versé</span>
                <span>{fmtEuros(reservation.acompte_montant)}</span>
              </div>
              <div className="flex justify-between text-ink">
                <span>Solde versé</span>
                <span>{fmtEuros(reservation.solde_montant)}</span>
              </div>
              <div className="flex justify-between text-ink/70 pt-1 border-t border-line">
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
            <div className="bg-mist/60 rounded-2xl border border-line p-4">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`text-xl ${i < (avis_lieu?.note ?? avisNote) ? 'text-brand' : 'text-line'}`}>★</span>
                ))}
              </div>
              {(avis_lieu?.commentaire || avisCommentaire) && (
                <p className="text-sm text-ink">{avis_lieu?.commentaire ?? avisCommentaire}</p>
              )}
              <p className="inline-flex items-center gap-1.5 text-xs text-success font-medium mt-2">
                <IconCheckMini /> Avis enregistré
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-ink mb-2">Note</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAvisNote(n)}
                      className={`text-3xl transition-colors ${n <= avisNote ? 'text-brand' : 'text-line hover:text-brand/60'}`}
                      aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                  {avisNote > 0 && (
                    <span className="ml-2 text-sm text-ink">{avisNote}/5</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-ink mb-1">
                  Commentaire <span className="text-ink/50">(optionnel)</span>
                </label>
                <textarea
                  value={avisCommentaire}
                  onChange={(e) => setAvisCommentaire(e.target.value)}
                  rows={3}
                  placeholder="Partagez votre expérience avec ce lieu…"
                  className="w-full px-3 py-2 text-sm border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
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
  const [selectedInscriptionId, setSelectedInscriptionId] = useState<string | null>(null)

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
      <div className="rounded-2xl border border-line bg-white shadow-sm p-6 sm:p-8">
        {selectedInscriptionId ? (
          <InlineInscriptionDetail
            inscriptionId={selectedInscriptionId}
            onBack={() => setSelectedInscriptionId(null)}
          />
        ) : loading ? (
          <p className="text-sm text-ink/60">Chargement des inscrits…</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <InscriptionsClient
            evenements={evenementRow ? [evenementRow] : []}
            inscriptions={inscriptions}
            evenementId={evenementId}
            evenement={evenementRow}
            formulaireId={formulaireId}
            onSelect={setSelectedInscriptionId}
          />
        )}
      </div>
    </div>
  )
}

// ─── Détail d'inscription inline ─────────────────────────────────────────────

const INSCRIPTION_STATUT_META: Record<string, { label: string; cls: string }> = {
  en_attente: { label: 'En attente', cls: 'bg-amber-100 text-amber-700' },
  validee: { label: 'Validée', cls: 'bg-success/10 text-success' },
  annulee: { label: 'Annulée', cls: 'bg-red-100 text-red-700' },
  refusee: { label: 'Refusée', cls: 'bg-red-100 text-red-700' },
}

const INSCRIPTION_PAIEMENT_META: Record<string, { label: string; cls: string }> = {
  en_attente: { label: 'Non payé', cls: 'bg-mist text-ink' },
  partiel: { label: 'Partiel', cls: 'bg-amber-100 text-amber-700' },
  paye_total: { label: 'Payé', cls: 'bg-success/10 text-success' },
}

function fmtShortDate(s: string | null) {
  return s ? new Date(s).toLocaleDateString('fr-FR') : '—'
}

function renderChampReponse(champ: ChampFormulaire, reponses: Record<string, unknown>): string {
  const val = reponses[champ.id]
  if (val === undefined || val === null || val === '') return '—'
  if (Array.isArray(val)) return val.join(', ')
  if (champ.type === 'oui_non') return val === 'true' || val === true ? 'Oui' : 'Non'
  return String(val)
}

function InscriptionBadge({
  statut,
  meta,
}: {
  statut: string
  meta: Record<string, { label: string; cls: string }>
}) {
  const m = meta[statut] ?? { label: statut, cls: 'bg-mist text-ink' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${m.cls}`}>
      {m.label}
    </span>
  )
}

function InscriptionSectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-mist/60 rounded-2xl border border-line">
      <div className="px-5 py-3.5 border-b border-line">
        <h3 className="text-xs font-semibold text-ink uppercase tracking-widest">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function InlineInscriptionDetail({
  inscriptionId,
  onBack,
}: {
  inscriptionId: string
  onBack: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [inscription, setInscription] = useState<InscriptionWithDetails | null>(null)
  const [champs, setChamps] = useState<ChampFormulaire[]>([])

  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [showAddEcheance, setShowAddEcheance] = useState(false)
  const [montant, setMontant] = useState('')
  const [dateEcheance, setDateEcheance] = useState('')

  const loadInscription = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    getInscriptionById(inscriptionId).then(async (insRes) => {
      if (insRes.error || !insRes.data) {
        setLoadError(insRes.error ?? 'Inscription introuvable.')
        setLoading(false)
        return
      }
      setInscription(insRes.data)
      const formRes = await getFormulaireById(insRes.data.formulaire_id)
      setChamps((formRes.data?.champs ?? []) as unknown as ChampFormulaire[])
      setLoading(false)
    })
  }, [inscriptionId])

  useEffect(() => {
    loadInscription()
  }, [loadInscription])

  function handleValider() {
    if (!inscription) return
    setActionError(null)
    startTransition(async () => {
      const res = await validerInscription(inscription.id)
      if (res.error) setActionError(res.error)
      else loadInscription()
    })
  }

  function handleRefuser() {
    if (!inscription) return
    setActionError(null)
    startTransition(async () => {
      const res = await refuserInscription(inscription.id)
      if (res.error) setActionError(res.error)
      else loadInscription()
    })
  }

  function handleAjouterEcheance(e: React.FormEvent) {
    e.preventDefault()
    if (!inscription) return
    setActionError(null)
    const fd = new FormData()
    fd.append('montant', montant)
    if (dateEcheance) fd.append('date_echeance', dateEcheance)
    startTransition(async () => {
      const res = await ajouterEcheance(inscription.id, fd)
      if (res.error) {
        setActionError(res.error)
      } else {
        setMontant('')
        setDateEcheance('')
        setShowAddEcheance(false)
        loadInscription()
      }
    })
  }

  function handleConfirmerEcheance(echeanceId: string) {
    setActionError(null)
    startTransition(async () => {
      const res = await confirmerEcheance(echeanceId)
      if (res.error) setActionError(res.error)
      else loadInscription()
    })
  }

  const visibleChamps = champs.filter((c) => c.type !== 'separateur')
  const sortedEcheances = inscription ? [...inscription.echeances].sort((a, b) => a.numero - b.numero) : []
  const totalPaye = sortedEcheances.filter((e) => e.paye).reduce((s, e) => s + e.montant, 0)
  const totalEcheances = sortedEcheances.reduce((s, e) => s + e.montant, 0)

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-ink hover:text-navy transition-colors self-start"
      >
        ← Retour
      </button>

      {loading ? (
        <p className="text-sm text-ink/60">Chargement de l&apos;inscription…</p>
      ) : loadError || !inscription ? (
        <p className="text-sm text-red-500">{loadError ?? 'Inscription introuvable.'}</p>
      ) : (
        <>
          {/* Header */}
          <div className="bg-white rounded-2xl border border-line px-6 py-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-bold text-navy">
                  {inscription.prenom} {inscription.nom}
                </h2>
                <p className="text-sm text-ink mt-0.5">{inscription.email}</p>
                <p className="text-xs text-ink/60 mt-1">Inscrit le {fmtShortDate(inscription.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <InscriptionBadge statut={inscription.statut} meta={INSCRIPTION_STATUT_META} />
                <InscriptionBadge statut={inscription.statut_paiement} meta={INSCRIPTION_PAIEMENT_META} />
              </div>
            </div>

            {actionError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {actionError}
              </div>
            )}

            {inscription.statut === 'en_attente' && (
              <div className="mt-5 pt-4 border-t border-line flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleValider}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-white bg-success hover:bg-success/90 rounded-xl transition-colors disabled:opacity-50"
                >
                  Valider l&apos;inscription
                </button>
                <button
                  type="button"
                  onClick={handleRefuser}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  Refuser l&apos;inscription
                </button>
              </div>
            )}
          </div>

          {/* Carte étudiante */}
          {inscription.carte_etudiante_url && (
            <InscriptionSectionCard title="Carte étudiante">
              <div className="flex items-center gap-3">
                <span className="text-ink/50 flex-shrink-0">
                  <IconDocumentText />
                </span>
                <span className="text-sm text-ink">{inscription.carte_etudiante_nom ?? 'Document'}</span>
                <a
                  href={`/api/carte-etudiante/${inscription.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-sm font-semibold text-brand hover:text-brand-light transition-colors"
                >
                  Voir la carte →
                </a>
              </div>
            </InscriptionSectionCard>
          )}

          {/* Informations */}
          <InscriptionSectionCard title="Informations">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-ink mb-0.5">Montant total</p>
                <p className="text-sm font-medium text-navy tabular-nums">{fmtEuros(inscription.montant_total)}</p>
              </div>
              {inscription.caution_montant !== null && (
                <div>
                  <p className="text-xs text-ink mb-0.5">Caution</p>
                  <p className="text-sm font-medium text-navy tabular-nums">
                    {fmtEuros(inscription.caution_montant)}{' '}
                    <span className={inscription.caution_payee ? 'text-success' : 'text-amber-600'}>
                      ({inscription.caution_payee ? 'payée' : 'non payée'})
                    </span>
                  </p>
                </div>
              )}
            </div>
          </InscriptionSectionCard>

          {/* Réponses au formulaire */}
          {visibleChamps.length > 0 && (
            <InscriptionSectionCard title="Réponses au formulaire">
              <div className="space-y-4">
                {visibleChamps.map((champ) => (
                  <div key={champ.id}>
                    <p className="text-xs text-ink mb-0.5">
                      {champ.libelle}
                      {champ.obligatoire && <span className="text-red-400 ml-0.5">*</span>}
                    </p>
                    <p className="text-sm font-medium text-navy">
                      {renderChampReponse(champ, inscription.reponses as Record<string, unknown>)}
                    </p>
                  </div>
                ))}
              </div>
            </InscriptionSectionCard>
          )}

          {/* Échéances de paiement */}
          <InscriptionSectionCard title="Échéances de paiement">
            {sortedEcheances.length === 0 ? (
              <p className="text-sm text-ink/60 mb-4">Aucune échéance définie.</p>
            ) : (
              <>
                <div className="space-y-2 mb-3">
                  {sortedEcheances.map((ech) => (
                    <div
                      key={ech.id}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-line"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${ech.paye ? 'bg-success' : 'bg-line'}`} />
                        <div>
                          <p className="text-sm font-medium text-navy tabular-nums">
                            Versement {ech.numero} — {fmtEuros(ech.montant)}
                          </p>
                          {ech.date_echeance && (
                            <p className="text-xs text-ink/60">
                              Échéance&nbsp;: {fmtShortDate(ech.date_echeance)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {ech.paye ? (
                          <span className="text-xs text-success font-medium">
                            Payé le {fmtShortDate(ech.paye_le)}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConfirmerEcheance(ech.id)}
                            disabled={isPending}
                            className="px-3 py-1.5 text-xs font-semibold text-success border border-success/30 rounded-xl hover:bg-success/5 transition-colors disabled:opacity-50"
                          >
                            Confirmer le paiement
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between py-2.5 border-t border-line">
                  <span className="text-xs text-ink">Total versé</span>
                  <span className="text-sm font-bold text-navy tabular-nums">
                    {fmtEuros(totalPaye)}{' '}
                    <span className="font-normal text-ink/60">/ {fmtEuros(totalEcheances)}</span>
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
                className="mt-4 p-4 border border-line rounded-xl space-y-3"
              >
                <p className="text-xs font-semibold text-ink uppercase tracking-wide">
                  Nouvelle échéance
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink mb-1">
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
                      className="w-full px-3 py-2 text-sm border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink mb-1">Date d&apos;échéance</label>
                    <input
                      type="date"
                      value={dateEcheance}
                      onChange={(e) => setDateEcheance(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-light rounded-xl transition-colors disabled:opacity-50"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddEcheance(false)
                      setActionError(null)
                    }}
                    className="px-4 py-2 text-sm font-semibold text-ink hover:text-navy transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </InscriptionSectionCard>
        </>
      )}
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
      <div className="rounded-2xl border border-line bg-white shadow-sm p-6 sm:p-8">
        {loading ? (
          <p className="text-sm text-ink/60">Chargement du formulaire…</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : formulaireRow ? (
          <>
            {formulaireRow.publie && (
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => navigator.clipboard.writeText(inscriptionUrl)}
                  className="flex items-center gap-2 px-4 py-2 bg-mist hover:bg-line/60 text-navy text-sm font-semibold rounded-xl border border-line transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copier le lien
                </button>
                <button
                  onClick={() => window.open(inscriptionUrl, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-mist hover:bg-line/60 text-navy text-sm font-semibold rounded-xl border border-line transition-colors"
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

  const statutLabels: Record<string, { label: string; dot: string }> = {
    annulee: { label: 'Annulée', dot: 'bg-red-400' },
    en_attente_acompte: { label: 'Acompte à régler', dot: 'bg-amber-400' },
    acompte_confirme: { label: 'Acompte payé', dot: 'bg-blue-400' },
    confirmee: { label: 'Solde à régler', dot: 'bg-orange-400' },
    en_cours: { label: 'Événement terminé', dot: 'bg-success' },
    terminee: { label: 'Clôturé', dot: 'bg-ink/30' },
    commission_reversee: { label: 'Clôturé', dot: 'bg-ink/30' },
  }
  const statutDisplay = reservation ? (statutLabels[reservation.statut] ?? { label: reservation.statut, dot: 'bg-ink/30' }) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête + timeline fusionnés dans un même bloc navy sticky */}
      <div className="bg-navy rounded-2xl mx-6 mt-6 overflow-hidden">
        {/* Infos événement */}
        <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-6 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              {demande?.etablissement && (
                <p className="text-white/50 text-xs uppercase tracking-widest mb-1">
                  {demande.etablissement.nom}
                  {demande.etablissement.ville ? ` · ${demande.etablissement.ville}` : ''}
                </p>
              )}
              <h1 className="text-xl font-bold text-white">{evenement.nom}</h1>
              <p className="inline-flex items-center gap-1.5 text-white/60 text-sm mt-0.5">
                <IconCalendarPlain />
                {fmtDate(evenement.date_debut)} → {fmtDate(evenement.date_fin)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {statutDisplay && (
                <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 text-white ring-1 ring-white/15">
                  <span className={`w-1.5 h-1.5 rounded-full ${statutDisplay.dot}`} />
                  {statutDisplay.label}
                </span>
              )}
              <p className="text-white/40 text-xs whitespace-nowrap">Étape {currentStep} / 10</p>
            </div>
          </div>

          {showSection4 && (
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div className="inline-flex items-center gap-1 bg-white/10 rounded-2xl p-1">
                <button
                  onClick={() => setActiveView('inscrits')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors
                    ${activeView === 'inscrits' ? 'bg-white text-navy' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Gérer les inscrits
                </button>
                {formulaire && (
                  <button
                    onClick={() => setActiveView('formulaire')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors
                      ${activeView === 'formulaire' ? 'bg-white text-navy' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Gérer le formulaire
                  </button>
                )}
              </div>
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

        {/* Séparateur subtil */}
        <div className="border-t border-white/10 mx-6 lg:mx-10" />

        {/* Timeline dans le même bloc navy */}
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-4">
          <RoadmapTimeline
            currentStep={currentStep}
            selectedStep={activeView}
            onSelect={setActiveView}
            cancelled={reservation?.statut === 'annulee'}
          />
        </div>
      </div>

      {/* Contenu */}
      <main className="mx-6 py-8 sm:py-10">
        {actionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 mb-6">
            {actionError}
          </div>
        )}

        {reservation?.statut === 'annulee' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 space-y-2 mb-6">
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

        <div className="flex flex-col gap-6">
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
      </main>
    </div>
  )
}
