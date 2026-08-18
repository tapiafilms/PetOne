import { useState, useRef, useCallback } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

export default function SplashScreen({ onComplete }) {
  const [fading, setFading] = useState(false)
  const [muted, setMuted] = useState(true)
  const videoRef = useRef(null)

  const handleEnd = useCallback(() => {
    setFading(true)
    setTimeout(() => onComplete(), 600)
  }, [onComplete])

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted
      setMuted(!muted)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-5">
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950">
        <video
          ref={videoRef}
          src="/intro-petone.mp4"
          autoPlay
          playsInline
          muted
          onEnded={handleEnd}
          className={`w-full h-full object-cover transition-opacity duration-500 ease-out ${
            fading ? 'opacity-0' : 'opacity-100'
          }`}
        />
        {/* Emerald tint overlay */}
        <div className="absolute inset-0 bg-emerald-900/10 pointer-events-none" />
        {/* Fade overlay */}
        <div className={`absolute inset-0 bg-slate-950 transition-opacity duration-500 ease-out ${
          fading ? 'opacity-100' : 'opacity-0'
        }`} />
        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="absolute top-4 right-4 z-10 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
    </div>
  )
}
