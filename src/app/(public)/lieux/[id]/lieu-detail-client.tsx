'use client'

import 'react-day-picker/dist/style.css'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import type { DateRange } from 'react-day-picker'
import type { LieuDetail, PeriodeOccupee } from '@/lib/actions/public'
import type { AvisLieu } from '@/lib/actions/avis'
import DevisWidget from './devis-widget'
import { MotionSection } from '@/components/public/motion-section'

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toLocalDateString(d: Date): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  )
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function nbNuits(from: Date, to: Date): number {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000))
}

type Props = {
  lieu: LieuDetail
  reservationsOccupees: PeriodeOccupee[]
  initialDates: { date_debut: string; date_fin: string; participants: string }
  avis: AvisLieu[]
}

function Stars({ note, size = 'md' }: { note: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'text-sm' : 'text-base'
  return (
    <span className={`${sz} leading-none`} aria-label={`${note} étoiles sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < note ? 'text-brand' : 'text-gray-200'}>★</span>
      ))}
    </span>
  )
}

export default function LieuDetailClient({ lieu, reservationsOccupees, initialDates, avis }: Props) {
  const noteMoyenne =
    avis.length > 0
      ? Math.round((avis.reduce((s, a) => s + a.note, 0) / avis.length) * 10) / 10
      : null
  const router = useRouter()
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [range, setRange] = useState<DateRange | undefined>(
    initialDates.date_debut
      ? {
          from: parseLocalDate(initialDates.date_debut),
          to: initialDates.date_fin ? parseLocalDate(initialDates.date_fin) : undefined,
        }
      : undefined,
  )

  const dateDebut = range?.from ? toLocalDateString(range.from) : undefined
  const dateFin = range?.to ? toLocalDateString(range.to) : undefined
  const nuits = range?.from && range?.to ? nbNuits(range.from, range.to) : 0
  const estimation = lieu.prix_base != null && nuits > 0 ? lieu.prix_base * nuits : null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const disabledDates = [
    { before: today },
    ...reservationsOccupees.map((r) => ({
      from: parseLocalDate(r.date_debut),
      to: parseLocalDate(r.date_fin),
    })),
  ]

  const mainPhoto = lieu.photos.find((p) => p.est_principale) ?? lieu.photos[0] ?? null
  const sidePhotos = lieu.photos.filter((p) => p.id !== mainPhoto?.id).slice(0, 4)
  const hasGrid = sidePhotos.length > 0

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-7xl mx-auto px-6">

        {/* Retour */}
        <div className="pt-8 pb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Retour aux résultats
          </button>
        </div>

        {/* ── Galerie ── */}
        <div className="relative h-[480px] rounded-2xl overflow-hidden bg-gray-100">
          {hasGrid ? (
            <div className="flex h-full gap-2">
              {/* Photo principale */}
              <div className="relative flex-[3] bg-gray-100">
                {mainPhoto && (
                  <Image src={mainPhoto.url} alt={lieu.nom} fill className="object-cover" priority />
                )}
              </div>
              {/* Grille 2x2 */}
              <div className="flex-[2] grid grid-cols-2 grid-rows-2 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="relative bg-gray-200">
                    {sidePhotos[i] && (
                      <Image src={sidePhotos[i].url} alt="" fill className="object-cover" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : mainPhoto ? (
            <Image src={mainPhoto.url} alt={lieu.nom} fill className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
          )}

          {/* Bouton voir toutes les photos */}
          {lieu.photos.length > 1 && (
            <button
              onClick={() => setShowAllPhotos(true)}
              className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/95 backdrop-blur-sm text-navy text-sm font-semibold px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              Voir toutes les photos ({lieu.photos.length})
            </button>
          )}
        </div>

        {/* ── Header ── */}
        <div className="mt-8 pb-8 border-b border-gray-100">
          <div className="flex items-start gap-3 flex-wrap mb-2">
            <h1 className="text-3xl font-bold text-navy leading-tight">{lieu.nom}</h1>
            {lieu.type_lieu && (
              <span className="mt-1.5 text-xs font-semibold bg-brand/10 text-brand px-3 py-1 rounded-full">
                {lieu.type_lieu}
              </span>
            )}
          </div>

          {(lieu.ville || lieu.adresse) && (
            <p className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              {[lieu.ville, lieu.adresse, lieu.code_postal].filter(Boolean).join(' · ')}
            </p>
          )}

          {noteMoyenne !== null && (
            <div className="flex items-center gap-2 mb-4">
              <Stars note={Math.round(noteMoyenne)} />
              <span className="text-sm font-bold text-navy">{noteMoyenne.toFixed(1)}</span>
              <span className="text-sm text-gray-400">· {avis.length} avis</span>
            </div>
          )}

          {lieu.equipements && lieu.equipements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {lieu.equipements.slice(0, 7).map((eq) => (
                <span key={eq} className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {eq}
                </span>
              ))}
              {lieu.equipements.length > 7 && (
                <span className="text-xs font-medium bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                  +{lieu.equipements.length - 7}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Sections infos ── */}
        <div className="py-10 space-y-12">

          {/* À propos */}
          {lieu.description && (
            <MotionSection direction="up">
              <section>
                <h2 className="text-xl font-bold text-navy mb-4">À propos</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {lieu.description}
                </p>
              </section>
            </MotionSection>
          )}

          {/* Caractéristiques */}
          <MotionSection direction="up" delay={50}>
            <section>
              <h2 className="text-xl font-bold text-navy mb-5">Caractéristiques</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {lieu.capacite_max != null && (
                  <Carac icon={<IconUsers />} label="Capacité max" value={`${lieu.capacite_max} personnes`} />
                )}
                {lieu.nb_couchages != null && lieu.nb_couchages > 0 && (
                  <Carac icon={<IconBed />} label="Couchages" value={`${lieu.nb_couchages}`} />
                )}
                {lieu.nb_chambres != null && lieu.nb_chambres > 0 && (
                  <Carac icon={<IconDoor />} label="Chambres" value={`${lieu.nb_chambres}`} />
                )}
                {lieu.nb_salles_de_bain != null && lieu.nb_salles_de_bain > 0 && (
                  <Carac icon={<IconBath />} label="Salles de bain" value={`${lieu.nb_salles_de_bain}`} />
                )}
                {lieu.superficie_m2 != null && (
                  <Carac icon={<IconSquare />} label="Superficie" value={`${lieu.superficie_m2} m²`} />
                )}
                {lieu.prix_base != null && (
                  <Carac icon={<IconTag />} label="À partir de" value={`${lieu.prix_base.toLocaleString('fr-FR')} € / nuit`} />
                )}
              </div>
            </section>
          </MotionSection>

          {/* Équipements */}
          {lieu.equipements && lieu.equipements.length > 0 && (
            <MotionSection direction="up" delay={50}>
              <section>
                <h2 className="text-xl font-bold text-navy mb-5">Équipements</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
                  {lieu.equipements.map((eq) => (
                    <div key={eq} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-brand" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                      {eq}
                    </div>
                  ))}
                </div>
              </section>
            </MotionSection>
          )}

          {/* Types d'événements */}
          {lieu.types_evenements && lieu.types_evenements.length > 0 && (
            <MotionSection direction="up" delay={50}>
              <section>
                <h2 className="text-xl font-bold text-navy mb-4">Types d&apos;événements acceptés</h2>
                <div className="flex flex-wrap gap-2">
                  {lieu.types_evenements.map((t) => (
                    <span key={t} className="text-sm font-medium bg-navy/5 text-navy px-4 py-2 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            </MotionSection>
          )}
        </div>

        {/* ── Layout calendrier + widget ── */}
        <MotionSection direction="up" delay={50}>
          <div className="flex gap-8 items-start pb-12">

            {/* Disponibilités */}
            <div className="flex-1 min-w-0">
              <section>
                <h2 className="text-xl font-bold text-navy mb-5">Disponibilités</h2>
                <style>{`
                  .rdp-day_selected:not([disabled]) { background-color: #f49915 !important; color: white !important; }
                  .rdp-day_range_start:not([disabled]),
                  .rdp-day_range_end:not([disabled]) { background-color: #f49915 !important; color: white !important; }
                  .rdp-day_range_middle:not([disabled]) { background-color: rgba(247,181,71,0.3) !important; color: #071634 !important; }
                  .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: #f7b547 !important; color: white !important; }
                  .rdp-day_disabled, .rdp-day_disabled:hover { opacity: 0.35 !important; background-color: transparent !important; color: inherit !important; cursor: not-allowed !important; }
                `}</style>
                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
                  <DayPicker
                    mode="range"
                    selected={range}
                    onSelect={setRange}
                    numberOfMonths={2}
                    disabled={disabledDates}
                    fromMonth={today}
                  />
                </div>
                {range?.from && range?.to && (
                  <div className="mt-4 px-4 py-3 bg-brand/5 rounded-xl border border-brand/20 flex items-center justify-between">
                    <p className="text-sm font-semibold text-navy">
                      Du {fmtDate(range.from)} au {fmtDate(range.to)}
                    </p>
                    <p className="text-sm text-gray-500 flex-shrink-0 ml-4">
                      {nuits} nuit{nuits > 1 ? 's' : ''}
                      {estimation != null && (
                        <> · <span className="font-semibold text-brand">~{estimation.toLocaleString('fr-FR')} €</span></>
                      )}
                    </p>
                  </div>
                )}
                {range?.from && !range?.to && (
                  <p className="mt-3 text-sm text-gray-400">Sélectionnez une date de fin</p>
                )}
              </section>
            </div>

            {/* Widget sticky */}
            <div className="hidden lg:block w-[380px] flex-shrink-0">
              <DevisWidget
                lieuId={lieu.id}
                lieuNom={lieu.nom}
                prixBase={lieu.prix_base}
                typesAcceptes={lieu.types_evenements ?? []}
                dateDebut={dateDebut}
                dateFin={dateFin}
                initialParticipants={
                  initialDates.participants ? parseInt(initialDates.participants, 10) : undefined
                }
              />
            </div>
          </div>
        </MotionSection>

        {/* ── Avis des BDE ── */}
        <div className="pb-16">
          <MotionSection direction="up" delay={50}>
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-navy">
                  Avis des BDE
                  {avis.length > 0 && (
                    <span className="ml-2 text-base font-normal text-gray-400">({avis.length})</span>
                  )}
                </h2>
                {noteMoyenne !== null && (
                  <div className="flex items-center gap-2">
                    <Stars note={Math.round(noteMoyenne)} />
                    <span className="text-sm font-bold text-navy">{noteMoyenne.toFixed(1)}/5</span>
                  </div>
                )}
              </div>

              {avis.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 px-6 py-10 text-center">
                  <p className="text-sm text-gray-400">Aucun avis pour ce lieu pour l&apos;instant.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {avis.map((a) => (
                    <div key={a.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <Stars note={a.note} size="sm" />
                          {a.bde && (
                            <p className="text-sm font-semibold text-navy mt-1">{a.bde.nom}</p>
                          )}
                          {a.bde?.ecole && (
                            <p className="text-xs text-gray-400">{a.bde.ecole}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                          {new Date(a.created_at).toLocaleDateString('fr-FR', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {a.commentaire && (
                        <p className="text-sm text-gray-600 leading-relaxed">
                          &ldquo;{a.commentaire}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </MotionSection>
        </div>
      </div>

      {/* ── Modal toutes les photos ── */}
      {showAllPhotos && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
            <p className="text-white font-semibold">
              {lieu.nom} · {lieu.photos.length} photos
            </p>
            <button
              onClick={() => setShowAllPhotos(false)}
              className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
            >
              Fermer
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
              {lieu.photos.map((p) => (
                <div key={p.id} className="relative aspect-video rounded-xl overflow-hidden bg-gray-800">
                  <Image src={p.url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Composants utilitaires ───────────────────────────────────────────────────

function Carac({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
      <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-navy">{value}</p>
      </div>
    </div>
  )
}

function IconUsers() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function IconBed() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  )
}

function IconDoor() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  )
}

function IconBath() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function IconSquare() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
  )
}

function IconTag() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  )
}
