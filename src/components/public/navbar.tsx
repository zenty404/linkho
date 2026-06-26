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
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white shadow-lg rounded-full px-6 h-14 flex items-center gap-8 border border-gray-100 whitespace-nowrap">
      <Link href="/" className="flex items-center flex-shrink-0">
        <Image
          src="/LOGO PRINCIPAL.svg"
          alt="LINKHO"
          width={100}
          height={30}
          priority
        />
      </Link>

      <div className="hidden md:flex items-center gap-6">
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

      <div className="flex items-center gap-2">
        {user ? (
          <Link
            href={getDashboardUrl(user.role)}
            className="text-sm bg-brand text-white font-bold px-4 py-2 rounded-full hover:bg-brand/90 transition-colors"
          >
            Mon espace
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm text-navy font-semibold px-4 py-2 rounded-full border border-navy/20 hover:bg-navy/5 transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="text-sm bg-brand text-white font-bold px-4 py-2 rounded-full hover:bg-brand/90 transition-colors"
            >
              Inscription
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
