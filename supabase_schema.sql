-- Script SQL para inicializar la base de datos de PetOne en Supabase
-- Copia y pega este script en el editor SQL Editor de tu consola de Supabase.

-- 1. Tabla de Perfil del Tutor (Hogar)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- Usamos 'user' para el MVP local o el ID de auth de Supabase
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    points INTEGER DEFAULT 0,
    consents JSONB DEFAULT '{"shareAnon": true, "tracking": false, "pushPromo": true}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla de Mascotas
CREATE TABLE IF NOT EXISTS public.pets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    age INTEGER,
    size TEXT,
    weight NUMERIC,
    allergies TEXT,
    diagnosis TEXT,
    diagnosis_staff TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabla de Historial de Compras (Online y Offline)
CREATE TABLE IF NOT EXISTS public.purchases (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total INTEGER NOT NULL,
    items JSONB NOT NULL, -- Listado de productos comprados en esta boleta
    type TEXT NOT NULL, -- E-Commerce, Scan & Go, Tienda Física (Boleta)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabla de Suscripciones Recurrentes
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    brand TEXT NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    frequency INTEGER NOT NULL, -- en días
    next_delivery_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Activa', -- Activa, Pausada
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Tabla de Citas para Servicios (Veterinaria / Peluquería)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    pet_id TEXT REFERENCES public.pets(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL,
    store_id TEXT NOT NULL,
    staff_id TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    diagnosis TEXT DEFAULT '',
    diagnosis_staff TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Tabla de Logs de Escaneo Scan & Go (Fricción de Compra)
CREATE TABLE IF NOT EXISTS public.scan_logs (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    brand TEXT NOT NULL,
    name TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    purchased BOOLEAN NOT NULL DEFAULT TRUE,
    abandon_reason TEXT DEFAULT ''
);

-- 7. Tabla de Métricas de Retail Media (Publicidad)
CREATE TABLE IF NOT EXISTS public.retail_media_logs (
    id TEXT PRIMARY KEY,
    sponsor TEXT NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0
);

-- 8. Tabla de Galería de Fotos IA (Juntos IA)
CREATE TABLE IF NOT EXISTS public.ai_photos (
    id TEXT PRIMARY KEY,
    pet_id TEXT,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ================= POLÍTICAS RLS (RESOLVER ADVISOR) =================

-- Opción Recomendada: Habilitar políticas de acceso público (Lectura/Escritura) para el API Anon Key
CREATE POLICY "Permitir todo a perfiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a pets" ON public.pets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a purchases" ON public.purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a scan_logs" ON public.scan_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a retail_media_logs" ON public.retail_media_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a ai_photos" ON public.ai_photos FOR ALL USING (true) WITH CHECK (true);
