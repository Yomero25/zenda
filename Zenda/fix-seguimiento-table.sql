-- SCRIPT ESPECÍFICO PARA CORREGIR TABLA configuraciones_seguimiento
-- Ejecutar en SQL Editor de Supabase

-- 1. Verificar si la tabla existe
SELECT tablename FROM pg_tables WHERE tablename = 'configuraciones_seguimiento';

-- 2. Si no existe, crearla
CREATE TABLE IF NOT EXISTS configuraciones_seguimiento (
    id TEXT PRIMARY KEY,
    dias_seguimiento INTEGER NOT NULL DEFAULT 7,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Eliminar política existente restrictiva
DROP POLICY IF EXISTS "Admin can manage follow config" ON configuraciones_seguimiento;
DROP POLICY IF EXISTS "Authenticated users can manage follow config" ON configuraciones_seguimiento;

-- 4. Desactivar RLS temporalmente para diagnosticar
ALTER TABLE configuraciones_seguimiento DISABLE ROW LEVEL SECURITY;

-- 5. Insertar registro inicial si no existe
INSERT INTO configuraciones_seguimiento (id, dias_seguimiento) 
VALUES ('seguimiento_config', 7)
ON CONFLICT (id) DO NOTHING;

-- 6. Verificar que el registro existe
SELECT * FROM configuraciones_seguimiento;

-- 7. OPCIONAL: Reactivar RLS con política permisiva
-- ALTER TABLE configuraciones_seguimiento ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for authenticated users" ON configuraciones_seguimiento
--     FOR ALL USING (true);
