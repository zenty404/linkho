'use server'

import { createElement } from 'react'
import { revalidatePath } from 'next/cache'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/emails/send'
import { EtatDesLieuxBdeEmail } from '@/emails/etat-des-lieux-bde'
import { EtatDesLieuxPdf } from '@/lib/pdf/etat-des-lieux-pdf'
import { yousignFetch, YOUSIGN_API_KEY, YOUSIGN_BASE_URL } from '@/lib/yousign'
import type { ActionResult } from '@/lib/types/actions'

export type EtatDesLieux = {
  id: string
  reservation_id: string
  type: 'arrivee' | 'depart'
  statut: 'non_lance' | 'en_attente_signature' | 'signe'
  pdf_path: string | null
  yousign_signature_request_id: string | null
  yousign_bde_signer_id: string | null
  yousign_etab_signer_id: string | null
  yousign_bde_signature_link: string | null
  yousign_etab_signature_link: string | null
  bde_signe_le: string | null
  etab_signe_le: string | null
  commentaire: string | null
  created_at: string
  updated_at: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const edlTable = (client: any) => client.from('etats_des_lieux') as any

export async function lancerEtatDesLieux(
  reservationId: string,
  type: 'arrivee' | 'depart',
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()

  const { data: etablissementId } = await supabase.rpc('get_etablissement_id')
  if (!etablissementId) return { data: null, error: 'Profil établissement introuvable.' }

  const ACOMPTE_CONFIRME_STATUTS = ['acompte_confirme', 'confirmee', 'en_cours', 'terminee', 'commission_reversee']

  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, statut, bde_id, etablissement_id, demande_id, date_debut, date_fin')
    .eq('id', reservationId)
    .eq('etablissement_id', etablissementId)
    .single()

  if (!reservation) return { data: null, error: 'Réservation introuvable.' }
  if (!ACOMPTE_CONFIRME_STATUTS.includes(reservation.statut)) {
    return { data: null, error: "L'acompte doit être confirmé avant de lancer un état des lieux." }
  }

  const adminClient = createAdminClient()

  if (type === 'depart') {
    const { data: arrivee } = await edlTable(adminClient)
      .select('statut')
      .eq('reservation_id', reservationId)
      .eq('type', 'arrivee')
      .maybeSingle()

    if (!arrivee || arrivee.statut !== 'signe') {
      return {
        data: null,
        error: "L'état des lieux d'arrivée doit être entièrement signé avant de lancer l'état des lieux de départ.",
      }
    }
  }

  const { data: existing } = await edlTable(adminClient)
    .select('id')
    .eq('reservation_id', reservationId)
    .eq('type', type)
    .maybeSingle()

  if (existing) {
    const typeLabel = type === 'arrivee' ? "d'arrivée" : 'de départ'
    return { data: null, error: `L'état des lieux ${typeLabel} est déjà lancé.` }
  }

  const [{ data: bdeProfile }, { data: etabProfile }] = await Promise.all([
    supabase.from('bde_profiles').select('id, nom, user_id').eq('id', reservation.bde_id).single(),
    supabase.from('etablissement_profiles').select('nom, ville, user_id').eq('id', etablissementId).single(),
  ])

  if (!bdeProfile || !etabProfile) return { data: null, error: 'Profils introuvables.' }

  const [{ data: bdeAuth }, { data: etabAuth }] = await Promise.all([
    adminClient.auth.admin.getUserById(bdeProfile.user_id),
    adminClient.auth.admin.getUserById(etabProfile.user_id),
  ])

  const bdeEmail = bdeAuth.user?.email
  const etabEmail = etabAuth.user?.email
  if (!bdeEmail) return { data: null, error: 'Email BDE introuvable.' }
  if (!etabEmail) return { data: null, error: 'Email établissement introuvable.' }

  // Generate PDF
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(createElement(EtatDesLieuxPdf, {
    type,
    nomLieu: etabProfile.nom,
    villeLieu: etabProfile.ville ?? null,
    nomBde: bdeProfile.nom,
    nomEtab: etabProfile.nom,
    dateDebut: reservation.date_debut,
    dateFin: reservation.date_fin,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any)

  const pdfPath = `etats-des-lieux/${reservationId}/${type}-${Date.now()}.pdf`
  const { error: uploadError } = await adminClient.storage
    .from('documents')
    .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: false })

  if (uploadError) return { data: null, error: uploadError.message }

  const { data: edl, error: insertError } = await edlTable(adminClient)
    .insert({ reservation_id: reservationId, type, statut: 'en_attente_signature', pdf_path: pdfPath })
    .select('id')
    .single()

  if (insertError || !edl) {
    await adminClient.storage.from('documents').remove([pdfPath])
    return { data: null, error: insertError?.message ?? 'Erreur création état des lieux.' }
  }

  // YouSign: 2 signers
  try {
    const typeLabel = type === 'arrivee' ? 'Arrivée' : 'Départ'

    const sigRequest = await yousignFetch('/signature_requests', {
      method: 'POST',
      body: JSON.stringify({
        name: `État des lieux ${typeLabel} — ${etabProfile.nom}`,
        delivery_mode: 'none',
      }),
    })
    const signatureRequestId = sigRequest.id as string

    const multipart = new FormData()
    multipart.append('file', new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), `etat-des-lieux-${type}.pdf`)
    multipart.append('nature', 'signable_document')

    const docResponse = await fetch(`${YOUSIGN_BASE_URL}/signature_requests/${signatureRequestId}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${YOUSIGN_API_KEY}` },
      body: multipart,
    })
    if (!docResponse.ok) {
      throw new Error(`YouSign doc upload error ${docResponse.status}: ${await docResponse.text()}`)
    }
    const { id: documentId } = await docResponse.json()

    // BDE signer — signature zone gauche
    const bdeSignerResult = await yousignFetch(`/signature_requests/${signatureRequestId}/signers`, {
      method: 'POST',
      body: JSON.stringify({
        info: { first_name: 'BDE', last_name: bdeProfile.nom, email: bdeEmail, locale: 'fr' },
        signature_level: 'electronic_signature',
        signature_authentication_mode: 'no_otp',
        fields: [
          { type: 'signature', document_id: documentId, page: 1, x: 80, y: 680, width: 150, height: 50 },
        ],
      }),
    })

    // Établissement signer — signature zone droite
    const etabSignerResult = await yousignFetch(`/signature_requests/${signatureRequestId}/signers`, {
      method: 'POST',
      body: JSON.stringify({
        info: { first_name: 'Etablissement', last_name: etabProfile.nom, email: etabEmail, locale: 'fr' },
        signature_level: 'electronic_signature',
        signature_authentication_mode: 'no_otp',
        fields: [
          { type: 'signature', document_id: documentId, page: 1, x: 340, y: 680, width: 150, height: 50 },
        ],
      }),
    })

    await yousignFetch(`/signature_requests/${signatureRequestId}/activate`, { method: 'POST' })

    const [bdeSignerDetails, etabSignerDetails] = await Promise.all([
      yousignFetch(`/signature_requests/${signatureRequestId}/signers/${bdeSignerResult.id}`),
      yousignFetch(`/signature_requests/${signatureRequestId}/signers/${etabSignerResult.id}`),
    ])

    const bdeLien: string | null = bdeSignerDetails.signature_link ?? bdeSignerDetails.signature_url ?? null
    const etabLien: string | null = etabSignerDetails.signature_link ?? etabSignerDetails.signature_url ?? null

    await edlTable(adminClient)
      .update({
        yousign_signature_request_id: signatureRequestId,
        yousign_bde_signer_id: bdeSignerResult.id as string,
        yousign_etab_signer_id: etabSignerResult.id as string,
        yousign_bde_signature_link: bdeLien,
        yousign_etab_signature_link: etabLien,
      })
      .eq('id', edl.id)

    if (bdeLien) {
      await sendEmail(
        bdeEmail,
        `État des lieux ${typeLabel} à signer — ${etabProfile.nom}`,
        createElement(EtatDesLieuxBdeEmail, { type, nomLieu: etabProfile.nom, signatureLink: bdeLien }),
      )
    }
  } catch (err) {
    console.error('[YouSign] lancerEtatDesLieux:', err instanceof Error ? err.message : err)
    await adminClient.storage.from('documents').remove([pdfPath])
    await edlTable(adminClient).delete().eq('id', edl.id)
    const msg = err instanceof Error ? err.message : 'Erreur YouSign inconnue.'
    return { data: null, error: msg }
  }

  revalidatePath('/etablissement/demandes')
  if (reservation.demande_id) {
    revalidatePath(`/etablissement/demandes/${reservation.demande_id}`)
    const { data: evt } = await adminClient
      .from('evenements')
      .select('id')
      .eq('demande_id', reservation.demande_id)
      .maybeSingle()
    if (evt) {
      revalidatePath('/bde/evenements')
      revalidatePath(`/bde/evenements/${evt.id}`)
    }
  }

  return { data: { id: edl.id as string }, error: null }
}
