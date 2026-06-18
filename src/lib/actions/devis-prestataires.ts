'use server'

import { createElement } from 'react'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, getBdeEmail } from '@/lib/emails/send'
import { DevisPrestataireBdeEmail } from '@/emails/devis-prestataire-bde'
import type { ActionResult } from '@/lib/types/actions'

// ─── Dépôt admin ─────────────────────────────────────────────────────────────

export async function deposerDevisPrestataire(
  evenementId: string,
  type: 'transport' | 'securite' | 'autre',
  nom: string,
  montant: number | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { data: role } = await supabase.rpc('get_user_role')
  if (role !== 'admin') return { data: null, error: 'Non autorisé.' }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { data: null, error: 'Aucun fichier fourni.' }
  if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    return { data: null, error: 'Seuls les fichiers PDF sont acceptés.' }
  }
  if (file.size > 20 * 1024 * 1024) {
    return { data: null, error: 'Le fichier dépasse la limite de 20 Mo.' }
  }

  const sanitizedName = file.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')

  const path = `prestataires/${evenementId}/${type}-${Date.now()}_${sanitizedName}`

  const adminClient = createAdminClient()
  const { error: uploadError } = await adminClient.storage
    .from('documents')
    .upload(path, file, { upsert: false })

  if (uploadError) return { data: null, error: uploadError.message }

  const { error: insertError } = await supabase.from('devis_prestataires').insert({
    evenement_id: evenementId,
    type,
    nom,
    montant: montant ?? null,
    pdf_path: path,
    pdf_nom: file.name,
    statut: 'en_attente',
  })

  if (insertError) {
    // Nettoyage storage si l'insert échoue
    await adminClient.storage.from('documents').remove([path])
    return { data: null, error: insertError.message }
  }

  // Notification email BDE
  try {
    const { data: evt } = await supabase
      .from('evenements')
      .select('bde_id')
      .eq('id', evenementId)
      .single()

    if (evt?.bde_id) {
      const bdeEmail = await getBdeEmail(evt.bde_id)
      if (bdeEmail) {
        await sendEmail(
          bdeEmail,
          'Nouveau devis à consulter dans votre espace événement',
          createElement(DevisPrestataireBdeEmail, { type, nomPrestataire: nom, evenementId }),
        )
      }
    }
  } catch (e) {
    console.error('[deposerDevisPrestataire] email error:', e)
  }

  revalidatePath('/admin/reservations')
  revalidatePath('/bde/evenements')
  revalidatePath(`/bde/evenements/${evenementId}`)

  return { data: null, error: null }
}

// ─── Actions BDE (signer / refuser) ──────────────────────────────────────────

export async function signerDevisPrestataire(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const { data: bdeId } = await supabase.rpc('get_bde_id')
  if (!bdeId) return { data: null, error: 'Profil BDE introuvable.' }

  // Vérifier que le devis appartient à un événement du BDE connecté
  const { data: dp } = await supabase
    .from('devis_prestataires')
    .select('id, evenement_id, statut')
    .eq('id', id)
    .single()

  if (!dp) return { data: null, error: 'Devis prestataire introuvable.' }
  if (dp.statut !== 'en_attente') return { data: null, error: 'Ce devis ne peut plus être signé.' }

  const { data: evt } = await supabase
    .from('evenements')
    .select('bde_id')
    .eq('id', dp.evenement_id)
    .single()

  if (evt?.bde_id !== bdeId) return { data: null, error: 'Non autorisé.' }

  const { error } = await supabase
    .from('devis_prestataires')
    .update({ statut: 'signe', signe_le: new Date().toISOString() })
    .eq('id', id)

  if (error) return { data: null, error: error.message }

  revalidatePath(`/bde/evenements/${dp.evenement_id}`)
  return { data: null, error: null }
}

export async function refuserDevisPrestataire(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const { data: bdeId } = await supabase.rpc('get_bde_id')
  if (!bdeId) return { data: null, error: 'Profil BDE introuvable.' }

  const { data: dp } = await supabase
    .from('devis_prestataires')
    .select('id, evenement_id, statut')
    .eq('id', id)
    .single()

  if (!dp) return { data: null, error: 'Devis prestataire introuvable.' }
  if (dp.statut !== 'en_attente') return { data: null, error: 'Ce devis ne peut plus être refusé.' }

  const { data: evt } = await supabase
    .from('evenements')
    .select('bde_id')
    .eq('id', dp.evenement_id)
    .single()

  if (evt?.bde_id !== bdeId) return { data: null, error: 'Non autorisé.' }

  const { error } = await supabase
    .from('devis_prestataires')
    .update({ statut: 'refuse' })
    .eq('id', id)

  if (error) return { data: null, error: error.message }

  revalidatePath(`/bde/evenements/${dp.evenement_id}`)
  return { data: null, error: null }
}
