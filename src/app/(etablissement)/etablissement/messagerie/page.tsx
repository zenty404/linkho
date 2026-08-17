'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Send, Headphones } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/supabase'
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  type ConversationItem,
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

function MessagerieEmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full gap-6">
      <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: '#fdfdfd' }}>
        <Image
          src="/messaging-illustration.png"
          alt="Messagerie"
          width={280}
          height={280}
          className="object-contain translate-x-2"
        />
      </div>
      <div className="text-center">
        <p className="text-navy font-bold text-lg mb-1">{title}</p>
        <p className="text-gray-400 text-sm max-w-[220px] leading-relaxed">{subtitle}</p>
      </div>
    </div>
  )
}

function MessagerieContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const convParam = searchParams.get('conv')
  const activeConvId = convParam === 'support' ? null : (convParam ?? null)

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [messages, setMessages] = useState<MessageWithMeta[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeConv = conversations.find(
    (c) =>
      (activeConvId === null && c.demandeId === null) ||
      c.demandeId === activeConvId,
  )

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
    getConversations('etablissement').then(({ data }) => {
      if (data) setConversations(data)
    })
  }, [])

  useEffect(() => {
    if (convParam === null) return
    getMessages(activeConvId).then(({ data }) => {
      if (data) { setMessages(data); scrollToBottom() }
    })
    if (activeConvId !== undefined) {
      markAsRead(activeConvId).then(() => {
        window.dispatchEvent(new Event('messages-read'))
      })
      setConversations((prev) =>
        prev.map((c) => (c.demandeId === activeConvId ? { ...c, nonLus: 0 } : c)),
      )
    }
  }, [convParam, activeConvId, scrollToBottom])

  useEffect(() => {
    if (convParam === null) return
    const supabase = createClient()
    const channelKey = activeConvId ?? 'support'
    const channel = supabase
      .channel(`messages-etab-${channelKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: activeConvId
            ? `demande_id=eq.${activeConvId}`
            : 'demande_id=is.null',
        },
        (payload) => {
          const raw = payload.new as MessageRow
          if (
            activeConvId === null &&
            raw.expediteur_id !== currentUserId &&
            raw.destinataire_id !== currentUserId
          )
            return
          setMessages((prev) => [
            ...prev,
            {
              ...raw,
              expediteurNom: raw.expediteur_id === currentUserId ? 'Vous' : (activeConv?.interlocuteurNom ?? ''),
              isOwn: raw.expediteur_id === currentUserId,
            },
          ])
          scrollToBottom()
          getConversations('etablissement').then(({ data }) => { if (data) setConversations(data) })
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [convParam, activeConvId, currentUserId, activeConv, scrollToBottom])

  async function handleSend() {
    if (!input.trim() || convParam === null) return
    setSending(true)
    await sendMessage(activeConvId, input.trim())
    setInput('')
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  function selectConv(conv: ConversationItem) {
    router.push(`/etablissement/messagerie?conv=${conv.demandeId === null ? 'support' : conv.demandeId}`)
  }

  return (
    <div className="flex h-full gap-5">
      {/* Colonne gauche — conversations */}
      <div className="w-80 shrink-0 flex flex-col gap-4 min-h-0">
        {/* En-tête navy */}
        <div className="rounded-2xl bg-navy px-5 py-5 shadow-sm shrink-0">
          <h1 className="text-lg font-bold text-white">Messagerie</h1>
          <p className="text-xs text-white/60 mt-0.5">Discussions avec les BDE et le support</p>
        </div>

        {/* Liste */}
        <div className="flex-1 min-h-0 rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden flex flex-col">
          <div className="px-4 pt-4 pb-3 shrink-0">
            <span className="inline-flex items-center text-xs font-semibold text-brand bg-brand/10 px-3 py-1.5 rounded-full">
              Toutes ({conversations.length})
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Aucune conversation</p>
            )}
            {conversations.map((conv) => {
              const isActive =
                (conv.demandeId === null && convParam === 'support') ||
                conv.demandeId === activeConvId
              const isSupport = conv.demandeId === null
              const isUnread = conv.nonLus > 0 && !isActive
              return (
                <button
                  key={conv.demandeId ?? 'support'}
                  onClick={() => selectConv(conv)}
                  className={`w-full text-left px-4 py-3.5 flex items-start gap-3 border-b border-gray-50 last:border-b-0 transition-colors ${
                    isActive ? 'bg-navy' : isUnread ? 'bg-brand/5 hover:bg-brand/10' : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isActive ? 'bg-white/20 text-white' : isSupport ? 'bg-brand text-white' : 'bg-navy/10 text-navy'
                    }`}
                  >
                    {isSupport ? <Headphones size={16} /> : getInitials(conv.interlocuteurNom)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-navy'}`}>
                        {conv.interlocuteurNom}
                      </p>
                      {conv.dateLastMessage && (
                        <span className={`text-[11px] shrink-0 font-medium ${
                          isActive ? 'text-white/60' : isUnread ? 'text-brand' : 'text-gray-400'
                        }`}>
                          {fmtTime(conv.dateLastMessage)}
                        </span>
                      )}
                    </div>
                    {conv.evenementNom && (
                      <p className={`text-xs truncate mt-0.5 ${isActive ? 'text-white/55' : 'text-gray-400'}`}>
                        {conv.evenementNom}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className={`text-xs truncate flex-1 ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                        {conv.dernierMessage ?? 'Aucun message'}
                      </p>
                      {isUnread && (
                        <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-brand text-white text-[10px] font-bold rounded-full shrink-0">
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
      </div>

      {/* Colonne droite — messages */}
      <div className="flex-1 min-w-0 rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden flex flex-col">
        {convParam === null ? (
          <div className="flex-1">
            <MessagerieEmptyState
              title="Vos messages"
              subtitle="Sélectionnez une conversation pour commencer à échanger"
            />
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center text-xs font-bold text-navy">
                {activeConv?.demandeId === null ? <Headphones size={14} /> : getInitials(activeConv?.interlocuteurNom ?? '')}
              </div>
              <p className="font-semibold text-navy text-sm">{activeConv?.interlocuteurNom ?? '…'}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5 bg-gray-50/50">
              {messages.length === 0 && (
                <div className="flex-1">
                  <MessagerieEmptyState
                    title="Démarrez la conversation"
                    subtitle="Envoyez votre premier message ci-dessous"
                  />
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.isOwn ? 'bg-brand text-navy rounded-br-md' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
                    }`}
                  >
                    {msg.contenu}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 px-1">
                    {msg.isOwn ? 'Vous' : msg.expediteurNom} · {fmtTime(msg.created_at)}
                  </p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white shrink-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Votre message… (Entrée pour envoyer)"
                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-full outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-10 h-10 shrink-0 flex items-center justify-center bg-brand hover:bg-brand-light text-navy rounded-full transition-colors disabled:opacity-50"
                aria-label="Envoyer"
              >
                <Send size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function MessagingPage() {
  return (
    <div className="h-[calc(100vh-theme(spacing.6)*2-theme(spacing.14))]">
      <Suspense fallback={<div className="flex items-center justify-center h-full text-sm text-gray-400">Chargement…</div>}>
        <MessagerieContent />
      </Suspense>
    </div>
  )
}
