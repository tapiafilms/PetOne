import { useState } from 'react'
import { ArrowRight, KeyRound, X } from 'lucide-react'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient'

export default function MobileWelcome({ onNavigateToAdmin, onStartCreate }) {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginKey, setLoginKey] = useState('')
  const [loginError, setLoginError] = useState('')

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

  return (
    <div className="relative min-h-dvh bg-[#020617] text-white flex flex-col items-center justify-center overflow-hidden px-6 text-center font-sans">
      {/* Subtle background glow */}
      <div className="absolute top-[20%] left-[15%] w-[200px] h-[200px] rounded-full bg-emerald-950/20 blur-[80px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[15%] w-[200px] h-[200px] rounded-full bg-teal-950/20 blur-[80px] pointer-events-none z-0" />

      <main className="relative z-10 max-w-sm flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="animate-fade-in-scale delay-1">
          <img
            src="/logo-petone.png"
            alt="PetOne Logo"
            className="w-28 h-auto object-contain rounded-2xl border border-emerald-500/10 shadow-2xl bg-[#020617]/40 backdrop-blur-sm p-3"
          />
        </div>

        {/* Tagline */}
        <div className="flex flex-col gap-2 animate-fade-in-up delay-2">
          <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
            Tu mascota, <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">siempre a la vista.</span>
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            Ruta GPS en vivo, fichas médicas y notificaciones automáticas para tus paseos.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 w-full animate-fade-in-up delay-3">
          <button
            onClick={onStartCreate}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-lg shadow-emerald-600/20"
          >
            Comenzar Ahora
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => { setShowLoginModal(true); setLoginKey(''); setLoginError('') }}
            className="w-full bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-bold text-sm py-4 rounded-xl border border-slate-800 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
          >
            <KeyRound size={14} className="text-slate-400" />
            Ya tengo cuenta
          </button>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-4 animate-fade-in-up delay-4">
          <div className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </div>
          <span>Preparando el terreno para tu manada</span>
        </div>
      </main>

      {/* Modal: Entrar con Clave */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 pb-8 sm:p-8 w-full max-w-sm shadow-2xl animate-fade-in-up">
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
    </div>
  )
}
