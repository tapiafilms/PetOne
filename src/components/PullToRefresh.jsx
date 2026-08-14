import { useState, useRef, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

const PULL_THRESHOLD = 80
const MAX_PULL = 130

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const isPulling = useRef(false)
  const contentRef = useRef(null)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const handleTouchStart = (e) => {
      if (isRefreshing) return
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
      if (scrollTop > 5) return
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }

    const handleTouchMove = (e) => {
      if (!isPulling.current || isRefreshing) return
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
      if (scrollTop > 5) {
        setPullDistance(0)
        return
      }
      const currentY = e.touches[0].clientY
      const diff = currentY - startY.current
      if (diff > 0) {
        e.preventDefault()
        setPullDistance(Math.min(diff * 0.5, MAX_PULL))
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling.current) return
      isPulling.current = false

      setPullDistance(prev => {
        if (prev >= PULL_THRESHOLD && !isRefreshing) {
          setIsRefreshing(true)
          onRefresh().finally(() => setIsRefreshing(false))
        }
        return 0
      })
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isRefreshing, onRefresh])

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1)
  const showIndicator = pullDistance > 10 || isRefreshing

  return (
    <div ref={contentRef}>
      {/* Pull indicator */}
      <div
        className="fixed top-0 left-0 right-0 flex justify-center pointer-events-none z-50"
        style={{
          transform: `translateY(${isRefreshing ? 56 : pullDistance - 20}px)`,
          opacity: showIndicator ? 1 : 0,
          transition: (isRefreshing || pullDistance > 0) ? 'none' : 'opacity 0.2s'
        }}
      >
        <div className="flex items-center gap-2 bg-slate-900/95 border border-slate-700/60 rounded-full px-4 py-2.5 shadow-2xl backdrop-blur-md">
          <RefreshCw
            size={15}
            className={`text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`}
            style={!isRefreshing ? { transform: `rotate(${progress * 360}deg)` } : undefined}
          />
          <span className="text-[11px] text-slate-300 font-semibold whitespace-nowrap">
            {isRefreshing ? 'Actualizando...' : progress >= 1 ? 'Soltar para actualizar' : 'Arrastra hacia abajo'}
          </span>
        </div>
      </div>

      {/* Content with pull animation */}
      <div
        style={{
          transform: `translateY(${isRefreshing ? 50 : pullDistance * 0.3}px)`,
          transition: (pullDistance > 0 || isRefreshing) ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  )
}
