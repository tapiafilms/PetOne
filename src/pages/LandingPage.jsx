import { useState, useEffect } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient'
import { 
  Utensils, Copy, Check, ArrowRight, Loader2, KeyRound, X, HelpCircle, AlertCircle, Dog,
  MapPin, ShieldCheck, Sparkles, ClipboardList, Send, Radio
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'

// Replace with your actual MercadoPago Public Key
initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY || 'YOUR_PUBLIC_KEY', { locale: 'es-CL' })

// Zod Schema for validation
const eventSchema = z.object({
  childName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50),
  eventDate: z.string().min(1, 'La fecha es obligatoria'),
  eventTime: z.string().min(1, 'La hora es obligatoria'),
  location: z.string().min(5, 'La ubicación debe tener al menos 5 caracteres').max(100),
  hostEmail: z.string().email('Ingresa un correo electrónico válido'),
  securityAnswer: z.string().min(2, 'La respuesta debe tener al menos 2 caracteres').max(50)
})

export default function LandingPage({ onNavigateToAdmin, initialStep = 'home' }) {
  const [step, setStep] = useState(initialStep) // 'home' | 'form' | 'checkout' | 'processing' | 'success' | 'login' | 'recover'
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginKey, setLoginKey] = useState('')
  const [loginError, setLoginError] = useState('')
  const [showRecoverModal, setShowRecoverModal] = useState(false)
  const [recoverAnswer, setRecoverAnswer] = useState('')
  const [recoverError, setRecoverError] = useState('')
  const [recoverResult, setRecoverResult] = useState(null)
  const [recoverLoading, setRecoverLoading] = useState(false)

  // Reset step when initialStep changes (e.g., from mobile-welcome → landing with form)
  useEffect(() => {
    setStep(initialStep)
  }, [initialStep])

  // React Hook Form
  const { register, handleSubmit, formState: { errors }, getValues } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      childName: '',
      eventDate: '',
      eventTime: '16:00',
      location: '',
      hostEmail: '',
      securityAnswer: ''
    }
  })

  const [createdEvent, setCreatedEvent] = useState(null)
  const [copiedLink, setCopiedLink] = useState('')

  const [preferenceId, setPreferenceId] = useState(null)

  const handleValidFormSubmit = async () => {
    setStep('processing')
    const formData = getValues()
    // 1. Create a preference on your backend
    try {
      // Simulation of fetching preference ID
      // const response = await fetch('/api/create_preference', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })
      // const { id } = await response.json()
      // setPreferenceId(id)

      // Simulate backend response time
      await new Promise(resolve => setTimeout(resolve, 1000))
      // setPreferenceId('mock-preference-id')

      // For now, bypass actual payment creation since backend isn't ready
      // Jump directly to simulate success
      await handleSimulatePayment()
    } catch (error) {
      console.error(error)
      alert('Error creating payment preference.')
      setStep('form')
    }
  }

  const handleSimulatePayment = async () => {
    const formData = getValues()
    const eventDateTime = new Date(`${formData.eventDate}T${formData.eventTime}`)
    const defaultTimeline = [
      { id: 't1', title: 'Recogida de mascotas', time: formData.eventTime, status: 'active' },
      { id: 't2', title: 'Caminata y juego en el parque', time: addHoursToTime(formData.eventTime, 1.0), status: 'pending' },
      { id: 't3', title: 'Descanso e hidratación', time: addHoursToTime(formData.eventTime, 2.0), status: 'pending' },
      { id: 't4', title: 'Regreso y entrega a casa', time: addHoursToTime(formData.eventTime, 3.0), status: 'pending' }
    ]

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (!isSupabaseConfigured) {
        const mockId = `mock-event-${Date.now()}`
        const mockEventData = {
          id: mockId,
          child_name: formData.childName,
          event_date: eventDateTime.toISOString(),
          location: formData.location,
          host_email: formData.hostEmail,
          host_token: `mock-host-${Math.random().toString(36).substring(7)}`,
          guest_token: `mock-guest-${Math.random().toString(36).substring(7)}`,
          security_answer: formData.securityAnswer.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
          payment_status: 'paid',
          timeline: defaultTimeline,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
        localStorage.setItem(`petone_mock_event_${mockId}`, JSON.stringify(mockEventData))
        localStorage.setItem(`petone_mock_guests_${mockId}`, JSON.stringify([]))
        setCreatedEvent(mockEventData)
        setStep('success')
        return
      }

      const generateHexToken = () => {
        const arr = new Uint8Array(16)
        window.crypto.getRandomValues(arr)
        return Array.from(arr, dec => dec.toString(16).padStart(2, '0')).join('')
      }
      const hostToken = generateHexToken()
      const guestToken = generateHexToken()

      const clientWithToken = getSupabaseClient(hostToken)
      const { data, error } = await clientWithToken
        .from('events')
        .insert({
          child_name: formData.childName,
          event_date: eventDateTime.toISOString(),
          location: formData.location,
          host_email: formData.hostEmail,
          security_answer: formData.securityAnswer.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
          payment_status: 'paid',
          timeline: defaultTimeline,
          host_token: hostToken,
          guest_token: guestToken,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()

      if (error) throw error
      setCreatedEvent(data)
      setStep('success')

      // Enviar clave de acceso por email (fire-and-forget)
      if (formData.hostEmail) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        if (supabaseUrl) {
          console.log('Token generado:', hostToken)
          console.log('Token de Supabase:', data.host_token)
          console.log('¿Coinciden?', hostToken === data.host_token)
          fetch(`${supabaseUrl}/functions/v1/send-access-key`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              email: formData.hostEmail,
              childName: formData.childName,
              hostToken: data.host_token
            })
          }).catch(err => console.warn('Email send failed:', err))
        }
      }
    } catch (err) {
      console.error('Error creating event:', err)
      alert(`Error en el pago o al registrar el paseo: ${err.message || JSON.stringify(err)}`)
      setStep('form')
    }
  }

  const handleLoginWithKey = async () => {
    if (!loginKey.trim()) return
    setLoginError('')
    
    try {
      if (!isSupabaseConfigured) {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('petone_mock_event_'))
        for (const key of keys) {
          const ev = JSON.parse(localStorage.getItem(key))
          if (ev.host_token === loginKey.trim()) {
            setShowLoginModal(false)
            onNavigateToAdmin(ev.id, ev.host_token)
            return
          }
        }
        setLoginError('Clave no encontrada. Verifica e intenta de nuevo.')
        return
      }

      const client = getSupabaseClient(loginKey.trim())
      const { data: events } = await client
        .from('events')
        .select('id, host_token')
        .eq('host_token', loginKey.trim())
        .limit(1)

      if (events && events.length > 0) {
        setShowLoginModal(false)
        onNavigateToAdmin(events[0].id, events[0].host_token)
      } else {
        setLoginError('Clave no encontrada. Verifica e intenta de nuevo.')
      }
    } catch {
      setLoginError('Error al verificar la clave.')
    }
  }

  const handleRecoverKey = async () => {
    if (!recoverAnswer.trim()) return
    setRecoverError('')
    setRecoverLoading(true)
    setRecoverResult(null)

    // Rate limiting: máximo 5 intentos por hora
    const rateLimitKey = 'petone_recover_attempts'
    const attempts = JSON.parse(localStorage.getItem(rateLimitKey) || '[]')
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const recentAttempts = attempts.filter(t => t > oneHourAgo)
    
    if (recentAttempts.length >= 5) {
      setRecoverError('Demasiados intentos. Intenta de nuevo en una hora.')
      setRecoverLoading(false)
      return
    }

    // Registrar intento
    recentAttempts.push(Date.now())
    localStorage.setItem(rateLimitKey, JSON.stringify(recentAttempts))

    const normalize = (s) => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const answer = normalize(recoverAnswer)

    try {
      if (!isSupabaseConfigured) {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('petone_mock_event_'))
        for (const key of keys) {
          const ev = JSON.parse(localStorage.getItem(key))
          if (ev.security_answer === answer) {
            setRecoverResult({ token: ev.host_token, childName: ev.child_name })
            setRecoverLoading(false)
            return
          }
        }
        setRecoverError('No se encontró un evento con esa respuesta.')
        setRecoverLoading(false)
        return
      }

      const { data: events } = await supabase
        .from('events')
        .select('host_token, child_name, security_answer')
        .limit(100)

      if (!events || events.length === 0) {
        setRecoverError('No se encontró ningún evento.')
        setRecoverLoading(false)
        return
      }

      const match = events.find(ev => ev.security_answer === answer)
      if (match) {
        setRecoverResult({ token: match.host_token, childName: match.child_name })
      } else {
        setRecoverError('No se encontró un evento con esa respuesta.')
      }
    } catch {
      setRecoverError('Error al buscar el evento.')
    }
    setRecoverLoading(false)
  }

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiedLink(type)
    setTimeout(() => setCopiedLink(''), 2000)
  }

  function addHoursToTime(timeStr, hoursToAdd) {
    const [h, m] = timeStr.split(':').map(Number)
    let totalMinutes = h * 60 + m + (hoursToAdd * 60)
    const newH = Math.floor(totalMinutes / 60) % 24
    const newM = Math.floor(totalMinutes % 60)
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden">
      <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] rounded-full bg-emerald-900/10 blur-[100px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[300px] h-[300px] rounded-full bg-emerald-900/15 blur-[100px] -z-10" />

      {/* ==================== HOME ==================== */}
      {step === 'home' && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 min-h-screen flex flex-col justify-between">
          {/* Header/Nav */}
          <header className="w-full flex justify-between items-center py-4 mb-8 md:mb-12 animate-fade-in-scale delay-1">
            <div className="flex items-center gap-3">
              <img src="/logo-petone.png" alt="PetOne Logo" className="h-10 w-auto object-contain rounded-lg border border-emerald-500/10" />
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-350 bg-clip-text text-transparent leading-none">PetOne</span>
                <span className="text-[9px] text-emerald-400 font-semibold tracking-wider uppercase leading-none mt-0.5">Control de Paseos</span>
              </div>
            </div>
            <button 
              onClick={() => { setShowLoginModal(true); setLoginKey(''); setLoginError('') }} 
              className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs px-4 py-2 rounded-full border border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound size={12} />
              <span>Acceso Paseador</span>
            </button>
          </header>

          {/* Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full my-auto">
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col text-left items-start animate-fade-in-up delay-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-6">
                <Sparkles size={10} className="animate-pulse" /> Para paseadores de perros profesionales
              </span>
              
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6">
                Tus clientes saben dónde está <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-450 to-cyan-400 bg-clip-text text-transparent">su mascota. Siempre.</span>
              </h1>
              
              <p className="text-sm md:text-base text-slate-400 mb-8 max-w-lg leading-relaxed">
                Ruta GPS en vivo, fichas médicas y notificaciones automáticas. Tu servicio, más profesional. Sus mascotas, más seguras.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-4">
                <button 
                  onClick={() => setStep('form')} 
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm px-8 py-4 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] w-full sm:w-auto text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Comenzar Ahora</span>
                  <ArrowRight size={16} />
                </button>
                <button 
                  onClick={() => { setShowLoginModal(true); setLoginKey(''); setLoginError('') }} 
                  className="bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-bold text-sm px-6 py-4 rounded-xl border border-slate-800 transition-all active:scale-[0.98] w-full sm:w-auto text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound size={14} className="text-slate-400" />
                  <span>Ya tengo cuenta</span>
                </button>
              </div>
            </div>

            {/* Right Graphic Column */}
            <div className="lg:col-span-5 w-full flex justify-center lg:justify-end animate-fade-in-scale delay-3 mt-4 lg:mt-0">
              <div className="relative w-full max-w-[320px] aspect-[4/5] sm:aspect-square md:aspect-[4/5] rounded-[32px] overflow-hidden border border-emerald-500/10 shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 opacity-70" />
                <img 
                  src="/dog_hero.jpg" 
                  alt="Mascota feliz" 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                
                {/* Simulated live route badge */}
                <div className="absolute top-4 left-4 z-20 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3 flex items-center gap-2 shadow-xl">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Ruta en vivo</span>
                </div>

                {/* Simulated status overlay card */}
                <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-medium">Paseo: Rocky y amigos</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">En el parque</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs">🐕</div>
                    <div className="flex-1">
                      <div className="h-1.5 bg-slate-850 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 w-[75%]" />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">16:45</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="w-full mt-14 md:mt-20 animate-fade-in-up delay-4">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles size={10} /> Cómo funciona
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                3 pasos para un paseo profesional
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
              {/* Connector line (desktop only) */}
              <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-emerald-500/50 via-teal-500/50 to-cyan-500/50 -z-0" />

              {/* Step 1 */}
              <div className="relative flex flex-col items-center text-center group">
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mb-5 shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                  <ClipboardList size={24} className="text-white" />
                </div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2">Paso 1</span>
                <h3 className="font-bold text-sm text-white mb-1.5">Crea tu paseo</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[220px]">Llena un formulario con los datos del paseo: mascota, fecha, ruta y cuidados especiales.</p>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col items-center text-center group">
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center mb-5 shadow-lg shadow-teal-600/20 group-hover:scale-105 transition-transform">
                  <Send size={24} className="text-white" />
                </div>
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mb-2">Paso 2</span>
                <h3 className="font-bold text-sm text-white mb-1.5">Comparte con los dueños</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[220px]">La app envía un enlace único a cada dueño para que pueda seguir a su mascota en tiempo real.</p>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col items-center text-center group">
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center mb-5 shadow-lg shadow-cyan-600/20 group-hover:scale-105 transition-transform">
                  <Radio size={24} className="text-white" />
                </div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-2">Paso 3</span>
                <h3 className="font-bold text-sm text-white mb-1.5">Paseo en vivo</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[220px]">Inicia la ruta mientras los dueños ven cada paso, foto y actualización en vivo.</p>
              </div>
            </div>
          </div>

          {/* Value Props Section */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 md:mt-16 animate-fade-in-up delay-4">
            <div className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-2xl p-5 text-left transition-all duration-300 group hover:-translate-y-0.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit mb-4 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <MapPin size={18} />
              </div>
              <h3 className="font-bold text-sm text-white mb-1.5">Ruta GPS en Vivo</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Tus clientes ven cada paso en tiempo real. Sin mensajes de WhatsApp, sin llamadas. Solo tranquilidad.</p>
            </div>
            
            <div className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-2xl p-5 text-left transition-all duration-300 group hover:-translate-y-0.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit mb-4 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                <Utensils size={18} />
              </div>
              <h3 className="font-bold text-sm text-white mb-1.5">Fichas Médicas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Alergias, medicamentos y cuidados al alcance de tu mano durante el paseo.</p>
            </div>
            
            <div className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-2xl p-5 text-left transition-all duration-300 group hover:-translate-y-0.5">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 w-fit mb-4 group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-bold text-sm text-white mb-1.5">Check-out Automático</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Notificación push instantánea cuando su mascota está de vuelta en casa.</p>
            </div>
          </div>

          {/* Footer Recover Key */}
          <footer className="w-full text-center mt-12 pt-4 border-t border-slate-900/60 animate-fade-in-up delay-5">
            <button 
              onClick={() => { setShowRecoverModal(true); setRecoverAnswer(''); setRecoverError(''); setRecoverResult(null) }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors py-2 cursor-pointer"
            >
              <HelpCircle size={13} /> 
              <span>¿Olvidaste tu clave de paseo? Recupérala aquí</span>
            </button>
          </footer>
        </main>
      )}

      {/* ==================== FORMULARIO ==================== */}
      {step === 'form' && (
        <main className="max-w-lg mx-auto px-6 py-10">
          <button onClick={() => setStep('home')} className="text-xs text-slate-400 hover:text-white mb-6 flex items-center gap-1">
            ← Volver
          </button>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-white mb-1">Crea tu paseo en minutos</h2>
            <p className="text-xs text-slate-400 mb-6">Configura los datos del paseo e invita a los tutores.</p>

            <form onSubmit={handleSubmit(handleValidFormSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300">Nombre del paseador</label>
                <input type="text" placeholder="Ej: Pedro, Paseos con Luna..."
                  {...register("childName")}
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-base text-white placeholder-slate-600 focus:outline-none transition-colors ${errors.childName ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'}`} />
                {errors.childName && <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> {errors.childName.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-300">Fecha del Paseo</label>
                  <input type="date"
                    {...register("eventDate")}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-base text-white focus:outline-none transition-colors ${errors.eventDate ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'}`} />
                  {errors.eventDate && <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> {errors.eventDate.message}</span>}
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-300">Hora de Salida</label>
                  <input type="time"
                    {...register("eventTime")}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-base text-white focus:outline-none transition-colors ${errors.eventTime ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'}`} />
                  {errors.eventTime && <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> {errors.eventTime.message}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300">Sector o comuna del paseo</label>
                <input type="text" placeholder="Ej: Las Condes, Providencia..."
                  {...register("location")}
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-base text-white placeholder-slate-600 focus:outline-none transition-colors ${errors.location ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'}`} />
                {errors.location && <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> {errors.location.message}</span>}
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300">Tu Correo Electrónico (Paseador)</label>
                <input type="email" placeholder="Ej: paseador.pedro@gmail.com"
                  {...register("hostEmail")}
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-base text-white placeholder-slate-600 focus:outline-none transition-colors ${errors.hostEmail ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'}`} />
                {errors.hostEmail && <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> {errors.hostEmail.message}</span>}
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300">¿Cuál fue el nombre de tu última mascota?</label>
                <p className="text-[10px] text-slate-500 -mt-1">Úsalo para recuperar tu clave si la olvidas.</p>
                <input type="text" placeholder="Ej: Max"
                  {...register("securityAnswer")}
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-base text-white placeholder-slate-600 focus:outline-none transition-colors ${errors.securityAnswer ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'}`} />
                {errors.securityAnswer && <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> {errors.securityAnswer.message}</span>}
              </div>

              <div className="mt-2 flex flex-col sm:flex-row gap-3">
                <button type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-lg shadow-emerald-600/30">
                  Crear Paseo <ArrowRight size={16} />
                </button>
                <button type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] border border-slate-700">
                  <KeyRound size={14} /> Ya tengo cuenta
                </button>
              </div>
            </form>
          </div>
        </main>
      )}

      {/* ==================== CHECKOUT (MercadoPago) ==================== */}
      {step === 'checkout' && preferenceId && (
        <main className="max-w-md mx-auto px-6 py-16">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-left relative">
            <button onClick={() => setStep('form')} className="absolute top-6 right-6 text-xs text-slate-400 hover:text-white">Cancelar</button>
            
            <h3 className="text-xl font-bold text-white mb-1">Pago Seguro</h3>
            <p className="text-xs text-slate-400 mb-6">Completa el pago para el evento de <strong className="text-white">{getValues('childName')}</strong>.</p>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-5">
              <span className="text-[10px] text-slate-400 block">Monto a pagar</span>
              <span className="text-2xl font-black text-indigo-400">$19.990 CLP</span>
            </div>

            {/* MercadoPago Brick */}
            <div id="wallet_container">
              <Payment
                initialization={{ amount: 19990, preferenceId: preferenceId }}
                customization={{ paymentMethods: { ticket: 'all', bankTransfer: 'all', creditCard: 'all', debitCard: 'all', mercadoPago: 'all' } }}
                onSubmit={async () => {
                  // handle form submission
                  await handleSimulatePayment()
                }}
                onReady={() => {
                  console.log("Brick ready")
                }}
                onError={(error) => {
                  console.error(error)
                }}
              />
            </div>
          </div>
        </main>
      )}

      {/* ==================== PROCESANDO ==================== */}
      {step === 'processing' && (
        <main className="max-w-md mx-auto px-6 py-32 text-center flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-indigo-400 animate-spin" />
          <h3 className="text-xl font-bold text-white">Procesando Pago...</h3>
          <p className="text-xs text-slate-400">Verificando transacción e inicializando tu espacio.</p>
        </main>
      )}

      {/* ==================== ÉXITO ==================== */}
      {step === 'success' && createdEvent && (
        <main className="max-w-lg mx-auto px-6 py-10">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Dog size={24} className="text-emerald-400" />
            </div>

            <h2 className="text-2xl font-extrabold text-white mb-2">¡Paseo Creado!</h2>
            <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
              La sesión de paseo para <strong className="text-white">{createdEvent.child_name}</strong> está lista.
            </p>

            {/* Clave de acceso */}
            <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-5 mb-5">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-2">Tu Clave de Acceso del Paseador</span>
              <p className="text-[10px] text-slate-400 mb-3">Guárdala. La necesitas para volver a entrar al panel como paseador.</p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-emerald-300 truncate select-all text-center">
                  {createdEvent.host_token}
                </code>
                <button
                  onClick={() => copyToClipboard(createdEvent.host_token, 'key')}
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors shrink-0"
                >
                  {copiedLink === 'key' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <button
              onClick={() => onNavigateToAdmin(createdEvent.id, createdEvent.host_token)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-lg shadow-emerald-600/20"
            >
              Ir al Panel de Paseador <ArrowRight size={16} />
            </button>

            <button
              onClick={() => { setStep('home'); setCreatedEvent(null) }}
              className="w-full mt-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm py-3.5 rounded-xl transition-all active:scale-[0.97]"
            >
              Volver en otro momento
            </button>
          </div>
        </main>
      )}

      {/* ==================== MODAL: ENTRAR CON CLAVE ==================== */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl">
            <button onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
                <KeyRound size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-white">Entrar con Clave</h3>
              <p className="text-xs text-slate-400 mt-1">Ingresa la clave que recibiste al crear tu paseo.</p>
            </div>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={loginKey}
                onChange={(e) => { setLoginKey(e.target.value); setLoginError('') }}
                placeholder="Pega tu clave aquí"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-base text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-colors text-center font-mono"
                autoFocus
              />
              {loginError && (
                <p className="text-xs text-red-400 text-center">{loginError}</p>
              )}
              <button
                onClick={handleLoginWithKey}
                disabled={!loginKey.trim()}
                className="w-full bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold text-sm py-3 rounded-xl transition-all active:scale-[0.97]"
              >
                Ingresar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: RECUPERAR CLAVE ==================== */}
      {showRecoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowRecoverModal(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl">
            <button onClick={() => setShowRecoverModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-white">Recuperar Clave</h3>
              <p className="text-xs text-slate-400 mt-1">Ingresa la respuesta de seguridad que configuraste al crear el paseo.</p>
            </div>

            {recoverResult ? (
              <div className="text-center">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-4">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Clave recuperada</p>
                  <p className="text-xs text-slate-400 mb-2">Paseo de <strong className="text-white">{recoverResult.childName}</strong></p>
                  <code className="block bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-emerald-300 select-all break-all">
                    {recoverResult.token}
                  </code>
                </div>
                <button
                  onClick={() => { setShowRecoverModal(false); setLoginKey(recoverResult.token); setShowLoginModal(true); setRecoverResult(null) }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 rounded-xl transition-all active:scale-[0.97]"
                >
                  Usar esta clave
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={recoverAnswer}
                  onChange={(e) => { setRecoverAnswer(e.target.value); setRecoverError('') }}
                  placeholder="Nombre de tu última mascota"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-base text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  autoFocus
                />
                {recoverError && (
                  <p className="text-xs text-red-400 text-center">{recoverError}</p>
                )}
                <button
                  onClick={handleRecoverKey}
                  disabled={!recoverAnswer.trim() || recoverLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                >
                  {recoverLoading ? <><Loader2 size={14} className="animate-spin" /> Buscando...</> : 'Recuperar Clave'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
