import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useEventData } from '../hooks/useEventData'
import { usePushSubscription } from '../hooks/usePushSubscription'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import Timeline from '../components/Timeline'
import PhotoGallery from '../components/PhotoGallery'
import PullToRefresh from '../components/PullToRefresh'
import ChatBox from '../components/ChatBox'
import { 
  Bell, ShieldCheck, Camera, Plus, Trash2, 
  Loader2, UserCheck, Clock, MessageCircle, MapPin, Navigation, Car
} from 'lucide-react'

export default function EventBoard({ eventId, guestToken, personalToken }) {
  // Fallback: si guestToken no se pasó como prop, buscarlo en localStorage
  const effectiveGuestToken = guestToken || localStorage.getItem(`petone_guest_token_${eventId}`) || null
  const { event, currentGuest, media, loading, error, refresh, updateGuest } = useEventData(eventId, effectiveGuestToken, personalToken)
  const { isSubscribed, loading: pushLoading, subscribe, unsubscribe } = usePushSubscription(currentGuest, updateGuest)

  // Estados locales para edición de autorizados y alergias
  const [newPickupName, setNewPickupName] = useState('')
  const [editingAllergies, setEditingAllergies] = useState(false)
  const [allergyInput, setAllergyInput] = useState('')
  const [submittingChanges, setSubmittingChanges] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [arrivalSent, setArrivalSent] = useState(false)
  const [arrivalLoading, setArrivalLoading] = useState(false)

  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  // Cargar Leaflet.js dinámicamente
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true)
      return
    }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => setLeafletLoaded(true)
    document.body.appendChild(script)
  }, [])

  // Actualizar mapa Leaflet al cambiar coordenadas
  useEffect(() => {
    if (!leafletLoaded) return
    
    const lat = event?.location_coords?.lat
    const lng = event?.location_coords?.lng
    
    if (!lat || !lng) return

    if (!mapRef.current) {
      mapRef.current = window.L.map('live-map', {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([lat, lng], 16)

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(mapRef.current)

      const dogIcon = window.L.divIcon({
        html: '<div style="font-size: 28px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4));">🦮</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      })

      markerRef.current = window.L.marker([lat, lng], { icon: dogIcon }).addTo(mapRef.current)
    } else {
      const newPos = [lat, lng]
      markerRef.current.setLatLng(newPos)
      mapRef.current.panTo(newPos)
    }
  }, [leafletLoaded, event?.location_coords])

  // Generar link de WhatsApp o email de respaldo si es necesario
  const formattedEventDate = event?.event_date 
    ? new Date(event.event_date).toLocaleDateString('es-CL', {
        weekday: 'long', 
        day: 'numeric', 
        month: 'long'
      })
    : ''

  // Contar mensajes no leídos del admin (usando chat_read_status)
  useEffect(() => {
    if (!eventId || !currentGuest) return

    const countUnread = async () => {
      if (showChat) {
        setUnreadCount(0)
        return
      }

      let lastReadAt = null

      if (isSupabaseConfigured) {
        // Obtener last_read_at del chat_read_status
        const { data: readStatus } = await supabase
          .from('chat_read_status')
          .select('last_read_at')
          .eq('event_id', eventId)
          .eq('guest_id', currentGuest.id)
          .single()

        if (readStatus) lastReadAt = readStatus.last_read_at

        let query = supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('event_id', eventId)
          .eq('guest_id', currentGuest.id)
          .eq('sender_role', 'admin')

        if (lastReadAt) {
          query = query.gt('created_at', lastReadAt)
        }

        const { count } = await query
        setUnreadCount(count || 0)
      } else {
        // LOCAL: usar localStorage
        const readKey = `petone_mock_read_status_${eventId}`
        const readStore = JSON.parse(localStorage.getItem(readKey) || '{}')
        lastReadAt = readStore[currentGuest.id] || null

        const stored = localStorage.getItem(`petone_mock_messages_${eventId}`)
        if (stored) {
          const all = JSON.parse(stored)
          const unread = all.filter(m =>
            m.guest_id === currentGuest.id &&
            m.sender_role === 'admin' &&
            (!lastReadAt || m.created_at > lastReadAt)
          )
          setUnreadCount(unread.length)
        }
      }
    }

    countUnread()
    const interval = setInterval(countUnread, 3000)
    return () => clearInterval(interval)
  }, [eventId, currentGuest, showChat])

  // Verificar si ya envió notificación de llegada
  useEffect(() => {
    if (!eventId || !currentGuest) return

    const checkArrival = async () => {
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('notifications')
          .select('id')
          .eq('event_id', eventId)
          .eq('guest_id', currentGuest.id)
          .eq('type', 'arrival')
          .limit(1)

        if (data && data.length > 0) setArrivalSent(true)
      } else {
        const key = `petone_mock_notifications_${eventId}`
        const stored = JSON.parse(localStorage.getItem(key) || '[]')
        const exists = stored.some(n => n.guest_id === currentGuest.id && n.type === 'arrival')
        if (exists) setArrivalSent(true)
      }
    }

    checkArrival()
  }, [eventId, currentGuest])

  // Limpiar unread cuando se abre el chat
  const handleOpenChat = () => {
    setUnreadCount(0)
    setShowChat(true)
  }

  // Notificar llegada al administrador
  const handleNotifyArrival = async () => {
    if (!currentGuest || arrivalSent) return
    setArrivalLoading(true)

    try {
      if (isSupabaseConfigured) {
        await supabase.from('notifications').insert({
          event_id: eventId,
          guest_id: currentGuest.id,
          type: 'arrival',
          child_name: currentGuest.child_guest_name,
          parent_name: currentGuest.parent_name
        })
      } else {
        const key = `petone_mock_notifications_${eventId}`
        const stored = JSON.parse(localStorage.getItem(key) || '[]')
        stored.push({
          id: `notif-${Date.now()}`,
          event_id: eventId,
          guest_id: currentGuest.id,
          type: 'arrival',
          child_name: currentGuest.child_guest_name,
          parent_name: currentGuest.parent_name,
          read: false,
          created_at: new Date().toISOString()
        })
        localStorage.setItem(key, JSON.stringify(stored))
      }
      setArrivalSent(true)
    } catch (err) {
      console.error('Error notifying arrival:', err)
    }
    setArrivalLoading(false)
  }

  const handleAddPickup = async (e) => {
    e.preventDefault()
    if (!newPickupName.trim() || !currentGuest) return

    setSubmittingChanges(true)
    const updatedPickups = [...(currentGuest.authorized_pickups || [])]
    updatedPickups.push({ name: newPickupName.trim(), relation: 'Autorizado' })

    try {
      await updateGuest(currentGuest.id, { authorized_pickups: updatedPickups })
      setNewPickupName('')
    } catch (err) {
      alert('Error al agregar autorizado: ' + (err.message || 'Error desconocido'))
    } finally {
      setSubmittingChanges(false)
    }
  }

  const handleRemovePickup = async (index) => {
    if (!currentGuest) return
    setSubmittingChanges(true)
    const updatedPickups = (currentGuest.authorized_pickups || []).filter((_, i) => i !== index)

    try {
      await updateGuest(currentGuest.id, { authorized_pickups: updatedPickups })
    } catch (err) {
      alert('Error al eliminar autorizado: ' + (err.message || 'Error desconocido'))
    } finally {
      setSubmittingChanges(false)
    }
  }

  const handleSaveAllergies = async () => {
    if (!currentGuest) return
    setSubmittingChanges(true)
    try {
      await updateGuest(currentGuest.id, { allergies: allergyInput.trim() || null })
      setEditingAllergies(false)
    } catch (err) {
      alert('Error al guardar alergias: ' + (err.message || 'Error desconocido'))
    } finally {
      setSubmittingChanges(false)
    }
  }

  const handleActivatePush = async () => {
    try {
      await subscribe()
    } catch (err) {
      alert(err.message || 'Error al suscribirse a las notificaciones.')
    }
  }

  const handleRefresh = useCallback(async () => {
    await refresh()
  }, [refresh])

  // Abrir mapas nativos con directions
  const handleOpenMaps = () => {
    const destination = encodeURIComponent(event.location)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    
    // Primero intentar obtener ubicación del usuario
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          const origin = `${latitude},${longitude}`
          
          if (isIOS) {
            // Apple Maps
            window.open(`https://maps.apple.com/?daddr=${destination}&sll=${origin}&dirflg=d`)
          } else {
            // Google Maps
            window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`)
          }
        },
        () => {
          // Sin ubicación, abrir mapas solo con destino
          if (isIOS) {
            window.open(`https://maps.apple.com/?daddr=${destination}`)
          } else {
            window.open(`https://www.google.com/maps/search/?api=1&query=${destination}`)
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${destination}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <Loader2 size={36} className="text-indigo-400 animate-spin" />
        <p className="text-sm text-slate-400">Cargando tu tablero de paseo...</p>
      </div>
    )
  }

  if (error || !event || !currentGuest) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-xl font-bold mb-2">
          !
        </div>
        <h3 className="text-lg font-bold text-white">Acceso Denegado</h3>
        <p className="text-xs text-slate-450 max-w-xs">
          No encontramos tu registro para este paseo. Vuelve a hacer clic en tu enlace personal.
        </p>
      </div>
    )
  }

  return (
    <>
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-16">
      {/* Barra superior / Indicador en tiempo real */}
      <div className="bg-emerald-950/40 border-b border-emerald-900/40 px-6 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Tablero de {currentGuest.child_guest_name}</span>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">PetOne Live</span>
      </div>

      {/* Header */}
      <div className="max-w-xl mx-auto px-4 pt-6 text-left">
        <div className="flex items-center gap-3 mb-1">
          {event.host_photo ? (
            <img src={event.host_photo} alt={event.child_name} className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/30" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-lg">
              🧑
            </div>
          )}
          <div>
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest">Paseo de tu mascota con</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {event.child_name}
            </h1>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-15">
          📅 {formattedEventDate}
        </p>
      </div>

      {/* Card de Ubicación */}
      <div className="max-w-xl mx-auto px-4 mt-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <MapPin size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Punto de Encuentro</span>
            <span className="text-xs text-white font-medium truncate block">{event.location}</span>
          </div>
          <button
            onClick={handleOpenMaps}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-[0.97] shadow-lg shadow-emerald-600/15 cursor-pointer"
          >
            <Navigation size={12} />
            Cómo llegar
          </button>
        </div>
      </div>

      {/* Card de Mapa en Vivo */}
      <div className="max-w-xl mx-auto px-4 mt-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-left flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Navigation size={18} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">Mapa en Vivo del Paseo</h4>
              <p className="text-[10px] text-slate-450 mt-0.5">Sigue la ruta de tu mascota en tiempo real</p>
            </div>
          </div>
          
          {event?.location_coords?.lat ? (
            <div id="live-map" className="w-full h-60 bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden" style={{ zIndex: 10 }} />
          ) : (
            <div className="h-60 bg-slate-950/40 border border-dashed border-slate-850 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
              <span className="text-3xl mb-2 animate-bounce">🦮</span>
              <h5 className="font-bold text-xs text-slate-350">Esperando Señal GPS</h5>
              <p className="text-[10px] text-slate-450 max-w-xs mt-1 leading-relaxed">
                Cuando el paseador comience a transmitir la ubicación real durante el paseo, verás la ruta de tu perro en este mapa en vivo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CARD DE NOTIFICACIONES PUSH */}
      <div className="max-w-xl mx-auto px-4 mt-6">
        {isSubscribed ? (
          <div className="bg-emerald-950/15 border border-emerald-500/20 rounded-2xl p-4 text-left flex gap-3 items-center">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck size={18} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-xs text-emerald-400 uppercase tracking-wider">Entrega Segura Activada</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                Te enviaremos una alerta push inmediata cuando {currentGuest.child_guest_name} sea marcado como entregado seguro por el paseador.
              </p>
            </div>
            <button 
              onClick={unsubscribe}
              className="text-[10px] text-slate-500 hover:text-slate-400 cursor-pointer"
            >
              Desactivar
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-left relative overflow-hidden">
            {/* Pequeña animación de fondo */}
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl -z-10" />

            <div className="flex gap-3.5 items-start">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Bell size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-sm text-white">Activar Alerta de Entrega Segura</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Recibe una notificación push instantánea al momento exacto en que tu perro sea entregado de regreso a salvo en tu domicilio.
                </p>

                {/* Verificar instalación PWA o Android directo */}
                {pushLoading ? (
                  <button disabled className="mt-3 bg-slate-800 text-slate-500 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" /> Cargando...
                  </button>
                ) : (
                  <button
                    onClick={handleActivatePush}
                    className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/15"
                  >
                    Activar Notificaciones
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botón "Estoy en Casa / Listo para Entrega" */}
        {currentGuest && (
          <button
            onClick={handleNotifyArrival}
            disabled={arrivalSent || arrivalLoading}
            className={`w-full rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98] ${
              arrivalSent
                ? 'bg-emerald-600/20 border border-emerald-500/30 cursor-default'
                : 'bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 cursor-pointer shadow-lg shadow-emerald-600/20'
            }`}
          >
            <div className={`p-2.5 rounded-xl shrink-0 ${arrivalSent ? 'bg-emerald-500/20' : 'bg-white/15'}`}>
              {arrivalLoading ? (
                <Loader2 size={20} className="text-white animate-spin" />
              ) : (
                <Car size={20} className={arrivalSent ? 'text-emerald-400' : 'text-white'} />
              )}
            </div>
            <div className="text-left flex-1">
              <span className={`text-sm font-extrabold block ${arrivalSent ? 'text-emerald-300' : 'text-white'}`}>
                {arrivalSent ? 'Notificación enviada' : 'Estoy en Casa / Listo para Entrega'}
              </span>
              <span className={`text-[11px] ${arrivalSent ? 'text-emerald-400/70' : 'text-white/70'}`}>
                {arrivalSent
                  ? 'El paseador fue notificado'
                  : 'Avisa al paseador que estás disponible para entregar o recibir a tu mascota.'
                }
              </span>
            </div>
          </button>
        )}
      </div>

      {/* TABS / SECCIONES */}
      <div className="max-w-xl mx-auto px-4 mt-8 flex flex-col gap-6">
        
        {/* SECCIÓN 1: ITINERARIO DEL PASEO */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 text-left">
          <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-emerald-400" />
            Itinerario en Tiempo Real
          </h3>
          <Timeline items={event.timeline} isAdmin={false} />
        </div>

        {/* SECCIÓN 2: DATOS DE RETIRO Y SALUD (DINÁMICO) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 text-left">
          <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
            <UserCheck size={16} className="text-amber-400" />
            Datos de {currentGuest.child_guest_name}
          </h3>

          <div className="flex flex-col gap-5">
            {/* Alergias */}
            <div className="border-b border-slate-850 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block">Alimentación y Cuidados</span>
                  {editingAllergies ? (
                    <div className="flex gap-2 mt-2 w-full">
                      <input 
                        type="text" 
                        value={allergyInput} 
                        onChange={(e) => setAllergyInput(e.target.value)} 
                        placeholder="Ej: Pollo, Granos, snacks de goma..."
                        className="bg-slate-950 border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-white flex-1 focus:outline-none focus:border-emerald-500"
                      />
                      <button 
                        onClick={handleSaveAllergies}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Guardar
                      </button>
                      <button 
                        onClick={() => setEditingAllergies(false)}
                        className="px-2 py-1.5 bg-slate-850 text-slate-400 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-white block mt-1">
                      {currentGuest.allergies || 'Ninguna registrada'}
                    </span>
                  )}
                </div>
                {!editingAllergies && (
                  <button 
                    onClick={() => {
                      setAllergyInput(currentGuest.allergies || '')
                      setEditingAllergies(true)
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>

            {/* Instrucciones de Retiro y Entrega */}
            <div>
              <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block">Instrucciones de Retiro y Entrega</span>
              <p className="text-[10px] text-slate-450 mt-1">Si necesitas que recojamos o entreguemos a tu mascota en una dirección específica, indícalo aquí.</p>
              
              {/* Listado de direcciones */}
              <div className="flex flex-col gap-2 mt-3">
                {currentGuest.authorized_pickups?.map((pickup, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-950/60 border border-slate-850 px-3 py-2 rounded-xl font-mono">
                    <span className="text-xs text-slate-200 font-semibold">
                      {typeof pickup === 'object' ? (pickup.name || JSON.stringify(pickup)) : pickup}
                    </span>
                    <button 
                      onClick={() => handleRemovePickup(i)}
                      disabled={submittingChanges}
                      className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Formulario para agregar */}
              <form onSubmit={handleAddPickup} className="flex gap-2 mt-3">
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Calle Principal 123, Depto 402"
                  value={newPickupName} 
                  onChange={(e) => setNewPickupName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white flex-1 focus:outline-none focus:border-emerald-500"
                />
                <button 
                  type="submit"
                  disabled={submittingChanges || !newPickupName.trim()}
                  className="px-3 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center"
                >
                  <Plus size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: GALERÍA DE FOTOS */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 text-left">
          <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
            <Camera size={16} className="text-emerald-400" />
            Álbum de Fotos
          </h3>
          <PhotoGallery media={currentGuest ? media.filter(m => !m.tags || m.tags.length === 0 || m.tags.includes(currentGuest.id)) : media} />
        </div>

      </div>
    </div>
    </PullToRefresh>

    {/* Chat en tiempo real */}
    {currentGuest && (
      <>
        {/* Botón flotante de chat */}
        {!showChat && (
          <button
            onClick={handleOpenChat}
            className="fixed bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center shadow-xl transition-all active:scale-90"
          >
            <MessageCircle size={22} className="text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-bounce shadow-lg">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )}

        <ChatBox
          eventId={eventId}
          senderName={currentGuest.child_guest_name || currentGuest.parent_name || 'Tutor'}
          senderRole="guest"
          guestId={currentGuest.id}
          filterGuestId={currentGuest.id}
          chatTitle="Chat con el Paseador"
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      </>
    )}
    </>
  )
}
