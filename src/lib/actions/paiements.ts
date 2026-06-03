'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/lib/types/actions'

export async function uploadJustificatif(
  paiementId: string,
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Non autorisé.' }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { data: null, error: 'Aucun fichier fourni.' }

  const sanitizedName = file.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')

  const path = `${paiementId}/${Date.now()}_${sanitizedName}`

  const { error: uploadError } = await adminClient.storage
    .from('justificatifs')
    .upload(path, file, { upsert: true })

  if (uploadError) return { data: null, error: uploadError.message }

  const { error: updateError } = await supabase
    .from('paiements')
    .update({ justificatif_url: path, justificatif_nom: file.name })
    .eq('id', paiementId)

  if (updateError) return { data: null, error: updateError.message }

  const { data: signedData } = await adminClient.storage
    .from('justificatifs')
    .createSignedUrl(path, 3600)

  return { data: { url: signedData?.signedUrl ?? '' }, error: null }
}

export async function getJustificatifUrl(paiementId: string): Promise<string | null> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: paiement } = await supabase
    .from('paiements')
    .select('justificatif_url')
    .eq('id', paiementId)
    .single()

  if (!paiement?.justificatif_url) return null

  const { data } = await adminClient.storage
    .from('justificatifs')
    .createSignedUrl(paiement.justificatif_url, 3600)

  return data?.signedUrl ?? null
}
