'use client'

import {
  Home,
  Calendar,
  MessageSquare,
  Settings,
  Inbox,
  Bookmark,
  Search,
  UserCheck,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'
import { getUnreadCount } from '@/lib/actions/messages'
import { getPendingAccountsCount } from '@/lib/actions/admin'

type Space = 'bde' | 'etablissement' | 'admin'

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

const BASE_NAV: Record<Space, Omit<NavItem, 'badge'>[]> = {
  bde: [
    { label: 'Tableau de bord', href: '/bde/dashboard', icon: Home },
    { label: 'Événements', href: '/bde/evenements', icon: Calendar },
    { label: 'Messagerie', href: '/bde/messagerie', icon: MessageSquare },
    { label: 'Rechercher un lieu', href: '/rechercher', icon: Search },
    { label: 'Paramètres', href: '/bde/parametres', icon: Settings },
  ],
  etablissement: [
    { label: 'Tableau de bord', href: '/etablissement/dashboard', icon: Home },
    { label: 'Demandes', href: '/etablissement/demandes', icon: Inbox },
    { label: 'Messagerie', href: '/etablissement/messagerie', icon: MessageSquare },
    { label: 'Paramètres', href: '/etablissement/parametres', icon: Settings },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { label: 'Comptes à valider', href: '/admin/comptes', icon: UserCheck },
    { label: 'Réservations', href: '/admin/reservations', icon: Bookmark },
    { label: 'Messagerie', href: '/admin/messagerie', icon: MessageSquare },
    { label: 'Paramètres', href: '/admin/parametres', icon: Settings },
  ],
}

const SPACE_META: Record<Space, { roleLabel: string }> = {
  bde: { roleLabel: 'BDE' },
  etablissement: { roleLabel: 'Établissement' },
  admin: { roleLabel: 'Admin LINKHO' },
}

function getInitials(name: string) {
  const parts = name.split(/[\s@._-]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

type Props = {
  space: Space
  displayName: string
}

export function AppSidebar({ space, displayName }: Props) {
  const { roleLabel } = SPACE_META[space]
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [expanded, setExpanded] = useState(true)
  const initials = getInitials(displayName)

  useEffect(() => {
    const refresh = () => getUnreadCount().then(setUnread)
    refresh()
    const interval = setInterval(refresh, 30000)
    window.addEventListener('messages-read', refresh)
    return () => {
      clearInterval(interval)
      window.removeEventListener('messages-read', refresh)
    }
  }, [])

  useEffect(() => {
    if (space !== 'admin') return
    const refresh = () => getPendingAccountsCount().then(setPendingCount)
    refresh()
    const interval = setInterval(refresh, 60000)
    return () => clearInterval(interval)
  }, [space])

  const items: NavItem[] = BASE_NAV[space].map((item) => {
    if (item.href.includes('/messagerie')) return { ...item, badge: unread || undefined }
    if (space === 'admin' && item.href.includes('/comptes')) return { ...item, badge: pendingCount || undefined }
    return item
  })

  return (
    <aside
      className={`relative flex flex-col bg-navy h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out
        ${expanded ? 'w-60' : 'w-16'}`}
    >
      {/* Toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="absolute -right-3 top-7 z-10 w-6 h-6 rounded-full bg-navy border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-colors"
        aria-label={expanded ? 'Réduire la barre latérale' : 'Étendre la barre latérale'}
      >
        <ChevronRight size={12} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/10 shrink-0">
        {expanded ? (
          <Image src="/LOGO ENTIER VF BLANC.svg" alt="LINKHO" width={110} height={34} className="shrink-0" />
        ) : (
          <Image src="/SOUS LOGO V2.svg" alt="LINKHO" width={28} height={28} className="shrink-0" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col gap-0.5 px-2">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors relative
                  ${active ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.75} />
                <span
                  className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 overflow-hidden
                    ${expanded ? 'opacity-100' : 'opacity-0 w-0'}`}
                >
                  {item.label}
                </span>
                {item.badge != null && item.badge > 0 && (
                  <span
                    className={`absolute min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center
                      ${expanded ? 'right-3 top-1/2 -translate-y-1/2' : 'right-1 top-1'}`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Profil */}
      <div className="border-t border-white/10 p-3 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          {expanded && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate leading-none">{displayName}</p>
                <p className="text-[11px] text-white/40 mt-1 truncate">{roleLabel}</p>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-white/40 hover:text-white transition-colors p-1"
                  aria-label="Déconnexion"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
