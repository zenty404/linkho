'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function getDashboardUrl(role: string): string {
  if (role === 'bde') return '/bde/dashboard'
  if (role === 'etablissement') return '/etablissement/dashboard'
  if (role === 'admin') return '/admin/dashboard'
  return '/bde/dashboard'
}

export default function Navbar() {
  const [user, setUser] = useState<null | { role: string }>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const role = session.user.user_metadata?.role as string
        setUser({ role })
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const role = session.user.user_metadata?.role as string
        setUser({ role })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white shadow-lg rounded-full px-4 md:px-6 h-14 flex items-center gap-3 md:gap-6 border border-gray-100 w-[calc(100vw-2rem)] max-w-[860px]">
      {/* Logo */}
      <Link href="/" className="flex items-center flex-shrink-0">
        <Image
          src="/LOGO PRINCIPAL.svg"
          alt="LINKHO"
          width={100}
          height={30}
          priority
        />
      </Link>

      {/* Nav links — uniquement sur lg+ */}
      <div className="hidden lg:flex items-center gap-5 flex-shrink-0">
        <Link
          href="/rechercher"
          className="text-sm text-navy/70 hover:text-navy font-medium transition-colors"
        >
          Rechercher
        </Link>
        <a
          href="#comment-ca-marche"
          className="text-sm text-navy/70 hover:text-navy font-medium transition-colors"
        >
          Comment ça marche ?
        </a>
        <a
          href="#a-propos"
          className="text-sm text-navy/70 hover:text-navy font-medium transition-colors"
        >
          À propos
        </a>
      </div>

      {/* Séparateur flexible */}
      <div className="flex-1" />

      {/* Boutons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {user ? (
          <Link
            href={getDashboardUrl(user.role)}
            className="text-xs md:text-sm bg-brand text-white font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full hover:bg-brand/90 transition-colors whitespace-nowrap"
          >
            Mon espace
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="text-xs md:text-sm text-navy font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-navy/20 hover:bg-navy/5 transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">Connexion</span>
              <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </Link>
            <Link
              href="/register"
              className="text-xs md:text-sm bg-brand text-white font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full hover:bg-brand/90 transition-colors whitespace-nowrap"
            >
              Inscription
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
