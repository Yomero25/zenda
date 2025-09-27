-- Script de migración para configuraciones_correo
-- Verifica y agrega columnas faltantes sin afectar datos existentes

-- Verificar si la tabla existe, si no, crearla
CREATE TABLE IF NOT EXISTS configuraciones_correo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar que la columna id tenga el DEFAULT correcto
DO $$ 
BEGIN
    -- Verificar si la columna id existe y si tiene DEFAULT
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'configuraciones_correo' 
               AND column_name = 'id') THEN
        -- Si existe pero no tiene DEFAULT, agregarlo
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'configuraciones_correo' 
                       AND column_name = 'id' 
                       AND column_default IS NOT NULL) THEN
            ALTER TABLE configuraciones_correo ALTER COLUMN id SET DEFAULT gen_random_uuid();
        END IF;
    END IF;
END $$;

-- Agregar columna 'tipo' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'tipo') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN tipo TEXT NOT NULL DEFAULT 'email';
    END IF;
END $$;

-- Agregar columnas SMTP si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'smtp_server') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN smtp_server TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'smtp_port') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN smtp_port INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'smtp_secure') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN smtp_secure BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'smtp_user') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN smtp_user TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'smtp_password') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN smtp_password TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'from_email') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN from_email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'from_name') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN from_name TEXT;
    END IF;
END $$;

-- Agregar columnas EmailJS si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'emailjs_public_key') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN emailjs_public_key TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'emailjs_service_id') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN emailjs_service_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'emailjs_template_id') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN emailjs_template_id TEXT;
    END IF;
END $$;

-- Agregar columnas adicionales si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'backend_url') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN backend_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'estado_prueba') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN estado_prueba TEXT DEFAULT 'no_probado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'ultima_prueba') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN ultima_prueba TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'mensaje_error') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN mensaje_error TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuraciones_correo' 
                   AND column_name = 'is_active') THEN
        ALTER TABLE configuraciones_correo ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_configuraciones_correo_tipo ON configuraciones_correo(tipo);
CREATE INDEX IF NOT EXISTS idx_configuraciones_correo_active ON configuraciones_correo(is_active);

-- Habilitar RLS si no está habilitado
ALTER TABLE configuraciones_correo ENABLE ROW LEVEL SECURITY;

-- Crear política si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                   WHERE tablename = 'configuraciones_correo' 
                   AND policyname = 'Enable all operations for configuraciones_correo') THEN
        CREATE POLICY "Enable all operations for configuraciones_correo" ON configuraciones_correo
            FOR ALL 
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Crear función de trigger si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger 
                   WHERE tgname = 'update_configuraciones_correo_updated_at') THEN
        CREATE TRIGGER update_configuraciones_correo_updated_at 
            BEFORE UPDATE ON configuraciones_correo 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Crear restricción única en 'tipo' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                   WHERE conname = 'configuraciones_correo_tipo_key') THEN
        ALTER TABLE configuraciones_correo ADD CONSTRAINT configuraciones_correo_tipo_key UNIQUE (tipo);
    END IF;
END $$;

-- Insertar configuración por defecto si no existe
-- Solo insertar si no existe ya una configuración con tipo 'email'
INSERT INTO configuraciones_correo (
    tipo,
    smtp_server,
    smtp_port,
    smtp_secure,
    from_email,
    from_name,
    estado_prueba
) 
SELECT 
    'email',
    'smtp.gmail.com',
    587,
    false,
    'tu-email@empresa.com',
    'Sistema de Cotizaciones',
    'no_probado'
WHERE NOT EXISTS (
    SELECT 1 FROM configuraciones_correo WHERE tipo = 'email'
);

-- Comentarios para documentación
COMMENT ON TABLE configuraciones_correo IS 'Configuraciones de servicios de correo (SMTP, EmailJS, etc.)';
COMMENT ON COLUMN configuraciones_correo.tipo IS 'Tipo de configuración: email, smtp, emailjs, etc.';
COMMENT ON COLUMN configuraciones_correo.estado_prueba IS 'Estado de la última prueba: exitoso, error, no_probado';
COMMENT ON COLUMN configuraciones_correo.emailjs_public_key IS 'Clave pública de EmailJS';
COMMENT ON COLUMN configuraciones_correo.emailjs_service_id IS 'ID del servicio de EmailJS';
COMMENT ON COLUMN configuraciones_correo.emailjs_template_id IS 'ID de la plantilla de EmailJS';
