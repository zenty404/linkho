'use client'

import { useActionState, useState } from 'react'
import { updateProfilBde } from '@/lib/actions/parametres'
import { PARAM_INIT } from '@/lib/types/params'
import { signOut } from '@/lib/actions/auth'
import type { Database } from '@/lib/types/supabase'
import {
  SettingsShell,
  SectionCard,
  settingsInputCls,
  type SettingsTab,
} from '@/components/shared/settings-shell'

type BdeProfile = Database['public']['Tables']['bde_profiles']['Row']

const inputCls = settingsInputCls

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const ICONS = {
  profil: (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  ),
  compte: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
}

const TABS: SettingsTab[] = [
  { id: 'profil', label: 'Profil', icon: ICONS.profil },
  { id: 'compte', label: 'Compte', icon: ICONS.compte },
]

function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  required,
  readOnly,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string | null
  required?: boolean
  readOnly?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs text-gray-500 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        readOnly={readOnly}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        className={inputCls + (readOnly ? ' bg-gray-50 text-gray-400 cursor-not-allowed' : '')}
      />
    </div>
  )
}

interface Props {
  bde: BdeProfile | null
  email: string
}

export function BdeParamsForm({ bde, email }: Props) {
  const [activeTab, setActiveTab] = useState('profil')
  const [state, formAction, isPending] = useActionState(updateProfilBde, PARAM_INIT)

  return (
    <SettingsShell
      title="Paramètres"
      subtitle="Gérez votre profil et votre compte"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'profil' && (
        <SectionCard title="Profil BDE" subtitle="Les informations de votre BDE affichées à vos interlocuteurs">
          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Nom du BDE"
                name="nom"
                required
                defaultValue={bde?.nom}
                placeholder="BDE Centrale Paris"
              />
              <Field
                label="École / Université"
                name="ecole"
                required
                defaultValue={bde?.ecole}
                placeholder="Centrale Paris"
              />
              <Field
                label="Ville"
                name="ville"
                defaultValue={bde?.ville}
                placeholder="Paris"
              />
              <Field
                label="Téléphone"
                name="telephone"
                type="tel"
                defaultValue={bde?.telephone}
                placeholder="06 00 00 00 00"
              />
            </div>

            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {state.error}
              </div>
            )}

            {state.success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
                Modifications enregistrées.
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2.5 bg-brand hover:bg-brand/90 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {activeTab === 'compte' && (
        <SectionCard title="Compte" subtitle="Les informations de connexion associées à votre espace">
          <div className="space-y-5">
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Email</p>
              <p className="text-sm font-medium text-navy">{email}</p>
              <p className="text-xs text-gray-400 mt-1">L&apos;email ne peut pas être modifié ici.</p>
            </div>

            <div className="pt-1 border-t border-gray-100">
              <form action={signOut}>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                >
                  Se déconnecter
                </button>
              </form>
            </div>
          </div>
        </SectionCard>
      )}
    </SettingsShell>
  )
}
