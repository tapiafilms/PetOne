import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Eye } from 'lucide-react'

const STACK_VISIBLE = 3

function cardTransform(pos, dy) {
  const scale = 1 - pos * 0.06
  const translateY = pos * -12 + (pos === 0 ? dy : Math.max(0, dy * 0.15 * (1 - pos * 0.4)))
  const opacity = pos >= STACK_VISIBLE ? 0 : 1 - pos * 0.08
  const rotations = [0, -2, 2.5, -1.5]
  const rotateZ = rotations[pos] || 0
  return { scale, translateY, opacity, rotateZ }
}

export default function PhotoCardStack({ media = [], onTapCard, onOpenGallery }) {
  const containerRef = useRef(null)
  const elsRef = useRef([])
  const orderRef = useState(() => ({ current: [] }))[0]
  const [order, setOrder] = useState([])

  const dragRef = useRef({ active: false, startY: 0, currY: 0, prevY: 0, vel: 0 })

  // Initialize / update order when media changes
  useEffect(() => {
    const newOrder = media.map((_, i) => i)
    orderRef.current = newOrder
    setOrder([...newOrder])
  }, [media, media.length, orderRef])

  const renderStack = useCallback((animate, dy = 0) => {
    const els = elsRef.current
    const ord = orderRef.current
    ord.forEach((cardIdx, pos) => {
      const el = els[cardIdx]
      if (!el) return
      const { scale, translateY, opacity, rotateZ } = cardTransform(pos, dy)
      if (animate) {
        el.style.transition = 'transform 0.45s cubic-bezier(0.34,1.2,0.64,1), opacity 0.35s ease'
      } else {
        el.style.transition = pos === 0 ? 'none' : 'transform 0.45s cubic-bezier(0.34,1.2,0.64,1), opacity 0.35s ease'
      }
      el.style.transform = `translateY(${translateY}px) scale(${scale}) rotate(${rotateZ}deg)`
      el.style.opacity = opacity
      el.style.zIndex = 100 - pos
    })
  }, [orderRef])

  // Drag handlers
  const onStart = useCallback((y) => {
    const ord = orderRef.current
    if (ord.length === 0) return
    const frontEl = elsRef.current[ord[0]]
    if (!frontEl) return
    dragRef.current = { active: true, startY: y, currY: 0, prevY: y, vel: 0 }
    frontEl.style.transition = 'none'
    frontEl.style.cursor = 'grabbing'
  }, [orderRef])

  const onMove = useCallback((y) => {
    const d = dragRef.current
    if (!d.active) return
    d.vel = y - d.prevY
    d.prevY = y
    d.currY = y - d.startY
    if (d.currY < 0) d.currY = d.currY * 0.2
    renderStack(false, d.currY)
  }, [renderStack])

  const onEnd = useCallback(() => {
    const d = dragRef.current
    if (!d.active) return
    d.active = false
    const ord = orderRef.current
    const frontEl = elsRef.current[ord[0]]
    if (!frontEl) return
    frontEl.style.cursor = 'grab'

    const THRESHOLD = 60
    if (d.currY > THRESHOLD || d.vel > 8) {
      frontEl.style.transition = 'transform 0.4s cubic-bezier(0.4,0,1,1), opacity 0.3s ease'
      frontEl.style.transform = 'translateY(320px) scale(0.85)'
      frontEl.style.opacity = '0'
      setTimeout(() => {
        const dismissed = ord.shift()
        ord.push(dismissed)
        setOrder([...ord])
        renderStack(true, 0)
      }, 380)
    } else {
      renderStack(true, 0)
    }
    d.currY = 0
  }, [renderStack, orderRef])

  // Re-render when order changes
  useEffect(() => {
    renderStack(false, 0)
  }, [order, renderStack])

  // Touch events
  const touchRef = useRef({ startY: 0 })

  const handleTouchStart = useCallback((e) => {
    if (!containerRef.current?.contains(e.target)) return
    touchRef.current.startY = e.touches[0].clientY
    onStart(e.touches[0].clientY)
  }, [onStart])

  const handleTouchMove = useCallback((e) => {
    onMove(e.touches[0].clientY)
  }, [onMove])

  const handleTouchEnd = useCallback((e) => {
    const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.startY)
    const wasTap = dy < 10
    onEnd()
    if (wasTap) {
      const ord = orderRef.current
      if (ord.length > 0 && onTapCard) onTapCard(media[ord[0]])
    }
  }, [onEnd, onTapCard, media, orderRef])

  // Mouse events (desktop)
  const mouseRef = useRef({ active: false, startY: 0 })

  const handleMouseDown = useCallback((e) => {
    if (!containerRef.current?.contains(e.target)) return
    if (e.target.closest('.stack-arrow-btn')) return
    e.preventDefault()
    mouseRef.current = { active: true, startY: e.clientY }
    onStart(e.clientY)

    const onMouseMove = (e) => onMove(e.clientY)
    const onMouseUp = (e) => {
      const dy = Math.abs(e.clientY - mouseRef.current.startY)
      const wasTap = dy < 8
      onEnd()
      if (wasTap) {
        const ord = orderRef.current
        if (ord.length > 0 && onTapCard) onTapCard(media[ord[0]])
      }
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [onStart, onMove, onEnd, onTapCard, media, orderRef])

  useEffect(() => {
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchMove, handleTouchEnd])

  if (media.length === 0) return null

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Card Stack */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onMouseDown={handleMouseDown}
        className="relative w-full"
        style={{ height: '210px', touchAction: 'none' }}
      >
        {media.map((item, i) => (
          <div
            key={item.id || i}
            ref={(el) => { elsRef.current[i] = el }}
            className="absolute left-0 right-0 rounded-2xl overflow-hidden border border-slate-800/50 bg-slate-900 shadow-2xl select-none"
            style={{
              height: '185px',
              cursor: 'grab',
              willChange: 'transform, opacity',
              WebkitUserSelect: 'none',
              userSelect: 'none',
            }}
          >
            {/* Photo/Video */}
            {item.media_type === 'photo' ? (
              <img
                src={item.url}
                alt="Foto"
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0">
                <video src={item.url} className="w-full h-full object-cover" muted draggable={false} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play size={28} className="text-white opacity-80" />
                </div>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* Arrow / View button */}
            <button
              onClick={(e) => { e.stopPropagation(); onTapCard?.(item) }}
              className="stack-arrow-btn absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors"
            >
              <Eye size={14} className="text-white" />
            </button>

            {/* Label */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="text-xs font-bold text-white/90">
                {item.media_type === 'photo' ? 'Foto' : 'Video'}
              </div>
              <div className="text-[10px] text-white/50 mt-0.5">
                Desliza para ver más
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ver todas */}
      {media.length > STACK_VISIBLE && (
        <button
          onClick={onOpenGallery}
          className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
        >
          <Eye size={13} />
          Ver todas ({media.length})
        </button>
      )}
    </div>
  )
}
