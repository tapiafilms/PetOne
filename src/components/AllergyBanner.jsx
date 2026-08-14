import React from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Banner de alergias críticas para el panel de administración.
 * @param {Array} guests - Lista completa de invitados del evento
 */
export default function AllergyBanner({ guests = [] }) {
  // Filtrar invitados confirmados con alergias cargadas
  const guestsWithAllergies = guests.filter(
    g => g.rsvp_status === 'yes' && g.allergies && g.allergies.trim() !== ''
  )

  if (guestsWithAllergies.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-4 sm:p-5 text-left flex gap-4 items-start shadow-xl shadow-amber-950/5">
      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
        <AlertTriangle size={20} className="animate-pulse" />
      </div>
      <div className="flex-1">
        <h4 className="font-extrabold text-sm sm:text-base text-amber-300 flex items-center gap-1.5">
          Restricciones Alimentarias Detectadas ({guestsWithAllergies.length})
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Ten en cuenta estas alertas al momento de entregar comida, premios o snacks:
        </p>
        
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {guestsWithAllergies.map((guest) => (
            <div 
              key={guest.id} 
              className="bg-slate-950/80 border border-slate-850 rounded-xl p-3 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">
                  {guest.child_guest_name}
                </span>
                <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Cuidado
                </span>
              </div>
              <p className="text-xs text-amber-300 font-medium">
                {guest.allergies}
              </p>
              {guest.special_conditions && (
                <p className="text-[10px] text-slate-450 italic mt-0.5 border-t border-slate-900 pt-1">
                  Nota: {guest.special_conditions}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
