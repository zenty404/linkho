'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/public/navbar'
import Footer from '@/components/public/footer'
import { MotionSection } from '@/components/public/motion-section'
import { VerticalCutReveal } from '@/components/ui/vertical-cut-reveal'
import { Highlighter } from '@/components/ui/highlighter'
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
        viewport={{ once: false }}
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
                      src="/LOGO ENTIER VF BLANC.svg"
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
                    On a organisé nos propres WEI. On sait ce qui coince. Un seul endroit pour votre lieu, votre transport et vos animations.
                  </p>
                </MotionSection>
                <MotionSection direction="left" delay={200}>
                  <div className="flex flex-wrap gap-3">
                    {[
                      {
                        label: 'Prix transparents',
                        icon: (
                          <svg className="w-4 h-4 text-brand flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Zéro marge cachée',
                        icon: (
                          <svg className="w-4 h-4 text-brand flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Fait par des étudiants',
                        icon: (
                          <svg className="w-4 h-4 text-brand flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Tout en un seul endroit',
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
            viewBox="0 0 1440 100"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full block"
            preserveAspectRatio="none"
            style={{ marginBottom: '-2px' }}
          >
            <path
              d="M0,0 C360,100 1080,100 1440,0 L1440,100 L0,100 Z"
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
              De la recherche au jour J, on gère tout ce que les autres oublient.
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
                title: 'Transport, sécu, on négocie pour vous',
                desc: "On a les contacts. Vous avez les étudiants. On fait le reste.",
              },
            ]
            return (
              <>
                {/* Mobile : grille 2 colonnes sans connecteurs */}
                <div className="grid grid-cols-2 gap-8 md:hidden">
                  {steps.map(({ n, icon, title, desc }, i) => (
                    <MotionSection key={n} direction="up" delay={i * 100} className="flex flex-col items-center text-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-md text-navy flex items-center justify-center">
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
                          <div className="w-16 h-16 rounded-2xl bg-white shadow-md text-navy flex items-center justify-center">
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
                <Highlighter action="underline" color="#f49915" strokeWidth={2} isView={true}>Nos lieux partenaires</Highlighter>
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

      {/* ── À PROPOS ── */}
      <section id="a-propos" className="relative py-24 px-6 bg-gray-50 overflow-hidden">

        {/* SVG clip paths */}
        <svg className="absolute -top-[999px] -left-[999px] w-0 h-0">
          <defs>
            <clipPath id="clip-squiggle" clipPathUnits="objectBoundingBox">
              <path d="M0.434125 0.00538712C0.56323 -0.00218488 0.714575 -0.000607013 0.814404 0.00302954L0.802642 0.163537C0.813884 0.167475 0.824927 0.172002 0.835358 0.177236C0.869331 0.194281 0.909224 0.225945 0.90824 0.27348C0.907177 0.324883 0.858912 0.354946 0.822651 0.36933C0.857426 0.376783 0.894591 0.387558 0.925837 0.404287C0.968002 0.426862 1.00569 0.464702 0.999287 0.515878C0.993163 0.564818 0.950731 0.597642 0.904098 0.615682C0.88204 0.624216 0.858239 0.62992 0.834803 0.633808C0.858076 0.639299 0.881603 0.646639 0.90267 0.656757C0.946271 0.677698 0.986875 0.715485 0.978905 0.768037C0.972241 0.811979 0.93615 0.843109 0.895204 0.862035C0.858032 0.879217 0.815169 0.887544 0.778534 0.892219C0.704792 0.901628 0.614366 0.901003 0.535183 0.899176C0.508115 0.898551 0.482286 0.89779 0.45773 0.897065C0.404798 0.895504 0.357781 0.894117 0.317008 0.894657C0.301552 0.894862 0.289265 0.895348 0.279749 0.895976C0.251913 0.937168 0.226467 0.980907 0.216015 1L0 0.941216C0.0140558 0.915539 0.051354 0.851547 0.0902557 0.797766C0.118421 0.758828 0.1722 0.745373 0.200402 0.740217C0.168437 0.733484 0.134299 0.723597 0.105102 0.708076C0.0614715 0.684884 0.0263696 0.64687 0.0325498 0.596965C0.0385804 0.548267 0.0803829 0.515256 0.12709 0.496909C0.146901 0.489127 0.168128 0.483643 0.189242 0.479724C0.163739 0.476035 0.137977 0.471053 0.115188 0.463936C0.0874831 0.455285 0.00855855 0.424854 0.016569 0.357817C0.0231721 0.302559 0.0838593 0.276249 0.116031 0.266164C0.149646 0.255625 0.188201 0.2505 0.221821 0.247468C0.208809 0.243824 0.195905 0.239492 0.183801 0.234287C0.152543 0.220846 0.101565 0.189547 0.105449 0.136312C0.108467 0.0949629 0.144168 0.0682612 0.171101 0.0543099C0.197578 0.0405945 0.227933 0.032236 0.25348 0.0267029C0.305656 0.0154021 0.370636 0.00911076 0.434125 0.00538712Z" fill="black" />
            </clipPath>
            <clipPath id="clip-circle" clipPathUnits="objectBoundingBox">
              <path d="M0.911218 0.329658C0.917139 0.29671 0.914994 0.262818 0.904967 0.23088C0.894939 0.198941 0.877327 0.169906 0.853635 0.146256C0.829944 0.122605 0.800878 0.105043 0.768923 0.0950708C0.736967 0.0850983 0.703072 0.083012 0.670134 0.0889901C0.651042 0.0615242 0.625587 0.0390856 0.595943 0.0235895C0.566299 0.00809344 0.533346 0 0.499896 0C0.466446 0 0.433493 0.00809344 0.403849 0.0235895C0.374204 0.0390856 0.34875 0.0615242 0.329658 0.0889901C0.29675 0.0830893 0.262904 0.0852337 0.231005 0.0952406C0.199106 0.105248 0.1701 0.12282 0.14646 0.14646C0.12282 0.1701 0.105248 0.199106 0.0952406 0.231005C0.0852337 0.262904 0.0830893 0.29675 0.0889901 0.329658C0.0615242 0.34875 0.0390856 0.374204 0.0235895 0.403849C0.00809344 0.433493 0 0.466446 0 0.499896C0 0.533346 0.00809344 0.566299 0.0235895 0.595943C0.0390856 0.625587 0.0615242 0.651042 0.0889901 0.670134C0.0830405 0.703077 0.0851562 0.73697 0.0951563 0.768917C0.105156 0.800864 0.122744 0.829915 0.146414 0.853586C0.170085 0.877256 0.199136 0.894844 0.231083 0.904844C0.26303 0.914844 0.296923 0.916959 0.329866 0.91101C0.348958 0.938476 0.374413 0.960914 0.404057 0.97641C0.433701 0.991907 0.466654 1 0.500104 1C0.533554 1 0.566507 0.991907 0.596151 0.97641C0.625796 0.960914 0.65125 0.938476 0.670343 0.91101C0.70327 0.916921 0.737139 0.914776 0.769057 0.904759C0.800976 0.894741 0.829997 0.877149 0.853642 0.853483C0.877287 0.829818 0.894854 0.800782 0.904844 0.768854C0.914834 0.736927 0.916949 0.703056 0.91101 0.670134C0.938476 0.651042 0.960914 0.625587 0.97641 0.595943C0.991907 0.566299 1 0.533346 1 0.499896C1 0.466446 0.991907 0.433493 0.97641 0.403849C0.960914 0.374204 0.938476 0.34875 0.91101 0.329658H0.911218Z" fill="black" />
            </clipPath>
            <clipPath id="clip-star" clipPathUnits="objectBoundingBox">
              <path d="M0.830625 0.5C0.883908 0.453139 0.926579 0.395449 0.955787 0.330781C0.984995 0.266114 1.00007 0.195958 1 0.125C1 0.0918481 0.98683 0.0600539 0.963388 0.0366119C0.939946 0.0131698 0.908152 2.32816e-07 0.875 2.32816e-07C0.725625 2.32816e-07 0.591667 0.0654169 0.5 0.169375C0.453139 0.116092 0.395449 0.0734212 0.330781 0.0442131C0.266114 0.0150049 0.195958 -6.83243e-05 0.125 2.32816e-07C0.0918481 2.32816e-07 0.0600539 0.0131698 0.0366119 0.0366119C0.0131698 0.0600539 2.32816e-07 0.0918481 2.32816e-07 0.125C2.32816e-07 0.274375 0.0654169 0.408333 0.169375 0.5C0.116092 0.546861 0.0734212 0.604551 0.0442131 0.669219C0.0150049 0.733887 -6.83243e-05 0.804042 2.32816e-07 0.875C2.32816e-07 0.908152 0.0131698 0.939946 0.0366119 0.963388C0.0600539 0.98683 0.0918481 1 0.125 1C0.274375 1 0.408333 0.934583 0.5 0.830625C0.546861 0.883908 0.604551 0.926579 0.669219 0.955787C0.733887 0.984995 0.804042 1.00007 0.875 1C0.908152 1 0.939946 0.98683 0.963388 0.963388C0.98683 0.939946 1 0.908152 1 0.875C1 0.725625 0.934583 0.591667 0.830625 0.5Z" fill="black" />
            </clipPath>
          </defs>
        </svg>

        {/* Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#07163425_1px,transparent_1px),linear-gradient(to_bottom,#07163425_1px,transparent_1px)] bg-[size:70px_70px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_100%,#000_70%,transparent_110%)]" />

        {/* Contenu */}
        <div className="relative z-10 max-w-2xl mx-auto text-center mb-16">
          <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-6">L&apos;équipe</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy mb-6 flex flex-wrap justify-center items-center gap-x-3 leading-tight">
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.15}
              staggerFrom="first"
              transition={{ type: "spring", stiffness: 250, damping: 30, delay: 0.2 }}
              containerClassName="justify-center items-center leading-tight"
            >
              {"Prêts à organiser votre événement"}
            </VerticalCutReveal>
            <Highlighter action="underline" color="#f49915" strokeWidth={2} isView={true}>
              <VerticalCutReveal
                splitBy="words"
                staggerDuration={0.15}
                staggerFrom="first"
                transition={{ type: "spring", stiffness: 250, damping: 30, delay: 0.6 }}
                containerClassName="justify-center items-center leading-tight"
              >
                {"inoubliable ?"}
              </VerticalCutReveal>
            </Highlighter>
          </h2>
          <motion.p
            className="text-gray-500 text-lg mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            On est passés par là. On sait ce que c&apos;est : le stress du lieu, le transport, le budget. C&apos;est pour ça qu&apos;on a créé LINKHO.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <Link
              href="/rechercher"
              className="inline-flex items-center gap-2 bg-brand text-white font-bold px-8 py-4 rounded-full hover:bg-brand/90 transition-colors text-base shadow-lg"
            >
              Commencer ma recherche
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </motion.div>
        </div>

        {/* Grille photos équipe */}
        <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 h-64 md:h-80">
          {[
            { clip: "clip-squiggle", rotate: "rotate-6", delay: 0.3, img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80" },
            { clip: "clip-circle", rotate: "-rotate-6", delay: 0.5, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" },
            { clip: "clip-star", rotate: "-rotate-3", delay: 0.7, img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" },
            { clip: "clip-squiggle", rotate: "rotate-3", delay: 0.9, img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80" },
          ].map(({ clip, rotate, delay, img }, i) => (
            <motion.figure
              key={i}
              className="w-full h-full rounded-lg overflow-hidden"
              style={{ clipPath: `url(#${clip})` }}
              initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: false }}
              transition={{ delay, duration: 0.7 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="Équipe LINKHO" className={`object-cover w-full h-full ${rotate}`} />
            </motion.figure>
          ))}
        </div>
      </section>

      {/* ── ÉTABLISSEMENTS ── */}
      <section className="bg-navy py-24 px-6 overflow-hidden relative">

        {/* Décoration fond */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:70px_70px]" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">

            {/* Colonne gauche — texte */}
            <MotionSection direction="left">
              <div>
                <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-4">
                  Propriétaires &amp; gestionnaires
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
                  Vous proposez un lieu <Highlighter action="underline" color="#f49915" strokeWidth={2} isView={true}>événementiel ?</Highlighter>
                </h2>
                <p className="text-white/60 text-lg mb-10 leading-relaxed">
                  Des milliers de BDE cherchent leur prochain lieu chaque année. Soyez là quand ils cherchent.
                </p>

                {/* Arguments */}
                <ul className="space-y-4 mb-10">
                  {[
                    'Visibilité auprès de milliers de BDE',
                    'Réservations et paiements 100% sécurisés',
                    'Contrats signés électroniquement',
                    'Tableau de bord dédié pour gérer vos demandes',
                    'Accompagnement personnalisé',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-white/80 text-sm">
                      <div className="w-5 h-5 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-brand" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register?role=etablissement"
                  className="inline-flex items-center gap-2 bg-brand text-white font-bold px-8 py-4 rounded-xl hover:bg-brand/90 transition-colors"
                >
                  Référencer mon lieu
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </MotionSection>

            {/* Colonne droite — carte visuelle */}
            <MotionSection direction="right" delay={150}>
              <div className="relative">
                {/* Carte principale */}
                <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 border border-white/30">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-brand/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Domaine des Pins</p>
                      <p className="text-white/50 text-xs">Bordeaux · 120 pers.</p>
                    </div>
                  </div>

                  {/* Stats fictives */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { label: 'Demandes reçues', value: '24' },
                      { label: 'Réservations', value: '8' },
                      { label: 'Note moyenne', value: '4.9/5' },
                      { label: 'Revenus générés', value: '32 000 €' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/15 rounded-xl p-3">
                        <p className="text-white font-bold text-lg">{value}</p>
                        <p className="text-white/50 text-xs">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    Compte actif · Mis à jour aujourd&apos;hui
                  </div>
                </div>

                {/* Badge flottant */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-brand text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                >
                  🎓 3 nouvelles demandes
                </motion.div>
              </div>
            </MotionSection>

          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
