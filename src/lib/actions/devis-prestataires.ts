'use server'

import { createElement } from 'react'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, getBdeEmail } from '@/lib/emails/send'
import { DevisPrestataireBdeEmail } from '@/emails/devis-prestataire-bde'
import { yousignFetch, YOUSIGN_API_KEY, YOUSIGN_BASE_URL } from '@/lib/yousign'
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
  } catch {
    // silent
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

export async function initierSignatureYousign(
  devisId: string,
): Promise<ActionResult<{ signatureLink: string }>> {
  const supabase = await createClient()

  const { data: bdeId } = await supabase.rpc('get_bde_id')
  if (!bdeId) return { data: null, error: 'Profil BDE introuvable.' }

  const { data: dp } = await supabase
    .from('devis_prestataires')
    .select('id, evenement_id, statut, yousign_signature_request_id, yousign_signature_link, pdf_path, nom, type')
    .eq('id', devisId)
    .single()

  if (!dp) return { data: null, error: 'Devis prestataire introuvable.' }
  if (dp.statut !== 'en_attente') return { data: null, error: 'Ce devis ne peut plus être signé.' }

  const { data: evt } = await supabase
    .from('evenements')
    .select('bde_id')
    .eq('id', dp.evenement_id)
    .single()

  if (evt?.bde_id !== bdeId) return { data: null, error: 'Non autorisé.' }

  if (dp.yousign_signature_request_id && dp.yousign_signature_link) {
    return { data: { signatureLink: dp.yousign_signature_link }, error: null }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { data: null, error: 'Email utilisateur introuvable.' }

  const { data: bdeProfile } = await supabase
    .from('bde_profiles')
    .select('nom, ecole')
    .eq('id', bdeId)
    .maybeSingle()

  const firstName = 'BDE'
  const lastName = bdeProfile?.nom ?? 'Association'

  const adminClient = createAdminClient()
  const { data: pdfData } = await adminClient.storage
    .from('documents')
    .createSignedUrl(dp.pdf_path, 3600)

  if (!pdfData?.signedUrl) return { data: null, error: 'Impossible de récupérer le PDF.' }

  const pdfResponse = await fetch(pdfData.signedUrl)
  if (!pdfResponse.ok) return { data: null, error: 'Impossible de télécharger le PDF.' }
  const pdfBuffer = await pdfResponse.arrayBuffer()

  const typeLabel =
    dp.type === 'transport' ? 'Transport' : dp.type === 'securite' ? 'Sécurité' : 'Autre'

  try {
    // 1. Créer la signature request
    const sigRequest = await yousignFetch('/signature_requests', {
      method: 'POST',
      body: JSON.stringify({
        name: `Devis ${typeLabel} - ${dp.nom}`,
        delivery_mode: 'none',
      }),
    })
    const signatureRequestId = sigRequest.id as string

    // 2. Uploader le document dans cette signature request
    const multipart = new FormData()
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' })
    multipart.append('file', pdfBlob, `${dp.nom}.pdf`)
    multipart.append('nature', 'signable_document')

    const docResponse = await fetch(`${YOUSIGN_BASE_URL}/signature_requests/${signatureRequestId}/documents`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${YOUSIGN_API_KEY}` },
      body: multipart,
    })
    if (!docResponse.ok) {
      const errText = await docResponse.text()
      throw new Error(`YouSign document upload error ${docResponse.status}: ${errText}`)
    }
    const docResult = await docResponse.json()
    const documentId = docResult.id as string

    // 3. Ajouter le signer avec les champs
    const signerResult = await yousignFetch(`/signature_requests/${signatureRequestId}/signers`, {
      method: 'POST',
      body: JSON.stringify({
        info: { first_name: firstName, last_name: lastName, email: user.email, locale: 'fr' },
        signature_level: 'electronic_signature',
        signature_authentication_mode: 'no_otp',
        fields: [
          { type: 'signature', document_id: documentId, page: 1, x: 100, y: 700, width: 150, height: 50 },
        ],
      }),
    })
    const signerId = signerResult.id as string

    // 4. Activer
    await yousignFetch(`/signature_requests/${signatureRequestId}/activate`, { method: 'POST' })

    // 5. Récupérer le lien de signature via GET signer
    const signerDetails = await yousignFetch(
      `/signature_requests/${signatureRequestId}/signers/${signerId}`,
    )
    console.log('[YouSign] signer details:', JSON.stringify(signerDetails))
    const signatureLink = signerDetails.signature_link ?? signerDetails.signature_url ?? signerDetails.url

    if (!signatureLink) {
      return { data: null, error: 'Lien de signature introuvable dans la réponse YouSign.' }
    }

    const expiresAt: string | null = signerDetails?.expires_at ?? null

    await supabase
      .from('devis_prestataires')
      .update({
        yousign_signature_request_id: signatureRequestId,
        yousign_signer_id: signerId,
        yousign_signature_link: signatureLink,
        yousign_signature_link_expires_at: expiresAt,
      })
      .eq('id', devisId)

    return { data: { signatureLink }, error: null }
  } catch (err) {
    console.error('[YouSign] error:', err instanceof Error ? err.message : JSON.stringify(err))
    const message = err instanceof Error ? err.message : 'Erreur YouSign inconnue'
    return { data: null, error: message }
  }
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
