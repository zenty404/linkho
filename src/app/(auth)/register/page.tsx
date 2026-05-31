'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signUp, { error: null as string | null })

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-brand tracking-tight">LINKHO</h1>
        <p className="text-white/50 mt-2 text-sm">L&apos;événementiel étudiant, simplifié.</p>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-2xl">
        <h2 className="text-xl font-semibold text-navy mb-6">Créer un compte</h2>

        <form action={formAction} className="space-y-5">
          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {state.error}
            </div>
          )}

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2.5">Je représente…</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="bde"
                  required
                  className="peer sr-only"
                />
                <div className="border-2 border-gray-200 rounded-xl p-4 text-center transition-colors peer-checked:border-brand peer-checked:bg-brand/5 hover:border-gray-300">
                  <p className="font-semibold text-sm text-navy">BDE</p>
                  <p className="text-xs text-gray-500 mt-1">Association étudiante</p>
                </div>
              </label>

              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="etablissement"
                  className="peer sr-only"
                />
                <div className="border-2 border-gray-200 rounded-xl p-4 text-center transition-colors peer-checked:border-brand peer-checked:bg-brand/5 hover:border-gray-300">
                  <p className="font-semibold text-sm text-navy">Établissement</p>
                  <p className="text-xs text-gray-500 mt-1">Lieu événementiel</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="votre@email.fr"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-brand hover:bg-brand-light text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {isPending ? 'Création en cours…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-brand font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
