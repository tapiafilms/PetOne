import { useState, useEffect, useRef, useCallback } from 'react'

export default function SplashScreen({ onComplete }) {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    // Iniciar con un fade-in suave después del montaje
    const timer = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(timer)
  }, [])

  const handleEnd = useCallback(() => {
    setFading(true)
    setTimeout(() => onComplete(), 600)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[100] bg-[#020617] flex items-center justify-center p-5">
      {/* Fondo contenedor: azul oscuro de la app (#020617) */}
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-[#020617]">
        <video
          ref={videoRef}
          src="/intro-petone.mp4"
          autoPlay
          playsInline
          muted
          onEnded={handleEnd}
          className={`w-full h-full object-cover mix-blend-screen transition-opacity duration-1000 ease-in-out ${
            !visible || fading ? 'opacity-0' : 'opacity-100'
          }`}
        />
        
        {/* Capa de fundido al terminar el video (hacia el fondo de la app) */}
        <div className={`absolute inset-0 bg-[#020617] transition-opacity duration-500 ease-out pointer-events-none ${
          fading ? 'opacity-100' : 'opacity-0'
        }`} />
      </div>
    </div>
  )
}
