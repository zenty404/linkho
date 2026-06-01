'use client'

import Link from 'next/link'

export default function Navbar() {
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
        </div>
      </div>
    </nav>
  )
}
