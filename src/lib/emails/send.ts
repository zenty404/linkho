import { Resend } from 'resend'
import type { ReactElement } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)

const from = process.env.NODE_ENV === 'production'
  ? 'LINKHO <noreply@linkho.fr>'
  : 'LINKHO <onboarding@resend.dev>'

export async function sendEmail(to: string, subject: string, react: ReactElement) {
  try {
    await resend.emails.send({ from, to, subject, react })
  } catch (error) {
    console.error('[sendEmail] error:', error)
  }
}

export async function getBdeEmail(bdeId: string): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('bde_profiles')
      .select('user_id')
      .eq('id', bdeId)
      .single()
    if (!data?.user_id) return null
    const { data: authData } = await admin.auth.admin.getUserById(data.user_id)
    return authData.user?.email ?? null
  } catch {
    return null
  }
}

export async function getEtabEmail(etabId: string): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('etablissement_profiles')
      .select('user_id')
      .eq('id', etabId)
      .single()
    if (!data?.user_id) return null
    const { data: authData } = await admin.auth.admin.getUserById(data.user_id)
    return authData.user?.email ?? null
  } catch {
    return null
  }
}
