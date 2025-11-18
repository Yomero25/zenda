-- Script de migración para la tabla cotizaciones
-- Agregar campo cliente_nombre y eliminar campo volumen

-- Agregar campo cliente_nombre si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cotizaciones' 
        AND column_name = 'cliente_nombre'
    ) THEN
        ALTER TABLE cotizaciones ADD COLUMN cliente_nombre VARCHAR(200);
        RAISE NOTICE 'Campo cliente_nombre agregado';
    ELSE
        RAISE NOTICE 'Campo cliente_nombre ya existe';
    END IF;
END $$;

-- Eliminar campo volumen si existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cotizaciones' 
        AND column_name = 'volumen'
    ) THEN
        ALTER TABLE cotizaciones DROP COLUMN volumen;
        RAISE NOTICE 'Campo volumen eliminado';
    ELSE
        RAISE NOTICE 'Campo volumen no existe';
    END IF;
END $$;

-- Actualizar cotizaciones existentes con cliente_nombre basado en cliente_id
UPDATE cotizaciones 
SET cliente_nombre = 'Cliente ' || id::text 
WHERE cliente_nombre IS NULL OR cliente_nombre = '';

-- Verificar la estructura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cotizaciones' 
ORDER BY ordinal_position;
