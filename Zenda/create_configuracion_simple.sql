-- Script simple para crear tabla configuracion_sistema
-- Ejecutar en Supabase SQL Editor

-- Crear la tabla
CREATE TABLE IF NOT EXISTS public.configuracion_sistema (
    clave TEXT PRIMARY KEY,
    valor JSONB NOT NULL,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_configuracion_sistema_clave ON public.configuracion_sistema(clave);

-- Habilitar RLS
ALTER TABLE public.configuracion_sistema ENABLE ROW LEVEL SECURITY;

-- Crear política (eliminar si existe primero)
DROP POLICY IF EXISTS "configuracion_sistema_policy" ON public.configuracion_sistema;
CREATE POLICY "configuracion_sistema_policy" 
ON public.configuracion_sistema 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Insertar datos iniciales
INSERT INTO public.configuracion_sistema (clave, valor, ultima_actualizacion)
VALUES (
    'tipos_globales',
    '{"vehiculos":[],"soluciones":[],"insumos":[]}',
    NOW()
)
ON CONFLICT (clave) DO NOTHING;
