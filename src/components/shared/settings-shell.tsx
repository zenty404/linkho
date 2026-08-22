'use client'

import type { ReactNode } from 'react'

export interface SettingsTab {
  id: string
  label: string
  icon: ReactNode
}

export function SettingsShell({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  children,
}: {
  title: string
  subtitle: string
  tabs: SettingsTab[]
  activeTab: string
  onTabChange: (id: string) => void
  children: ReactNode
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-navy">{title}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex gap-8 min-h-screen">
        <aside className="w-56 flex-shrink-0">
          <nav className="flex flex-col gap-1 sticky top-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  activeTab === tab.id
                    ? 'bg-navy text-white'
                    : 'text-navy/60 hover:text-navy hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col gap-6">{children}</div>
      </div>
    </div>
  )
}

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-navy mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-gray-400 mb-6">{subtitle}</p>}
      {!subtitle && <div className="mb-6" />}
      {children}
    </div>
  )
}

export const settingsInputCls =
  'w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none transition-colors focus:ring-2 focus:ring-brand/20 focus:border-brand'

export function SettingsSaveButton({
  pending,
  label = 'Enregistrer',
}: {
  pending: boolean
  label?: string
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-brand hover:bg-brand/90 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Enregistrement…' : label}
    </button>
  )
}

export function SettingsStateMessages({
  success,
  error,
}: {
  success: boolean
  error: string | null
}) {
  if (error)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
        {error}
      </div>
    )
  if (success)
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
        Modifications enregistrées.
      </div>
    )
  return null
}
