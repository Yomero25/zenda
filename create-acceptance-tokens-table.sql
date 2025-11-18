-- Tabla para tokens de aceptación de cotizaciones
CREATE TABLE IF NOT EXISTS acceptance_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cotizacion_folio TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    is_used BOOLEAN DEFAULT false,
    client_info JSONB NULL -- IP, User-Agent, etc.
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_acceptance_tokens_token ON acceptance_tokens(token);
CREATE INDEX IF NOT EXISTS idx_acceptance_tokens_folio ON acceptance_tokens(cotizacion_folio);
CREATE INDEX IF NOT EXISTS idx_acceptance_tokens_expires ON acceptance_tokens(expires_at);

-- RLS (Row Level Security)
ALTER TABLE acceptance_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir insertar tokens (desde la aplicación)
CREATE POLICY "Enable insert for authenticated users" ON acceptance_tokens
    FOR INSERT 
    WITH CHECK (true);

-- Política para leer tokens (para validación)
CREATE POLICY "Enable read for all" ON acceptance_tokens
    FOR SELECT 
    USING (true);

-- Política para actualizar tokens (marcar como usado)
CREATE POLICY "Enable update for all" ON acceptance_tokens
    FOR UPDATE 
    USING (true);

-- Función para limpiar tokens expirados (ejecutar manualmente o por cron)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM acceptance_tokens 
    WHERE expires_at < NOW() AND is_used = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Comentarios para documentación
COMMENT ON TABLE acceptance_tokens IS 'Tokens temporales para aceptación de cotizaciones por email';
COMMENT ON COLUMN acceptance_tokens.cotizacion_folio IS 'Folio de la cotización (ej: COT-2025-123)';
COMMENT ON COLUMN acceptance_tokens.token IS 'Token único para la URL de aceptación';
COMMENT ON COLUMN acceptance_tokens.expires_at IS 'Fecha de expiración del token (15 días)';
COMMENT ON COLUMN acceptance_tokens.used_at IS 'Timestamp cuando se usó el token';
COMMENT ON COLUMN acceptance_tokens.client_info IS 'Información del cliente que aceptó (IP, navegador, etc.)';
