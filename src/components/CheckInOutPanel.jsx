import React, { useState } from 'react'
import { Search, ShieldCheck, LogOut, Check, Copy, Send } from 'lucide-react'
import { generateWhatsAppLink } from '../lib/waLink'

/**
 * Panel dedicado al control de Check-In/Out en la puerta del evento.
 * @param {Array} guests - Lista completa de invitados
 * @param {Function} onCheckoutToggle - Función para alternar el retiro de una mascota
 * @param {string} eventId - ID del evento
 */
export default function CheckInOutPanel({ guests = [], onCheckoutToggle, eventId }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all' | 'inside' | 'outside'
  const [copiedId, setCopiedId] = useState('')

  // Filtrar invitados confirmados (solo los confirmados ingresan a la fiesta)
  const confirmedGuests = guests.filter(g => g.rsvp_status === 'yes')

  const filteredGuests = confirmedGuests.filter(guest => {
    const matchesSearch = guest.child_guest_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          guest.parent_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const isCheckedOut = guest.checked_out?.status
    
    if (filterType === 'inside') {
      return matchesSearch && !isCheckedOut
    } else if (filterType === 'outside') {
      return matchesSearch && isCheckedOut
    }
    return matchesSearch
  })

  const copyToClipboard = async (text, guestId) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(guestId)
      setTimeout(() => setCopiedId(''), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedId(guestId)
      setTimeout(() => setCopiedId(''), 2000)
    }
  }

  const getWhatsAppMessage = (guest) => {
    const personalLink = `${window.location.origin}/?e=${eventId}&t=${guest.personal_token}`
    return `¡Hola ${guest.parent_name}! Aquí tienes el link único de ${guest.child_guest_name} para el paseo con PetOne. Desde este link podrás ver la ubicación GPS en tiempo real en el mapa, ver fotos en vivo de la ruta y enviarnos mensajes: ${personalLink}`
  }

  const insideCount = confirmedGuests.filter(g => !g.checked_out?.status).length
  const outsideCount = confirmedGuests.filter(g => g.checked_out?.status).length

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-850 pb-4">
        <div>
          <h3 className="text-lg font-extrabold text-white">Control de Entrega y Retiro</h3>
          <p className="text-xs text-slate-450 mt-0.5">
            Marca cuando la mascota regrese a salvo con su tutor y notifica por WhatsApp.
          </p>
        </div>
        
        {/* Contadores rápidos */}
        <div className="flex gap-2 text-xs">
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-xl font-bold">
            {insideCount} en paseo
          </span>
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-xl font-bold">
            {outsideCount} entregados
          </span>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por perro o tutor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-450 hover:text-slate-300'}`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilterType('inside')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${filterType === 'inside' ? 'bg-slate-800 text-white' : 'text-slate-450 hover:text-slate-350'}`}
          >
            En Paseo
          </button>
          <button
            type="button"
            onClick={() => setFilterType('outside')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${filterType === 'outside' ? 'bg-slate-800 text-white' : 'text-slate-450 hover:text-slate-350'}`}
          >
            Entregados
          </button>
        </div>
      </div>

      {/* Lista de Invitados para Control */}
      {filteredGuests.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs italic">
          No encontramos perros confirmados que coincidan con la búsqueda.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredGuests.map(guest => {
            const isCheckedOut = guest.checked_out?.status
            const personalLink = `${window.location.origin}/?e=${eventId}&t=${guest.personal_token}`
            
            return (
              <div 
                key={guest.id}
                className={`border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                  isCheckedOut 
                    ? 'border-emerald-500/20 bg-emerald-500/5' 
                    : 'border-slate-850 bg-slate-950/40 hover:border-slate-800'
                }`}
              >
                {/* Detalles de la Mascota */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-bold text-sm sm:text-base ${isCheckedOut ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {guest.child_guest_name}
                    </h4>
                    {guest.allergies && (
                      <span className="text-[9px] font-black bg-amber-500/10 border border-amber-500/25 text-amber-400 px-2 py-0.5 rounded-full uppercase">
                        ⚠️ Cuidados
                      </span>
                    )}
                  </div>
                  
                  <span className="text-xs text-slate-400 block mt-1">
                    Tutor: {guest.parent_name} ({guest.parent_phone || 'Sin WhatsApp'})
                  </span>

                  {/* Listado rápido de direcciones autorizados a retirarlo */}
                  <div className="mt-2 text-[11px] text-slate-450 leading-relaxed">
                    <strong className="text-slate-400">Instrucciones de Retiro/Entrega:</strong> {Array.isArray(guest.authorized_pickups) ? guest.authorized_pickups.join(' | ') : 'Sin instrucciones'}
                  </div>
                </div>

                {/* Botón de Check-Out y Acciones */}
                <div className="flex flex-col items-end gap-3 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => onCheckoutToggle(guest.id, guest.child_guest_name, isCheckedOut)}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 ${
                      isCheckedOut
                        ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-semibold'
                        : 'bg-emerald-650 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-650/10'
                    }`}
                  >
                    {isCheckedOut ? (
                      <>
                        <ShieldCheck size={14} />
                        Entregado Seguro
                      </>
                    ) : (
                      <>
                        <LogOut size={14} />
                        Marcar Entregado
                      </>
                    )}
                  </button>

                  {/* Links de soporte */}
                  <div className="flex items-center gap-2 w-full justify-between sm:justify-end">
                    <button
                      onClick={() => copyToClipboard(personalLink, guest.id)}
                      className="text-[10px] text-slate-450 hover:text-slate-350 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === guest.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      Link único
                    </button>
                    
                    {guest.parent_phone && (
                      <a
                        href={generateWhatsAppLink(guest.parent_phone, getWhatsAppMessage(guest))}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Send size={11} />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
