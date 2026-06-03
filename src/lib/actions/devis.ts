'use server'

import { redirect } from 'next/navigation'
import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/supabase'
import type { ActionResult } from '@/lib/types/actions'
import { sendEmail, getBdeEmail, getEtabEmail } from '@/lib/emails/send'
import { createAdminClient } from '@/lib/supabase/admin'
import { DevisRecuEmail } from '@/emails/devis-recu'
import { DevisRefuseEmail } from '@/emails/devis-refuse'
import { DevisAccepteEmail } from '@/emails/devis-accepte'

type Devis = Database['public']['Tables']['devis']['Row']
type DevisItem = Database['public']['Tables']['devis_items']['Row']
type DemandeDevis = Database['public']['Tables']['demandes_devis']['Row']

export type DevisWithItems = Devis & {
  items: DevisItem[]
  demande: DemandeDevis & {
    bde: Pick<Database['public']['Tables']['bde_profiles']['Row'], 'nom' | 'ecole'> | null
  }
  etablissement: Pick<
    Database['public']['Tables']['etablissement_profiles']['Row'],
    'nom' | 'ville'
  > | null
}

export type DevisAvecBde = Devis & {
  bde: { nom: string } | null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function recalculateSousTotal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  devisId: string,
) {
  const { data: rows } = await supabase
    .from('devis_items')
    .select('quantite, prix_unitaire')
    .eq('devis_id', devisId)

  const sousTotal = rows?.reduce((sum, r) => sum + r.quantite * r.prix_unitaire, 0) ?? 0
  await supabase.from('devis').update({ sous_total_ht: sousTotal }).eq('id', devisId)
  return sousTotal
}

// ─── Lecture ────────────────────────────────────────────────────────────────

export async function getDevisById(id: string): Promise<ActionResult<DevisWithItems>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('devis')
    .select(
      `*, items:devis_items(*), demande:demandes_devis(*, bde:bde_profiles(nom, ecole)), etablissement:etablissement_profiles(nom, ville)`,
    )
    .eq('id', id)
    .order('ordre', { referencedTable: 'devis_items', ascending: true })
    .single()

  if (error || !data) {
    console.error('getDevisById error:', error)
    return { data: null, error: error?.message ?? 'Devis introuvable.' }
  }

  return { data: data as unknown as DevisWithItems, error: null }
}

export async function getDevisByBde(): Promise<ActionResult<Devis[]>> {
  const supabase = await createClient()

  const { data: bdeId, error: rpcError } = await supabase.rpc('get_bde_id')
  if (rpcError || !bdeId) {
    console.error('get_bde_id error:', rpcError)
    return { data: null, error: 'Profil BDE introuvable.' }
  }

  const { data, error } = await supabase
    .from('devis')
    .select('*')
    .eq('bde_id', bdeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getDevisByBde error:', error)
    return { data: null, error: error.message }
  }

  return { data: data ?? [], error: null }
}

// ─── Création ───────────────────────────────────────────────────────────────

export async function createDevis(formData: FormData): Promise<ActionResult<Devis>> {
  const demande_id = formData.get('demande_id') as string
  const sous_total_ht = parseFloat(formData.get('sous_total_ht') as string)
  const message_client = (formData.get('message_client') as string) || null
  const item_libelle = (formData.get('item_libelle') as string).trim()
  const item_quantite = parseInt(formData.get('item_quantite') as string, 10) || 1
  const item_prix_unitaire = parseFloat(formData.get('item_prix_unitaire') as string)

  if (!demande_id || isNaN(sous_total_ht) || !item_libelle || isNaN(item_prix_unitaire)) {
    return { data: null, error: 'Tous les champs obligatoires sont requis.' }
  }

  const supabase = await createClient()

  const { data: etablissementId, error: rpcError } = await supabase.rpc('get_etablissement_id')
  if (rpcError || !etablissementId) {
    console.error('get_etablissement_id error:', rpcError)
    return { data: null, error: 'Profil établissement introuvable.' }
  }

  const { data: demande, error: demandeError } = await supabase
    .from('demandes_devis')
    .select('bde_id, date_debut, date_fin, nb_participants')
    .eq('id', demande_id)
    .single()

  if (demandeError || !demande) {
    console.error('Demande fetch error:', demandeError)
    return { data: null, error: 'Demande introuvable.' }
  }

  const { data: etablissement } = await supabase
    .from('etablissement_profiles')
    .select('commission_rate')
    .eq('id', etablissementId)
    .single()

  const commission_taux = etablissement?.commission_rate ?? 0

  const { data: devisData, error: devisError } = await supabase
    .from('devis')
    .insert({
      demande_id,
      bde_id: demande.bde_id,
      etablissement_id: etablissementId,
      date_evenement_debut: demande.date_debut,
      date_evenement_fin: demande.date_fin,
      nb_participants: demande.nb_participants,
      sous_total_ht,
      message_client,
      commission_taux,
      numero: '', // remplacé par le trigger generate_devis_numero
    })
    .select()
    .single()

  if (devisError || !devisData) {
    console.error('createDevis insert error:', devisError)
    return { data: null, error: devisError?.message ?? 'Erreur lors de la création du devis.' }
  }

  await supabase.from('devis_items').insert({
    devis_id: devisData.id,
    libelle: item_libelle,
    quantite: item_quantite,
    prix_unitaire: item_prix_unitaire,
    ordre: 1,
  })

  redirect(`/etablissement/devis/${devisData.id}`)
}

// ─── Mise à jour devis ──────────────────────────────────────────────────────

export async function updateDevis(
  id: string,
  formData: FormData,
): Promise<ActionResult<Devis>> {
  const message_client = (formData.get('message_client') as string) || null
  const rawSousTotal = parseFloat(formData.get('sous_total_ht') as string)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('devis')
    .update({
      message_client,
      ...(isNaN(rawSousTotal) ? {} : { sous_total_ht: rawSousTotal }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    console.error('updateDevis error:', error)
    return { data: null, error: error?.message ?? 'Erreur mise à jour devis.' }
  }

  return { data, error: null }
}

export async function envoyerDevis(id: string): Promise<ActionResult<Devis>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('devis')
    .update({ statut: 'envoye', envoye_le: new Date().toISOString() })
    .eq('id', id)
    .eq('statut', 'brouillon') // garde-fou
    .select()
    .single()

  if (error || !data) {
    console.error('envoyerDevis error:', error)
    return { data: null, error: error?.message ?? 'Impossible d\'envoyer le devis.' }
  }

  try {
    const admin = createAdminClient()
    const [{ data: etabCtx }, { data: evt }] = await Promise.all([
      supabase.from('etablissement_profiles').select('nom').eq('id', data.etablissement_id).single(),
      // evenements appartient au BDE — client admin pour bypasser RLS
      (admin.from('evenements') as any).select('id').eq('demande_id', data.demande_id).maybeSingle() as Promise<{ data: { id: string } | null }>,
    ])
    const bdeEmail = await getBdeEmail(data.bde_id)
    if (bdeEmail) {
      await sendEmail(
        bdeEmail,
        `Nouveau devis reçu — ${etabCtx?.nom ?? ''}`,
        createElement(DevisRecuEmail, {
          etabNom: etabCtx?.nom ?? '',
          montantTtc: data.total_ttc ?? 0,
          evenementId: evt?.id ?? '',
        }),
      )
    }
  } catch (e) {
    console.error('[envoyerDevis] email error:', e)
  }

  return { data, error: null }
}

// ─── Items ──────────────────────────────────────────────────────────────────

export async function addDevisItem(
  devisId: string,
  formData: FormData,
): Promise<ActionResult<DevisItem>> {
  const libelle = (formData.get('libelle') as string).trim()
  const description = (formData.get('description') as string) || null
  const quantite = parseInt(formData.get('quantite') as string, 10) || 1
  const prix_unitaire = parseFloat(formData.get('prix_unitaire') as string)

  if (!libelle || isNaN(prix_unitaire)) {
    return { data: null, error: 'Libellé et prix unitaire sont obligatoires.' }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('devis_items')
    .select('ordre')
    .eq('devis_id', devisId)
    .order('ordre', { ascending: false })
    .limit(1)

  const nextOrdre = (existing?.[0]?.ordre ?? 0) + 1

  const { data, error } = await supabase
    .from('devis_items')
    .insert({ devis_id: devisId, libelle, description, quantite, prix_unitaire, ordre: nextOrdre })
    .select()
    .single()

  if (error || !data) {
    console.error('addDevisItem error:', error)
    return { data: null, error: error?.message ?? 'Erreur ajout prestation.' }
  }

  await recalculateSousTotal(supabase, devisId)

  return { data, error: null }
}

export async function updateDevisItem(
  itemId: string,
  formData: FormData,
): Promise<ActionResult<DevisItem>> {
  const libelle = (formData.get('libelle') as string).trim()
  const description = (formData.get('description') as string) || null
  const quantite = parseInt(formData.get('quantite') as string, 10) || 1
  const prix_unitaire = parseFloat(formData.get('prix_unitaire') as string)

  if (!libelle || isNaN(prix_unitaire)) {
    return { data: null, error: 'Libellé et prix unitaire sont obligatoires.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('devis_items')
    .update({ libelle, description, quantite, prix_unitaire })
    .eq('id', itemId)
    .select()
    .single()

  if (error || !data) {
    console.error('updateDevisItem error:', error)
    return { data: null, error: error?.message ?? 'Erreur mise à jour prestation.' }
  }

  await recalculateSousTotal(supabase, data.devis_id)

  return { data, error: null }
}

export async function deleteDevisItem(itemId: string): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('devis_items')
    .select('devis_id')
    .eq('id', itemId)
    .single()

  const { error } = await supabase.from('devis_items').delete().eq('id', itemId)

  if (error) {
    console.error('deleteDevisItem error:', error)
    return { data: null, error: error.message }
  }

  if (item?.devis_id) {
    await recalculateSousTotal(supabase, item.devis_id)
  }

  return { data: null, error: null }
}

// ─── Établissement ──────────────────────────────────────────────────────────

export async function getDevisByEtablissement(): Promise<ActionResult<DevisAvecBde[]>> {
  const supabase = await createClient()

  const { data: etablissementId, error: rpcError } = await supabase.rpc('get_etablissement_id')
  if (rpcError || !etablissementId) {
    console.error('get_etablissement_id error:', rpcError)
    return { data: null, error: 'Profil établissement introuvable.' }
  }

  const { data, error } = await supabase
    .from('devis')
    .select('*, bde:bde_profiles(nom)')
    .eq('etablissement_id', etablissementId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getDevisByEtablissement error:', error)
    return { data: null, error: error.message }
  }

  return { data: (data ?? []) as unknown as DevisAvecBde[], error: null }
}

// ─── Actions BDE ─────────────────────────────────────────────────────────────

export async function accepterDevis(id: string): Promise<ActionResult<Devis>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('devis')
    .update({ statut: 'accepte' })
    .eq('id', id)
    .eq('statut', 'envoye') // garde-fou
    .select()
    .single()

  if (error || !data) {
    console.error('accepterDevis error:', error)
    return { data: null, error: error?.message ?? 'Impossible d\'accepter le devis.' }
  }

  try {
    const { data: bdeCtx } = await supabase
      .from('bde_profiles')
      .select('nom')
      .eq('id', data.bde_id)
      .single()
    const etabEmail = await getEtabEmail(data.etablissement_id)
    if (etabEmail) {
      await sendEmail(
        etabEmail,
        `Devis accepté — ${bdeCtx?.nom ?? 'BDE'}`,
        createElement(DevisAccepteEmail, {
          bdeNom: bdeCtx?.nom ?? 'BDE',
          montantTtc: data.total_ttc ?? 0,
          demandeId: data.demande_id ?? '',
        }),
      )
    }
  } catch (e) {
    console.error('[accepterDevis] email error:', e)
  }

  return { data, error: null }
}

export async function refuserDevis(id: string): Promise<ActionResult<Devis>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('devis')
    .update({ statut: 'refuse' })
    .eq('id', id)
    .eq('statut', 'envoye') // garde-fou
    .select()
    .single()

  if (error || !data) {
    console.error('refuserDevis error:', error)
    return { data: null, error: error?.message ?? 'Impossible de refuser le devis.' }
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: etabCtx } = await supabase
      .from('etablissement_profiles')
      .select('nom')
      .eq('id', data.etablissement_id)
      .single()
    if (user?.email) {
      await sendEmail(
        user.email,
        `Devis refusé — ${etabCtx?.nom ?? ''}`,
        createElement(DevisRefuseEmail, { etabNom: etabCtx?.nom ?? '' }),
      )
    }
  } catch (e) {
    console.error('[refuserDevis] email error:', e)
  }

  return { data, error: null }
}
