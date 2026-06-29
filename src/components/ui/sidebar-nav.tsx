'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map(({ label, href, icon: Icon, badge }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'relative flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors',
              isActive
                ? 'text-white bg-white/10'
                : 'text-white/55 hover:text-white/90 hover:bg-white/5',
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand rounded-r-full" />
            )}
            <Icon size={16} strokeWidth={1.75} className="shrink-0" />
            <span className="truncate flex-1">{label}</span>
            {badge != null && badge > 0 && (
              <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
