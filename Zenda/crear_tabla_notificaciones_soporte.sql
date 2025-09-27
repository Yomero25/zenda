-- Crear tabla notificaciones_soporte si no existe
CREATE TABLE IF NOT EXISTS public.notificaciones_soporte (
    id BIGSERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_notificaciones_soporte_cotizacion_id 
ON public.notificaciones_soporte USING GIN ((data->>'cotizacionId'));

CREATE INDEX IF NOT EXISTS idx_notificaciones_soporte_solicitud_id 
ON public.notificaciones_soporte USING GIN ((data->>'solicitudDespachoId'));

CREATE INDEX IF NOT EXISTS idx_notificaciones_soporte_created_at 
ON public.notificaciones_soporte (created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.notificaciones_soporte ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS (permitir todas las operaciones para usuarios autenticados)
CREATE POLICY IF NOT EXISTS "notificaciones_soporte_all_access" 
ON public.notificaciones_soporte 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Agregar a la publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones_soporte;

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_notificaciones_soporte_updated_at 
BEFORE UPDATE ON public.notificaciones_soporte 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
