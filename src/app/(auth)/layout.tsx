import Image from 'next/image'

const args = [
  'Trouvez votre lieu idéal parmi nos partenaires vérifiés',
  'Réservations et paiements 100% sécurisés',
  'Devis gratuits et réponse sous 48h',
  'Accompagnement personnalisé de A à Z',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Colonne gauche — navy */}
      <div className="hidden lg:flex w-[40%] bg-navy flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10">
          <Image
            src="/LOGO ENTIER VF FULL BLANC.svg"
            alt="LINKHO"
            width={140}
            height={44}
            priority
          />
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            L&apos;événementiel étudiant,{' '}
            <span className="text-brand">simplifié.</span>
          </h2>
          <p className="text-white/60 mb-8 leading-relaxed text-sm">
            La plateforme qui connecte les BDE avec les meilleurs lieux événementiels partout en France.
          </p>
          <ul className="space-y-3">
            {args.map((arg) => (
              <li key={arg} className="flex items-start gap-3 text-white/80 text-sm">
                <div className="w-5 h-5 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-brand" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                {arg}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <p className="text-white/30 text-xs">© 2026 LINKHO. Tous droits réservés.</p>
        </div>
      </div>

      {/* Colonne droite — formulaire */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 lg:p-16 min-h-screen">
        {children}
      </div>
    </div>
  )
}
