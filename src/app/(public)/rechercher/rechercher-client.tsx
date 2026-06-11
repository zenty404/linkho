'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { LieuPublic } from '@/lib/actions/public'

const TYPES_EVENEMENTS_OPTIONS = [
  'WEI',
  'Soirée',
  'Gala',
  'Séminaire',
  'Week-end',
  "Journée d'intégration",
  'Autre',
]

const TAGS_EQUIPEMENTS_OPTIONS = [
  'Piscine',
  'Scène',
  'Sono',
  'Parking',
  'Bar',
  'Cuisine',
  'Hébergement',
  'Salle de réception',
  'Terrasse',
  'Climatisation',
  'WiFi',
  'Jacuzzi',
  'Salle de sport',
  'Karaoké',
  'Barbecue',
]

type Filtres = {
  ville: string
  participants: string
  budget_max: string
  avec_hebergement: boolean
  equipements: string[]
  types_evenements: string[]
}

type Props = {
  lieux: LieuPublic[]
  initialFiltres: Filtres
  initialDates: { date_debut: string; date_fin: string }
}

export default function RecherchePage({ lieux, initialFiltres, initialDates }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filtres, setFiltres] = useState<Filtres>(initialFiltres)

  function buildUrl(f: Filtres): string {
    const params = new URLSearchParams()
    if (f.ville) params.set('ville', f.ville)
    if (f.participants) params.set('participants', f.participants)
    if (f.budget_max) params.set('budget_max', f.budget_max)
    if (f.avec_hebergement) params.set('avec_hebergement', 'true')
    f.equipements.forEach((e) => params.append('equipements', e))
    f.types_evenements.forEach((t) => params.append('types_evenements', t))
    if (initialDates.date_debut) params.set('date_debut', initialDates.date_debut)
    if (initialDates.date_fin) params.set('date_fin', initialDates.date_fin)
    const qs = params.toString()
    return `/rechercher${qs ? `?${qs}` : ''}`
  }

  function navigate(f: Filtres) {
    startTransition(() => {
      router.push(buildUrl(f))
    })
  }

  function handleTextBlur() {
    navigate(filtres)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') navigate(filtres)
  }

  function toggleEquipement(eq: string) {
    const next = filtres.equipements.includes(eq)
      ? filtres.equipements.filter((e) => e !== eq)
      : [...filtres.equipements, eq]
    const updated = { ...filtres, equipements: next }
    setFiltres(updated)
    navigate(updated)
  }

  function toggleTypeEvenement(type: string) {
    const next = filtres.types_evenements.includes(type)
      ? filtres.types_evenements.filter((t) => t !== type)
      : [...filtres.types_evenements, type]
    const updated = { ...filtres, types_evenements: next }
    setFiltres(updated)
    navigate(updated)
  }

  function toggleHebergement() {
    const updated = { ...filtres, avec_hebergement: !filtres.avec_hebergement }
    setFiltres(updated)
    navigate(updated)
  }

  function resetFiltres() {
    const empty: Filtres = {
      ville: '',
      participants: '',
      budget_max: '',
      avec_hebergement: false,
      equipements: [],
      types_evenements: [],
    }
    setFiltres(empty)
    startTransition(() => {
      const params = new URLSearchParams()
      if (initialDates.date_debut) params.set('date_debut', initialDates.date_debut)
      if (initialDates.date_fin) params.set('date_fin', initialDates.date_fin)
      const qs = params.toString()
      router.push(`/rechercher${qs ? `?${qs}` : ''}`)
    })
  }

  function buildLieuUrl(id: string): string {
    const params = new URLSearchParams()
    if (initialDates.date_debut) params.set('date_debut', initialDates.date_debut)
    if (initialDates.date_fin) params.set('date_fin', initialDates.date_fin)
    if (filtres.participants) params.set('participants', filtres.participants)
    const qs = params.toString()
    return `/lieux/${id}${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8 items-start">
          {/* ── Sidebar filtres ── */}
          <aside className="hidden md:block w-[280px] flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-navy text-lg">Filtrer</h2>
                <button
                  onClick={resetFiltres}
                  className="text-xs text-brand hover:underline font-medium"
                >
                  Réinitialiser
                </button>
              </div>

              {/* Ville */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-navy/60 uppercase tracking-wider mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  value={filtres.ville}
                  onChange={(e) => setFiltres({ ...filtres, ville: e.target.value })}
                  onBlur={handleTextBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Paris, Lyon…"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 text-navy focus:outline-none focus:border-brand"
                />
              </div>

              {/* Participants */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-navy/60 uppercase tracking-wider mb-2">
                  Participants minimum
                </label>
                <input
                  type="number"
                  min={1}
                  value={filtres.participants}
                  onChange={(e) => setFiltres({ ...filtres, participants: e.target.value })}
                  onBlur={handleTextBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="50"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 text-navy focus:outline-none focus:border-brand"
                />
              </div>

              {/* Budget */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-navy/60 uppercase tracking-wider mb-2">
                  Budget max par personne (€)
                </label>
                <input
                  type="number"
                  min={0}
                  value={filtres.budget_max}
                  onChange={(e) => setFiltres({ ...filtres, budget_max: e.target.value })}
                  onBlur={handleTextBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="500"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 text-navy focus:outline-none focus:border-brand"
                />
              </div>

              {/* Avec hébergement */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={toggleHebergement}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      filtres.avec_hebergement ? 'bg-brand' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        filtres.avec_hebergement ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium text-navy">Avec hébergement</span>
                </button>
              </div>

              {/* Type d'événement */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-navy/60 uppercase tracking-wider mb-3">
                  Type d&apos;événement
                </p>
                <div className="space-y-2.5">
                  {TYPES_EVENEMENTS_OPTIONS.map((type) => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filtres.types_evenements.includes(type)}
                        onChange={() => toggleTypeEvenement(type)}
                        className="w-4 h-4 rounded accent-brand"
                      />
                      <span className="text-sm text-navy/80 group-hover:text-navy transition-colors">
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Équipements */}
              <div>
                <p className="text-xs font-semibold text-navy/60 uppercase tracking-wider mb-3">
                  Équipements
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TAGS_EQUIPEMENTS_OPTIONS.map((eq) => (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => toggleEquipement(eq)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                        filtres.equipements.includes(eq)
                          ? 'bg-navy text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* ── Grille résultats ── */}
          <main className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-navy mb-6">
              {isPending
                ? 'Recherche en cours…'
                : `${lieux.length} lieu${lieux.length !== 1 ? 'x' : ''} disponible${lieux.length !== 1 ? 's' : ''}`}
            </h1>

            {isPending ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse"
                  >
                    <div className="h-48 bg-gray-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="flex gap-1 pt-1">
                        <div className="h-5 bg-gray-200 rounded-full w-16" />
                        <div className="h-5 bg-gray-200 rounded-full w-12" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : lieux.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                </div>
                <p className="font-semibold text-navy mb-1">
                  Aucun lieu ne correspond à vos critères
                </p>
                <p className="text-sm text-gray-400">Essayez d&apos;élargir votre recherche</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {lieux.map((lieu) => (
                  <LieuCard key={lieu.id} lieu={lieu} lieuUrl={buildLieuUrl(lieu.id)} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function LieuCard({ lieu, lieuUrl }: { lieu: LieuPublic; lieuUrl: string }) {
  const badges = lieu.equipements?.slice(0, 3) ?? []

  return (
    <Link
      href={lieuUrl}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
    >
      {/* Photo */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {lieu.photo_url ? (
          <Image
            src={lieu.photo_url}
            alt={lieu.nom}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-300"
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-navy text-base mb-1 group-hover:text-brand transition-colors line-clamp-1">
          {lieu.nom}
        </h3>

        {lieu.ville && (
          <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
            {lieu.ville}
          </p>
        )}

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {badges.map((eq) => (
              <span
                key={eq}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
              >
                {eq}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-end justify-between pt-3 border-t border-gray-100">
          <div className="flex flex-col gap-0.5">
            {lieu.capacite_max != null && (
              <span className="text-xs text-gray-500">
                Jusqu&apos;à{' '}
                <strong className="text-navy">{lieu.capacite_max}</strong> pers.
              </span>
            )}
            {lieu.nb_couchages != null && lieu.nb_couchages > 0 && (
              <span className="text-xs text-gray-500">
                <strong className="text-navy">{lieu.nb_couchages}</strong> couchages
              </span>
            )}
          </div>
          {lieu.prix_base != null && (
            <span className="text-sm font-bold text-brand whitespace-nowrap">
              À partir de {lieu.prix_base.toLocaleString('fr-FR')} €
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
