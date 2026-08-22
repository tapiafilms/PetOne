import { useEffect, useState, useCallback, useRef } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient'
import { getMediaFromDB, addMediaToDB, deleteMediaFromDB } from '../lib/mediaDB'

/**
 * Hook para cargar y suscribirse en tiempo real a los datos de un evento y sus invitados.
 * Soporta LOCAL DEMO MODE (localStorage) si Supabase no está configurado.
 */
export function useEventData(eventId, eventToken, personalToken = null) {
  const [event, setEvent] = useState(null)
  const [guests, setGuests] = useState([])
  const [currentGuest, setCurrentGuest] = useState(null)
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const currentGuestRef = useRef(null)
  useEffect(() => {
    currentGuestRef.current = currentGuest
  }, [currentGuest])

  // Siempre recrear el cliente cuando cambien los tokens (resuelve race condition con localStorage)
  const supabaseClient = isSupabaseConfigured
    ? getSupabaseClient(eventToken, personalToken)
    : null

  // --- MOCK LOCALSTORAGE LOGIC (LOCAL DEMO MODE) ---
  const fetchLocalData = useCallback(async (silent = false) => {
    if (!eventId) return
    if (!silent) setLoading(true)
    setError(null)
    
    try {
      const storedEvent = localStorage.getItem(`petone_mock_event_${eventId}`)
      if (!storedEvent) {
        throw new Error('Evento local no encontrado.')
      }
      const eventData = JSON.parse(storedEvent)
      setEvent(eventData)

      const storedGuests = localStorage.getItem(`petone_mock_guests_${eventId}`)
      const guestsData = storedGuests ? JSON.parse(storedGuests) : []
      setGuests(guestsData)

      // Usar IndexedDB para media (resuelve límite de 5MB de localStorage)
      const mediaData = await getMediaFromDB(eventId)

      if (personalToken) {
        const found = guestsData.find(g => g.personal_token === personalToken)
        setCurrentGuest(found || null)
        
        if (found) {
          const filteredMedia = mediaData.filter(m => 
            !m.tags || m.tags.length === 0 || m.tags.includes(found.id)
          )
          setMedia(filteredMedia)
        } else {
          setMedia([])
        }
      } else {
        setCurrentGuest(null)
        setMedia(mediaData)
      }
    } catch (err) {
      console.error('Local fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [eventId, personalToken])

  const updateLocalTimeline = useCallback((newTimeline) => {
    if (!eventId) return
    const stored = localStorage.getItem(`petone_mock_event_${eventId}`)
    if (stored) {
      const eventData = JSON.parse(stored)
      eventData.timeline = newTimeline
      localStorage.setItem(`petone_mock_event_${eventId}`, JSON.stringify(eventData))
      setEvent(eventData)
      
      // Forzar evento de storage para actualizar otras pestañas
      window.dispatchEvent(new Event('storage'))
    }
  }, [eventId])

  const updateLocalGuest = useCallback((guestId, updates) => {
    const stored = localStorage.getItem(`petone_mock_guests_${eventId}`)
    if (stored) {
      const guestsData = JSON.parse(stored)
      const updated = guestsData.map(g => g.id === guestId ? { ...g, ...updates } : g)
      localStorage.setItem(`petone_mock_guests_${eventId}`, JSON.stringify(updated))
      setGuests(updated)

      if (currentGuest && currentGuest.id === guestId) {
        setCurrentGuest(prev => prev ? { ...prev, ...updates } : null)
      }
      window.dispatchEvent(new Event('storage'))
    }
  }, [eventId, currentGuest])

  const addLocalGuest = useCallback((guestData) => {
    const stored = localStorage.getItem(`petone_mock_guests_${eventId}`)
    const guestsData = stored ? JSON.parse(stored) : []
    
    const newGuest = {
      id: `mock-guest-${Date.now()}`,
      event_id: eventId,
      personal_token: `mock-guest-token-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      created_at: new Date().toISOString(),
      ...guestData
    }

    guestsData.push(newGuest)
    localStorage.setItem(`petone_mock_guests_${eventId}`, JSON.stringify(guestsData))
    setGuests(guestsData)
    window.dispatchEvent(new Event('storage'))
    return newGuest
  }, [eventId])
  const addLocalMedia = useCallback(async (url, mediaType, tags = []) => {
    const newMedia = {
      id: `mock-media-${Date.now()}`,
      event_id: eventId,
      url,
      media_type: mediaType,
      tags,
      created_at: new Date().toISOString()
    }
    
    await addMediaToDB(eventId, newMedia)
    setMedia(prev => [newMedia, ...prev])
    window.dispatchEvent(new Event('storage'))
    return newMedia
  }, [eventId])

  const deleteLocalMedia = useCallback(async (mediaId) => {
    await deleteMediaFromDB(mediaId)
    setMedia(prev => prev.filter(m => m.id !== mediaId))
    window.dispatchEvent(new Event('storage'))
  }, [])

  // --- FIN MOCK LOGIC ---

  // --- SUPABASE LOGIC (CLOUD MODE) ---
  const fetchCloudData = useCallback(async (silent = false) => {
    if (!eventId || !supabaseClient) return
    if (!silent) setLoading(true)
    setError(null)

    try {
      const { data: eventData, error: eventErr } = await supabaseClient
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventErr) throw eventErr
      setEvent(eventData)

      const { data: guestsData, error: guestsErr } = await supabaseClient
        .from('guests')
        .select('*')
        .eq('event_id', eventId)

      if (guestsErr) throw guestsErr
      setGuests(guestsData || [])

      const { data: mediaData, error: mediaErr } = await supabaseClient
        .from('event_media')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (mediaErr) throw mediaErr
      setMedia(mediaData || [])

      if (personalToken && guestsData) {
        const found = guestsData.find(g => g.personal_token === personalToken)
        setCurrentGuest(found || null)
      } else {
        setCurrentGuest(null)
      }

    } catch (err) {
      console.error('Error fetching event data:', err)
      setError(err.message || 'Error al cargar los datos del evento.')
    } finally {
      setLoading(false)
    }
  }, [eventId, personalToken, supabaseClient])

  const updateCloudTimeline = useCallback(async (newTimeline) => {
    if (!eventId || !supabaseClient) return
    try {
      const { error: err } = await supabaseClient
        .from('events')
        .update({ timeline: newTimeline })
        .eq('id', eventId)
      if (err) throw err
      setEvent(prev => prev ? { ...prev, timeline: newTimeline } : null)
    } catch (err) {
      console.error('Error updating timeline:', err)
      throw err
    }
  }, [eventId, supabaseClient])

  const updateCloudGuest = useCallback(async (guestId, updates) => {
    if (!supabaseClient) return
    try {
      const { error: err } = await supabaseClient
        .from('guests')
        .update(updates)
        .eq('id', guestId)
      if (err) throw err
      setGuests(prev => prev.map(g => g.id === guestId ? { ...g, ...updates } : g))
      if (currentGuest && currentGuest.id === guestId) {
        setCurrentGuest(prev => prev ? { ...prev, ...updates } : null)
      }
    } catch (err) {
      console.error('Error updating guest:', err)
      throw err
    }
  }, [supabaseClient, currentGuest])

  const addCloudGuest = useCallback(async (guestData) => {
    // Generar personal_token en el cliente si no viene para eludir RLS en RETURNING
    const personalToken = guestData.personal_token || (
      Array.from(window.crypto.getRandomValues(new Uint8Array(16)), dec => dec.toString(16).padStart(2, '0')).join('')
    );

    const client = getSupabaseClient(eventToken, personalToken);

    try {
      const { data, error: err } = await client
        .from('guests')
        .insert({
          event_id: eventId,
          personal_token: personalToken,
          ...guestData
        })
        .select()
        .single()
      if (err) throw err
      setGuests(prev => [...prev, data])
      return data
    } catch (err) {
      console.error('Error adding guest:', err)
      throw err
    }
  }, [eventId, eventToken])
  const addCloudMedia = useCallback(async (url, mediaType, tags = []) => {
    if (!supabaseClient) return
    try {
      const { data, error: err } = await supabaseClient
        .from('event_media')
        .insert({
          event_id: eventId,
          url,
          media_type: mediaType,
          tags
        })
        .select()
        .single()
      if (err) throw err
      setMedia(prev => [data, ...prev])
      return data
    } catch (err) {
      console.error('Error adding media:', err)
      throw err
    }
  }, [eventId, supabaseClient])

  const deleteCloudMedia = useCallback(async (mediaId) => {
    if (!supabaseClient) return
    try {
      const { error: err } = await supabaseClient
        .from('event_media')
        .delete()
        .eq('id', mediaId)
      if (err) throw err
      setMedia(prev => prev.filter(m => m.id !== mediaId))
    } catch (err) {
      console.error('Error deleting media:', err)
      throw err
    }
  }, [supabaseClient])

  // --- FIN SUPABASE LOGIC ---

  // Suscripción / Inicialización
  useEffect(() => {
    if (!eventId) return
    let mounted = true

    if (!isSupabaseConfigured) {
      // Modo Demo Local
      fetchLocalData()

      const handleStorageChange = () => {
        if (mounted) fetchLocalData(true)
      }

      window.addEventListener('storage', handleStorageChange)
      return () => {
        mounted = false
        window.removeEventListener('storage', handleStorageChange)
      }
    } else {
      // Modo Nube Supabase
      if (!supabaseClient) return

      fetchCloudData()
      supabaseClient.rpc('delete_expired_event_media').then(() => {}, err => {
        console.error('Lazy media cleanup error:', err)
      })

      const eventChannel = supabaseClient
        .channel(`realtime:events:${eventId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
          (payload) => {
            if (!mounted) return
            if (payload.eventType === 'DELETE') {
              setEvent(null)
            } else {
              setEvent(payload.new)
            }
          }
        )
        .subscribe()

      const guestsChannel = supabaseClient
        .channel(`realtime:guests:${eventId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'guests', filter: `event_id=eq.${eventId}` },
          (payload) => {
            if (!mounted) return
            if (payload.eventType === 'INSERT') {
              setGuests(prev => {
                if (prev.some(g => g.id === payload.new.id)) return prev
                return [...prev, payload.new]
              })
            } else if (payload.eventType === 'UPDATE') {
              setGuests(prev => prev.map(g => g.id === payload.new.id ? payload.new : g))
              if (personalToken && payload.new.personal_token === personalToken) {
                setCurrentGuest(payload.new)
              }
            } else if (payload.eventType === 'DELETE') {
              setGuests(prev => prev.filter(g => g.id !== payload.old.id))
              if (currentGuestRef.current && currentGuestRef.current.id === payload.old.id) {
                setCurrentGuest(null)
              }
            }
          }
        )
        .subscribe()

      const mediaChannel = supabaseClient
        .channel(`realtime:media:${eventId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'event_media', filter: `event_id=eq.${eventId}` },
          (payload) => {
            if (!mounted) return
            if (payload.eventType === 'INSERT') {
              setMedia(prev => {
                if (prev.some(m => m.id === payload.new.id)) return prev
                return [payload.new, ...prev]
              })
            } else if (payload.eventType === 'DELETE') {
              setMedia(prev => prev.filter(m => m.id !== payload.old.id))
            }
          }
        )
        .subscribe()

      return () => {
        mounted = false
        supabaseClient.removeChannel(eventChannel)
        supabaseClient.removeChannel(guestsChannel)
        supabaseClient.removeChannel(mediaChannel)
      }
    }
  }, [eventId, fetchLocalData, fetchCloudData, supabaseClient, personalToken])

  const finishCloudEvent = useCallback(async () => {
    if (!eventId || !supabaseClient) return
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    const { error: err } = await supabaseClient
      .from('events')
      .update({ expires_at: expiresAt })
      .eq('id', eventId)

    if (err) throw err
    setEvent(prev => prev ? { ...prev, expires_at: expiresAt } : null)
    return expiresAt
  }, [eventId, supabaseClient])

  const finishLocalEvent = useCallback(async () => {
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    const stored = localStorage.getItem(`petone_mock_event_${eventId}`)
    if (stored) {
      const eventData = JSON.parse(stored)
      eventData.expires_at = expiresAt
      localStorage.setItem(`petone_mock_event_${eventId}`, JSON.stringify(eventData))
      setEvent(eventData)
    }
    return expiresAt
  }, [eventId])

  return {
    event,
    guests,
    currentGuest,
    media,
    loading,
    error,
    refresh: isSupabaseConfigured ? fetchCloudData : fetchLocalData,
    updateTimeline: isSupabaseConfigured ? updateCloudTimeline : updateLocalTimeline,
    updateGuest: isSupabaseConfigured ? updateCloudGuest : updateLocalGuest,
    addGuest: isSupabaseConfigured ? addCloudGuest : addLocalGuest,
    addMedia: isSupabaseConfigured ? addCloudMedia : addLocalMedia,
    deleteMedia: isSupabaseConfigured ? deleteCloudMedia : deleteLocalMedia,
    finishEvent: isSupabaseConfigured ? finishCloudEvent : finishLocalEvent
  }
}
