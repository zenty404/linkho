'use client'

import { useActionState } from 'react'
import {
  creerProfilBde,
  creerProfilEtablissement,
  type OnboardingState,
} from '@/lib/actions/onboarding'

const INITIAL: OnboardingState = { error: null }

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none transition-colors focus:ring-2 focus:ring-brand/20 focus:border-brand'

function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
  hint,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  hint?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className={inputCls}
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

// ─── Formulaire BDE ──────────────────────────────────────────────────────────

export function BdeOnboardingForm() {
  const [state, formAction, isPending] = useActionState(creerProfilBde, INITIAL)

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {state.error}
        </div>
      )}

      <Field label="Nom du BDE" name="nom" required placeholder="BDE Centrale Paris" />
      <Field label="École / Université" name="ecole" required placeholder="Centrale Paris" />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Ville" name="ville" placeholder="Paris" />
        <Field label="Téléphone" name="telephone" type="tel" placeholder="06 00 00 00 00" />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 py-3 bg-brand hover:bg-brand-light text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending ? 'Création en cours…' : <>Commencer <span aria-hidden>→</span></>}
      </button>
    </form>
  )
}

// ─── Formulaire Établissement ─────────────────────────────────────────────────

export function EtabOnboardingForm() {
  const [state, formAction, isPending] = useActionState(creerProfilEtablissement, INITIAL)

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {state.error}
        </div>
      )}

      <Field label="Nom du lieu" name="nom" required placeholder="Château de la Loire" />
      <Field label="Adresse" name="adresse" required placeholder="12 rue des Vignes" />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Ville" name="ville" required placeholder="Bordeaux" />
        <Field label="Code postal" name="code_postal" placeholder="33000" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Capacité max" name="capacite_max" type="number" placeholder="200" />
        <Field label="Nb couchages" name="nb_couchages" type="number" placeholder="50" />
        <Field
          label="Prix de base (€)"
          name="prix_base"
          type="number"
          placeholder="1500"
          hint="par nuit ou événement"
        />
      </div>

      <Field
        label="IBAN"
        name="iban"
        placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
        hint="Pour recevoir les paiements LINKHO"
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Décrivez votre lieu en quelques phrases…"
          className={inputCls + ' resize-none'}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 py-3 bg-brand hover:bg-brand-light text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending ? 'Création en cours…' : <>Commencer <span aria-hidden>→</span></>}
      </button>
    </form>
  )
}
