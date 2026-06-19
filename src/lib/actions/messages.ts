'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/supabase'
import type { ActionResult } from '@/lib/types/actions'

type MessageRow = Database['public']['Tables']['messages']['Row']

export type MessageWithMeta = MessageRow & {
  expediteurNom: string
  isOwn: boolean
}

export type ConversationItem = {
  demandeId: string | null
  interlocuteurNom: string
  interlocuteurRole: string
  evenementNom: string | null
  dernierMessage: string | null
  dateLastMessage: string | null
  nonLus: number
}

export type AdminSupportConversation = {
  userId: string
  userName: string
  userRole: string
  dernierMessage: string | null
  dateLastMessage: string | null
  nonLus: number
}

// ─── Lecture ─────────────────────────────────────────────────────────────────

export async function getUnreadCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('destinataire_id', user.id)
      .neq('expediteur_id', user.id)
      .eq('lu', false)
    return count ?? 0
  } catch { return 0 }
}

export async function getConversations(
  role: 'bde' | 'etablissement',
): Promise<ActionResult<ConversationItem[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Non authentifié.' }

  const conversations: ConversationItem[] = []
  let demandeIds: string[] = []

  function buildSubtitle(d: {
    type_evenement: string
    date_debut: string | null
    date_fin: string | null
  }): string | null {
    const type = d.type_evenement
      ? d.type_evenement.charAt(0).toUpperCase() + d.type_evenement.slice(1)
      : null
    const fmt = (s: string) => {
      const dt = new Date(s.includes('T') ? s : s + 'T12:00:00')
      return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`
    }
    const dateStr = d.date_debut
      ? `${fmt(d.date_debut)}${d.date_fin && d.date_fin !== d.date_debut ? ` → ${fmt(d.date_fin)}` : ''}`
      : null
    if (type && dateStr) return `${type} · ${dateStr}`
    return type ?? dateStr ?? null
  }

  if (role === 'bde') {
    const { data: bdeId } = await supabase.rpc('get_bde_id')
    if (bdeId) {
      const { data: demandes } = await supabase
        .from('demandes_devis')
        .select('id, type_evenement, date_debut, date_fin, etablissement:etablissement_profiles(nom)')
        .eq('bde_id', bdeId)
      if (demandes) {
        demandeIds = demandes.map((d) => d.id)
        const { data: msgs } = demandeIds.length
          ? await supabase
              .from('messages')
              .select('demande_id, contenu, created_at, lu, destinataire_id, expediteur_id')
              .in('demande_id', demandeIds)
              .order('created_at', { ascending: false })
          : { data: [] }
        for (const d of demandes) {
          const dm = (msgs ?? []).filter((m) => m.demande_id === d.id)
          const last = dm[0] ?? null
          conversations.push({
            demandeId: d.id,
            interlocuteurNom:
              (d.etablissement as { nom: string } | null)?.nom ?? 'Établissement',
            interlocuteurRole: 'etablissement',
            evenementNom: buildSubtitle(d),
            dernierMessage: last?.contenu ?? null,
            dateLastMessage: last?.created_at ?? null,
            nonLus: dm.filter((m) => m.destinataire_id === user.id && m.expediteur_id !== user.id && !m.lu).length,
          })
        }
      }
    }
  } else {
    const { data: etabId } = await supabase.rpc('get_etablissement_id')
    if (etabId) {
      const { data: demandes } = await supabase
        .from('demandes_devis')
        .select('id, type_evenement, date_debut, date_fin, bde:bde_profiles(nom)')
        .eq('etablissement_id', etabId)
      if (demandes) {
        demandeIds = demandes.map((d) => d.id)
        const { data: msgs } = demandeIds.length
          ? await supabase
              .from('messages')
              .select('demande_id, contenu, created_at, lu, destinataire_id, expediteur_id')
              .in('demande_id', demandeIds)
              .order('created_at', { ascending: false })
          : { data: [] }
        for (const d of demandes) {
          const dm = (msgs ?? []).filter((m) => m.demande_id === d.id)
          const last = dm[0] ?? null
          conversations.push({
            demandeId: d.id,
            interlocuteurNom: (d.bde as { nom: string } | null)?.nom ?? 'BDE',
            interlocuteurRole: 'bde',
            evenementNom: buildSubtitle(d),
            dernierMessage: last?.contenu ?? null,
            dateLastMessage: last?.created_at ?? null,
            nonLus: dm.filter((m) => m.destinataire_id === user.id && m.expediteur_id !== user.id && !m.lu).length,
          })
        }
      }
    }
  }

  // Support LINKHO
  const { data: supportMsgs } = await supabase
    .from('messages')
    .select('contenu, created_at, lu, destinataire_id, expediteur_id')
    .is('demande_id', null)
    .or(`expediteur_id.eq.${user.id},destinataire_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const lastSupport = supportMsgs?.[0] ?? null
  conversations.unshift({
    demandeId: null,
    interlocuteurNom: 'Support LINKHO',
    interlocuteurRole: 'admin',
    evenementNom: null,
    dernierMessage: lastSupport?.contenu ?? null,
    dateLastMessage: lastSupport?.created_at ?? null,
    nonLus: (supportMsgs ?? []).filter(
      (m) => m.destinataire_id === user.id && m.expediteur_id !== user.id && !m.lu,
    ).length,
  })

  const support = conversations[0]
  const rest = conversations.slice(1).sort((a, b) => {
    if (!a.dateLastMessage) return 1
    if (!b.dateLastMessage) return -1
    return (
      new Date(b.dateLastMessage).getTime() - new Date(a.dateLastMessage).getTime()
    )
  })
  return { data: [support, ...rest], error: null }
}

export async function getMessages(
  demandeId: string | null,
  userIdFilter?: string,
): Promise<ActionResult<MessageWithMeta[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Non authentifié.' }

  const targetUserId = userIdFilter ?? user.id

  let query = supabase.from('messages').select('*').order('created_at', { ascending: true })

  if (demandeId === null) {
    query = query
      .is('demande_id', null)
      .or(`expediteur_id.eq.${targetUserId},destinataire_id.eq.${targetUserId}`)
  } else {
    query = query.eq('demande_id', demandeId)
  }

  const { data: msgs, error } = await query
  if (error) return { data: null, error: error.message }

  const userIds = [...new Set((msgs ?? []).map((m) => m.expediteur_id))]

  // RLS sur users bloque la lecture des autres utilisateurs → requêter les tables
  // de profil directement pour tous les IDs sans passer par users.role
  const [{ data: bdeProfiles }, { data: etabProfiles }] = await Promise.all([
    userIds.length
      ? supabase.from('bde_profiles').select('user_id, nom').in('user_id', userIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase.from('etablissement_profiles').select('user_id, nom').in('user_id', userIds)
      : Promise.resolve({ data: [] }),
  ])

  const nameMap: Record<string, string> = {}
  for (const p of bdeProfiles ?? []) nameMap[p.user_id] = p.nom
  for (const p of etabProfiles ?? []) nameMap[p.user_id] = p.nom

  // Restants (admins) : fallback sur users (seul l'utilisateur courant est visible)
  const remaining = userIds.filter((id) => !nameMap[id])
  if (remaining.length) {
    const { data: admins } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', remaining)
    for (const u of admins ?? []) {
      nameMap[u.id] = u.full_name ?? u.email ?? 'Support LINKHO'
    }
  }

  const messages: MessageWithMeta[] = (msgs ?? []).map((msg) => ({
    ...msg,
    expediteurNom: nameMap[msg.expediteur_id] ?? 'Inconnu',
    isOwn: msg.expediteur_id === user.id,
  }))

  return { data: messages, error: null }
}

export async function getAdminSupportConversations(): Promise<
  ActionResult<AdminSupportConversation[]>
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Non authentifié.' }

  const { data: role } = await supabase.rpc('get_user_role')
  if (role !== 'admin') return { data: null, error: 'Non autorisé.' }

  const { data: msgs, error } = await supabase
    .from('messages')
    .select('expediteur_id, destinataire_id, contenu, created_at, lu')
    .is('demande_id', null)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  const nonAdminIds = [
    ...new Set(
      (msgs ?? [])
        .flatMap((m) => [m.expediteur_id, m.destinataire_id])
        .filter((id) => id !== user.id),
    ),
  ]

  const { data: usersData } = nonAdminIds.length
    ? await supabase
        .from('users')
        .select('id, full_name, email, role')
        .in('id', nonAdminIds)
    : { data: [] }

  const nonAdminUsers = (usersData ?? []).filter((u) => u.role !== 'admin')
  const usersMap = Object.fromEntries(nonAdminUsers.map((u) => [u.id, u]))

  const conversations: AdminSupportConversation[] = nonAdminUsers.map((u) => {
    const userMsgs = (msgs ?? []).filter(
      (m) => m.expediteur_id === u.id || m.destinataire_id === u.id,
    )
    const last = userMsgs[0] ?? null
    return {
      userId: u.id,
      userName: u.full_name ?? u.email,
      userRole: u.role,
      dernierMessage: last?.contenu ?? null,
      dateLastMessage: last?.created_at ?? null,
      nonLus: userMsgs.filter((m) => m.destinataire_id === user.id && !m.lu)
        .length,
    }
  })

  // Deduplicate (should already be unique but safety)
  void usersMap

  return {
    data: conversations.sort((a, b) => {
      if (!a.dateLastMessage) return 1
      if (!b.dateLastMessage) return -1
      return (
        new Date(b.dateLastMessage).getTime() -
        new Date(a.dateLastMessage).getTime()
      )
    }),
    error: null,
  }
}

// ─── Envoi ────────────────────────────────────────────────────────────────────

export async function sendMessage(
  demandeId: string | null,
  contenu: string,
  destinataireIdOverride?: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }
  if (!contenu.trim()) return { error: 'Contenu requis.' }

  let destinataireId = destinataireIdOverride ?? ''

  if (!destinataireId) {
    if (demandeId) {
      const { data: senderUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      const { data: demande } = await supabase
        .from('demandes_devis')
        .select('bde:bde_profiles(user_id), etablissement:etablissement_profiles(user_id)')
        .eq('id', demandeId)
        .single()
      if (senderUser?.role === 'bde') {
        destinataireId =
          (demande?.etablissement as { user_id: string } | null)?.user_id ?? ''
      } else {
        destinataireId =
          (demande?.bde as { user_id: string } | null)?.user_id ?? ''
      }
    } else {
      // Support — trouver un admin
      const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle()
      destinataireId = adminUser?.id ?? user.id
    }
  }

  if (!destinataireId) return { error: 'Destinataire introuvable.' }

  const { error } = await supabase.from('messages').insert({
    demande_id: demandeId,
    expediteur_id: user.id,
    destinataire_id: destinataireId,
    contenu: contenu.trim(),
  })

  if (error) return { error: error.message }

  revalidatePath('/bde/messagerie')
  revalidatePath('/etablissement/messagerie')
  revalidatePath('/admin/messagerie')
  return { error: null }
}

export async function markAsRead(demandeId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const admin = createAdminClient()

  const base = admin
    .from('messages')
    .update({ lu: true, lu_le: new Date().toISOString() }, { count: 'exact' })
    .eq('destinataire_id', user.id)
    .eq('lu', false)

  const { error, count } = demandeId === null
    ? await base.is('demande_id', null)
    : await base.eq('demande_id', demandeId)

  void error
  void count

  revalidatePath('/bde/messagerie')
  revalidatePath('/etablissement/messagerie')
  revalidatePath('/admin/messagerie')
}
