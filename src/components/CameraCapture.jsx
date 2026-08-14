import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react'

export default function CameraCapture({ onClose, onCaptureComplete, type = 'photo', onError }) {
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const stopRecordingRef = useRef(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment') // 'environment' | 'user'
  const [isRecording, setIsRecording] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(15)
  const timerRef = useRef(null)

  // Inicializar la cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    // Detener cualquier stream anterior
    stopCamera()

    try {
      const constraints = {
        video: { 
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: type === 'video'
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setLoading(false)
    } catch (err) {
      console.error('Error starting camera:', err)
      setError('No se pudo acceder a la cámara. Por favor verifica los permisos.')
      setLoading(false)
    }
  }, [facingMode, type, stopCamera])

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera])

  // Cambiar entre cámara frontal y trasera
  const handleToggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  // Tomar Foto (Capturar Canvas)
  const handleTakePhonePhoto = () => {
    if (!videoRef.current || !streamRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    
    // Si es cámara frontal, voltear horizontalmente para efecto espejo
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    canvas.toBlob((blob) => {
      if (blob) {
        onCaptureComplete(blob)
      }
    }, 'image/jpeg', 0.8)
  }

  // Iniciar/Detener Grabación de Video
  const handleStartRecording = () => {
    if (!streamRef.current) return

    chunksRef.current = []
    let options = { mimeType: 'video/webm;codecs=vp9,opus' }
    
    // Alternativas de codecs para mayor compatibilidad (ej. iOS Safari)
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8,opus' }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/mp4' }
      }
    }

    try {
      const recorder = new MediaRecorder(streamRef.current, options)
      mediaRecorderRef.current = recorder
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorderRef.current.mimeType || 'video/mp4' })
        onCaptureComplete(blob)
      }

      recorder.start()
      setIsRecording(true)
      setSecondsLeft(15)

      // Iniciar contador en reversa de 15 segundos
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            if (stopRecordingRef.current) stopRecordingRef.current()
            return 0
          }
          return prev - 1
        })
      }, 1000)

    } catch (err) {
      console.error('Error starting MediaRecorder:', err)
      alert('Tu navegador no soporta grabación de video integrada.')
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  // Store stop function in ref for timer callback
  useEffect(() => {
    stopRecordingRef.current = handleStopRecording
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black text-white overflow-hidden" style={{ height: '100dvh' }}>
      {/* Barra superior de control */}
      <div className="shrink-0 flex justify-between items-center px-6 py-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10 safe-area-top">
        <button 
          onClick={onClose}
          className="p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
        {type === 'video' && isRecording && (
          <div className="flex items-center gap-2 bg-red-600 px-4 py-1.5 rounded-full text-xs font-bold animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full" />
            <span>0:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}</span>
          </div>
        )}
        <button 
          onClick={handleToggleCamera}
          disabled={loading || error || isRecording}
          className="p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Visor de Cámara */}
      <div className="flex-1 relative flex items-center justify-center bg-black min-h-0 overflow-hidden pt-14">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950">
            <Loader2 size={36} className="text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400">Encendiendo cámara...</p>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center">
            <AlertTriangle size={40} className="text-amber-500" />
            <p className="text-sm text-slate-300">{error}</p>
            <button 
              onClick={() => {
                if (onError) onError()
                else onClose()
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl cursor-pointer"
            >
              Usar selector de archivos tradicional
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Barra de progreso de video */}
        {type === 'video' && isRecording && (
          <div className="absolute bottom-4 left-6 right-6 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-1000 ease-linear"
              style={{ width: `${((15 - secondsLeft) / 15) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Panel inferior de disparo */}
      <div className="shrink-0 h-24 bg-black flex items-center justify-center safe-area-bottom">
        {type === 'photo' ? (
          <button
            onClick={handleTakePhonePhoto}
            disabled={loading || error}
            className="w-16 h-16 rounded-full bg-white border-4 border-slate-350 hover:bg-slate-100 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-white border border-slate-300" />
          </button>
        ) : (
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={loading || error}
            className="w-16 h-16 rounded-full bg-red-600 border-4 border-white hover:bg-red-500 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer flex items-center justify-center"
          >
            {isRecording ? (
              <div className="w-6 h-6 bg-white rounded-md" />
            ) : (
              <div className="w-8 h-8 bg-red-600 rounded-full border border-white" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
