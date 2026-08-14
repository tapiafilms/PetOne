import { useState, useEffect, useCallback } from 'react'

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

/**
 * Hook para gestionar los permisos y la suscripción de notificaciones Web Push.
 * @param {Object} guest - Registro del invitado actual
 * @param {Function} updateGuest - Función para actualizar el invitado en la base de datos (con su suscripción push)
 */
export function usePushSubscription(guest, updateGuest) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState('default')
  const [loading, setLoading] = useState(true)

  // Helper para convertir la clave pública VAPID de Base64 a Uint8Array
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Verificar estado actual de la suscripción al montar
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setLoading(false)
      return
    }

    setPermission(Notification.permission)

    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((subscription) => {
        setIsSubscribed(!!subscription)
        setLoading(false)
      }).catch(err => {
        console.error('Error getting push subscription:', err)
        setLoading(false)
      })
    })
  }, [])

  // Suscribirse a las notificaciones
  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !PUBLIC_VAPID_KEY) {
      console.warn('Web Push not supported or VAPID public key missing.')
      return null
    }

    setLoading(true)
    try {
      // 1. Pedir permisos
      const status = await Notification.requestPermission()
      setPermission(status)

      if (status !== 'granted') {
        throw new Error('Permisos de notificaciones denegados.')
      }

      // 2. Registrar suscripción en el navegador
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      })

      // Convertir suscripción a JSON puro para guardarlo en Postgres (Supabase)
      const subJson = subscription.toJSON()

      // 3. Guardar en la tabla de base de datos
      if (guest && updateGuest) {
        await updateGuest(guest.id, { push_subscription: subJson })
      }

      setIsSubscribed(true)
      return subscription

    } catch (err) {
      console.error('Error subscribing to push notifications:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [guest, updateGuest])

  // Desuscribirse de las notificaciones
  const unsubscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return

    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
      }

      // Limpiar en base de datos
      if (guest && updateGuest) {
        await updateGuest(guest.id, { push_subscription: null })
      }

      setIsSubscribed(false)
    } catch (err) {
      console.error('Error unsubscribing:', err)
    } finally {
      setLoading(false)
    }
  }, [guest, updateGuest])

  return {
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe
  }
}
