-- ====================================================
-- SCRIPT DE BASE DE DATOS: PetOne, paseamos a tu can
-- ====================================================
-- Copia y pega este script en el SQL Editor de tu consola de Supabase.
-- Este script configura las tablas, políticas de seguridad (RLS) y triggers.

-- Habilitar extensión para encriptación / bytes si no existe
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TABLA: events (Sesiones de Paseo)
-- child_name -> Nombre de la mascota / Grupo de paseo (ej: "Rocky y amigos" o "Paseo de la Tarde")
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name TEXT NOT NULL, 
  event_date TIMESTAMPTZ NOT NULL, -- Fecha y hora del paseo
  location TEXT NOT NULL, -- Punto de encuentro / Ruta
  host_email TEXT NOT NULL, -- Email del paseador (Admin)
  host_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'), -- Acceso paseador
  guest_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'), -- Acceso público para invitar dueños
  payment_status TEXT NOT NULL DEFAULT 'paid',
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb, -- Hitos del paseo (En tránsito, en el parque, etc.)
  security_answer TEXT, -- Respuesta de seguridad para recuperar accesos
  location_coords JSONB NOT NULL DEFAULT '{"lat": null, "lng": null, "heading": null, "timestamp": null}'::jsonb, -- Coordenadas GPS en vivo del paseador
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ -- Fecha de auto-eliminación
);

-- 2. TABLA: guests (Mascotas registradas para el paseo)
-- child_guest_name -> Nombre del perro
-- parent_name -> Nombre del tutor (Dueño)
-- parent_phone -> Teléfono del tutor
-- parent_email -> Email del tutor
-- allergies -> Alergias o restricciones alimenticias
-- special_conditions -> Comportamiento (ej: reactivo, tímido) o indicaciones médicas
-- authorized_pickups -> Dirección y notas para recoger/entregar al perro
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  child_guest_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  parent_phone TEXT,
  parent_email TEXT,
  rsvp_status TEXT NOT NULL DEFAULT 'pending', -- 'yes' (confirmado) | 'no' (no va) | 'pending'
  allergies TEXT,
  special_conditions TEXT,
  authorized_pickups JSONB NOT NULL DEFAULT '[]'::jsonb,
  checked_out JSONB NOT NULL DEFAULT '{"status": false, "by": null, "at": null}'::jsonb, -- checked_out.status = true cuando el perro está entregado seguro en su casa
  personal_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'), -- Enlace único del dueño
  push_subscription JSONB, -- Suscripción a notificaciones push
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLA: event_media (Fotos y Videos tomadas durante el paseo)
CREATE TABLE IF NOT EXISTS event_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type TEXT NOT NULL, -- 'photo' o 'video'
  tags JSONB NOT NULL DEFAULT '[]'::jsonb, -- Perros etiquetados en la foto
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA: providers (Directorio curado de veterinarios, paseadores y tiendas - Opcional)
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'veterinario', 'tienda', 'entrenador', 'otro'
  zone TEXT NOT NULL,
  phone TEXT NOT NULL,
  photo_url TEXT,
  price_range TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================
-- HABILITAR RLS (Row Level Security)
-- ====================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ====================================================

-- Políticas para 'events'
CREATE POLICY "Permitir lectura de eventos por token" ON events
  FOR SELECT
  USING (
    host_token = coalesce(current_setting('request.headers', true)::json->>'x-event-token', '')
    OR guest_token = coalesce(current_setting('request.headers', true)::json->>'x-event-token', '')
  );

CREATE POLICY "Permitir inserción de eventos" ON events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualización de eventos por paseador" ON events
  FOR UPDATE
  USING (host_token = coalesce(current_setting('request.headers', true)::json->>'x-event-token', ''))
  WITH CHECK (host_token = coalesce(current_setting('request.headers', true)::json->>'x-event-token', ''));

-- Políticas para 'guests'
CREATE POLICY "Permitir lectura de mascotas/dueños" ON guests
  FOR SELECT
  USING (
    personal_token = coalesce(current_setting('request.headers', true)::json->>'x-guest-token', '')
    OR EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = guests.event_id 
      AND events.host_token = coalesce(current_setting('request.headers', true)::json->>'x-event-token', '')
    )
  );

CREATE POLICY "Permitir inserción de mascotas si tienen token del paseo" ON guests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = guests.event_id 
      AND events.guest_token = coalesce(current_setting('request.headers', true)::json->>'x-event-token', '')
    )
  );

CREATE POLICY "Permitir actualización de datos de mascota por dueño o paseador" ON guests
  FOR UPDATE
  USING (
    personal_token = coalesce(current_setting('request.headers', true)::json->>'x-guest-token', '')
    OR EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = guests.event_id 
      AND events.host_token = coalesce(current_setting('request.headers', true)::json->>'x-event-token', '')
    )
  )
  WITH CHECK (
    personal_token = coalesce(current_setting('request.headers', true)::json->>'x-guest-token', '')
    OR EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = guests.event_id 
      AND events.host_token = coalesce(current_setting('request.headers', true)::json->>'x-event-token', '')
    )
  );

-- Políticas para 'event_media'
CREATE POLICY "Permitir lectura de fotos por token de paseo" ON event_media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_media.event_id
      AND (
        events.host_token = coalesce(current_setting('request.headers', true)::json->>'x-event-token', '') OR
        events.guest_token = coalesce(current_setting('request.headers', true)::json->>'x-event-token', '')
      )
    )
  );

CREATE POLICY "Permitir inserción de fotos por paseador" ON event_media
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_media.event_id
      AND events.host_token = coalesce(current_setting('request.headers', true)::json->>'x-event-token', '')
    )
  );

CREATE POLICY "Permitir borrado de fotos por paseador" ON event_media
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_media.event_id
      AND events.host_token = coalesce(current_setting('request.headers', true)::json->>'x-event-token', '')
    )
  );

-- Políticas para 'providers'
CREATE POLICY "Permitir lectura pública de proveedores" ON providers
  FOR SELECT
  USING (true);


-- ====================================================
-- FUNCIONES Y TRIGGERS (Auto-eliminación y Limpieza)
-- ====================================================

-- 1. Función RPC para limpiar paseos expirados (Lazy Clean)
CREATE OR REPLACE FUNCTION delete_expired_event_media()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Borra todos los paseos donde expires_at ya pasó (hace más de 1 hora por seguridad).
  -- El ON DELETE CASCADE borrará automáticamente las mascotas e imágenes asociadas.
  DELETE FROM events
  WHERE expires_at IS NOT NULL
  AND expires_at < (now() - interval '1 hour');
END;
$$;

-- 2. Trigger para eliminar automáticamente archivos físicos de Supabase Storage
CREATE OR REPLACE FUNCTION delete_storage_files_on_event_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Borra del bucket 'photos' todos los archivos dentro de la subcarpeta de este paseo
  DELETE FROM storage.objects
  WHERE bucket_id = 'photos'
  AND name LIKE 'event-' || OLD.id || '/%';

  RETURN OLD;
END;
$$;

-- Vincular el trigger a la tabla events
DROP TRIGGER IF EXISTS trg_delete_storage_files_on_event_delete ON events;
CREATE TRIGGER trg_delete_storage_files_on_event_delete
AFTER DELETE ON events
FOR EACH ROW
EXECUTE FUNCTION delete_storage_files_on_event_delete();


-- ====================================================
-- SEMILLAS DE PRUEBA (Proveedores Recomendados de PetOne)
-- ====================================================
INSERT INTO providers (name, category, zone, phone, photo_url, price_range, notes) VALUES
('Veterinaria PetOne Central', 'veterinario', 'Providencia / Las Condes', '+56911112222', null, '$$$', 'Urgencias 24/7 y consultas de especialidades con descuento.'),
('Peluquería Móvil DoggyGroom', 'tienda', 'Santiago Oriente', '+56933334444', null, '$$', 'Servicio de peluquería e higiene canina directo en tu domicilio.'),
('Entrenador Canino AlfaDog', 'entrenador', 'Ñuñoa / La Reina', '+56955556666', null, '$$$', 'Especialista en sociabilización y control de reactividad con refuerzo positivo.'),
('Tienda PetOne Express', 'tienda', 'Toda la RM', '+56977778888', null, '$$', 'Despacho express de alimento premium y juguetes interactivos.');
