import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from './lib/supabaseClient'
import InstallPrompt from './components/InstallPrompt'
import SplashScreen from './components/SplashScreen'
import { Loader2 } from 'lucide-react'

// Code Splitting / Lazy Loading
const LandingPage = lazy(() => import('./pages/LandingPage'))
const RsvpPage = lazy(() => import('./pages/RsvpPage'))
const HostAdmin = lazy(() => import('./pages/HostAdmin'))
const EventBoard = lazy(() => import('./pages/EventBoard'))
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage'))

const isMobileDevice = () => window.matchMedia('(max-width: 768px)').matches

export default function App() {
  const [route, setRoute] = useState('loading') // 'loading' | 'landing' | 'rsvp' | 'admin' | 'board' | '404'
  const [resolvedParams, setResolvedParams] = useState({})
  const [loading, setLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(false)

  // Obtener parámetros de la URL
  const params = new URLSearchParams(window.location.search)
  const eventId = params.get('e')
  const token = params.get('t')

  useEffect(() => {
    if (!eventId || !token) {
      if (window.location.pathname === '/home') {
        setRoute('landing')
        setLoading(false)
        return
      }

      // Solo mostrar splash en mobile en la home page, una vez por sesión
      if (isMobileDevice() && !sessionStorage.getItem('petone_splash_seen')) {
        setShowSplash(true)
      } else {
        const urlParams = new URLSearchParams(window.location.search)
        const isPreview = urlParams.get('preview') === 'true' || urlParams.get('setup') === 'true'
        setRoute(isPreview ? 'landing' : 'comingsoon')
      }
      setLoading(false)
      return
    }

    async function resolveRoute() {
      try {
        if (!isSupabaseConfigured) {
          // MODO DEMO LOCAL: Buscar evento en localStorage
          const storedEvent = localStorage.getItem(`petone_mock_event_${eventId}`)
          if (storedEvent) {
            const event = JSON.parse(storedEvent)
            
            if (token === event.host_token) {
              setResolvedParams({ eventId, hostToken: token })
              setRoute('admin')
              setLoading(false)
              return
            } else if (token === event.guest_token) {
              // Invitación general. Verificar si ya hay un token personal registrado localmente
              const storedPersonalToken = localStorage.getItem(`petone_personal_token_${eventId}`)
              if (storedPersonalToken) {
                const storedGuests = localStorage.getItem(`petone_mock_guests_${eventId}`)
                const guests = storedGuests ? JSON.parse(storedGuests) : []
                const guest = guests.find(g => g.personal_token === storedPersonalToken)
                
                if (guest && guest.rsvp_status === 'yes') {
                  setResolvedParams({ eventId, personalToken: storedPersonalToken })
                  setRoute('board')
                  setLoading(false)
                  return
                }
              }
              setResolvedParams({ eventId, guestToken: token })
              setRoute('rsvp')
              setLoading(false)
              return
            } else {
              // Probar si el token es el de un invitado registrado
              const storedGuests = localStorage.getItem(`petone_mock_guests_${eventId}`)
              const guests = storedGuests ? JSON.parse(storedGuests) : []
              const guest = guests.find(g => g.personal_token === token)
              
              if (guest) {
                if (guest.rsvp_status === 'yes') {
                  localStorage.setItem(`petone_personal_token_${eventId}`, token)
                }
                setResolvedParams({ eventId, personalToken: token })
                setRoute('board')
                setLoading(false)
                return
              }
            }
          }
          setRoute('404')
          setLoading(false)
          return
        }

        // MODO NUBE: Probar si el token corresponde al eventToken (host_token o guest_token)
        const clientWithToken = getSupabaseClient(token)
        const { data: event, error: _eventErr } = await clientWithToken
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single()

        if (event) {
          if (token === event.host_token) {
            setResolvedParams({ eventId, hostToken: token })
            setRoute('admin')
          } else if (token === event.guest_token) {
            // Es un link de invitación general. Verificar si ya tiene token personal en localStorage
            const storedPersonalToken = localStorage.getItem(`petone_personal_token_${eventId}`)
            
            if (storedPersonalToken) {
              // Validar que el token personal del localStorage corresponda a un invitado confirmado
              const personalClient = getSupabaseClient(null, storedPersonalToken)
              const { data: guest } = await personalClient
                .from('guests')
                .select('*')
                .eq('event_id', eventId)
                .eq('personal_token', storedPersonalToken)
                .single()

              if (guest && guest.rsvp_status === 'yes') {
                setResolvedParams({ eventId, personalToken: storedPersonalToken })
                setRoute('board')
                setLoading(false)
                return
              }
            }
            
            // Si no tiene token personal guardado, mostrar formulario RSVP
            setResolvedParams({ eventId, guestToken: token })
            setRoute('rsvp')
          }
          setLoading(false)
          return
        }

        // MODO NUBE: Si no es un eventToken, probar si es un personalToken de invitado
        const personalClient = getSupabaseClient(null, token)
        const { data: guest, error: _guestErr } = await personalClient
          .from('guests')
          .select('*')
          .eq('event_id', eventId)
          .eq('personal_token', token)
          .single()

        if (guest) {
          // Guardar en localStorage para visitas futuras al rsvp genérico
          if (guest.rsvp_status === 'yes') {
            localStorage.setItem(`petone_personal_token_${eventId}`, token)
          }
          setResolvedParams({ eventId, personalToken: token })
          setRoute('board')
          setLoading(false)
          return
        }

        // Si no coincide con nada, ruta 404
        setRoute('404')
      } catch (err) {
        console.error('Error resolving app routing:', err)
        setRoute('404')
      } finally {
        setLoading(false)
      }
    }

    resolveRoute()
  }, [eventId, token])

  // Navegar de forma imperativa tras pagar el evento en la landing
  const handleNavigateToAdmin = (newEvId, newHostToken) => {
    // Actualizar URL sin recargar la página para mantener SPA DX
    const newUrl = `${window.location.origin}${window.location.pathname}?e=${newEvId}&t=${newHostToken}`
    window.history.pushState({ path: newUrl }, '', newUrl)
    setResolvedParams({ eventId: newEvId, hostToken: newHostToken })
    setRoute('admin')
  }

  // Navegar tras auto-registro de invitado exitoso
  const handleRegisterComplete = (newPersonalToken) => {
    const newUrl = `${window.location.origin}${window.location.pathname}?e=${eventId}&t=${newPersonalToken}`
    window.history.pushState({ path: newUrl }, '', newUrl)
    setResolvedParams({ eventId, personalToken: newPersonalToken })
    setRoute('board')
  }

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('petone_splash_seen', '1')
    setShowSplash(false)
    const urlParams = new URLSearchParams(window.location.search)
    const isPreview = urlParams.get('preview') === 'true' || urlParams.get('setup') === 'true'
    setRoute(isPreview ? 'landing' : 'comingsoon')
  }, [])

  if (loading || route === 'loading') {
    if (showSplash) {
      return <SplashScreen onComplete={handleSplashComplete} />
    }
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-indigo-400 animate-spin" />
        <p className="text-sm text-slate-400">Verificando invitación...</p>
      </div>
    )
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      
      <Suspense fallback={
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
          <Loader2 size={40} className="text-indigo-400 animate-spin" />
        </div>
      }>
        {route === 'comingsoon' && (
          <ComingSoonPage />
        )}

        {route === 'landing' && (
          <LandingPage onNavigateToAdmin={handleNavigateToAdmin} />
        )}

        {route === 'rsvp' && (
          <RsvpPage
            eventId={resolvedParams.eventId}
            guestToken={resolvedParams.guestToken}
            onRegisterComplete={handleRegisterComplete}
          />
        )}

        {route === 'admin' && (
          <HostAdmin
            eventId={resolvedParams.eventId}
            hostToken={resolvedParams.hostToken}
          />
        )}

        {route === 'board' && (
          <EventBoard
            eventId={resolvedParams.eventId}
            personalToken={resolvedParams.personalToken}
          />
        )}
      </Suspense>

      {route === '404' && (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-xl font-bold mb-2">
            404
          </div>
          <h3 className="text-lg font-bold text-white">Evento o Enlace No Encontrado</h3>
          <p className="text-xs text-slate-450 max-w-xs">
            El cumpleaños al que intentas acceder no existe, o tu token de acceso ha expirado. Por favor, solicita un nuevo enlace.
          </p>
          <a 
            href={window.location.origin}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold mt-4"
          >
            Volver a la página principal
          </a>
        </div>
      )}

      {/* Prompt global de instalación de la PWA */}
      <InstallPrompt />
    </>
  )
}
