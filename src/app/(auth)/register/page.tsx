'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signUp } from '@/lib/actions/auth'

function GraduationCapIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18zM6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
      <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
    </svg>
  )
}

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signUp, { error: null as string | null })

  return (
    <div className="w-full max-w-sm">
      {/* Logo mobile uniquement */}
      <div className="lg:hidden mb-8 flex justify-center">
        <Image src="/LOGO PRINCIPAL.svg" alt="LINKHO" width={120} height={38} />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy mb-1.5">Créer votre compte</h1>
        <p className="text-gray-500 text-sm">Rejoignez la plateforme LINKHO en quelques secondes</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-7">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">1</div>
          <span className="text-xs font-semibold text-navy">Votre profil</span>
        </div>
        <div className="flex-1 h-px bg-gray-200 mx-1" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold flex-shrink-0">2</div>
          <span className="text-xs font-medium text-gray-400">Vos informations</span>
        </div>
      </div>

      <form action={formAction} className="space-y-5">
        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {state.error}
          </div>
        )}

        {/* Choix rôle */}
        <div>
          <p className="block text-sm font-medium text-navy mb-2.5">Je représente…</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer">
              <input
                type="radio"
                name="role"
                value="bde"
                required
                className="peer sr-only"
              />
              <div className="border-2 border-gray-200 rounded-xl p-4 text-center transition-all peer-checked:border-brand peer-checked:bg-brand/5 hover:border-gray-300 hover:bg-gray-50 h-full">
                <div className="flex justify-center mb-2.5 text-navy peer-checked:text-brand">
                  <GraduationCapIcon />
                </div>
                <p className="font-semibold text-sm text-navy">Je suis un BDE</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  J&apos;organise des événements — WEI, soirées, galas
                </p>
              </div>
            </label>

            <label className="cursor-pointer">
              <input
                type="radio"
                name="role"
                value="etablissement"
                className="peer sr-only"
              />
              <div className="border-2 border-gray-200 rounded-xl p-4 text-center transition-all peer-checked:border-brand peer-checked:bg-brand/5 hover:border-gray-300 hover:bg-gray-50 h-full">
                <div className="flex justify-center mb-2.5 text-navy">
                  <BuildingIcon />
                </div>
                <p className="font-semibold text-sm text-navy">Je propose un lieu</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Je mets mon établissement à disposition
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Séparateur visuel étape 2 */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400 font-medium">Vos informations</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-navy mb-1.5">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="votre@email.fr"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-navy mb-1.5">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-brand hover:bg-brand/90 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
        >
          {isPending ? 'Création en cours…' : 'Créer mon compte'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-brand font-semibold hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
