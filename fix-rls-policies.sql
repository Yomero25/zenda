-- SCRIPT PARA CORREGIR LAS POLÍTICAS DE RLS
-- Ejecutar en SQL Editor de Supabase

-- 1. ELIMINAR POLÍTICAS EXISTENTES RESTRICTIVAS
DROP POLICY IF EXISTS "Admin can manage email config" ON configuraciones_correo;
DROP POLICY IF EXISTS "Admin can manage email templates" ON plantillas_correo;
DROP POLICY IF EXISTS "Admin can manage follow config" ON configuraciones_seguimiento;
DROP POLICY IF EXISTS "Users can view email records" ON registros_correos;
DROP POLICY IF EXISTS "Admin can manage email records" ON registros_correos;

-- 2. CREAR POLÍTICAS MÁS PERMISIVAS PARA USUARIOS AUTENTICADOS

-- Configuración de correo - permitir a usuarios autenticados
CREATE POLICY "Authenticated users can manage email config" ON configuraciones_correo
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Plantillas de correo - permitir a usuarios autenticados  
CREATE POLICY "Authenticated users can manage email templates" ON plantillas_correo
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Configuración de seguimiento - permitir a usuarios autenticados
CREATE POLICY "Authenticated users can manage follow config" ON configuraciones_seguimiento
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Registros de correo - permitir a usuarios autenticados
CREATE POLICY "Authenticated users can manage email records" ON registros_correos
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 3. VERIFICAR QUE LAS TABLAS TENGAN RLS HABILITADO
-- (Si ya lo habilitaste antes, estos comandos no harán nada)
ALTER TABLE configuraciones_correo ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_correo ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuraciones_seguimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_correos ENABLE ROW LEVEL SECURITY;

-- 4. VERIFICAR LAS POLÍTICAS (OPCIONAL - para debug)
-- SELECT tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('configuraciones_correo', 'plantillas_correo', 'configuraciones_seguimiento', 'registros_correos');
