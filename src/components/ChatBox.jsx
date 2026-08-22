import { useState, useEffect, useRef } from 'react'
import { isSupabaseConfigured, getSupabaseClient } from '../lib/supabaseClient'
import { Send, MessageCircle, X } from 'lucide-react'

export default function ChatBox({ eventId, eventToken = null, personalToken = null, senderName, senderRole, guestId = null, filterGuestId = null, isOpen, onClose, chatTitle = 'Chat' }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const channelRef = useRef(null)

  const client = isSupabaseConfigured
    ? getSupabaseClient(eventToken, personalToken)
    : null

  // Marcar como leído al abrir el chat, o cuando lleguen mensajes nuevos y esté abierto
  useEffect(() => {
    if (!eventId || !isOpen) return

    const markAsRead = async () => {
      const readGuestId = filterGuestId || guestId
      if (!readGuestId) return

      const now = new Date().toISOString()

      if (isSupabaseConfigured && client) {
        await client
          .from('chat_read_status')
          .upsert({
            event_id: eventId,
            guest_id: readGuestId,
            last_read_at: now
          }, { onConflict: 'event_id,guest_id' })
      } else {
        const key = `petone_mock_read_status_${eventId}`
        const stored = JSON.parse(localStorage.getItem(key) || '{}')
        stored[readGuestId] = now
        localStorage.setItem(key, JSON.stringify(stored))
      }
    }

    markAsRead()
  }, [eventId, isOpen, filterGuestId, guestId, messages.length, client])

  // Cargar mensajes + suscribirse a tiempo real (filtrado por guest_id)
  useEffect(() => {
    if (!eventId || !isOpen) return

    // Resetear mensajes al abrir un chat diferente
    setMessages([])

    if (isSupabaseConfigured && client) {
      const fetchMessages = async () => {
        let query = client
          .from('messages')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: true })
          .limit(100)

        // Filtrar por guest_id si se especifica (chat privado)
        if (filterGuestId) {
          query = query.eq('guest_id', filterGuestId)
        }

        const { data, error } = await query
        if (!error && data) setMessages(data)
      }

      fetchMessages()

      // Suscribirse a nuevos mensajes
      const channelName = filterGuestId ? `chat-${eventId}-${filterGuestId}` : `chat-${eventId}`
      const channel = client
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `event_id=eq.${eventId}` },
          (payload) => {
            // Si hay filtro de guest_id, solo mostrar mensajes de ese guest
            if (filterGuestId && payload.new.guest_id !== filterGuestId) return
            setMessages(prev => {
              if (prev.find(m => m.id === payload.new.id)) return prev
              return [...prev, payload.new]
            })
          }
        )
        .subscribe()

      channelRef.current = channel

      return () => {
        if (channelRef.current) {
          client.removeChannel(channelRef.current)
        }
      }
    } else {
      // LOCAL DEMO MODE: localStorage
      const storageKey = `petone_mock_messages_${eventId}`
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const all = JSON.parse(stored)
        const filtered = filterGuestId ? all.filter(m => m.guest_id === filterGuestId) : all
        setMessages(filtered)
      }

      const interval = setInterval(() => {
        const updated = localStorage.getItem(storageKey)
        if (updated) {
          const all = JSON.parse(updated)
          const filtered = filterGuestId ? all.filter(m => m.guest_id === filterGuestId) : all
          setMessages(filtered)
        }
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [eventId, isOpen, filterGuestId, client])

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    const message = {
      event_id: eventId,
      sender_name: senderName,
      sender_role: senderRole,
      guest_id: filterGuestId || guestId,
      content: newMessage.trim()
    }

    setSending(true)
    setNewMessage('')

    try {
      if (isSupabaseConfigured && client) {
        const { error } = await client.from('messages').insert(message)
        if (error) throw error
      } else {
        const newMsg = {
          id: `mock-msg-${Date.now()}`,
          ...message,
          created_at: new Date().toISOString()
        }
        const storageKey = `petone_mock_messages_${eventId}`
        const stored = localStorage.getItem(storageKey)
        const existing = stored ? JSON.parse(stored) : []
        const updated = [...existing, newMsg]
        localStorage.setItem(storageKey, JSON.stringify(updated))
        // Refrescar mensajes filtrados
        const filtered = filterGuestId ? updated.filter(m => m.guest_id === filterGuestId) : updated
        setMessages(filtered)
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setNewMessage(message.content)
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="shrink-0 bg-indigo-600 px-4 py-3 flex items-center gap-3 safe-area-top">
        <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
          <X size={20} />
        </button>
        <MessageCircle size={16} className="text-white" />
        <span className="text-sm font-bold text-white flex-1">{chatTitle}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-8">
            No hay mensajes aún. ¡Escribe el primero!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_role === senderRole && msg.sender_name === senderName
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-slate-500 mb-0.5 px-1">
                  {msg.sender_role === 'admin' ? '⭐ ' : ''}{msg.sender_name}
                </span>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-slate-800 text-slate-200 rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="shrink-0 border-t border-slate-800 p-3 flex gap-2 safe-area-bottom">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-xl text-white transition-colors"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
