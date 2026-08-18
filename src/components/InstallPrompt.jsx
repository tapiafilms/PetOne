import React, { useState, useEffect } from 'react'
import { Smartphone, Download, Share2, PlusSquare, X } from 'lucide-react'

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [platform, setPlatform] = useState('') // 'ios' | 'android' | ''
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    // 1. Verificar si ya está en modo standalone (instalada)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if (isStandalone) return

    // 2. Detectar Plataforma
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIos = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)

    if (isIos) {
      setPlatform('ios')
      // Mostrar prompt en iOS después de unos segundos (retardo amigable)
      const timer = setTimeout(() => setShowPrompt(true), 3000)
      return () => clearTimeout(timer)
    } else if (isAndroid) {
      setPlatform('android')

      // Escuchar el evento de instalación de Android
      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setShowPrompt(true)
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl z-50 text-left backdrop-blur-xl animate-bounce-in">
      <button 
        onClick={() => setShowPrompt(false)}
        className="absolute top-4 right-4 text-slate-450 hover:text-white cursor-pointer"
      >
        <X size={16} />
      </button>

      <div className="flex gap-4 items-start">
        <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 shrink-0">
          <Smartphone size={20} className="animate-pulse" />
        </div>

        <div className="flex-1">
          <h4 className="font-extrabold text-sm text-white">Instalar App PetOne</h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Instala la aplicación en tu celular para activar el **Check-Out de Entrega Segura** y recibir alertas en tiempo real.
          </p>

          {/* Prompt de Android (Acción directa) */}
          {platform === 'android' && (
            <button
              onClick={handleInstallAndroid}
              className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/15"
            >
              <Download size={13} />
              Instalar Ahora
            </button>
          )}

          {/* Prompt de iOS (Instrucciones) */}
          {platform === 'ios' && (
            <div className="mt-3 border-t border-slate-850 pt-3 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-emerald-400 block uppercase tracking-wider">
                Instrucciones para iPhone:
              </span>
              <div className="flex flex-col gap-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-950 flex items-center justify-center font-bold text-[9px] text-slate-300">1</span>
                  <span>Toca el botón compartir de Safari: <Share2 size={12} className="inline text-slate-300 mx-0.5" /></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-950 flex items-center justify-center font-bold text-[9px] text-slate-300">2</span>
                  <span>Selecciona **"Agregar a pantalla de inicio"** <PlusSquare size={12} className="inline text-slate-300 mx-0.5" /></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
