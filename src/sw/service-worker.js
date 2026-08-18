import { precacheAndRoute } from 'workbox-precaching'

// Precachear todos los assets inyectados por Vite/Workbox
precacheAndRoute(self.__WB_MANIFEST || [])

// 1. Escuchar notificaciones Push en background
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/'
      },
      tag: 'checkout-notification',
      requireInteraction: true
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  } catch (err) {
    console.error('Error handling push event:', err)
    
    // Fallback si el payload no es JSON
    const text = event.data.text()
    event.waitUntil(
      self.registration.showNotification('PetOne', {
        body: text,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png'
      })
    )
  }
})

// 2. Manejar clic en la notificación (abrir PWA)
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una ventana abierta, enfocarla y navegar
      const targetPath = new URL(urlToOpen, self.location.origin).pathname
      for (let client of windowClients) {
        if (client.url.includes(targetPath) && 'focus' in client) {
          return client.focus().then(() => client.navigate(urlToOpen))
        }
      }
      // Si no, abrir una ventana nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
