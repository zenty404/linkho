'use client'

import Link from 'next/link'
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const role = session.user.user_metadata?.role as string
          setUser({ role })
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy shadow-lg">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-white">LIN</span>
          <span className="text-brand">KHO</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/rechercher"
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            Rechercher un lieu
          </Link>
          {user ? (
            <Link
              href={getDashboardUrl(user.role)}
              className="text-sm bg-brand hover:bg-brand-light text-navy font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Mon espace
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                className="text-sm bg-brand hover:bg-brand-light text-navy font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
