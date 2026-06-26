'use server'

import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/supabase'
import type { ActionResult } from '@/lib/types/actions'
import { sendEmail, getEtabEmail } from '@/lib/emails/send'
import { DevisRefuseEmail } from '@/emails/devis-refuse'
import { DevisAccepteEmail } from '@/emails/devis-accepte'

type Devis = Database['public']['Tables']['devis']['Row']

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
  }

  return { data, error: null }
}
