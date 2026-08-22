import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Image as ImageIcon, ZoomIn, Play, Download, X } from 'lucide-react'

export default function PhotoGallery({ media = [] }) {
  const [activeMedia, setActiveMedia] = useState(null)
  const [modalState, setModalState] = useState('closed') // closed | opening | open | closing

  const openModal = useCallback((item) => {
    setActiveMedia(item)
    setModalState('opening')
  }, [])

  const closeModal = useCallback(() => {
    setModalState('closing')
  }, [])

  useEffect(() => {
    if (modalState === 'opening') {
      const frame = requestAnimationFrame(() => {
        setModalState('open')
      })
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
      // Fallback: abrir en pestaña nueva
      window.open(url, '_blank')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Grid de Fotos y Videos */}
      {media.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-2xl py-12 px-6 text-center flex flex-col items-center gap-3">
          <ImageIcon size={32} className="text-slate-655" />
          <div>
            <span className="text-xs font-bold text-slate-400 block">Álbum de fotos vacío</span>
            <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
              Las fotos del paseo aparecerán aquí.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 max-h-[450px] overflow-y-auto pr-1">
          {media.map((item, i) => (
            <div 
              key={item.id || i}
              onClick={() => openModal(item)}
              className="relative aspect-square rounded-xl overflow-hidden border border-slate-850 bg-slate-900 group cursor-pointer"
            >
              {item.media_type === 'photo' ? (
                <img 
                  src={item.url} 
                  alt="Foto de paseo" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full relative">
                  <video 
                    src={item.url} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play size={20} className="text-white opacity-85" />
                  </div>
                </div>
              )}
              
              <div 
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
              >
                <ZoomIn size={18} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Pantalla Completa — via Portal */}
      {activeMedia && createPortal(
        <div className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm ${modalState === 'closing' ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}`} style={{ height: '100dvh' }}>
          {/* Header */}
          <div className={`absolute top-0 left-0 right-0 flex justify-between items-center px-4 py-3 z-10 safe-area-top ${modalState === 'closing' ? 'modal-header-exit' : 'modal-header-enter'}`}>
            <button
              onClick={() => handleDownload(activeMedia.url, `${activeMedia.media_type}-${activeMedia.id || Date.now()}`)}
              className="px-4 py-2 bg-slate-900/80 border border-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-850 active:scale-95 transition-all cursor-pointer shadow-lg"
            >
              <Download size={14} />
              Descargar
            </button>
            <button 
              onClick={closeModal}
              className="p-2 bg-slate-900/80 border border-slate-800 text-white rounded-full hover:bg-slate-850 cursor-pointer shadow-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Media Container */}
          <div className={`w-full h-full flex items-center justify-center p-4 pt-14 overflow-auto ${modalState === 'closing' ? 'modal-content-exit' : 'modal-content-enter'}`}>
            {activeMedia.media_type === 'photo' ? (
              <img 
                src={activeMedia.url} 
                alt="Full View" 
                className="max-w-full max-h-full object-contain rounded-2xl border border-slate-850 shadow-2xl"
              />
            ) : (
              <video 
                src={activeMedia.url} 
                controls 
                autoPlay
                className="max-w-full max-h-full object-contain rounded-2xl border border-slate-850 shadow-2xl"
              />
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
