-- Crear tabla configuracion_sistema para persistir tipos globales
CREATE TABLE IF NOT EXISTS public.configuracion_sistema (
    clave TEXT PRIMARY KEY,
    valor JSONB NOT NULL,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_configuracion_sistema_clave ON public.configuracion_sistema(clave);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.configuracion_sistema ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir lectura y escritura a usuarios autenticados
-- Primero eliminar la política si existe, luego crearla
DROP POLICY IF EXISTS "Permitir acceso completo a configuracion_sistema" ON public.configuracion_sistema;
CREATE POLICY "Permitir acceso completo a configuracion_sistema" 
ON public.configuracion_sistema 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Insertar datos iniciales si no existen
INSERT INTO public.configuracion_sistema (clave, valor, ultima_actualizacion)
VALUES (
    'tipos_globales',
    '{"vehiculos":[],"soluciones":[],"insumos":[]}',
    NOW()
)
ON CONFLICT (clave) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE public.configuracion_sistema IS 'Tabla para almacenar configuración global del sistema';
COMMENT ON COLUMN public.configuracion_sistema.clave IS 'Clave única para identificar la configuración';
COMMENT ON COLUMN public.configuracion_sistema.valor IS 'Valor de la configuración en formato JSON';
COMMENT ON COLUMN public.configuracion_sistema.ultima_actualizacion IS 'Timestamp de la última actualización';
