-- Verificar y corregir políticas RLS para notificaciones_soporte

-- 1. Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notificaciones_soporte';

-- 2. Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notificaciones_soporte';

-- 3. Verificar permisos de la tabla
SELECT 
    grantee, 
    privilege_type, 
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'notificaciones_soporte' 
AND table_schema = 'public';

-- 4. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "notificaciones_soporte_all_access" ON public.notificaciones_soporte;
DROP POLICY IF EXISTS "notificaciones_soporte_select" ON public.notificaciones_soporte;
DROP POLICY IF EXISTS "notificaciones_soporte_insert" ON public.notificaciones_soporte;
DROP POLICY IF EXISTS "notificaciones_soporte_update" ON public.notificaciones_soporte;
DROP POLICY IF EXISTS "notificaciones_soporte_delete" ON public.notificaciones_soporte;

-- 5. Crear políticas RLS correctas
-- Política para SELECT (lectura)
CREATE POLICY "notificaciones_soporte_select" 
ON public.notificaciones_soporte 
FOR SELECT 
TO authenticated, anon
USING (true);

-- Política para INSERT (inserción)
CREATE POLICY "notificaciones_soporte_insert" 
ON public.notificaciones_soporte 
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Política para UPDATE (actualización)
CREATE POLICY "notificaciones_soporte_update" 
ON public.notificaciones_soporte 
FOR UPDATE 
TO authenticated, anon
USING (true) 
WITH CHECK (true);

-- Política para DELETE (eliminación)
CREATE POLICY "notificaciones_soporte_delete" 
ON public.notificaciones_soporte 
FOR DELETE 
TO authenticated, anon
USING (true);

-- 6. Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notificaciones_soporte';

-- 7. Verificar permisos de la tabla después de crear políticas
SELECT 
    grantee, 
    privilege_type, 
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'notificaciones_soporte' 
AND table_schema = 'public';

-- 8. Probar eliminación directa
-- (Ejecutar esto después de aplicar las políticas)
-- DELETE FROM public.notificaciones_soporte WHERE data->>'cotizacionId' = 'COT-2025-297';
