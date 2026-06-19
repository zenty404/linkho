import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/public/navbar'
import { getAvisLinkho } from '@/lib/actions/avis'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: lieux }, avisResult] = await Promise.all([
    supabase
      .from('etablissement_profiles')
      .select('id, nom, ville, capacite_max, prix_base, etablissement_photos(url, est_principale)')
      .eq('actif', true)
      .eq('visible', true)
      .limit(3),
    getAvisLinkho(),
  ])

  const avisLinkho = (avisResult.data ?? []).slice(0, 3)

  type LieuRow = NonNullable<typeof lieux>[number]
  type PhotoRow = { url: string; est_principale: boolean | null }

  function getPhoto(lieu: LieuRow): string | null {
    const photos = lieu.etablissement_photos as PhotoRow[] | null
    if (!photos?.length) return null
    return photos.find((p) => p.est_principale)?.url ?? photos[0].url
  }

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 pt-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            L&apos;événementiel étudiant,{' '}
            <span className="text-brand">simplifié.</span>
          </h1>
          <p className="text-lg text-white/70 mb-12 max-w-xl mx-auto">
            Trouvez, réservez et gérez vos lieux d&apos;événements en quelques clics.
            Conçu pour les BDE, fait pour les événements qui marquent.
          </p>

          {/* Search bar */}
          <form
            action="/rechercher"
            method="get"
            className="bg-white rounded-2xl p-4 flex flex-col md:flex-row gap-3 shadow-2xl"
          >
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-semibold text-navy/60 uppercase tracking-wider px-1">
                Ville
              </label>
              <input
                name="ville"
                type="text"
                placeholder="Paris, Lyon…"
                className="text-navy text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-brand"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-semibold text-navy/60 uppercase tracking-wider px-1">
                Date de début
              </label>
              <input
                name="date_debut"
                type="date"
                className="text-navy text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-brand"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-semibold text-navy/60 uppercase tracking-wider px-1">
                Date de fin
              </label>
              <input
                name="date_fin"
                type="date"
                className="text-navy text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-brand"
              />
            </div>
            <div className="w-full md:w-36 flex flex-col gap-1">
              <label className="text-xs font-semibold text-navy/60 uppercase tracking-wider px-1">
                Participants
              </label>
              <input
                name="participants"
                type="number"
                min={1}
                placeholder="50"
                className="text-navy text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-brand"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full md:w-auto bg-brand hover:bg-brand-light text-navy font-bold px-8 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                Rechercher
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-navy text-center mb-16">
            Comment ça marche
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: '01',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                ),
                title: 'Trouvez votre lieu',
                desc: 'Parcourez des centaines de salles, chalets et espaces événementiels adaptés à vos envies et votre budget.',
              },
              {
                step: '02',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                ),
                title: 'Demandez un devis',
                desc: 'Envoyez votre demande directement à l\'établissement. Recevez une réponse sous 48h avec tous les détails.',
              },
              {
                step: '03',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                ),
                title: 'Profitez de votre événement',
                desc: 'Gérez tout depuis votre tableau de bord BDE : paiement, état des lieux, suivi — sans stress.',
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                  {icon}
                </div>
                <span className="text-xs font-bold text-brand tracking-widest">{step}</span>
                <h3 className="text-lg font-bold text-navy">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIEUX MIS EN AVANT */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-navy">Lieux mis en avant</h2>
            <Link
              href="/rechercher"
              className="text-sm text-brand font-semibold hover:underline"
            >
              Voir tous les lieux →
            </Link>
          </div>

          {lieux && lieux.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {lieux.map((lieu) => {
                const photo = getPhoto(lieu)
                return (
                  <Link
                    key={lieu.id}
                    href={`/lieux/${lieu.id}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
                  >
                    <div className="relative h-48 bg-navy-light overflow-hidden">
                      {photo ? (
                        <Image
                          src={photo}
                          alt={lieu.nom}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
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
                        <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                          {lieu.ville}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        {lieu.capacite_max != null && (
                          <span className="text-xs text-gray-500">
                            Jusqu&apos;à <strong className="text-navy">{lieu.capacite_max}</strong> pers.
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
                )
              })}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-16">
              Aucun lieu disponible pour le moment. Revenez bientôt !
            </p>
          )}
        </div>
      </section>

      {/* AVIS LINKHO */}
      {avisLinkho.length > 0 && (
        <section className="py-24 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-navy text-center mb-16">
              Ce que disent nos BDE
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {avisLinkho.map((a) => (
                <div key={a.id} className="bg-gray-50 rounded-2xl p-6 flex flex-col gap-3">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`text-xl ${i < a.note ? 'text-brand' : 'text-gray-300'}`}>★</span>
                    ))}
                  </div>
                  {a.commentaire && (
                    <p className="text-gray-600 text-sm leading-relaxed flex-1">&ldquo;{a.commentaire}&rdquo;</p>
                  )}
                  {a.bde && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-sm font-semibold text-navy">{a.bde.nom}</p>
                      {a.bde.ecole && <p className="text-xs text-gray-400">{a.bde.ecole}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA ÉTABLISSEMENT */}
      <section className="py-24 px-6 bg-navy">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Vous proposez un lieu événementiel ?
          </h2>
          <p className="text-white/60 mb-10 text-lg">
            Rejoignez LINKHO et donnez de la visibilité à votre espace auprès de
            milliers d&apos;associations étudiantes.
          </p>
          <Link
            href="/register?role=etablissement"
            className="inline-block bg-brand hover:bg-brand-light text-navy font-bold px-10 py-4 rounded-xl transition-colors text-base"
          >
            Rejoindre LINKHO
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-navy-light py-10 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">
              <span className="text-white">LIN</span>
              <span className="text-brand">KHO</span>
            </span>
            <span className="text-white/40 text-sm">© 2026 LINKHO</span>
          </div>
          <div className="flex gap-6 text-sm text-white/50">
            <Link href="/mentions-legales" className="hover:text-white transition-colors">
              Mentions légales
            </Link>
            <Link href="/cgu" className="hover:text-white transition-colors">
              CGU
            </Link>
          </div>
        </div>
      </footer>
    </>
  )
}
