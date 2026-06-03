'use server'

import { revalidatePath } from 'next/cache'
import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/supabase'
import type { ActionResult } from '@/lib/types/actions'
import { sendEmail } from '@/lib/emails/send'
import { InscriptionConfirmeeEmail } from '@/emails/inscription-confirmee'

type Inscription = Database['public']['Tables']['inscriptions']['Row']
type InscriptionEcheance = Database['public']['Tables']['inscription_echeances']['Row']

export type InscriptionWithDetails = Inscription & {
  echeances: InscriptionEcheance[]
}

const SELECT_WITH_ECHEANCES = `*, echeances:inscription_echeances(*)`

// ─── Lecture ──────────────────────────────────────────────────────────────────

export async function getInscriptionsByEvenement(
  evenementId: string,
): Promise<ActionResult<InscriptionWithDetails[]>> {
  const supabase = await createClient()

  const { data: bdeId, error: rpcError } = await supabase.rpc('get_bde_id')
  if (rpcError || !bdeId) {
    console.error('get_bde_id error:', rpcError)
    return { data: null, error: 'Profil BDE introuvable.' }
  }

  const { data, error } = await supabase
    .from('inscriptions')
    .select(SELECT_WITH_ECHEANCES)
    .eq('evenement_id', evenementId)
    .eq('bde_id', bdeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getInscriptionsByEvenement error:', error)
    return { data: null, error: error.message }
  }

  return { data: (data ?? []) as unknown as InscriptionWithDetails[], error: null }
}

export async function getInscriptionsByFormulaire(
  formulaireId: string,
): Promise<ActionResult<InscriptionWithDetails[]>> {
  const supabase = await createClient()

  const { data: bdeId, error: rpcError } = await supabase.rpc('get_bde_id')
  if (rpcError || !bdeId) {
    console.error('get_bde_id error:', rpcError)
    return { data: null, error: 'Profil BDE introuvable.' }
  }

  const { data, error } = await supabase
    .from('inscriptions')
    .select(SELECT_WITH_ECHEANCES)
    .eq('formulaire_id', formulaireId)
    .eq('bde_id', bdeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getInscriptionsByFormulaire error:', error)
    return { data: null, error: error.message }
  }

  return { data: (data ?? []) as unknown as InscriptionWithDetails[], error: null }
}

export async function getInscriptionById(
  id: string,
): Promise<ActionResult<InscriptionWithDetails>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inscriptions')
    .select(SELECT_WITH_ECHEANCES)
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('getInscriptionById error:', error)
    return { data: null, error: error?.message ?? 'Inscription introuvable.' }
  }

  return { data: data as unknown as InscriptionWithDetails, error: null }
}

// ─── Statut ───────────────────────────────────────────────────────────────────

export async function updateStatutInscription(
  id: string,
  statut: 'validee' | 'annulee',
): Promise<ActionResult<Inscription>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inscriptions')
    .update({ statut })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    console.error('updateStatutInscription error:', error)
    return { data: null, error: error?.message ?? 'Erreur mise à jour statut.' }
  }

  revalidatePath('/bde/inscriptions')
  revalidatePath(`/bde/inscriptions/${id}`)
  return { data, error: null }
}

// ─── Échéances ────────────────────────────────────────────────────────────────

export async function ajouterEcheance(
  inscriptionId: string,
  formData: FormData,
): Promise<ActionResult<InscriptionEcheance>> {
  const supabase = await createClient()

  const montant = parseFloat(formData.get('montant') as string)
  const date_echeance = (formData.get('date_echeance') as string) || null

  if (isNaN(montant) || montant <= 0) {
    return { data: null, error: 'Montant invalide.' }
  }

  const { data: existing } = await supabase
    .from('inscription_echeances')
    .select('numero')
    .eq('inscription_id', inscriptionId)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  const numero = (existing?.numero ?? 0) + 1

  const { data, error } = await supabase
    .from('inscription_echeances')
    .insert({ inscription_id: inscriptionId, montant, date_echeance, numero })
    .select()
    .single()

  if (error || !data) {
    console.error('ajouterEcheance error:', error)
    return { data: null, error: error?.message ?? 'Erreur ajout échéance.' }
  }

  revalidatePath(`/bde/inscriptions/${inscriptionId}`)
  return { data, error: null }
}

export async function confirmerEcheance(
  echeanceId: string,
): Promise<ActionResult<InscriptionEcheance>> {
  const supabase = await createClient()

  const { data: echeance } = await supabase
    .from('inscription_echeances')
    .select('inscription_id')
    .eq('id', echeanceId)
    .single()

  const { data, error } = await supabase
    .from('inscription_echeances')
    .update({ paye: true, paye_le: new Date().toISOString() })
    .eq('id', echeanceId)
    .select()
    .single()

  if (error || !data) {
    console.error('confirmerEcheance error:', error)
    return { data: null, error: error?.message ?? 'Erreur confirmation échéance.' }
  }

  if (echeance?.inscription_id) {
    const { data: allEcheances } = await supabase
      .from('inscription_echeances')
      .select('paye')
      .eq('inscription_id', echeance.inscription_id)

    if (allEcheances && allEcheances.length > 0) {
      const payedCount = allEcheances.filter((e) => e.paye).length
      const statut_paiement =
        payedCount === allEcheances.length
          ? 'paye_total'
          : payedCount > 0
            ? 'partiel'
            : 'en_attente'

      await supabase
        .from('inscriptions')
        .update({ statut_paiement })
        .eq('id', echeance.inscription_id)
    }

    revalidatePath(`/bde/inscriptions/${echeance.inscription_id}`)
    revalidatePath('/bde/inscriptions')
  }

  return { data, error: null }
}

// ─── Marquage paiement total ─────────────────────────────────────────────────

export async function marquerPayeTotal(id: string): Promise<ActionResult<Inscription>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inscriptions')
    .update({ statut_paiement: 'paye_total', statut: 'validee' })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/bde/inscriptions')
  return { data, error: null }
}

// ─── Caution ──────────────────────────────────────────────────────────────────

export async function marquerCautionRecue(id: string): Promise<ActionResult<Inscription>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inscriptions')
    .update({ caution_payee: true })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    console.error('marquerCautionRecue error:', error)
    return { data: null, error: error?.message ?? 'Erreur.' }
  }

  revalidatePath('/bde/inscriptions')
  return { data, error: null }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exporterInscriptionsExcel(
  evenementId: string,
): Promise<ActionResult<string>> {
  const result = await getInscriptionsByEvenement(evenementId)
  if (result.error || !result.data) {
    return { data: null, error: result.error ?? 'Erreur export.' }
  }
  return { data: JSON.stringify(result.data), error: null }
}

// ─── Inscription publique ─────────────────────────────────────────────────────

export async function creerInscription(
  formulaireId: string,
  formData: FormData,
): Promise<ActionResult<Inscription>> {
  const supabase = await createClient()

  const { data: formulaire, error: formError } = await supabase
    .from('formulaire_inscriptions')
    .select('evenement_id, bde_id, prix_total, publie, caution_montant')
    .eq('id', formulaireId)
    .single()

  if (formError || !formulaire) {
    return { data: null, error: 'Formulaire introuvable.' }
  }

  if (!formulaire.publie) {
    return { data: null, error: "Ce formulaire n'est plus ouvert aux inscriptions." }
  }

  const prenom = (formData.get('prenom') as string)?.trim()
  const nom = (formData.get('nom') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()

  if (!prenom || !nom || !email) {
    return { data: null, error: 'Prénom, nom et email sont obligatoires.' }
  }

  const reponses: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    if (['prenom', 'nom', 'email'].includes(key)) continue
    if (reponses[key] !== undefined) {
      reponses[key] = Array.isArray(reponses[key])
        ? [...(reponses[key] as string[]), value as string]
        : [reponses[key] as string, value as string]
    } else {
      reponses[key] = value
    }
  }

  const { data, error } = await supabase
    .from('inscriptions')
    .insert({
      formulaire_id: formulaireId,
      evenement_id: formulaire.evenement_id,
      bde_id: formulaire.bde_id,
      prenom,
      nom,
      email,
      reponses: reponses as Database['public']['Tables']['inscriptions']['Insert']['reponses'],
      montant_total: formulaire.prix_total ?? 0,
      caution_montant: formulaire.caution_montant ?? null,
      statut: 'en_attente',
      statut_paiement: 'en_attente',
    })
    .select()
    .single()

  if (error || !data) {
    console.error('creerInscription error:', error)
    return { data: null, error: error?.message ?? "Erreur lors de l'inscription." }
  }

  try {
    const { data: evt } = await supabase
      .from('evenements')
      .select('nom, date_debut, date_fin')
      .eq('id', formulaire.evenement_id)
      .single()

    const lieuNom = ''

    await sendEmail(
      email,
      `Inscription confirmée — ${evt?.nom ?? 'événement'}`,
      createElement(InscriptionConfirmeeEmail, {
        evenementNom: evt?.nom ?? 'événement',
        dateDebut: evt?.date_debut ?? null,
        dateFin: evt?.date_fin ?? null,
        lieuNom,
        reponses: reponses as Record<string, unknown>,
      }),
    )
  } catch (e) {
    console.error('[creerInscription] email error:', e)
  }

  return { data, error: null }
}
