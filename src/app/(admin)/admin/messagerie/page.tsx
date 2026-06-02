'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/supabase'
import {
  getAdminSupportConversations,
  getMessages,
  sendMessage,
  markAsRead,
  type AdminSupportConversation,
  type MessageWithMeta,
} from '@/lib/actions/messages'

type MessageRow = Database['public']['Tables']['messages']['Row']

function fmtTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  return isToday
    ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function getInitials(name: string): string {
  const parts = name.split(/[\s@._-]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const ROLE_LABEL: Record<string, string> = {
  bde: 'BDE',
  etablissement: 'Établissement',
  admin: 'Admin',
}

function AdminMessagerieContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeUserId = searchParams.get('user')

  const [conversations, setConversations] = useState<AdminSupportConversation[]>([])
  const [messages, setMessages] = useState<MessageWithMeta[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeConv = conversations.find((c) => c.userId === activeUserId)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
    getAdminSupportConversations().then(({ data }) => {
      if (data) setConversations(data)
    })
  }, [])

  useEffect(() => {
    if (!activeUserId) return
    getMessages(null, activeUserId).then(({ data }) => {
      if (data) { setMessages(data); scrollToBottom() }
    })
    markAsRead(null)
  }, [activeUserId, scrollToBottom])

  useEffect(() => {
    if (!activeUserId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`messages-admin-support-${activeUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: 'demande_id=is.null' },
        (payload) => {
          const raw = payload.new as MessageRow
          if (raw.expediteur_id !== activeUserId && raw.destinataire_id !== activeUserId) return
          setMessages((prev) => [
            ...prev,
            {
              ...raw,
              expediteurNom: raw.expediteur_id === currentUserId ? 'Vous' : (activeConv?.userName ?? ''),
              isOwn: raw.expediteur_id === currentUserId,
            },
          ])
          scrollToBottom()
          getAdminSupportConversations().then(({ data }) => { if (data) setConversations(data) })
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeUserId, currentUserId, activeConv, scrollToBottom])

  async function handleSend() {
    if (!input.trim() || !activeUserId) return
    setSending(true)
    await sendMessage(null, input.trim(), activeUserId)
    setInput('')
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex h-full gap-0 rounded-xl overflow-hidden border border-gray-200 bg-white">
      {/* Liste conversations support */}
      <div className="w-72 shrink-0 flex flex-col border-r border-gray-100">
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="text-base font-bold text-navy">Support LINKHO</h1>
          <p className="text-xs text-gray-400 mt-0.5">Conversations avec les utilisateurs</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Aucun message de support</p>
          )}
          {conversations.map((conv) => {
            const isActive = conv.userId === activeUserId
            return (
              <button
                key={conv.userId}
                onClick={() => router.push(`/admin/messagerie?user=${conv.userId}`)}
                className={`w-full text-left px-4 py-3.5 flex items-start gap-3 border-b border-gray-50 transition-colors ${
                  isActive ? 'bg-navy text-white' : 'hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-navy/10 text-navy'
                  }`}
                >
                  {getInitials(conv.userName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-navy'}`}>
                      {conv.userName}
                    </p>
                    {conv.dateLastMessage && (
                      <span className={`text-[10px] shrink-0 ${isActive ? 'text-white/60' : 'text-gray-400'}`}>
                        {fmtTime(conv.dateLastMessage)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {ROLE_LABEL[conv.userRole] ?? conv.userRole}
                    </span>
                    <p className={`text-xs truncate flex-1 ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                      {conv.dernierMessage ?? 'Aucun message'}
                    </p>
                    {conv.nonLus > 0 && !isActive && (
                      <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                        {conv.nonLus}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Messages */}
      {!activeUserId ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">Sélectionnez une conversation</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-xs font-bold text-navy">
              {getInitials(activeConv?.userName ?? '')}
            </div>
            <div>
              <p className="font-semibold text-navy text-sm">{activeConv?.userName ?? '…'}</p>
              <p className="text-xs text-gray-400">{ROLE_LABEL[activeConv?.userRole ?? ''] ?? ''}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
            {messages.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Aucun message</p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.isOwn ? 'bg-brand text-navy rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.contenu}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 px-1">
                  {msg.isOwn ? 'Support LINKHO' : msg.expediteurNom} · {fmtTime(msg.created_at)}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Votre réponse… (Entrée pour envoyer)"
              className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="px-4 py-2.5 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminMessagingPage() {
  return (
    <div className="h-[calc(100vh-theme(spacing.6)*2-theme(spacing.14))]">
      <Suspense fallback={<div className="flex items-center justify-center h-full text-sm text-gray-400">Chargement…</div>}>
        <AdminMessagerieContent />
      </Suspense>
    </div>
  )
}
