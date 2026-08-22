import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useEventData } from '../hooks/useEventData'

import { supabase, getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient'
import CameraCapture from '../components/CameraCapture'
import Timeline from '../components/Timeline'
import AllergyBanner from '../components/AllergyBanner'
import CheckInOutPanel from '../components/CheckInOutPanel'
import ProviderDirectory from '../components/ProviderDirectory'
import PullToRefresh from '../components/PullToRefresh'
import ChatBox from '../components/ChatBox'
import ChatList from '../components/ChatList'
import PhotoCardStack from '../components/PhotoCardStack'
import { 
  AlertTriangle, Calendar, MapPin, Copy, Check, 
  UserMinus, RefreshCw,
  Camera, Video, Loader2, Play, Download, X,
  Home, Users, Clock, Truck, MessageCircle, Image as ImageIcon, Car, Compass, Dog
} from 'lucide-react'

export default function HostAdmin({ eventId, hostToken }) {
  const { event, guests, media, loading, error, updateTimeline, updateGuest, refresh, addMedia, finishEvent } = useEventData(eventId, hostToken)
  
  // Estados locales
  const [copiedText, setCopiedText] = useState('')
  const [activeTab, setActiveTab] = useState('home')

  // Estados locales para la galería y etiquetado
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [publishingMedia, setPublishingMedia] = useState(false)
  const [showTaggingModal, setShowTaggingModal] = useState(false)
  const [pendingMedia, setPendingMedia] = useState(null)
  const [selectedTags, setSelectedTags] = useState([])
  const [showCamera, setShowCamera] = useState(null) // 'photo' | 'video' | null
  const [activeMedia, setActiveMedia] = useState(null)
  const [modalState, setModalState] = useState('closed')
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [zipProgress, setZipProgress] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState(null)
  const [chatMessageCount, setChatMessageCount] = useState(0)
  const [showGallery, setShowGallery] = useState(false)
  const [activeNotification, setActiveNotification] = useState(null)
  const photoInputRef = useRef(null)
  const videoInputRef = useRef(null)

  const [gpsActive, setGpsActive] = useState(false)
  const [simulatedGps, setSimulatedGps] = useState(false)

  // Función para actualizar coordenadas del paseo
  const updateCoords = useCallback(async (coords) => {
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('events')
          .update({ location_coords: coords })
          .eq('id', eventId)
      } else {
        const stored = localStorage.getItem(`petone_mock_event_${eventId}`)
        if (stored) {
          const eventData = JSON.parse(stored)
          eventData.location_coords = coords
          localStorage.setItem(`petone_mock_event_${eventId}`, JSON.stringify(eventData))
          window.dispatchEvent(new Event('storage'))
        }
      }
    } catch (err) {
      console.error('Error updating location coords:', err)
    }
  }, [eventId])

  // Geolocalización GPS real
  useEffect(() => {
    if (!gpsActive) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading,
          timestamp: Date.now()
        }
        updateCoords(newCoords)
      },
      (error) => {
        console.error('Error watchPosition:', error)
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [gpsActive, updateCoords])

  // Simulador de ruta para paseadores
  useEffect(() => {
    if (!simulatedGps) return

    let stepIndex = 0
    const route = [
      { lat: -33.4024, lng: -70.5794 },
      { lat: -33.4026, lng: -70.5785 },
      { lat: -33.4020, lng: -70.5772 },
      { lat: -33.4012, lng: -70.5765 },
      { lat: -33.4005, lng: -70.5770 },
      { lat: -33.4008, lng: -70.5782 },
      { lat: -33.4015, lng: -70.5790 }
    ]

    const intervalId = setInterval(() => {
      const pos = route[stepIndex % route.length]
      const newCoords = {
        lat: pos.lat + (Math.random() - 0.5) * 0.00008,
        lng: pos.lng + (Math.random() - 0.5) * 0.00008,
        timestamp: Date.now(),
        isSimulated: true
      }
      updateCoords(newCoords)
      stepIndex++
    }, 8000)

    return () => clearInterval(intervalId)
  }, [simulatedGps, updateCoords])

  const openMediaModal = useCallback((item) => {
    setActiveMedia(item)
    setModalState('opening')
  }, [])

  const closeMediaModal = useCallback(() => {
    setModalState('closing')
  }, [])

  useEffect(() => {
    if (modalState === 'opening') {
      const frame = requestAnimationFrame(() => setModalState('open'))
      return () => cancelAnimationFrame(frame)
    }
    if (modalState === 'closing') {
      const timer = setTimeout(() => {
        setActiveMedia(null)
        setModalState('closed')
      }, 220)
      return () => clearTimeout(timer)
    }
  }, [modalState])

  // Polling de notificaciones (llegadas)
  useEffect(() => {
    if (!eventId) return

    const fetchNotifications = async () => {
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('event_id', eventId)
          .eq('read', false)
          .order('created_at', { ascending: false })

        if (data) {
          // Mostrar la más reciente si hay alguna nueva
          if (data.length > 0 && !activeNotification) {
            setActiveNotification(data[0])
          }
        }
      } else {
        const key = `petone_mock_notifications_${eventId}`
        const stored = JSON.parse(localStorage.getItem(key) || '[]')
        const unread = stored.filter(n => !n.read)
        if (unread.length > 0 && !activeNotification) {
          setActiveNotification(unread[0])
        }
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 3000)
    return () => clearInterval(interval)
  }, [eventId, activeNotification])

  // Cerrar notificación y marcar como leída
  const dismissNotification = async (notifId) => {
    if (isSupabaseConfigured) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notifId)
    } else {
      const key = `petone_mock_notifications_${eventId}`
      const stored = JSON.parse(localStorage.getItem(key) || '[]')
      const updated = stored.map(n => n.id === notifId ? { ...n, read: true } : n)
      localStorage.setItem(key, JSON.stringify(updated))
    }
    setActiveNotification(null)
  }

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(type)
      setTimeout(() => setCopiedText(''), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedText(type)
      setTimeout(() => setCopiedText(''), 2000)
    }
  }

  // Compresión y publicación de fotos/videos
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const max_size = 1200
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width
              width = max_size
            }
          } else {
            if (height > max_size) {
              width *= max_size / height
              height = max_size
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Canvas to blob failed'))
            }
          }, 'image/webp', 0.8)
        }
        img.onerror = (err) => reject(err)
      }
      reader.onerror = (err) => reject(err)
    })
  }

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.src = URL.createObjectURL(file)
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src)
        resolve(video.duration)
      }
      video.onerror = () => {
        resolve(0)
      }
    })
  }

  const handleMediaCapture = async (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingMedia(true)
    try {
      let finalBlob = file

      if (type === 'photo') {
        finalBlob = await compressImage(file)
      } else if (type === 'video') {
        const duration = await getVideoDuration(file)
        if (duration > 15.5) {
          alert('No te puedes pasar de 15 segundos por video')
          setUploadingMedia(false)
          return
        }
        if (file.size > 10 * 1024 * 1024) {
          alert('El video es muy pesado. Por favor graba un video más corto (máximo 15 segundos).')
          setUploadingMedia(false)
          return
        }
      }

      const previewUrl = URL.createObjectURL(finalBlob)
      setPendingMedia({
        blob: finalBlob,
        type,
        previewUrl,
        name: file.name
      })
      setSelectedTags([])
      setShowTaggingModal(true)
    } catch (err) {
      console.error('Error processing media:', err)
      alert('Error al procesar el archivo.')
    } finally {
      setUploadingMedia(false)
    }
  }

  const handlePublishMedia = async () => {
    if (!pendingMedia) return
    setPublishingMedia(true)

    try {
      let publicUrl = ''

      if (isSupabaseConfigured) {
        const authedClient = getSupabaseClient(hostToken)
        const fileExt = pendingMedia.type === 'photo' ? 'webp' : 'mp4'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
        const filePath = `event-${eventId}/${fileName}`

        const { error: uploadError } = await authedClient.storage
          .from('photos')
          .upload(filePath, pendingMedia.blob, { cacheControl: '3600', upsert: false })

        if (uploadError) throw uploadError

        const { data: urlData } = authedClient.storage
          .from('photos')
          .getPublicUrl(filePath)

        publicUrl = urlData.publicUrl
      } else {
        publicUrl = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.readAsDataURL(pendingMedia.blob)
          reader.onloadend = () => resolve(reader.result)
        })
      }

      await addMedia(publicUrl, pendingMedia.type, selectedTags)
      
      setShowTaggingModal(false)
      setPendingMedia(null)
      setSelectedTags([])
    } catch (err) {
      console.error('Error publishing media:', err)
      alert('Hubo un error al publicar el archivo en vivo.')
    } finally {
      setPublishingMedia(false)
    }
  }

  const handleMediaCaptured = async (blob, type) => {
    setUploadingMedia(true)
    try {
      const previewUrl = URL.createObjectURL(blob)
      setPendingMedia({
        blob,
        type,
        previewUrl,
        name: type === 'photo' ? `camera-${Date.now()}.webp` : `camera-${Date.now()}.mp4`
      })
      setSelectedTags([])
      setShowTaggingModal(true)
    } catch (err) {
      console.error('Error handling captured media:', err)
      alert('Error al procesar la captura de cámara.')
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename || 'petone-media'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Error downloading file:', err)
      window.open(url, '_blank')
    }
  }

  const handleDownloadAllAsZip = async () => {
    if (media.length === 0) {
      alert('No hay fotos ni videos para descargar.')
      return
    }

    setDownloadingZip(true)
    setZipProgress(0)

    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      const folder = zip.folder(`${event?.child_name || 'cumpleanos'}-fotos`)

      let downloaded = 0
      let failed = 0

      for (let i = 0; i < media.length; i++) {
        const item = media[i]
        try {
          const response = await fetch(item.url)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const blob = await response.blob()
          
          const ext = item.media_type === 'photo' ? 'jpg' : 'mp4'
          const filename = `media-${i + 1}.${ext}`
          
          folder.file(filename, blob)
          downloaded++
        } catch (fetchErr) {
          console.warn(`Error downloading file ${i + 1}:`, fetchErr)
          failed++
        }
        setZipProgress(Math.round(((i + 1) / media.length) * 100))
      }

      if (downloaded === 0) {
        alert('No se pudo descargar ningún archivo. Verifica tu conexión a internet.')
        return
      }

      const content = await zip.generateAsync({ type: 'blob' })
      const blobUrl = window.URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${event?.child_name || 'cumpleanos'}-fotos.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      
      if (failed > 0) {
        alert(`ZIP descargado con ${failed} archivo(s) fallido(s). ${downloaded} archivos descargados correctamente.`)
      } else {
        alert('¡Descarga de archivo ZIP completada con éxito!')
      }
    } catch (err) {
      console.error('Error generating ZIP:', err)
      alert('Ocurrió un error al generar el archivo ZIP. Por favor descarga las fotos individualmente.')
    } finally {
      setDownloadingZip(false)
      setZipProgress(0)
    }
  }

  const handleFinishEvent = async () => {
    const confirmFinish = confirm(
      '¿Seguro que deseas dar por terminada la fiesta?\n\nEsto programará el borrado automático de todas las fotos y videos en 12 horas. Asegúrate de descargar el álbum ZIP antes de que expire.'
    )
    if (!confirmFinish) return

    try {
      await finishEvent()
      alert('¡Paseo finalizado! El borrado automático de archivos ha sido programado en 12 horas.')
    } catch (err) {
      console.error('Error finishing event:', err)
      alert('Hubo un problema al finalizar el paseo.')
    }
  }

  // Filtrar métricas
  const confirmedGuests = guests.filter(g => g.rsvp_status === 'yes')
  const declinedGuests = guests.filter(g => g.rsvp_status === 'no')
  const guestsWithAllergies = confirmedGuests.filter(g => g.allergies && g.allergies.trim() !== '')
  const guestsCheckedIn = confirmedGuests.filter(g => !g.checked_out?.status)
  const guestsCheckedOut = confirmedGuests.filter(g => g.checked_out?.status)


  // Cambiar estado de una tarea del timeline
  const handleToggleTimelineStatus = async (taskId, currentStatus) => {
    if (!event) return
    const nextStatus = currentStatus === 'pending' ? 'active' : currentStatus === 'active' ? 'done' : 'pending'
    
    const updatedTimeline = event.timeline.map(t => {
      if (t.id === taskId) {
        return { ...t, status: nextStatus }
      }
      // Si activamos una, las demás pasan a pending si estaban active
      if (nextStatus === 'active' && t.id !== taskId && t.status === 'active') {
        return { ...t, status: 'done' }
      }
      return t
    })

    try {
      await updateTimeline(updatedTimeline)
    } catch (err) {
      alert('Error al actualizar el itinerario: ' + (err.message || 'Error desconocido'))
    }
  }

  // Registrar retiro manual por el anfitrión
  const handleHostCheckout = async (guestId, childName, currentStatus) => {
    const nextStatus = !currentStatus
    const updates = {
      checked_out: {
        status: nextStatus,
        by: nextStatus ? 'Anfitrión (Manual)' : null,
        at: nextStatus ? new Date().toISOString() : null
      }
    }
    
    try {
      await updateGuest(guestId, updates)
      
      // Enviar Web Push real si se marca como retirado
      if (nextStatus) {
        fetch('/api/send-push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            guestId,
            eventId,
            hostToken
          })
        })
        .then(async (res) => {
          const resData = await res.json()
          if (!res.ok) console.error('Error sending push notification:', resData.error)
        })
        .catch(err => console.error('Error calling send-push API:', err))
      }
    } catch (err) {
      alert('Error al registrar el retiro: ' + (err.message || 'Error desconocido'))
    }
  }

  const handleRefresh = useCallback(async () => {
    await refresh()
  }, [refresh])

  // Contar mensajes de guests para badge de notificación
  useEffect(() => {
    if (!eventId) return

    const countGuestMessages = async () => {
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('event_id', eventId)
          .eq('sender_role', 'guest')
        if (data) setChatMessageCount(data.length)
      } else {
        const stored = localStorage.getItem(`petone_mock_messages_${eventId}`)
        if (stored) {
          const all = JSON.parse(stored)
          setChatMessageCount(all.filter(m => m.sender_role === 'guest').length)
        }
      }
    }

    countGuestMessages()
    const interval = setInterval(countGuestMessages, 3000)
    return () => clearInterval(interval)
  }, [eventId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <RefreshCw size={36} className="text-indigo-400 animate-spin" />
        <p className="text-sm text-slate-400">Cargando panel de administrador...</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-xl font-bold mb-2">
          !
        </div>
        <h3 className="text-lg font-bold text-white">Panel No Disponible</h3>
        <p className="text-xs text-slate-450 max-w-xs">
          No tienes permisos para ver este panel o el token es incorrecto.
        </p>
      </div>
    )
  }

  return (
    <>
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-4">
      
      {/* Barra de estado / Online indicator */}
      <div className="bg-emerald-950/40 border-b border-emerald-900/40 px-6 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Paseo en vivo conectado (Tiempo Real)</span>
        </div>
        <button onClick={() => window.location.href = window.location.origin} className="hover:text-white flex items-center gap-1">
          Salir
        </button>
      </div>

      {/* ==================== TOP NAV TABS (MÓVIL) ==================== */}
      <nav className="md:hidden sticky top-0 z-40 bg-slate-950 border-b border-slate-800 safe-area-top">
        <div className="flex items-stretch h-14 px-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer rounded-xl mx-0.5 ${activeTab === 'home' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 border border-transparent'}`}
          >
            <Home size={18} />
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Paseo</span>
          </button>
          <button
            onClick={() => setActiveTab('guests')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer rounded-xl mx-0.5 ${activeTab === 'guests' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 border border-transparent'}`}
          >
            <Users size={18} />
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Mascotas</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer rounded-xl mx-0.5 ${activeTab === 'timeline' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 border border-transparent'}`}
          >
            <Clock size={18} />
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Itinerario</span>
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer rounded-xl mx-0.5 ${activeTab === 'providers' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 border border-transparent'}`}
          >
            <Truck size={18} />
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Servicios</span>
          </button>
        </div>
      </nav>

      {/* ==================== TAB: HOME ==================== */}
      {activeTab === 'home' && (
        <>
          {/* Hero Banner: Paseo de [nombre], fecha y lugar */}
          <div className="max-w-6xl mx-auto px-6 pt-8 pb-4">
            <div>
              <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-widest">Panel del Paseador</span>
              <h1 className="text-3xl font-extrabold text-white mt-1">
                Paseo de {event.child_name}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1"><Calendar size={13} /> {new Date(event.event_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="flex items-center gap-1"><MapPin size={13} /> {event.location}</span>
              </div>
            </div>
          </div>

          {/* Registro de Mascotas */}
          <div className="max-w-6xl mx-auto px-6 pb-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full flex flex-col sm:flex-row items-center gap-4">
              <div className="text-left w-full sm:w-auto">
                <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider font-mono">Ficha de Registro</span>
                <span className="text-xs text-slate-400">Comparte este link con los tutores para registrar sus mascotas</span>
              </div>
              <div className="flex gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1.5 w-full sm:w-auto justify-between items-center">
                <span className="text-[11px] font-mono text-slate-450 truncate w-[140px] px-2 select-all">
                  {`${window.location.origin}/?e=${event.id}&t=${event.guest_token}`}
                </span>
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/?e=${event.id}&t=${event.guest_token}`, 'general')}
                  className="p-2 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-350 transition-colors"
                >
                  {copiedText === 'general' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Panel GPS Tracker */}
          <div className="max-w-6xl mx-auto px-6 pb-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2 mb-1.5 font-mono">
                <Compass size={18} className="text-emerald-400" />
                Seguimiento GPS del Paseo en Vivo
              </h3>
              <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                Comparte tu ruta en tiempo real. Los dueños podrán ver la ubicación de sus perros en el mapa desde sus tableros.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => {
                    setGpsActive(!gpsActive);
                    if (simulatedGps) setSimulatedGps(false);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer border ${
                    gpsActive 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500' 
                      : 'bg-slate-950 hover:bg-slate-900 text-slate-450 border-slate-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${gpsActive ? 'bg-white animate-pulse' : 'bg-slate-650'}`} />
                  {gpsActive ? 'GPS Real: Transmitiendo' : 'Compartir GPS Real'}
                </button>
                
                <button
                  onClick={() => {
                    setSimulatedGps(!simulatedGps);
                    if (gpsActive) setGpsActive(false);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer border ${
                    simulatedGps 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500' 
                      : 'bg-slate-950 hover:bg-slate-900 text-slate-450 border-slate-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${simulatedGps ? 'bg-white animate-pulse' : 'bg-slate-650'}`} />
                  {simulatedGps ? 'Simulador: Activo' : 'Simular Ruta (Demo Local)'}
                </button>
              </div>
            </div>
          </div>

          {/* Sección Multimedia (Cámara en Vivo) */}
          <div className="max-w-6xl mx-auto px-6 py-2">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-850">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Camera size={20} className="text-emerald-400" />
                    Cámara en Vivo del Paseo
                  </h3>
                  <p className="text-xs text-slate-450 mt-0.5">Captura momentos del paseo y compártelos al instante con los tutores.</p>
                </div>
                 <div className="flex gap-2.5 w-full sm:w-auto">
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleMediaCapture(e, 'photo')}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    capture="environment"
                    onChange={(e) => handleMediaCapture(e, 'video')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current.click()}
                    disabled={uploadingMedia || publishingMedia}
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-emerald-600/10 text-center"
                  >
                    <Camera size={16} />
                    Tomar Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCamera('video')}
                    disabled={uploadingMedia || publishingMedia}
                    className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-amber-600/10 text-center"
                  >
                    <Video size={16} />
                    Grabar Video
                  </button>
                </div>
              </div>

              {media.length === 0 ? (
                <div className="py-8 px-6 text-center text-slate-500 text-xs italic">
                  No hay fotos ni videos publicados en esta fiesta todavía. ¡Toma la primera captura!
                </div>
              ) : (
                <PhotoCardStack
                  media={media}
                  onTapCard={(item) => openMediaModal(item)}
                  onOpenGallery={() => setShowGallery(true)}
                />
              )}
            </div>
          </div>

          {/* Grid de Métricas Rápidas (4 boxes) */}
          <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col">
              <span className="text-slate-400 text-xs font-semibold">Mascotas Confirmadas</span>
              <span className="text-3xl font-black text-white mt-2 flex items-baseline gap-1.5">
                {confirmedGuests.length} <span className="text-xs text-slate-500 font-normal">perros</span>
              </span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col">
              <span className="text-slate-400 text-xs font-semibold">No Asisten</span>
              <span className="text-3xl font-black text-slate-400 mt-2 flex items-baseline gap-1.5">
                {declinedGuests.length} <span className="text-xs text-slate-500 font-normal">perros</span>
              </span>
            </div>
            <div className={`border rounded-2xl p-4 flex flex-col transition-colors ${guestsWithAllergies.length > 0 ? 'bg-amber-950/20 border-amber-850 text-amber-300' : 'bg-slate-900/60 border-slate-800/80'}`}>
              <span className="text-xs font-semibold flex items-center gap-1.5">
                Alergias / Cuidados {guestsWithAllergies.length > 0 && <AlertTriangle size={14} className="animate-bounce" />}
              </span>
              <span className="text-3xl font-black mt-2 flex items-baseline gap-1.5">
                {guestsWithAllergies.length} <span className="text-xs font-normal">perros</span>
              </span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col">
              <span className="text-slate-400 text-xs font-semibold">En el Paseo / Entregados</span>
              <span className="text-3xl font-black text-emerald-400 mt-2 flex items-baseline gap-1.5">
                {guestsCheckedIn.length} <span className="text-slate-500 text-xs font-normal">/ {guestsCheckedOut.length} ent.</span>
              </span>
            </div>
          </div>

          {/* Gestión del Evento */}
          <div className="max-w-6xl mx-auto px-6 mb-4">
            {event.expires_at && (new Date(event.expires_at).getTime() - Date.now()) < 24 * 60 * 60 * 1000 ? (
              <div className="bg-amber-950/20 border border-amber-800/60 rounded-3xl p-6 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1">
                  <span className="text-xs text-amber-400 font-extrabold uppercase tracking-wider block mb-1">
                    ⚠️ Fiesta Finalizada y Programada para Eliminación
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Esta fiesta ha terminado. Las fotos y videos se eliminarán permanentemente el{' '}
                    <strong>{new Date(event.expires_at).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong>.
                  </p>
                </div>
                <button
                  onClick={handleDownloadAllAsZip}
                  disabled={downloadingZip}
                  className="w-full md:w-auto bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-amber-600/10 shrink-0"
                >
                  {downloadingZip ? <><Loader2 size={16} className="animate-spin" /> Comprimiendo ({zipProgress}%)</> : <><Download size={16} /> Descargar Todo (ZIP)</>}
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-6 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1">
                  <span className="text-xs text-indigo-400 font-extrabold uppercase tracking-wider block mb-1">
                    ⚙️ Gestión del Evento
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Cuando termine el paseo, marca la sesión como finalizada para programar la destrucción automática de los archivos multimedia en 12 horas por privacidad.
                  </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto shrink-0">
                  <button
                    onClick={handleDownloadAllAsZip}
                    disabled={downloadingZip}
                    className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-650 text-slate-350 border border-slate-700/50 font-bold text-xs py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {downloadingZip ? <><Loader2 size={16} className="animate-spin" /> ({zipProgress}%)</> : <><Download size={15} /> ZIP</>}
                  </button>
                  <button
                    onClick={handleFinishEvent}
                    className="flex-1 md:flex-none bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-red-600/10"
                  >
                    Terminar Fiesta
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== TAB: MASCOTAS ==================== */}
      {activeTab === 'guests' && (
        <div className="max-w-6xl mx-auto px-6 pt-8 pb-6 flex flex-col gap-6">
          <h1 className="text-3xl font-extrabold text-white">Mascotas</h1>
          <AllergyBanner guests={guests} />
          <CheckInOutPanel 
            guests={guests} 
            onCheckoutToggle={handleHostCheckout} 
            eventId={eventId} 
            birthdayKidName={event.child_name} 
          />
          {declinedGuests.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-left">
              <h3 className="text-base font-bold text-slate-300 mb-4">No asisten ({declinedGuests.length})</h3>
              <div className="flex flex-wrap gap-2">
                {declinedGuests.map(g => (
                  <span 
                    key={g.id}
                    className="text-xs bg-slate-950 border border-slate-855 text-slate-400 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-mono"
                  >
                    <UserMinus size={12} className="text-amber-400" />
                    {g.child_guest_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB: ITINERARIO ==================== */}
      {activeTab === 'timeline' && (
        <div className="max-w-2xl mx-auto px-6 pt-8 pb-6">
          <h1 className="text-3xl font-extrabold text-white mb-6">Itinerario</h1>
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 text-left">
            <p className="text-xs text-slate-400 mb-6">Administra el orden del paseo. Los dueños verán los cambios en vivo en su tablero móvil.</p>
            <Timeline items={event.timeline} onToggleStatus={handleToggleTimelineStatus} isAdmin={true} />
          </div>
        </div>
      )}

      {/* ==================== TAB: SERVICIOS ==================== */}
      {activeTab === 'providers' && (
        <div className="max-w-2xl mx-auto px-6 pt-8 pb-6">
          <h1 className="text-3xl font-extrabold text-white mb-6">Servicios Recomendados</h1>
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 text-left">
            <ProviderDirectory eventName={event.child_name} />
          </div>
        </div>
      )}

      {/* Desktop Tabs */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 mt-4 font-mono">
        <div className="flex border-b border-slate-900 gap-4 mb-6">
          <button onClick={() => setActiveTab('home')} className={`pb-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'home' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-450 hover:text-slate-350'}`}>Paseo</button>
          <button onClick={() => setActiveTab('guests')} className={`pb-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'guests' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-450 hover:text-slate-350'}`}>Mascotas ({guests.length})</button>
          <button onClick={() => setActiveTab('timeline')} className={`pb-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'timeline' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-450 hover:text-slate-350'}`}>Itinerario</button>
          <button onClick={() => setActiveTab('providers')} className={`pb-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'providers' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-450 hover:text-slate-350'}`}>Servicios</button>
        </div>
      </div>

    </div>
    </PullToRefresh>

    {/* Modal Notificación de Llegada */}
    {activeNotification && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => dismissNotification(activeNotification.id)} />
        <div className="relative bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Car size={32} className="text-amber-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white mb-2">Llegó un invitado</h3>
          <p className="text-sm text-slate-400 mb-1">
            <strong className="text-white">{activeNotification.parent_name}</strong> está afuera del recinto.
          </p>
          <p className="text-xs text-slate-500 mb-6">
            Hijo: <strong className="text-amber-400">{activeNotification.child_name}</strong>
          </p>
          <button
            onClick={() => dismissNotification(activeNotification.id)}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm py-3 rounded-xl transition-all active:scale-[0.97] shadow-lg shadow-amber-600/20"
          >
            Entendido
          </button>
        </div>
      </div>
    )}

    {/* Modal Galería Completa */}
    {showGallery && (
      <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950 safe-area-top safe-area-bottom">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
          <h3 className="text-sm font-extrabold text-white">Todas las Fotos</h3>
          <button onClick={() => setShowGallery(false)} className="p-2 bg-slate-800/80 text-white rounded-full hover:bg-slate-700 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-3 gap-2">
            {media.map((item) => (
              <div
                key={item.id}
                onClick={() => { setShowGallery(false); openMediaModal(item) }}
                className="relative aspect-square rounded-xl overflow-hidden border border-slate-850 bg-slate-900 group cursor-pointer"
              >
                {item.media_type === 'photo' ? (
                  <img src={item.url} alt="Foto" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full relative">
                    <video src={item.url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play size={18} className="text-white opacity-85" />
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ImageIcon size={16} className="text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Modal de Etiquetado — FUERA de PullToRefresh */}
    {showTaggingModal && pendingMedia && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md flex flex-col gap-5 text-left max-h-[90vh] overflow-y-auto safe-area-top safe-area-bottom">
          <div>
            <h3 className="text-lg font-extrabold text-white">Etiquetar Niños</h3>
            <p className="text-xs text-slate-400 mt-1">Selecciona los niños que aparecen en la captura para que se publique en su feed privado.</p>
          </div>
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-850 bg-slate-950 flex items-center justify-center">
            {pendingMedia.type === 'photo' ? (
              <img src={pendingMedia.previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <video src={pendingMedia.previewUrl} controls className="w-full h-full object-contain" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-450 block uppercase tracking-wider mb-2">Invitados Confirmados ({confirmedGuests.length})</span>
            {confirmedGuests.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay invitados confirmados aún.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto pr-1">
                {confirmedGuests.map(guest => {
                  const isSelected = selectedTags.includes(guest.id)
                  return (
                    <button
                      key={guest.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) setSelectedTags(prev => prev.filter(id => id !== guest.id))
                        else setSelectedTags(prev => [...prev, guest.id])
                      }}
                      className={`text-xs px-3 py-2 rounded-xl border transition-all font-medium cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                          : 'bg-slate-950 border-slate-850 text-slate-450 hover:border-slate-800 hover:text-slate-300'
                      }`}
                    >
                      {guest.child_guest_name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed italic">
            * Nota: Si no seleccionas ningún cliente, el archivo será visible de forma general para todos los invitados del paseo.
          </p>
          <div className="flex gap-3 border-t border-slate-850 pt-4">
            <button
              type="button"
              disabled={publishingMedia}
              onClick={() => { setShowTaggingModal(false); setPendingMedia(null); setSelectedTags([]) }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-350 font-bold text-xs py-3 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={publishingMedia}
              onClick={handlePublishMedia}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              {publishingMedia ? <><Loader2 size={14} className="animate-spin" /> Publicando...</> : 'Publicar en Vivo'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Cámara — FUERA de PullToRefresh */}
    {showCamera && (
      <CameraCapture
        type={showCamera}
        onClose={() => setShowCamera(null)}
        onCaptureComplete={(blob) => {
          setShowCamera(null)
          handleMediaCaptured(blob, showCamera)
        }}
        onError={() => {
          setShowCamera(null)
          if (showCamera === 'photo' && photoInputRef.current) photoInputRef.current.click()
          else if (showCamera === 'video' && videoInputRef.current) videoInputRef.current.click()
        }}
      />
    )}

    {/* Modal Pantalla Completa — FUERA de PullToRefresh */}
    {activeMedia && (
      <div className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm ${modalState === 'closing' ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}`} style={{ height: '100dvh' }}>
        <div className={`absolute top-0 left-0 right-0 flex justify-between items-center px-4 py-3 z-10 safe-area-top ${modalState === 'closing' ? 'modal-header-exit' : 'modal-header-enter'}`}>
          <button
            onClick={() => handleDownload(activeMedia.url, `${activeMedia.media_type}-${activeMedia.id || Date.now()}`)}
            className="px-4 py-2 bg-slate-900/80 border border-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-850 active:scale-95 transition-all cursor-pointer shadow-lg"
          >
            <Download size={14} />
            Descargar
          </button>
          <button onClick={closeMediaModal} className="p-2 bg-slate-900/80 border border-slate-800 text-white rounded-full hover:bg-slate-850 cursor-pointer shadow-lg">
            <X size={20} />
          </button>
        </div>
        <div className={`w-full h-full flex items-center justify-center p-4 pt-14 overflow-auto ${modalState === 'closing' ? 'modal-content-exit' : 'modal-content-enter'}`}>
          {activeMedia.media_type === 'photo' ? (
            <img src={activeMedia.url} alt="Full View" className="max-w-full max-h-full object-contain rounded-2xl border border-slate-850 shadow-2xl" />
          ) : (
            <video src={activeMedia.url} controls autoPlay className="max-w-full max-h-full object-contain rounded-2xl border border-slate-850 shadow-2xl" />
          )}
        </div>
      </div>
    )}

    {/* Chat privado */}
    <ChatList
      eventId={eventId}
      guests={guests}
      isOpen={showChat && !selectedGuest}
      onSelectGuest={(guest) => setSelectedGuest(guest)}
      onClose={() => { setShowChat(false); setSelectedGuest(null) }}
      onUnreadChange={(total) => setChatMessageCount(total)}
    />

    {selectedGuest && (
      <ChatBox
        eventId={eventId}
        senderName="Anfitrión"
        senderRole="admin"
        filterGuestId={selectedGuest.id}
        chatTitle={`Chat con ${selectedGuest.child_guest_name}`}
        isOpen={true}
        onClose={() => setSelectedGuest(null)}
      />
    )}

    {/* Botón flotante de chat */}
    {!showChat && !selectedGuest && (
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center shadow-xl transition-all active:scale-90"
      >
        <MessageCircle size={22} className="text-white" />
        {chatMessageCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-bounce shadow-lg">
            {chatMessageCount > 99 ? '99+' : chatMessageCount}
          </span>
        )}
      </button>
    )}

    </>
  )
}
