'use client'

import { usePathname } from 'next/navigation'

const ROUTE_TITLES: Record<string, string> = {
  // BDE
  '/bde/dashboard': 'Tableau de bord',
  '/bde/evenements': 'Événements',
  '/bde/inscriptions': 'Inscriptions',
  '/bde/formulaires': 'Formulaires',
  '/bde/paiements': 'Paiements',
  '/bde/communications': 'Communications',
  '/bde/documents': 'Documents',
  '/bde/membres': 'Membres',
  '/bde/parametres': 'Paramètres',
  // Établissement
  '/etablissement/dashboard': 'Tableau de bord',
  '/etablissement/lieux': 'Lieux',
  '/etablissement/calendrier': 'Calendrier',
  '/etablissement/demandes': 'Demandes',
  '/etablissement/devis': 'Devis',
  '/etablissement/reservations': 'Réservations',
  '/etablissement/factures': 'Factures',
  '/etablissement/messages': 'Messages',
  '/etablissement/avis': 'Avis',
  '/etablissement/parametres': 'Paramètres',
  // Admin
  '/admin/dashboard': 'Dashboard',
  '/admin/etablissements': 'Établissements',
  '/admin/bde': 'BDE',
  '/admin/reservations': 'Réservations',
  '/admin/commissions': 'Commissions',
  '/admin/parametres': 'Paramètres',
}

const SPACE_LABELS: Record<string, string> = {
  '/bde': 'Espace BDE',
  '/etablissement': 'Espace Lieu',
  '/admin': 'Espace Admin',
}

function getSpaceLabel(pathname: string) {
  const key = Object.keys(SPACE_LABELS).find((prefix) => pathname.startsWith(prefix))
  return key ? SPACE_LABELS[key] : 'LINKHO'
}

function getPageTitle(pathname: string) {
  const exact = ROUTE_TITLES[pathname]
  if (exact) return exact
  const prefix = Object.keys(ROUTE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((p) => pathname.startsWith(p + '/'))
  return prefix ? ROUTE_TITLES[prefix] : 'LINKHO'
}

export function DashboardHeader() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const spaceLabel = getSpaceLabel(pathname)

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-navy leading-none">{title}</h1>
        <p className="text-xs text-gray-400 mt-1">
          {spaceLabel} / {title}
        </p>
      </div>
    </header>
  )
}
