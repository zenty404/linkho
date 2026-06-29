'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signIn } from '@/lib/actions/auth'

type Props = {
  redirect: string
  action: string
}

export default function LoginForm({ redirect, action }: Props) {
  const [state, formAction, isPending] = useActionState(signIn, { error: null as string | null })

  return (
    <div className="w-full max-w-sm">
      {/* Logo mobile uniquement */}
      <div className="lg:hidden mb-8 flex justify-center">
        <Image src="/LOGO PRINCIPAL.svg" alt="LINKHO" width={120} height={38} />
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy mb-1.5">Bon retour !</h1>
        <p className="text-gray-500 text-sm">Connectez-vous à votre espace LINKHO</p>
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="redirect" value={redirect} />
        <input type="hidden" name="action" value={action} />

        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {state.error}
          </div>
        )}

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
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-brand hover:bg-brand/90 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-1"
        >
          {isPending ? 'Connexion en cours…' : 'Se connecter'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-brand font-semibold hover:underline">
          S&apos;inscrire
        </Link>
      </p>
    </div>
  )
}
