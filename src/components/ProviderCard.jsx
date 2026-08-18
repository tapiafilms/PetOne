import React from 'react'
import { generateWhatsAppLink } from '../lib/waLink'
import { Send, MapPin } from 'lucide-react'

export default function ProviderCard({ provider }) {
  const getPrefilledMessage = () => {
    return `¡Hola ${provider.name}! Vi tu servicio en PetOne. Quisiera cotizar tus servicios de ${provider.category} para mi mascota. ¿Tienes disponibilidad?`
  }

  const waLink = generateWhatsAppLink(provider.phone, getPrefilledMessage())

  const categoryLabels = {
    veterinario: '🏥 Veterinario',
    tienda: '🛍️ Pet Shop',
    entrenador: '🦮 Entrenador / Conducta',
    paseador: '🐾 Paseador',
    otro: '✨ Otros Servicios'
  }

  return (
    <div className="bg-slate-950/60 border border-slate-850 hover:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 text-left transition-all hover:translate-y-[-2px] shadow-lg shadow-black/20">
      <div className="flex flex-col gap-2">
        {/* Categoría y Precio */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {categoryLabels[provider.category] || provider.category}
          </span>
          <span className="flex text-amber-500 text-xs">
            {provider.price_range || '$$'}
          </span>
        </div>

        {/* Nombre */}
        <h4 className="font-extrabold text-base text-white mt-1">
          {provider.name}
        </h4>

        {/* Zona */}
        <div className="flex items-center gap-1 text-[11px] text-slate-450 mt-0.5">
          <MapPin size={11} className="text-slate-500" />
          <span>{provider.zone}</span>
        </div>

        {/* Notas / Descripción */}
        <p className="text-xs text-slate-400 leading-relaxed mt-2 line-clamp-3">
          {provider.notes || 'Sin descripción detallada por ahora.'}
        </p>
      </div>

      {/* Botón de Contacto */}
      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        className="w-full bg-slate-900 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 hover:text-indigo-300 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
      >
        <Send size={13} />
        Cotizar por WhatsApp
      </a>
    </div>
  )
}
