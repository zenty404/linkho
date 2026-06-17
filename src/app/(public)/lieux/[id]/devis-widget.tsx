'use client'

import 'react-day-picker/dist/style.css'
import { DayPicker } from 'react-day-picker'
import type { DateRange } from 'react-day-picker'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createDemandeEtEvenement, type LieuPublic } from '@/lib/actions/public'

const TYPES_EVENEMENT = [
  { value: 'wei', label: 'WEI' },
  { value: 'soiree', label: 'Soirée' },
  { value: 'gala', label: 'Gala' },
  { value: 'seminaire', label: 'Séminaire' },
  { value: 'weekend', label: 'Week-end' },
  { value: 'integration', label: "Journée d'intégration" },
  { value: 'autre', label: 'Autre' },
]

type Props = {
  lieuId: string
  lieuNom: string
  prixBase: number | null
  reservationsOccupees: { date_debut: string; date_fin: string }[]
  typesAcceptes: string[]
  initialDateDebut?: string
  initialDateFin?: string
  initialParticipants?: number
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function parseInitialRange(debut?: string, fin?: string): DateRange | undefined {
  if (!debut) return undefined
  return { from: parseLocalDate(debut), to: fin ? parseLocalDate(fin) : undefined }
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateDDMMYYYY(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function nbNuits(from: Date, to: Date): number {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000))
}

export default function DevisWidget({
  lieuId,
  lieuNom,
  prixBase,
  reservationsOccupees,
  typesAcceptes,
  initialDateDebut,
  initialDateFin,
  initialParticipants,
}: Props) {
  const typesDisponibles = typesAcceptes.length > 0
    ? TYPES_EVENEMENT.filter((t) => typesAcceptes.includes(t.label))
    : TYPES_EVENEMENT
  const router = useRouter()

  const [range, setRange] = useState<DateRange | undefined>(
    parseInitialRange(initialDateDebut, initialDateFin),
  )
  const [participants, setParticipants] = useState(initialParticipants ?? 1)
  const [typeEvenement, setTypeEvenement] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{ evenementId: string; suggestions: LieuPublic[] } | null>(null)
  const [nbMonths, setNbMonths] = useState(1)
  const [showRecap, setShowRecap] = useState(false)

  useEffect(() => {
    const update = () => setNbMonths(window.innerWidth >= 1280 ? 2 : 1)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (!successData) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [successData])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const disabledDates = [
    { before: today },
    ...reservationsOccupees.map((r) => ({
      from: parseLocalDate(r.date_debut),
      to: parseLocalDate(r.date_fin),
    })),
  ]

  const nuits = range?.from && range?.to ? nbNuits(range.from, range.to) : 0
  const estimation = prixBase != null && nuits > 0 ? prixBase * nuits : null
  const acompteEstime = prixBase != null && nuits > 0 ? Math.round(prixBase * nuits * 0.3) : null
  const canSubmit = range?.from != null && range?.to != null && participants >= 1 && typeEvenement !== ''
  const typeLabel = TYPES_EVENEMENT.find((t) => t.value === typeEvenement)?.label ?? typeEvenement

  function handleCloseModal() {
    router.push(`/bde/evenements/${successData!.evenementId}`)
  }

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
        setShowRecap(false)
        return
      }

      const toLocalDateString = (d: Date) =>
        d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0')

      const result = await createDemandeEtEvenement({
        lieuId,
        date_debut: toLocalDateString(range!.from!),
        date_fin: toLocalDateString(range!.to!),
        participants,
        typeEvenement,
        message,
      })
      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
        setShowRecap(false)
        return
      }
      setSuccessData(result.data!)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
      setShowRecap(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* ── Modal succès ── */}
      {successData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div
            className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 text-sm"
              aria-label="Fermer"
            >
              ✕
            </button>

            <div className="pt-8 px-6 pb-5 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-navy">Demande envoyée !</h3>
              <p className="text-sm text-gray-500">L&apos;établissement vous répondra sous 48h.</p>
            </div>

            {successData.suggestions.length > 0 && (
              <div className="px-6 pb-5 space-y-3">
                <div className="border-t border-gray-100 pt-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Ces lieux sont aussi disponibles pour vos dates
                  </p>
                  <div className="flex flex-col gap-2">
                    {successData.suggestions.map((lieu) => (
                      <a
                        key={lieu.id}
                        href={`/lieux/${lieu.id}`}
                        className="flex items-center gap-3 border border-gray-100 rounded-xl p-3 hover:border-brand/40 hover:bg-brand/5 transition-colors"
                      >
                        {lieu.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={lieu.photo_url}
                            alt={lieu.nom}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-navy truncate">{lieu.nom}</p>
                          {lieu.ville && <p className="text-xs text-gray-500">{lieu.ville}</p>}
                          {lieu.capacite_max != null && (
                            <p className="text-xs text-gray-400">jusqu&apos;à {lieu.capacite_max} pers.</p>
                          )}
                        </div>
                        <span className="ml-auto text-gray-300 flex-shrink-0">›</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="px-6 pb-6 pt-2 border-t border-gray-100">
              <a
                href={`/bde/evenements/${successData.evenementId}`}
                className="block w-full py-3 text-center bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors"
              >
                Voir mon événement
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Widget ── */}
      <div className="sticky top-24 bg-white border border-gray-200 rounded-xl overflow-hidden">
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

        {showRecap ? (
          /* ── Écran récapitulatif ── */
          <div className="px-5 py-5 space-y-5">
            <h4 className="text-sm font-bold text-navy">Vérifier les disponibilités</h4>

            {/* Lignes récap */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Lieu</span>
                <span className="font-semibold text-navy text-right">{lieuNom}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Dates</span>
                <span className="font-semibold text-navy">
                  {fmtDateDDMMYYYY(range!.from!)} → {fmtDateDDMMYYYY(range!.to!)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Participants</span>
                <span className="font-semibold text-navy">{participants}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Type d&apos;événement</span>
                <span className="font-semibold text-navy">{typeLabel}</span>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="flex justify-between items-start text-sm">
                  <span className="text-gray-500">Acompte estimé (30%)</span>
                  {acompteEstime != null ? (
                    <span className="font-bold text-brand text-base">
                      ~{acompteEstime.toLocaleString('fr-FR')} €
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 text-right max-w-[160px]">
                      Le montant sera défini par l&apos;établissement
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Message 72h */}
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5 leading-relaxed">
              En cas de disponibilité confirmée, vous aurez 72h pour régler cet acompte et finaliser votre réservation.
            </p>

            {/* Erreur */}
            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${
                  !isSubmitting
                    ? 'bg-brand hover:bg-brand-light text-navy cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Envoi…' : 'Confirmer la demande'}
              </button>

              <button
                type="button"
                onClick={() => setShowRecap(false)}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-navy hover:bg-gray-50 transition-colors"
              >
                Modifier
              </button>
            </div>
          </div>
        ) : (
          /* ── Formulaire ── */
          <>
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
                  {typesDisponibles.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy/60 uppercase tracking-wider mb-1.5">
                  Participants
                </label>
                <input
                  type="number"
                  min={1}
                  defaultValue={participants}
                  onBlur={(e) => {
                    const v = parseInt(e.target.value, 10)
                    setParticipants(isNaN(v) ? 1 : Math.max(1, v))
                  }}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 text-navy focus:outline-none focus:border-brand"
                />
              </div>

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

              {error && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                onClick={() => { if (canSubmit) setShowRecap(true) }}
                disabled={!canSubmit}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${
                  canSubmit
                    ? 'bg-brand hover:bg-brand-light text-navy cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Envoyer la demande
              </button>

              <p className="text-xs text-gray-400 text-center">
                Aucun paiement maintenant · Devis gratuit
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
