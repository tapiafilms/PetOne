import React, { useState } from 'react'
import { 
  Check, X, User, Phone, Mail, 
  Trash2, Plus, ArrowRight, ShieldCheck, Loader2
} from 'lucide-react'

export default function RsvpForm({ event, onRegisterSuccess }) {
  const [rsvpStatus, setRsvpStatus] = useState(null) // 'yes' | 'no' | null
  const [childName, setChildName] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  
  // Sensibilidades alimentarias de mascotas
  const [commonAllergies, setCommonAllergies] = useState({
    Pollo: false,
    Granos: false,
    Lácteos: false,
    Vacuno: false
  })
  const [otherAllergies, setOtherAllergies] = useState('')
  
  // Condiciones Especiales
  const [specialConditions, setSpecialConditions] = useState('')
  
  // Personas autorizadas a retiro (dinámico)
  const [authorizedPickups, setAuthorizedPickups] = useState([''])

  const [submitting, setSubmitting] = useState(false)

  const handleAllergyChange = (key) => {
    setCommonAllergies(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleAddPickup = () => {
    setAuthorizedPickups(prev => [...prev, ''])
  }

  const handleRemovePickup = (index) => {
    setAuthorizedPickups(prev => prev.filter((_, i) => i !== index))
  }

  const handlePickupChange = (index, value) => {
    setAuthorizedPickups(prev => prev.map((item, i) => i === index ? value : item))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Recopilar alergias activadas
      const allergiesList = Object.keys(commonAllergies)
        .filter(key => commonAllergies[key])
        .concat(otherAllergies.trim() ? [otherAllergies.trim()] : [])
        .join(', ')

      // Filtrar y agregar direcciones/instrucciones de retiro y entrega
      const pickups = authorizedPickups
        .map(name => name.trim())
        .filter(name => name !== '')

      const guestData = {
        child_guest_name: childName.trim(),
        parent_name: rsvpStatus === 'yes' ? parentName.trim() : '',
        parent_phone: rsvpStatus === 'yes' ? parentPhone.trim() : null,
        parent_email: rsvpStatus === 'yes' ? parentEmail.trim() : null,
        rsvp_status: rsvpStatus,
        allergies: rsvpStatus === 'yes' && allergiesList ? allergiesList : null,
        special_conditions: rsvpStatus === 'yes' && specialConditions.trim() ? specialConditions.trim() : null,
        authorized_pickups: rsvpStatus === 'yes' ? pickups : [],
        checked_out: { status: false, by: null, at: null }
      }

      await onRegisterSuccess(guestData)
    } catch (err) {
      console.error('Error submitting RSVP:', err)
      alert('Hubo un problema al procesar tu confirmación. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const formattedEventDate = event?.event_date 
    ? new Date(event.event_date).toLocaleDateString('es-CL', {
        weekday: 'long', 
        day: 'numeric', 
        month: 'long'
      })
    : ''

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Tarjeta de Invitación Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left">
        <div className="absolute top-[-20px] right-6 bg-gradient-to-r from-amber-500 to-emerald-500 px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase shadow-md shadow-emerald-500/25">
          ¡Invitación al Paseo!
        </div>

        {/* Info del Paseo */}
        <div className="mb-8 mt-2 text-center sm:text-left">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Sesión de Paseo de</span>
          <h2 className="text-3xl font-extrabold text-white mt-1 bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent">
            {event?.child_name}
          </h2>
          <p className="text-sm text-slate-350 mt-4 flex flex-col sm:flex-row gap-1 sm:gap-4 justify-center sm:justify-start">
            <span className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
              📅 {formattedEventDate}
            </span>
            <span className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
              📍 {event?.location}
            </span>
          </p>
        </div>

        {/* Selección Inicial: Sí / No */}
        {rsvpStatus === null ? (
          <div className="flex flex-col gap-6">
            <h3 className="text-base font-bold text-white text-center sm:text-left">¿Enviarás a tu mascota al paseo de hoy?</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setRsvpStatus('yes')}
                className="group flex flex-col items-center gap-3 bg-gradient-to-b from-emerald-950/20 to-slate-950 border border-slate-800 hover:border-emerald-500/80 rounded-2xl p-6 transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center transition-colors">
                  <Check size={24} />
                </div>
                <span className="font-bold text-sm text-white">Sí, irá al paseo</span>
              </button>

              <button
                onClick={() => setRsvpStatus('no')}
                className="group flex flex-col items-center gap-3 bg-gradient-to-b from-slate-900/10 to-slate-950 border border-slate-800 hover:border-amber-500/80 rounded-2xl p-6 transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 flex items-center justify-center transition-colors">
                  <X size={24} />
                </div>
                <span className="font-bold text-sm text-white">No podrá ir esta vez</span>
              </button>
            </div>
          </div>
        ) : (
          /* Formulario Detallado */
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-2">
              <span className="text-sm font-bold text-emerald-300">
                {rsvpStatus === 'yes' ? '✓ Confirmando Paseo' : '✗ Declinando Paseo'}
              </span>
              <button 
                type="button"
                onClick={() => {
                  setRsvpStatus(null)
                  setChildName('')
                }}
                className="text-xs text-slate-450 hover:text-white"
              >
                Cambiar opción
              </button>
            </div>

            {/* CASO: NO ASISTE */}
            {rsvpStatus === 'no' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Nombre de la Mascota (Perro)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Rocky"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-450 mt-1">
                    Esto le ayuda al paseador a organizar los cupos del grupo de paseo.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 mt-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {submitting ? 'Guardando...' : 'Enviar Respuesta'}
                </button>
              </div>
            )}

            {/* CASO: SÍ ASISTE */}
            {rsvpStatus === 'yes' && (
              <div className="flex flex-col gap-6">
                
                {/* 1. Datos Básicos de la Mascota */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">1. Datos de la Mascota</h4>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300">Nombre del Perro</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Rocky"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* 2. Datos de Contacto del Tutor */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">2. Contacto del Tutor Responsable</h4>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300">Tu Nombre (Dueño/a)</label>
                    <div className="relative">
                      <User size={14} className="absolute left-4 top-3.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="Ej: María López"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-base text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-300">Teléfono / WhatsApp</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-4 top-3.5 text-slate-500" />
                        <input
                          type="tel"
                          required
                          placeholder="Ej: +56912345678"
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-base text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-300">Correo Electrónico (Respaldo)</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-4 top-3.5 text-slate-500" />
                        <input
                          type="email"
                          required
                          placeholder="Ej: maria@example.com"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-base text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Alergias e Indicaciones de Cuidado */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">3. Alimentación y Cuidados</h4>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">Privado</span>
                  </div>
                  <p className="text-[11px] text-slate-450">Solo el paseador podrá ver esta información por seguridad de tu mascota.</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.keys(commonAllergies).map(key => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => handleAllergyChange(key)}
                        className={`flex items-center justify-between border rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                          commonAllergies[key] 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {key}
                        {commonAllergies[key] && <Check size={12} className="text-emerald-400" />}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-350">Otras Alergias o Restricciones (Ej: pollo, arroz, snacks...)</label>
                    <input
                      type="text"
                      placeholder="Escribe si tiene restricciones alimenticias"
                      value={otherAllergies}
                      onChange={(e) => setOtherAllergies(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-base text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-350">Indicaciones Médicas y de Comportamiento (Opcional)</label>
                    <textarea
                      placeholder="Ej: Es reactivo a otros perros machos, no soltar de la correa, morder juguetes de goma..."
                      rows="2"
                      value={specialConditions}
                      onChange={(e) => setSpecialConditions(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-base text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* 4. Retiro Seguro (Dirección y Notas) */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">4. Dirección de Entrega y Retiro</h4>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">Seguridad</span>
                  </div>
                  <p className="text-[11px] text-slate-450">
                    Indica la dirección completa para que el paseador recoja y entregue a **{childName || 'tu mascota'}**. (Puedes agregar notas sobre conserjería, timbre, etc.).
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {authorizedPickups.map((pickup, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="relative flex-1">
                          <ShieldCheck size={14} className="absolute left-4 top-3.5 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Ej: Calle Principal 123, Depto 402 (Conserjería)"
                            value={pickup}
                            onChange={(e) => handlePickupChange(index, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-base text-white focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                        {authorizedPickups.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePickup(index)}
                            className="p-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={handleAddPickup}
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold w-fit mt-1 cursor-pointer"
                    >
                      <Plus size={14} />
                      Agregar otra nota/dirección
                    </button>
                  </div>
                </div>

                {/* 5. Aceptación y Envío */}
                <div className="mt-4 p-4 border border-emerald-500/10 rounded-2xl bg-emerald-500/5 flex items-start gap-3">
                  <input type="checkbox" required className="mt-0.5 rounded border-slate-800 text-emerald-600 focus:ring-0 focus:ring-offset-0 cursor-pointer" />
                  <span className="text-[11px] text-slate-400 leading-relaxed text-left">
                    Declaro que la información entregada es correcta. Entiendo que los datos serán usados únicamente por el paseador para la seguridad de la mascota durante la sesión de paseo, y serán eliminados automáticamente una vez finalizado el evento.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      Confirmar Ficha de Paseo
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
