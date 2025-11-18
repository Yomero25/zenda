-- Tabla para logs de aceptación de cotizaciones
CREATE TABLE IF NOT EXISTS logs_aceptacion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    folio TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'cotizacion_aceptada', 'notificacion_enviada', etc.
    cliente TEXT,
    total DECIMAL(10,2),
    fecha_aceptacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_info JSONB NULL,
    email_enviado BOOLEAN DEFAULT false,
    email_timestamp TIMESTAMP WITH TIME ZONE NULL,
    metadata JSONB NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_logs_aceptacion_folio ON logs_aceptacion(folio);
CREATE INDEX IF NOT EXISTS idx_logs_aceptacion_tipo ON logs_aceptacion(tipo);
CREATE INDEX IF NOT EXISTS idx_logs_aceptacion_fecha ON logs_aceptacion(fecha_aceptacion);

-- RLS
ALTER TABLE logs_aceptacion ENABLE ROW LEVEL SECURITY;

-- Política para permitir insertar logs
CREATE POLICY "Enable insert for all" ON logs_aceptacion
    FOR INSERT 
    WITH CHECK (true);

-- Política para leer logs
CREATE POLICY "Enable read for authenticated users" ON logs_aceptacion
    FOR SELECT 
    USING (true);

-- Comentarios
COMMENT ON TABLE logs_aceptacion IS 'Registro de aceptaciones de cotizaciones y notificaciones enviadas';
COMMENT ON COLUMN logs_aceptacion.tipo IS 'Tipo de evento: cotizacion_aceptada, notificacion_enviada, etc.';
COMMENT ON COLUMN logs_aceptacion.client_info IS 'Información del cliente que aceptó (IP, navegador, etc.)';
COMMENT ON COLUMN logs_aceptacion.metadata IS 'Información adicional del evento';
