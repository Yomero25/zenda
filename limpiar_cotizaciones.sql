-- Script para limpiar todas las cotizaciones existentes
-- Este script eliminará todas las cotizaciones y sus datos relacionados

-- Eliminar todas las cotizaciones (esto eliminará en cascada todas las unidades, soluciones, etc.)
DELETE FROM cotizaciones;

-- Verificar que se eliminaron
SELECT COUNT(*) as total_cotizaciones FROM cotizaciones;

-- Verificar que se eliminaron las unidades
SELECT COUNT(*) as total_unidades FROM cotizacion_unidades;

-- Verificar que se eliminaron las soluciones
SELECT COUNT(*) as total_soluciones FROM cotizacion_soluciones;

-- Verificar que se eliminaron los accesorios
SELECT COUNT(*) as total_accesorios FROM cotizacion_accesorios;

-- Verificar que se eliminaron los insumos
SELECT COUNT(*) as total_insumos FROM cotizacion_insumos;

-- Verificar que se eliminaron los servicios
SELECT COUNT(*) as total_servicios FROM cotizacion_servicios;

-- Verificar que se eliminaron las funciones
SELECT COUNT(*) as total_funciones FROM cotizacion_funciones;

-- Reiniciar la secuencia del ID de cotizaciones
ALTER SEQUENCE cotizaciones_id_seq RESTART WITH 1;

-- Reiniciar la secuencia del ID de unidades
ALTER SEQUENCE cotizacion_unidades_id_seq RESTART WITH 1;

-- Reiniciar la secuencia del ID de soluciones
ALTER SEQUENCE cotizacion_soluciones_id_seq RESTART WITH 1;

-- Reiniciar la secuencia del ID de accesorios
ALTER SEQUENCE cotizacion_accesorios_id_seq RESTART WITH 1;

-- Reiniciar la secuencia del ID de insumos
ALTER SEQUENCE cotizacion_insumos_id_seq RESTART WITH 1;

-- Reiniciar la secuencia del ID de servicios
ALTER SEQUENCE cotizacion_servicios_id_seq RESTART WITH 1;

-- Reiniciar la secuencia del ID de funciones
ALTER SEQUENCE cotizacion_funciones_id_seq RESTART WITH 1;

-- Verificar la estructura de la tabla cotizaciones
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cotizaciones' 
ORDER BY ordinal_position;
