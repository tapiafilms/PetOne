import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import ProviderCard from './ProviderCard'
import { Loader2 } from 'lucide-react'

const MOCK_PROVIDERS = [
  { id: 'p1', name: 'Mago Balbi', category: 'animador', zone: 'Santiago Oriente', phone: '+56999998888', price_range: '$$$', notes: 'Show de magia interactivo de 45 mins. Ideal para niños de 5 a 10 años.' },
  { id: 'p2', name: 'Tía Carito Animaciones', category: 'animador', zone: 'Santiago Norte / Centro', phone: '+56911112222', price_range: '$$', notes: 'Pinta caritas, globoflexia y juegos grupales dinámicos.' },
  { id: 'p3', name: 'Catering Petit-Gourmet', category: 'catering', zone: 'Toda la RM', phone: '+56933334444', price_range: '$$$', notes: 'Pizzas infantiles, jugos naturales y carritos de hot-dogs gourmet.' },
  { id: 'p4', name: 'Globos Mágicos Deco', category: 'decoracion', zone: 'Santiago Sur', phone: '+56955556666', price_range: '$', notes: 'Arcos orgánicos de globos temáticos, fondos fotográficos y mesas decoradas.' },
  { id: 'p5', name: 'Foto-Infantil Chile', category: 'fotografia', zone: 'Toda la RM', phone: '+56977778888', price_range: '$$', notes: 'Fotógrafo profesional especialista en capturar momentos espontáneos de niños.' }
]

export default function ProviderDirectory({ eventName }) {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    async function loadProviders() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('providers')
          .select('*')

        if (error || !data || data.length === 0) {
          setProviders(MOCK_PROVIDERS)
        } else {
          setProviders(data)
        }
      } catch (err) {
        console.error('Error fetching providers, loading mocks:', err)
        setProviders(MOCK_PROVIDERS)
      } finally {
        setLoading(false)
      }
    }

    loadProviders()
  }, [])

  const filteredProviders = activeFilter === 'all'
    ? providers
    : providers.filter(p => p.category === activeFilter)

  const filterOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'animador', label: 'Animación' },
    { value: 'catering', label: 'Comida' },
    { value: 'decoracion', label: 'Decoración' },
    { value: 'fotografia', label: 'Foto' }
  ]

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Explicación y Filtros */}
      <div className="flex flex-col gap-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          Directorio curado de proveedores locales recomendados para tu evento. Cotiza y contrata directamente sin intermediarios ni tarifas adicionales.
        </p>

        {/* Botones de Filtro */}
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {filterOptions.map(option => (
            <button
              type="button"
              key={option.value}
              onClick={() => setActiveFilter(option.value)}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                activeFilter === option.value
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                  : 'bg-slate-950 border-slate-850 text-slate-450 hover:border-slate-800 hover:text-slate-350'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Proveedores */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500 text-xs">
          <Loader2 size={16} className="animate-spin mr-2" />
          Cargando directorio...
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs italic">
          No hay proveedores registrados en esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProviders.map(provider => (
            <ProviderCard 
              key={provider.id} 
              provider={provider} 
              eventName={eventName} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
