import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { MessageCircle, X, ChevronRight } from 'lucide-react'

export default function ChatList({ eventId, guests, isOpen, onSelectGuest, onClose, onUnreadChange }) {
  const [lastMessages, setLastMessages] = useState({})
  const [readStatuses, setReadStatuses] = useState({})
  const [dataLoaded, setDataLoaded] = useState(false)

  // Cargar mensajes + read status
  const fetchData = useCallback(async () => {
    if (!eventId) return

    if (isSupabaseConfigured) {
      // Mensajes
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(200)

      if (msgs) {
        const lastByGuest = {}
        msgs.forEach(msg => {
          if (msg.guest_id && !lastByGuest[msg.guest_id]) {
            lastByGuest[msg.guest_id] = msg
          }
        })
        setLastMessages(lastByGuest)
      }

      // Read status
      const { data: reads } = await supabase
        .from('chat_read_status')
        .select('guest_id, last_read_at')
        .eq('event_id', eventId)

      if (reads) {
        const readMap = {}
        reads.forEach(r => { readMap[r.guest_id] = r.last_read_at })
        setReadStatuses(readMap)
      }
    } else {
      // LOCAL DEMO MODE
      const stored = localStorage.getItem(`petone_mock_messages_${eventId}`)
      if (stored) {
        const all = JSON.parse(stored)
        const lastByGuest = {}
        all.forEach(msg => {
          if (msg.guest_id && !lastByGuest[msg.guest_id]) {
            lastByGuest[msg.guest_id] = msg
          }
        })
        setLastMessages(lastByGuest)
      }

      const readStore = localStorage.getItem(`petone_mock_read_status_${eventId}`)
      if (readStore) {
        setReadStatuses(JSON.parse(readStore))
      }
    }
    setDataLoaded(true)
  }, [eventId])

  useEffect(() => {
    if (!isOpen) {
      setDataLoaded(false)
      return
    }
    fetchData()
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [isOpen, fetchData])

  // Calcular unread por guest y notificar al padre
  useEffect(() => {
    if (!dataLoaded) return

    const confirmedGuests = guests.filter(g => g.rsvp_status === 'yes')
    let totalUnread = 0
    const unreadMap = {}

    confirmedGuests.forEach(guest => {
      const guestMsgs = Object.values(lastMessages).filter(m => m.guest_id === guest.id && m.sender_role === 'guest')
      const lastRead = readStatuses[guest.id]
      const unread = guestMsgs.filter(m => !lastRead || new Date(m.created_at) > new Date(lastRead)).length
      unreadMap[guest.id] = unread
      totalUnread += unread
    })

    onUnreadChange?.(totalUnread, unreadMap)
  }, [lastMessages, readStatuses, guests, onUnreadChange, dataLoaded])

  // Marcar como leído al seleccionar un guest
  const handleSelectGuest = async (guest) => {
    const now = new Date().toISOString()

    if (isSupabaseConfigured) {
      await supabase
        .from('chat_read_status')
        .upsert({
          event_id: eventId,
          guest_id: guest.id,
          last_read_at: now
        }, { onConflict: 'event_id,guest_id' })
    } else {
      const key = `petone_mock_read_status_${eventId}`
      const stored = JSON.parse(localStorage.getItem(key) || '{}')
      stored[guest.id] = now
      localStorage.setItem(key, JSON.stringify(stored))
    }

    setReadStatuses(prev => ({ ...prev, [guest.id]: now }))
    onSelectGuest(guest)
  }

  if (!isOpen) return null

  const confirmedGuests = guests.filter(g => g.rsvp_status === 'yes')

  // Calcular unread local para mostrar badges
  const getUnread = (guestId) => {
    const guestMsgs = Object.values(lastMessages).filter(m => m.guest_id === guestId && m.sender_role === 'guest')
    const lastRead = readStatuses[guestId]
    return guestMsgs.filter(m => !lastRead || new Date(m.created_at) > new Date(lastRead)).length
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="shrink-0 bg-emerald-600 px-4 py-3 flex items-center gap-3 safe-area-top font-mono">
        <MessageCircle size={16} className="text-white" />
        <span className="text-sm font-bold text-white flex-1">Chats Privados</span>
        <span className="text-[10px] text-emerald-200">{confirmedGuests.length} conversaciones</span>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-20">
        {confirmedGuests.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-12 px-6">
            No hay mascotas confirmadas aún.
          </div>
        ) : (
          confirmedGuests.map(guest => {
            const lastMsg = lastMessages[guest.id]
            const unread = getUnread(guest.id)
            return (
              <button
                key={guest.id}
                onClick={() => handleSelectGuest(guest)}
                className="w-full px-4 py-3 flex items-center gap-3 border-b border-slate-800/50 hover:bg-slate-900/60 transition-colors text-left cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative shrink-0 font-mono">
                  <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm font-bold">
                    {(guest.child_guest_name || '?')[0].toUpperCase()}
                  </div>
                  {unread > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
                      <span className="text-[9px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-bold truncate ${unread > 0 ? 'text-white' : 'text-slate-300'}`}>
                      {guest.child_guest_name}
                    </span>
                    {lastMsg && (
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {new Date(lastMsg.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] truncate ${unread > 0 ? 'text-slate-300 font-medium' : 'text-slate-400'}`}>
                      {lastMsg
                        ? `${lastMsg.sender_role === 'admin' ? 'Tú: ' : ''}${lastMsg.content}`
                        : 'Sin mensajes aún'
                      }
                    </span>
                    <ChevronRight size={14} className="text-slate-600 shrink-0" />
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Botón cerrar flotante */}
      <div className="absolute bottom-0 left-0 right-0 p-4 safe-area-bottom bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pointer-events-none">
        <button
          onClick={onClose}
          className="mx-auto flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm px-8 py-3.5 rounded-2xl transition-all active:scale-[0.97] shadow-xl pointer-events-auto cursor-pointer"
        >
          <X size={18} />
          Cerrar
        </button>
      </div>
    </div>
  )
}
