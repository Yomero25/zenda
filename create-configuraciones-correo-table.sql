-- Tabla para configuraciones de correo (SMTP, EmailJS, etc.)
CREATE TABLE IF NOT EXISTS configuraciones_correo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo TEXT NOT NULL DEFAULT 'email', -- 'email', 'smtp', 'emailjs', etc.
    
    -- Configuración SMTP
    smtp_server TEXT,
    smtp_port INTEGER,
    smtp_secure BOOLEAN DEFAULT false,
    smtp_user TEXT,
    smtp_password TEXT,
    from_email TEXT,
    from_name TEXT,
    
    -- Configuración EmailJS
    emailjs_public_key TEXT,
    emailjs_service_id TEXT,
    emailjs_template_id TEXT,
    
    -- Configuración Backend personalizado
    backend_url TEXT,
    
    -- Configuración general
    estado_prueba TEXT DEFAULT 'no_probado', -- 'exitoso', 'error', 'no_probado'
    ultima_prueba TIMESTAMP WITH TIME ZONE,
    mensaje_error TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_configuraciones_correo_tipo ON configuraciones_correo(tipo);
CREATE INDEX IF NOT EXISTS idx_configuraciones_correo_active ON configuraciones_correo(is_active);

-- RLS (Row Level Security)
ALTER TABLE configuraciones_correo ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (ajustar según necesidades de seguridad)
CREATE POLICY "Enable all operations for configuraciones_correo" ON configuraciones_correo
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
CREATE TRIGGER update_configuraciones_correo_updated_at 
    BEFORE UPDATE ON configuraciones_correo 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuración por defecto
INSERT INTO configuraciones_correo (
    tipo,
    smtp_server,
    smtp_port,
    smtp_secure,
    from_email,
    from_name,
    estado_prueba
) VALUES (
    'email',
    'smtp.gmail.com',
    587,
    false,
    'tu-email@empresa.com',
    'Sistema de Cotizaciones',
    'no_probado'
) ON CONFLICT DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE configuraciones_correo IS 'Configuraciones de servicios de correo (SMTP, EmailJS, etc.)';
COMMENT ON COLUMN configuraciones_correo.tipo IS 'Tipo de configuración: email, smtp, emailjs, etc.';
COMMENT ON COLUMN configuraciones_correo.estado_prueba IS 'Estado de la última prueba: exitoso, error, no_probado';
COMMENT ON COLUMN configuraciones_correo.emailjs_public_key IS 'Clave pública de EmailJS';
COMMENT ON COLUMN configuraciones_correo.emailjs_service_id IS 'ID del servicio de EmailJS';
COMMENT ON COLUMN configuraciones_correo.emailjs_template_id IS 'ID de la plantilla de EmailJS';
