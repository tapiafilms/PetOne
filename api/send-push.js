import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export default async function handler(req, res) {
  // Asegurar cabeceras CORS si es necesario, aunque Vercel lo maneja
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { guestId, eventId, hostToken } = req.body

  if (!guestId || !eventId || !hostToken) {
    return res.status(400).json({ error: 'Missing required parameters (guestId, eventId, hostToken).' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || ''
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error: Supabase credentials missing.' })
  }

  // Inicializar Supabase con Service Role Key para evadir RLS de forma segura en el backend
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 1. Validar el token de anfitrión del evento
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('child_name, host_token')
      .eq('id', eventId)
      .single()

    if (eventErr || !event || event.host_token !== hostToken) {
      return res.status(403).json({ error: 'Unauthorized: Invalid host token.' })
    }

    // 2. Obtener los datos del invitado
    const { data: guest, error: guestErr } = await supabase
      .from('guests')
      .select('child_guest_name, push_subscription, checked_out')
      .eq('id', guestId)
      .single()

    if (guestErr || !guest) {
      return res.status(404).json({ error: 'Guest not found.' })
    }

    // 3. Si no tiene suscripción push, responder éxito pero sin envío
    if (!guest.push_subscription) {
      return res.status(200).json({ 
        success: true, 
        message: 'Guest has no active push subscription. DB updated but push not sent.' 
      })
    }

    // 4. Configurar Web Push
    if (!vapidPublicKey || !vapidPrivateKey) {
      return res.status(500).json({ 
        error: 'VAPID keys are not configured on the server. Please define VITE_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.' 
      })
    }

    webpush.setVapidDetails(
      'mailto:soporte@cumpland.cl',
      vapidPublicKey,
      vapidPrivateKey
    )

    // 5. Preparar payload y enviar
    const origin = req.headers.origin || `https://${req.headers.host}`
    const payload = JSON.stringify({
      title: '¡Retiro Realizado! 🚗',
      body: `${guest.child_guest_name} ha sido retirado con éxito del cumpleaños de ${event.child_name}.`,
      url: `${origin}/?e=${eventId}`
    })

    await webpush.sendNotification(guest.push_subscription, payload)

    return res.status(200).json({ success: true, message: 'Push notification sent successfully.' })
  } catch (err) {
    console.error('Error sending push notification:', err)
    return res.status(550).json({ error: err.message || 'Error processing web push.' })
  }
}
