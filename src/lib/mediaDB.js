/**
 * IndexedDB helper para almacenamiento de media en modo demo.
 * Resuelve el límite de 5MB de localStorage.
 */

const DB_NAME = 'cumpland_demo'
const DB_VERSION = 1
const MEDIA_STORE = 'media'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: 'id' })
      }
    }
  })
}

export async function getMediaFromDB(eventId) {
  try {
    const db = await openDB()
    const tx = db.transaction(MEDIA_STORE, 'readonly')
    const store = tx.objectStore(MEDIA_STORE)
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const all = request.result || []
        resolve(all.filter(m => m.event_id === eventId))
      }
      request.onerror = () => reject(request.error)
    })
  } catch {
    return []
  }
}

export async function addMediaToDB(eventId, mediaItem) {
  try {
    const db = await openDB()
    const tx = db.transaction(MEDIA_STORE, 'readwrite')
    const store = tx.objectStore(MEDIA_STORE)
    return new Promise((resolve, reject) => {
      const request = store.put({ ...mediaItem, event_id: eventId })
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error('IndexedDB addMedia error:', err)
  }
}

export async function deleteMediaFromDB(mediaId) {
  try {
    const db = await openDB()
    const tx = db.transaction(MEDIA_STORE, 'readwrite')
    const store = tx.objectStore(MEDIA_STORE)
    return new Promise((resolve, reject) => {
      const request = store.delete(mediaId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error('IndexedDB deleteMedia error:', err)
  }
}

export async function clearMediaFromDB(eventId) {
  try {
    const db = await openDB()
    const tx = db.transaction(MEDIA_STORE, 'readwrite')
    const store = tx.objectStore(MEDIA_STORE)
    const all = await new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
    const toDelete = all.filter(m => m.event_id === eventId)
    for (const item of toDelete) {
      store.delete(item.id)
    }
  } catch (err) {
    console.error('IndexedDB clearMedia error:', err)
  }
}
