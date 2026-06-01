'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '@/lib/actions/auth'

type Props = {
  redirect: string
  action: string
}

export default function LoginForm({ redirect, action }: Props) {
  const [state, formAction, isPending] = useActionState(signIn, { error: null as string | null })

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-brand tracking-tight">LINKHO</h1>
        <p className="text-white/50 mt-2 text-sm">L&apos;événementiel étudiant, simplifié.</p>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-2xl">
        <h2 className="text-xl font-semibold text-navy mb-6">Se connecter</h2>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="redirect" value={redirect} />
          <input type="hidden" name="action" value={action} />

          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {state.error}
            </div>
          )}

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
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-brand hover:bg-brand-light text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
          >
            {isPending ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-brand font-medium hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}
