'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { LieuDetail, PeriodeOccupee } from '@/lib/actions/public'
import DevisWidget from './devis-widget'

type Props = {
  lieu: LieuDetail
  reservationsOccupees: PeriodeOccupee[]
  initialDates: { date_debut: string; date_fin: string; participants: string }
}

export default function LieuDetailClient({ lieu, reservationsOccupees, initialDates }: Props) {
  const router = useRouter()
  const [activePhoto, setActivePhoto] = useState(
    lieu.photos.find((p) => p.est_principale)?.url ?? lieu.photos[0]?.url ?? null,
  )

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-navy transition-colors mb-6"
        >
          ← Retour aux résultats
        </button>
        <div className="flex gap-10 items-start">

          {/* ── Colonne principale ── */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* 1. Galerie */}
            <section>
              {/* Grande photo */}
              <div className="relative w-full h-[420px] rounded-2xl overflow-hidden bg-gray-100">
                {activePhoto ? (
                  <Image
                    src={activePhoto}
                    alt={lieu.nom}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-gray-300"
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

              {/* Miniatures */}
              {lieu.photos.length > 1 && (
                <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
                  {lieu.photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setActivePhoto(photo.url)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                        activePhoto === photo.url
                          ? 'border-brand'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image src={photo.url} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* 2. Infos principales */}
            <section>
              <div className="flex items-start gap-3 flex-wrap mb-3">
                <h1 className="text-3xl font-bold text-navy leading-tight">{lieu.nom}</h1>
                {lieu.type_lieu && (
                  <span className="mt-1.5 text-xs font-semibold bg-brand/10 text-brand px-3 py-1 rounded-full">
                    {lieu.type_lieu}
                  </span>
                )}
              </div>

              {lieu.ville && (
                <p className="flex items-center gap-1.5 text-gray-500 mb-5">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
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

              {lieu.description && (
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {lieu.description}
                </p>
              )}
            </section>

            {/* 3. Caractéristiques */}
            <section>
              <h2 className="text-lg font-bold text-navy mb-4">Caractéristiques</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {lieu.capacite_max != null && (
                  <Carac
                    icon={<IconUsers />}
                    label="Capacité max"
                    value={`${lieu.capacite_max} personnes`}
                  />
                )}
                {lieu.nb_couchages != null && lieu.nb_couchages > 0 && (
                  <Carac
                    icon={<IconBed />}
                    label="Couchages"
                    value={`${lieu.nb_couchages} couchages`}
                  />
                )}
                {lieu.nb_chambres != null && lieu.nb_chambres > 0 && (
                  <Carac
                    icon={<IconDoor />}
                    label="Chambres"
                    value={`${lieu.nb_chambres} chambres`}
                  />
                )}
                {lieu.superficie_m2 != null && (
                  <Carac
                    icon={<IconSquare />}
                    label="Superficie"
                    value={`${lieu.superficie_m2} m²`}
                  />
                )}
                {lieu.prix_base != null && (
                  <Carac
                    icon={<IconTag />}
                    label="Tarif"
                    value={`À partir de ${lieu.prix_base.toLocaleString('fr-FR')} €`}
                  />
                )}
              </div>
            </section>

            {/* 4. Équipements */}
            {lieu.equipements && lieu.equipements.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-navy mb-4">Équipements</h2>
                <div className="flex flex-wrap gap-2">
                  {lieu.equipements.map((eq) => (
                    <span
                      key={eq}
                      className="text-sm bg-brand/10 text-brand font-medium px-3 py-1.5 rounded-full"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* 5. Localisation */}
            {(lieu.ville || lieu.adresse) && (
              <section>
                <h2 className="text-lg font-bold text-navy mb-4">Localisation</h2>
                <div className="bg-white rounded-xl p-5 border border-gray-100 space-y-1">
                  {lieu.ville && (
                    <p className="text-navy font-semibold">{lieu.ville}</p>
                  )}
                  {lieu.adresse && (
                    <p className="text-gray-500 text-sm">{lieu.adresse}</p>
                  )}
                  {lieu.code_postal && (
                    <p className="text-gray-500 text-sm">{lieu.code_postal}</p>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ── Widget sticky droite ── */}
          <aside className="hidden lg:block w-80 xl:w-auto flex-shrink-0">
            <DevisWidget
              lieuId={lieu.id}
              lieuNom={lieu.nom}
              prixBase={lieu.prix_base}
              reservationsOccupees={reservationsOccupees}
              typesAcceptes={lieu.types_evenements ?? []}
              initialDateDebut={initialDates.date_debut || undefined}
              initialDateFin={initialDates.date_fin || undefined}
              initialParticipants={
                initialDates.participants ? parseInt(initialDates.participants, 10) : undefined
              }
            />
          </aside>
        </div>
      </div>
    </div>
  )
}

// ─── Composants utilitaires ───────────────────────────────────────────────────

function Carac({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100">
      <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
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
