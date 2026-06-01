'use client'

import 'react-day-picker/dist/style.css'
import { DayPicker } from 'react-day-picker'
import type { DateRange } from 'react-day-picker'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TYPES_EVENEMENT = [
  { value: 'soiree', label: 'Soirée' },
  { value: 'gala', label: 'Gala' },
  { value: 'wei', label: 'WEI' },
  { value: 'voyage', label: 'Voyage' },
  { value: 'sportif', label: 'Événement sportif' },
  { value: 'culturel', label: 'Événement culturel' },
  { value: 'conference', label: 'Conférence' },
  { value: 'atelier', label: 'Atelier' },
  { value: 'autre', label: 'Autre' },
]

type Props = {
  lieuId: string
  lieuNom: string
  prixBase: number | null
  reservationsOccupees: { date_debut: string; date_fin: string }[]
  initialDateDebut?: string
  initialDateFin?: string
  initialParticipants?: number
}

function parseInitialRange(debut?: string, fin?: string): DateRange | undefined {
  if (!debut) return undefined
  return { from: new Date(debut), to: fin ? new Date(fin) : undefined }
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function nbNuits(from: Date, to: Date): number {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000))
}

export default function DevisWidget({
  lieuId,
  lieuNom: _lieuNom,
  prixBase,
  reservationsOccupees,
  initialDateDebut,
  initialDateFin,
  initialParticipants,
}: Props) {
  const router = useRouter()

  const [range, setRange] = useState<DateRange | undefined>(
    parseInitialRange(initialDateDebut, initialDateFin),
  )
  const [participants, setParticipants] = useState(initialParticipants ?? 1)
  const [typeEvenement, setTypeEvenement] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [nbMonths, setNbMonths] = useState(1)

  useEffect(() => {
    const update = () => setNbMonths(window.innerWidth >= 1280 ? 2 : 1)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const disabledDates = [
    { before: today },
    ...reservationsOccupees.map((r) => ({
      from: new Date(r.date_debut),
      to: new Date(r.date_fin),
    })),
  ]

  const nuits = range?.from && range?.to ? nbNuits(range.from, range.to) : 0
  const estimation = prixBase != null && nuits > 0 ? prixBase * nuits : null
  const canSubmit = range?.from != null && range?.to != null && participants >= 1 && typeEvenement !== ''

  async function handleSubmit() {
    if (!canSubmit || isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login?redirect=/lieux/' + lieuId + '&action=devis')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const role = userData?.role

      if (role === 'etablissement' || role === 'admin') {
        setError('Vous ne pouvez pas faire une demande avec ce compte.')
        return
      }

      // CAS 3 — BDE : placeholder, server action à brancher dans la feature suivante
      console.log('Demande de devis:', {
        lieuId,
        date_debut: range!.from!.toISOString().split('T')[0],
        date_fin: range!.to!.toISOString().split('T')[0],
        participants,
        typeEvenement,
        message,
      })
      setSuccess(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="sticky top-24 bg-white border border-gray-200 rounded-xl p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="font-bold text-navy">Demande envoyée !</h3>
        <p className="text-sm text-gray-500">L&apos;établissement vous répondra sous 48h.</p>
        <button
          onClick={() => setSuccess(false)}
          className="text-xs text-brand hover:underline"
        >
          Faire une autre demande
        </button>
      </div>
    )
  }

  return (
    <div className="sticky top-24 bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Styles rdp custom */}
      <style>{`
        .rdp-day_selected:not([disabled]) { background-color: #f49915 !important; color: white !important; }
        .rdp-day_range_start:not([disabled]),
        .rdp-day_range_end:not([disabled]) { background-color: #f49915 !important; color: white !important; }
        .rdp-day_range_middle:not([disabled]) { background-color: rgba(247,181,71,0.3) !important; color: #071634 !important; }
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: #f7b547 !important; color: white !important; }
      `}</style>

      {/* En-tête prix */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-navy">Demander un devis</h3>
        {prixBase != null && (
          <p className="text-2xl font-bold text-brand mt-1">
            {prixBase.toLocaleString('fr-FR')} €
            <span className="text-sm font-normal text-gray-400"> /nuit</span>
          </p>
        )}
      </div>

      {/* Calendrier */}
      <div className="px-3 py-3 overflow-x-auto border-b border-gray-100">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          numberOfMonths={nbMonths}
          disabled={disabledDates}
          fromMonth={today}
        />
      </div>

      {/* Résumé dates */}
      {range?.from && range?.to && (
        <div className="mx-4 my-3 px-4 py-3 bg-brand/5 rounded-lg border border-brand/20">
          <p className="text-xs font-semibold text-navy">
            Du {fmtDate(range.from)} au {fmtDate(range.to)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {nuits} nuit{nuits > 1 ? 's' : ''}
            {estimation != null && (
              <> · <span className="font-semibold text-brand">~{estimation.toLocaleString('fr-FR')} €</span></>
            )}
          </p>
        </div>
      )}
      {range?.from && !range?.to && (
        <p className="mx-4 my-2 text-xs text-gray-400">
          Sélectionnez une date de fin
        </p>
      )}

      {/* Formulaire */}
      <div className="px-5 pb-5 space-y-4 mt-2">
        {/* Type d'événement */}
        <div>
          <label className="block text-xs font-semibold text-navy/60 uppercase tracking-wider mb-1.5">
            Type d&apos;événement
          </label>
          <select
            value={typeEvenement}
            onChange={(e) => setTypeEvenement(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 text-navy bg-white focus:outline-none focus:border-brand"
          >
            <option value="">Choisir…</option>
            {TYPES_EVENEMENT.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Participants */}
        <div>
          <label className="block text-xs font-semibold text-navy/60 uppercase tracking-wider mb-1.5">
            Participants
          </label>
          <input
            type="number"
            min={1}
            value={participants}
            onChange={(e) => setParticipants(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 text-navy focus:outline-none focus:border-brand"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-navy/60 uppercase tracking-wider mb-1.5">
            Message <span className="font-normal normal-case text-gray-400">(optionnel)</span>
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Décrivez votre événement…"
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 text-navy resize-none focus:outline-none focus:border-brand"
          />
        </div>

        {/* Erreur */}
        {error && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        {/* Bouton */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${
            canSubmit && !isSubmitting
              ? 'bg-brand hover:bg-brand-light text-navy cursor-pointer'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Envoi…' : 'Envoyer la demande'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Aucun paiement maintenant · Devis gratuit
        </p>
      </div>
    </div>
  )
}
