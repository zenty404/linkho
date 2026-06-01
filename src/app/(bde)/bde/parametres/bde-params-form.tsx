'use client'

import { useActionState } from 'react'
import { updateProfilBde } from '@/lib/actions/parametres'
import { PARAM_INIT } from '@/lib/types/params'
import { signOut } from '@/lib/actions/auth'
import type { Database } from '@/lib/types/supabase'

type BdeProfile = Database['public']['Tables']['bde_profiles']['Row']

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none transition-colors focus:ring-2 focus:ring-brand/20 focus:border-brand'

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-navy">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

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
  const [state, formAction, isPending] = useActionState(updateProfilBde, PARAM_INIT)

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div>
        <h1 className="text-lg font-bold text-navy">Paramètres</h1>
        <p className="text-sm text-gray-400 mt-0.5">Gérez votre profil et votre compte</p>
      </div>

      {/* Profil BDE */}
      <SectionCard title="Profil BDE">
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
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {state.error}
            </div>
          )}

          {state.success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3">
              Modifications enregistrées.
            </div>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 bg-brand hover:bg-brand-light text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Compte */}
      <SectionCard title="Compte">
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
                className="px-5 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
