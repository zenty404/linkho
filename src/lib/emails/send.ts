import { Resend } from 'resend'
import type { ReactElement } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, react: ReactElement) {
  try {
    await resend.emails.send({ from: 'LINKHO <noreply@linkho.fr>', to, subject, react })
  } catch {
    // silent — email failure must not crash callers
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
