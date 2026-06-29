'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition, useMemo } from 'react'
import type { LieuPublic } from '@/lib/actions/public'
import { MotionSection } from '@/components/public/motion-section'

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

type Tri = 'pertinence' | 'prix_asc' | 'prix_desc' | 'capacite'

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
  initialDates: { date_debut: string; date_fin: string; type: string }
}

export default function RecherchePage({ lieux, initialFiltres, initialDates }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filtres, setFiltres] = useState<Filtres>(initialFiltres)

  const [tri, setTri] = useState<Tri>('pertinence')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const hasDateFilter = Boolean(initialDates.date_debut && initialDates.date_fin)

  function buildUrl(f: Filtres): string {
    const d = initialDates
    const params = new URLSearchParams()
    if (f.ville) params.set('ville', f.ville)
    if (f.participants) params.set('participants', f.participants)
    if (f.budget_max) params.set('budget_max', f.budget_max)
    if (f.avec_hebergement) params.set('avec_hebergement', 'true')
    f.equipements.forEach((e) => params.append('equipements', e))
    f.types_evenements.forEach((t) => params.append('types_evenements', t))
    if (d.date_debut) params.set('date_debut', d.date_debut)
    if (d.date_fin) params.set('date_fin', d.date_fin)
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
    if (filtres.types_evenements.length === 1) {
      params.set('type', filtres.types_evenements[0])
    } else if (initialDates.type) {
      params.set('type', initialDates.type)
    }
    const qs = params.toString()
    return `/lieux/${id}${qs ? `?${qs}` : ''}`
  }

  const activeFilterCount =
    (filtres.ville ? 1 : 0) +
    (filtres.budget_max ? 1 : 0) +
    (filtres.avec_hebergement ? 1 : 0) +
    filtres.equipements.length +
    filtres.types_evenements.length

  const sortedLieux = useMemo(() => {
    const copy = [...lieux]
    if (tri === 'prix_asc') return copy.sort((a, b) => (a.prix_base ?? Infinity) - (b.prix_base ?? Infinity))
    if (tri === 'prix_desc') return copy.sort((a, b) => (b.prix_base ?? -1) - (a.prix_base ?? -1))
    if (tri === 'capacite') return copy.sort((a, b) => (b.capacite_max ?? 0) - (a.capacite_max ?? 0))
    return copy
  }, [lieux, tri])

  const sidebarContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white text-lg">Filtres</h2>
        <button onClick={resetFiltres} className="text-xs text-brand hover:underline font-medium">
          Réinitialiser
        </button>
      </div>

      {/* Ville */}
      <div>
        <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
          Localisation
        </label>
        <input
          type="text"
          value={filtres.ville}
          onChange={(e) => setFiltres({ ...filtres, ville: e.target.value })}
          onBlur={handleTextBlur}
          onKeyDown={handleKeyDown}
          placeholder="Paris, Lyon…"
          className="w-full text-sm px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white focus:outline-none focus:border-brand placeholder-white/40"
        />
      </div>

      {/* Capacité */}
      <div>
        <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
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
          className="w-full text-sm px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white focus:outline-none focus:border-brand placeholder-white/40"
        />
      </div>

      {/* Budget */}
      <div>
        <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
          Budget max (€)
        </label>
        <input
          type="number"
          min={0}
          value={filtres.budget_max}
          onChange={(e) => setFiltres({ ...filtres, budget_max: e.target.value })}
          onBlur={handleTextBlur}
          onKeyDown={handleKeyDown}
          placeholder="5 000"
          className="w-full text-sm px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white focus:outline-none focus:border-brand placeholder-white/40"
        />
      </div>

      {/* Hébergement */}
      <div>
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
          <span className="text-sm font-medium text-white">Avec hébergement</span>
        </button>
      </div>

      {/* Type d'événement */}
      <div>
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
          Type d&apos;événement
        </p>
        <div className="space-y-2">
          {TYPES_EVENEMENTS_OPTIONS.map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filtres.types_evenements.includes(type)}
                onChange={() => toggleTypeEvenement(type)}
                className="w-4 h-4 rounded accent-brand"
              />
              <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                {type}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Équipements */}
      <div>
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
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
                  ? 'bg-brand text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {eq}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pt-16">

      {/* ── Contenu principal ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8 items-start">

          {/* ── Sidebar desktop ────────────────────────────────────────────── */}
          <aside className="hidden md:block w-[280px] flex-shrink-0">
            <div className="bg-navy rounded-2xl p-6 shadow-sm sticky top-24">
              {sidebarContent}
            </div>
          </aside>

          {/* ── Liste résultats ────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            {/* Header résultats */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                {/* Bouton filtres mobile */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="md:hidden flex items-center gap-2 bg-white border border-gray-200 text-navy text-sm font-medium px-4 py-2 rounded-xl shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                  Filtres
                  {activeFilterCount > 0 && (
                    <span className="bg-brand text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <h1 className="text-base font-bold text-navy">
                  {isPending
                    ? 'Recherche…'
                    : `${sortedLieux.length} lieu${sortedLieux.length !== 1 ? 'x' : ''} disponible${sortedLieux.length !== 1 ? 's' : ''}`}
                </h1>
              </div>

              {/* Tri */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 font-medium whitespace-nowrap">Trier par</label>
                <select
                  value={tri}
                  onChange={(e) => setTri(e.target.value as Tri)}
                  className="text-sm text-navy font-medium border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-brand bg-white"
                >
                  <option value="pertinence">Pertinence</option>
                  <option value="prix_asc">Prix croissant</option>
                  <option value="prix_desc">Prix décroissant</option>
                  <option value="capacite">Capacité</option>
                </select>
              </div>
            </div>

            {/* Résultats */}
            {isPending ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse flex h-44">
                    <div className="w-[40%] bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 p-5 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedLieux.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
                <p className="font-semibold text-navy mb-1">Aucun lieu ne correspond à vos critères</p>
                <p className="text-sm text-gray-400">Essayez d&apos;élargir votre recherche</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedLieux.map((lieu, i) => (
                  <MotionSection key={lieu.id} direction="up" delay={Math.min(i * 60, 300)}>
                    <LieuCard
                      lieu={lieu}
                      lieuUrl={buildLieuUrl(lieu.id)}
                      hasDateFilter={hasDateFilter}
                    />
                  </MotionSection>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Drawer mobile ────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Panneau */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-6 pb-8">
              {sidebarContent}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="mt-6 w-full bg-navy text-white font-bold py-3 rounded-xl text-sm"
              >
                Voir les résultats ({sortedLieux.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LieuCard({
  lieu,
  lieuUrl,
  hasDateFilter,
}: {
  lieu: LieuPublic
  lieuUrl: string
  hasDateFilter: boolean
}) {
  return (
    <Link
      href={lieuUrl}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex"
    >
      {/* Photo */}
      <div className="relative w-[38%] sm:w-[32%] flex-shrink-0 bg-gray-100 overflow-hidden min-h-[160px] sm:min-h-[180px]">
        {lieu.photo_url ? (
          <Image
            src={lieu.photo_url}
            alt={lieu.nom}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>
        )}
        {/* Badge disponible */}
        {hasDateFilter && (
          <span className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            Disponible
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-navy text-base group-hover:text-brand transition-colors line-clamp-1">
              {lieu.nom}
            </h3>
          </div>

          {lieu.ville && (
            <p className="text-sm text-gray-400 flex items-center gap-1 mb-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              {lieu.ville}
            </p>
          )}

          {lieu.description && (
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-3">
              {lieu.description}
            </p>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {lieu.capacite_max != null && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
                Jusqu&apos;à <strong className="text-navy">{lieu.capacite_max}</strong> pers.
              </span>
            )}
            {lieu.nb_couchages != null && lieu.nb_couchages > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12h19.5m-19.5 0a8.25 8.25 0 0 1 16.5 0m-16.5 0H2.25m0 0L3.75 9m-1.5 3L3.75 15M21.75 12H20.25m0 0L18.75 9m1.5 3-1.5 3M12 4.5v1.5m0 12v1.5" />
                </svg>
                <strong className="text-navy">{lieu.nb_couchages}</strong> couchages
              </span>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 pt-3 mt-3 border-t border-gray-100">
          {lieu.prix_base != null ? (
            <div>
              <span className="text-xl font-bold text-brand">
                {lieu.prix_base.toLocaleString('fr-FR')} €
              </span>
              <span className="text-xs text-gray-400 ml-1">/ nuit</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Prix sur demande</span>
          )}
          <span className="text-xs font-semibold text-brand border border-brand/30 bg-brand/5 px-3 py-1.5 rounded-lg group-hover:bg-brand group-hover:text-white transition-colors whitespace-nowrap">
            Voir le lieu →
          </span>
        </div>
      </div>
    </Link>
  )
}
