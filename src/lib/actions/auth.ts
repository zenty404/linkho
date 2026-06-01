'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/supabase'

type UserRole = Database['public']['Tables']['users']['Row']['role']

export type AuthFormState = {
  error: string | null
}

function getDashboardUrl(role: UserRole): string {
  if (role === 'bde') return '/bde/dashboard'
  if (role === 'etablissement') return '/etablissement/dashboard'
  return '/admin/dashboard'
}

export async function signIn(
  prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = (formData.get('email') as string | null)?.trim()
  const password = formData.get('password') as string | null

  if (!email || !password) {
    return { error: 'Email et mot de passe requis.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return { error: 'Email ou mot de passe incorrect.' }
  }

  const redirectParam = (formData.get('redirect') as string | null) ?? ''
  const redirectUrl = redirectParam.startsWith('/') ? redirectParam : null

  const metaRole = data.user.user_metadata?.role as UserRole | undefined

  if (metaRole && ['bde', 'etablissement', 'admin'].includes(metaRole)) {
    redirect(redirectUrl ?? getDashboardUrl(metaRole))
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (!userData?.role) {
    return { error: 'Rôle utilisateur introuvable. Contactez le support.' }
  }

  redirect(redirectUrl ?? getDashboardUrl(userData.role as UserRole))
}

export async function signUp(
  prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = (formData.get('email') as string | null)?.trim()
  const password = formData.get('password') as string | null
  const role = formData.get('role') as string | null

  if (!email || !password || !role) {
    return { error: 'Tous les champs sont requis.' }
  }

  if (role !== 'bde' && role !== 'etablissement') {
    return { error: 'Rôle invalide.' }
  }

  if (password.length < 8) {
    return { error: 'Le mot de passe doit contenir au moins 8 caractères.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, full_name: '' },
    },
  })

  if (error) {
    console.error('Supabase signUp error:', error.message, error.status)
    const msg = error.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('user already exists')) {
      return { error: 'Un compte existe déjà avec cet email.' }
    }
    return { error: error.message }
  }

  redirect('/onboarding')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}