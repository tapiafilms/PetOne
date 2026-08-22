import React, { useState, useEffect } from 'react'
import { useEventData } from '../hooks/useEventData'
import RsvpForm from '../components/RsvpForm'
import { Loader2 } from 'lucide-react'

export default function RsvpPage({ eventId, guestToken, onRegisterComplete }) {
  const { event, addGuest, loading, error } = useEventData(eventId, guestToken)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [registeredGuest, setRegisteredGuest] = useState(null)

  // Guardar guest_token en localStorage al cargar para uso futuro
  useEffect(() => {
    if (guestToken && eventId) {
      localStorage.setItem(`petone_guest_token_${eventId}`, guestToken)
    }
  }, [guestToken, eventId])

  const handleRegisterSuccess = async (guestData) => {
    setSubmitting(true)
    try {
      // Registrar al invitado en la base de datos
      const newGuest = await addGuest(guestData)
      
      // Guardar token en localStorage
      if (newGuest.rsvp_status === 'yes') {
        localStorage.setItem(`petone_personal_token_${eventId}`, newGuest.personal_token)
        setRegisteredGuest(newGuest)
        setSuccess(true)
        
        // Simular transición visual bonita
        setTimeout(() => {
          onRegisterComplete(newGuest.personal_token)
        }, 2000)
      } else {
        // Si no asiste, no necesita personalToken en localStorage
        setSuccess(true)
      }
    } catch (err) {
      console.error('Error registering guest:', err)
      alert('Error al registrar tu confirmación. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || submitting) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <Loader2 size={36} className="text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400">
          {submitting ? 'Registrando mascota...' : 'Cargando paseo...'}
        </p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-xl font-bold mb-2">
          !
        </div>
        <h3 className="text-lg font-bold text-white">Paseo Inválido o Expirado</h3>
        <p className="text-xs text-slate-400 max-w-xs">
          El enlace de invitación que estás utilizando no es válido o la sesión de paseo ya ha finalizado.
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-bold mb-2 animate-bounce">
          ✓
        </div>
        {registeredGuest ? (
          <>
            <h3 className="text-xl font-bold text-white">¡Registro Exitoso!</h3>
            <p className="text-sm text-slate-450 max-w-sm mt-1">
              Hemos confirmado el paseo de **{registeredGuest.child_guest_name}**.
              Redirigiéndote al tablero en vivo del paseo...
            </p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold text-white">¡Gracias por Responder!</h3>
            <p className="text-sm text-slate-450 max-w-sm mt-1">
              Se ha cancelado la confirmación para esta mascota. Ya puedes cerrar esta pestaña.
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans py-12">
      <RsvpForm event={event} onRegisterSuccess={handleRegisterSuccess} />
    </div>
  )
}
