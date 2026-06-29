'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/public/navbar'
import { MotionSection } from '@/components/public/motion-section'
import type { AvisLinkho } from '@/lib/actions/avis'

function ConnectorLine({ delay }: { delay: number }) {
  return (
    <div className="flex items-center justify-center w-16 flex-shrink-0">
      <motion.svg
        width="48"
        height="12"
        viewBox="0 0 48 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: delay / 1000, duration: 0.5, ease: 'easeOut' }}
        style={{ originX: 0 }}
      >
        <line x1="0" y1="6" x2="38" y2="6" stroke="#f49915" strokeWidth="2" strokeDasharray="4 3" />
        <path d="M36 2 L44 6 L36 10" stroke="#f49915" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </motion.svg>
    </div>
  )
}

type LieuCard = {
  id: string
  nom: string
  ville: string | null
  capacite_max: number | null
  prix_base: number | null
  photo: string | null
}

type Props = {
  heroPhotos: string[]
  lieuxAffiches: LieuCard[]
  avisLinkho: AvisLinkho[]
}

export default function HomeClient({ heroPhotos, lieuxAffiches, avisLinkho }: Props) {
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [typeEvenement, setTypeEvenement] = useState('')

  function handleDateDebutChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setDateDebut(val)
    if (val && (!dateFin || dateFin <= val)) {
      const next = new Date(val)
      next.setDate(next.getDate() + 1)
      setDateFin(next.toISOString().split('T')[0])
    }
  }

  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-navy min-h-[85vh] pt-16 flex flex-col">
        <div className="flex-1 flex items-center">
          <div className="max-w-7xl mx-auto px-6 py-10 w-full">
            <div className="grid md:grid-cols-2 gap-16 items-center">

              {/* Texte */}
              <div>
                <MotionSection direction="left" delay={0}>
                  <div className="mb-10">
                    <Image
                      src="/LOGO ENTIER VF FULL BLANC.svg"
                      alt="LINKHO"
                      width={160}
                      height={50}
                      priority
                    />
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                    Vos événements étudiants,{' '}
                    <span className="block">
                      simplement{' '}
                      <span className="text-brand">réussis.</span>
                    </span>
                  </h1>
                </MotionSection>
                <MotionSection direction="left" delay={100}>
                  <p className="text-white/70 text-lg mb-10 leading-relaxed max-w-lg">
                    Lieux, transport, sécurité... Tout ce dont vous avez besoin pour
                    organiser vos événements, au même endroit, en quelques clics.
                  </p>
                </MotionSection>
                <MotionSection direction="left" delay={200}>
                  <div className="flex flex-wrap gap-3">
                    {[
                      {
                        label: 'Lieux vérifiés',
                        icon: (
                          <svg className="w-4 h-4 text-brand flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Devis gratuits',
                        icon: (
                          <svg className="w-4 h-4 text-brand flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Réponse rapide',
                        icon: (
                          <svg className="w-4 h-4 text-brand flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Accompagnement dédié',
                        icon: (
                          <svg className="w-4 h-4 text-brand flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                          </svg>
                        ),
                      },
                    ].map(({ label, icon }) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-2 text-white/80 text-sm"
                      >
                        {icon}
                        {label}
                      </span>
                    ))}
                  </div>
                </MotionSection>
              </div>

              {/* Mosaïque photos */}
              <MotionSection direction="right" delay={100} className="hidden md:block">
                <div className="relative" style={{ height: '480px' }}>
                  {heroPhotos[0] && (
                    <div
                      className="absolute rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20"
                      style={{ width: '55%', height: '65%', top: '8%', left: '0%', transform: 'rotate(-2deg)', zIndex: 2 }}
                    >
                      <Image src={heroPhotos[0]} fill className="object-cover" alt="Lieu" />
                    </div>
                  )}
                  {heroPhotos[1] && (
                    <div
                      className="absolute rounded-xl overflow-hidden shadow-xl border-2 border-white/20"
                      style={{ width: '40%', height: '38%', top: '0%', right: '0%', transform: 'rotate(2deg)', zIndex: 3 }}
                    >
                      <Image src={heroPhotos[1]} fill className="object-cover" alt="Lieu" />
                    </div>
                  )}
                  {heroPhotos[2] && (
                    <div
                      className="absolute rounded-xl overflow-hidden shadow-xl border-2 border-white/20"
                      style={{ width: '38%', height: '36%', top: '32%', right: '2%', transform: 'rotate(-1.5deg)', zIndex: 3 }}
                    >
                      <Image src={heroPhotos[2]} fill className="object-cover" alt="Lieu" />
                    </div>
                  )}
                  {heroPhotos[3] && (
                    <div
                      className="absolute rounded-xl overflow-hidden shadow-xl border-2 border-white/20"
                      style={{ width: '42%', height: '34%', bottom: '0%', right: '8%', transform: 'rotate(1deg)', zIndex: 4 }}
                    >
                      <Image src={heroPhotos[3]} fill className="object-cover" alt="Lieu" />
                    </div>
                  )}
                </div>
              </MotionSection>

            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative z-10 mx-auto max-w-5xl w-full px-6 -mb-8">
          <MotionSection direction="scale">
            <form
              action="/rechercher"
              method="get"
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col md:flex-row md:items-center md:divide-x divide-gray-100"
            >
              {/* Participants */}
              <div className="flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 flex-1 border-b border-gray-100 md:border-b-0">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Participants</p>
                  <input
                    name="participants"
                    type="number"
                    min={1}
                    placeholder="100"
                    className="text-sm text-navy font-medium outline-none w-full placeholder-gray-300"
                  />
                </div>
              </div>
              {/* Date début */}
              <div className="flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 flex-1 border-b border-gray-100 md:border-b-0">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date début</p>
                  <input
                    name="date_debut"
                    type="date"
                    value={dateDebut}
                    onChange={handleDateDebutChange}
                    className="text-sm text-navy font-medium outline-none w-full"
                  />
                </div>
              </div>
              {/* Date fin */}
              <div className="flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 flex-1 border-b border-gray-100 md:border-b-0">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date fin</p>
                  <input
                    name="date_fin"
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="text-sm text-navy font-medium outline-none w-full"
                  />
                </div>
              </div>
              {/* Type événement */}
              <div className="flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 flex-1 border-b border-gray-100 md:border-b-0">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</p>
                  <select
                    name="type"
                    value={typeEvenement}
                    onChange={(e) => setTypeEvenement(e.target.value)}
                    className="text-sm text-navy font-medium outline-none bg-transparent w-full"
                  >
                    <option value="">Tous</option>
                    <option value="WEI">WEI</option>
                    <option value="Soirée">Soirée</option>
                    <option value="Gala">Gala</option>
                    <option value="Séminaire">Séminaire</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>
              {/* Bouton */}
              <div className="px-3 py-3">
                <button
                  type="submit"
                  className="w-full md:w-auto bg-brand text-white font-bold px-6 py-3 rounded-xl hover:bg-brand/90 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  Rechercher
                </button>
              </div>
            </form>
          </MotionSection>
        </div>

        {/* Arrondi bas hero */}
        <div className="relative">
          <svg
            viewBox="0 0 1440 60"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full block"
            preserveAspectRatio="none"
            style={{ marginBottom: '-2px' }}
          >
            <path
              d="M0,0 C360,60 1080,60 1440,0 L1440,60 L0,60 Z"
              fill="#f9fafb"
            />
          </svg>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ────────────────────────────────────────────── */}
      <section id="comment-ca-marche" className="pt-16 pb-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              De la recherche à l&apos;événement, LINKHO simplifie chaque étape.
            </p>
          </div>
          {(() => {
            const steps = [
              {
                n: 1,
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                ),
                title: 'Trouvez votre lieu',
                desc: 'Filtrez parmi nos lieux partenaires vérifiés selon vos critères.',
              },
              {
                n: 2,
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                ),
                title: 'Vérifiez les disponibilités',
                desc: 'Envoyez une demande en quelques clics et obtenez une réponse rapide.',
              },
              {
                n: 3,
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                ),
                title: 'Réservez en toute sécurité',
                desc: 'Paiement sécurisé via virement SEPA, avec acompte puis solde.',
              },
              {
                n: 4,
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                ),
                title: "On s'occupe du reste",
                desc: "Transport, sécurité — notre équipe vous accompagne jusqu'à l'événement.",
              },
            ]
            return (
              <>
                {/* Mobile : grille 2 colonnes sans connecteurs */}
                <div className="grid grid-cols-2 gap-8 md:hidden">
                  {steps.map(({ n, icon, title, desc }, i) => (
                    <MotionSection key={n} direction="up" delay={i * 100} className="flex flex-col items-center text-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-md text-brand flex items-center justify-center">
                          {icon}
                        </div>
                        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shadow">
                          {n}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-navy">{title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                    </MotionSection>
                  ))}
                </div>

                {/* Desktop : flex avec connecteurs entre icônes */}
                <div className="hidden md:flex items-start justify-center gap-0">
                  {steps.map((step, i) => (
                    <div key={step.n} className="flex items-start">
                      <MotionSection direction="up" delay={i * 100} className="flex flex-col items-center text-center gap-4 w-44">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-white shadow-md text-brand flex items-center justify-center">
                            {step.icon}
                          </div>
                          <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shadow">
                            {step.n}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-navy">{step.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                      </MotionSection>

                      {i < steps.length - 1 && (
                        <div className="flex items-center h-16 flex-shrink-0">
                          <ConnectorLine delay={i * 150 + 200} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )
          })()}
        </div>
      </section>

      {/* ── LIEUX PARTENAIRES ────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-2">
                Nos lieux partenaires
              </h2>
              <p className="text-gray-500">
                Des espaces vérifiés pour tous vos événements étudiants.
              </p>
            </div>
            <Link
              href="/rechercher"
              className="hidden md:flex items-center gap-1.5 text-sm text-brand font-semibold hover:underline"
            >
              Voir tous les lieux
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {lieuxAffiches.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {lieuxAffiches.map((lieu, i) => (
                  <MotionSection key={lieu.id} direction="up" delay={i * 100}>
                    <Link
                      href={`/lieux/${lieu.id}`}
                      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 block"
                    >
                      <div className="relative h-52 bg-gray-100 overflow-hidden">
                        {lieu.photo ? (
                          <Image
                            src={lieu.photo}
                            alt={lieu.nom}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-navy/5 flex items-center justify-center">
                            <svg className="w-12 h-12 text-navy/20" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-navy text-base mb-1 group-hover:text-brand transition-colors">
                          {lieu.nom}
                        </h3>
                        {lieu.ville && (
                          <p className="text-sm text-gray-400 mb-4 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                            </svg>
                            {lieu.ville}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          {lieu.capacite_max != null && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                              </svg>
                              Jusqu&apos;à {lieu.capacite_max} pers.
                            </span>
                          )}
                          {lieu.prix_base != null && (
                            <span className="text-sm font-bold text-brand">
                              {lieu.prix_base.toLocaleString('fr-FR')} €
                              <span className="text-xs font-normal text-gray-400"> /nuit</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </MotionSection>
                ))}
              </div>
              <div className="mt-10 text-center md:hidden">
                <Link
                  href="/rechercher"
                  className="inline-flex items-center gap-2 bg-navy text-white font-semibold px-8 py-3 rounded-xl hover:bg-navy/90 transition-colors"
                >
                  Voir tous les lieux
                </Link>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-400 py-16">
              Aucun lieu disponible pour le moment. Revenez bientôt !
            </p>
          )}
        </div>
      </section>

      {/* ── AVIS LINKHO ──────────────────────────────────────────────────── */}
      {avisLinkho.length > 0 && (
        <section className="py-24 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
                Ce que disent nos BDE
              </h2>
              <p className="text-gray-500 text-lg">
                Ils nous ont fait confiance pour leurs événements.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {avisLinkho.map((a, i) => (
                <MotionSection key={a.id} direction="up" delay={i * 100} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-3">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, j) => (
                      <span key={j} className={`text-lg ${j < a.note ? 'text-brand' : 'text-gray-200'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  {a.commentaire && (
                    <p className="text-gray-600 text-sm leading-relaxed flex-1">
                      &ldquo;{a.commentaire}&rdquo;
                    </p>
                  )}
                  {a.bde && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-sm font-semibold text-navy">{a.bde.nom}</p>
                      {a.bde.ecole && <p className="text-xs text-gray-400">{a.bde.ecole}</p>}
                    </div>
                  )}
                </MotionSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section id="a-propos" className="py-24 px-6 bg-navy">
        <MotionSection direction="scale" className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à organiser un événement inoubliable ?
          </h2>
          <p className="text-white/60 mb-10 text-lg">
            Rejoignez des milliers d&apos;étudiants et simplifiez votre organisation dès
            maintenant.
          </p>
          <Link
            href="/rechercher"
            className="inline-flex items-center gap-2 bg-brand text-white font-bold px-10 py-4 rounded-xl hover:bg-brand/90 transition-colors text-base"
          >
            Commencer ma recherche
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </MotionSection>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#040e22] py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <Image
              src="/LOGO ENTIER VF FULL BLANC.svg"
              alt="LINKHO"
              width={140}
              height={44}
            />
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/rechercher" className="text-white/50 hover:text-white transition-colors">
                Rechercher un lieu
              </Link>
              <a href="#comment-ca-marche" className="text-white/50 hover:text-white transition-colors">
                Comment ça marche ?
              </a>
              <Link href="/register" className="text-white/50 hover:text-white transition-colors">
                Inscription
              </Link>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">© 2026 LINKHO. Tous droits réservés.</p>
            <div className="flex gap-6 text-sm text-white/30">
              <Link href="/mentions-legales" className="hover:text-white/60 transition-colors">
                Mentions légales
              </Link>
              <Link href="/cgu" className="hover:text-white/60 transition-colors">
                CGU
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
