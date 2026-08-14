import React from 'react'
import { Clock, CheckCircle2, Play, AlertCircle } from 'lucide-react'

/**
 * Componente Timeline reusable.
 * @param {Array} items - Listado de elementos del timeline [{id, title, time, status}]
 * @param {Function} onToggleStatus - Callback al cambiar estado (opcional, solo para admin)
 * @param {boolean} isAdmin - Indica si el usuario es administrador (habilita controles)
 */
export default function Timeline({ items = [], onToggleStatus, isAdmin = false }) {
  if (!items || items.length === 0) {
    return <p className="text-xs text-slate-500 italic">No hay itinerario programado.</p>
  }

  return (
    <div className="relative border-l-2 border-slate-800 pl-6 ml-4 flex flex-col gap-8 py-2">
      {items.map((item) => {
        const isActive = item.status === 'active'
        const isDone = item.status === 'done'
        const isPending = item.status === 'pending'

        return (
          <div key={item.id} className="relative text-left">
            
            {/* Punto indicador de estado en la línea temporal */}
            <span className={`absolute left-[-31px] top-1 w-4 h-4 rounded-full border-2 bg-slate-950 transition-all ${
              isActive 
                ? 'border-indigo-500 ring-4 ring-indigo-500/10' 
                : isDone 
                ? 'border-emerald-500 bg-emerald-500' 
                : 'border-slate-700'
            }`} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex-1">
                {/* Hora */}
                <span className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : isDone 
                    ? 'bg-emerald-500/5 text-emerald-500 border border-emerald-500/10'
                    : 'bg-slate-900 text-slate-500 border border-slate-850'
                }`}>
                  <Clock size={11} />
                  {item.time} hrs
                </span>

                {/* Título de Actividad */}
                <h4 className={`font-bold text-sm sm:text-base mt-2 transition-colors ${
                  isActive 
                    ? 'text-white text-shadow-sm shadow-indigo-500/20' 
                    : isDone 
                    ? 'text-slate-500 line-through' 
                    : 'text-slate-400'
                }`}>
                  {item.title}
                </h4>
              </div>

              {/* Botón de control (solo para Administrador) */}
              {isAdmin && onToggleStatus && (
                <button
                  onClick={() => onToggleStatus(item.id, item.status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all active:scale-[0.97] flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                      : isDone
                      ? 'bg-slate-900 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-750 hover:text-white'
                  }`}
                >
                  {isPending && (
                    <>
                      <Play size={12} />
                      Comenzar
                    </>
                  )}
                  {isActive && (
                    <>
                      <CheckCircle2 size={12} className="animate-pulse" />
                      Finalizar
                    </>
                  )}
                  {isDone && (
                    <>
                      <AlertCircle size={12} />
                      Reiniciar
                    </>
                  )}
                </button>
              )}

              {/* Tag de estado (solo para Invitado) */}
              {!isAdmin && isActive && (
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full animate-pulse w-fit">
                  ⚡ En Progreso
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
