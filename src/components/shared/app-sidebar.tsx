'use client'

import {
  Home,
  Calendar,
  Users,
  FileText,
  CreditCard,
  MessageSquare,
  File,
  UsersRound,
  Settings,
  Building2,
  Inbox,
  Bookmark,
  Receipt,
  Star,
  Percent,
  Search,
  UserCheck,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { SidebarNav, type NavItem } from '@/components/ui/sidebar-nav'
import { signOut } from '@/lib/actions/auth'
import { getUnreadCount } from '@/lib/actions/messages'
import { getPendingAccountsCount } from '@/lib/actions/admin'

type Space = 'bde' | 'etablissement' | 'admin'

const BASE_NAV: Record<Space, NavItem[]> = {
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

const SPACE_META: Record<Space, { label: string; roleLabel: string }> = {
  bde: { label: 'ESPACE BDE', roleLabel: 'BDE' },
  etablissement: { label: 'ESPACE LIEU', roleLabel: 'Établissement' },
  admin: { label: 'ESPACE ADMIN', roleLabel: 'Admin LINKHO' },
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
  const { label: spaceLabel, roleLabel } = SPACE_META[space]
  const [unread, setUnread] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
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

  const items = BASE_NAV[space].map((item) => {
    if (item.href.includes('/messagerie')) return { ...item, badge: unread || undefined }
    if (space === 'admin' && item.href.includes('/comptes')) return { ...item, badge: pendingCount || undefined }
    return item
  })

  return (
    <aside className="w-[210px] bg-navy flex flex-col shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 pt-7 pb-4">
        <span className="text-xl font-bold">
          <span className="text-white">LIN</span>
          <span className="text-brand">KHO</span>
        </span>
      </div>

      {/* Space label */}
      <div className="px-5 pb-4">
        <span className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.12em]">
          {spaceLabel}
        </span>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 overflow-y-auto">
        <SidebarNav items={items} />
      </div>

      {/* Profile card */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-brand">
            <span className="text-xs font-semibold text-white">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate leading-none">{displayName}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{roleLabel}</p>
          </div>
          <ChevronRight size={14} className="text-white/25 shrink-0" />
        </div>

        <form action={signOut} className="mt-0.5">
          <button
            type="submit"
            className="flex items-center gap-2 w-full px-2 py-1.5 text-[11px] text-white/35 hover:text-white/60 transition-colors rounded-md"
          >
            <LogOut size={12} strokeWidth={1.75} />
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  )
}
