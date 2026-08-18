import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Bandera para saber si el usuario configuró credenciales reales
export const isSupabaseConfigured = !!(rawUrl && rawKey && rawUrl !== 'YOUR_SUPABASE_URL')

// Usar placeholders si no están configuradas para evitar que el JS crasheé al cargar
const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder-project.supabase.co'
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'placeholder-anon-key'

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase URL or Anon Key is missing. PetOne is running in LOCAL DEMO MODE (saving data in localStorage).'
  )
}

// Cliente base sin headers (para operaciones genéricas)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cache de clientes por token para evitar crear instancias nuevas en cada llamada
const clientCache = new Map()

/**
 * Retorna una instancia del cliente de Supabase con headers personalizados para RLS.
 * Usa cache para no crear clientes duplicados.
 */
export const getSupabaseClient = (eventToken, guestToken) => {
  const cacheKey = `${eventToken || ''}-${guestToken || ''}`
  
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)
  }

  const headers = {}
  if (eventToken) headers['x-event-token'] = eventToken
  if (guestToken) headers['x-guest-token'] = guestToken

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers
    },
    auth: {
      persistSession: false
    }
  })

  clientCache.set(cacheKey, client)

  // Limitar tamaño del cache
  if (clientCache.size > 50) {
    const firstKey = clientCache.keys().next().value
    clientCache.delete(firstKey)
  }

  return client
}
