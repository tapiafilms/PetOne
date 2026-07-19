// Supabase Client Initialization for PetOne PWA
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are placeholders or undefined
const isConfigured = 
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('placeholder-project') && 
  !supabaseKey.includes('placeholder-anon-key');

export const supabase = isConfigured ? createClient(supabaseUrl, supabaseKey) : null;

if (!isConfigured) {
  console.warn(
    '[Supabase] Las credenciales no están configuradas o tienen valores de marcador de posición en el archivo .env. ' +
    'Las funciones en la nube permanecerán inactivas y la app operará únicamente en modo local (IndexedDB).'
  );
}
