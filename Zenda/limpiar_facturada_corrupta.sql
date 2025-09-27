-- Script para limpiar datos corruptos de facturada
-- Ejecutar en Supabase SQL Editor

-- Mostrar cotizaciones con facturada = true que no deberían tenerla
SELECT 
    id,
    folio,
    data->>'estado' as estado,
    data->>'facturada' as facturada,
    data->>'fecha_facturacion' as fecha_facturacion,
    data->>'fecha_instalacion' as fecha_instalacion
FROM cotizaciones 
WHERE data->>'facturada' = 'true'
ORDER BY created_at DESC;

-- Limpiar facturada = true para cotizaciones que no están realmente facturadas
UPDATE cotizaciones 
SET data = jsonb_set(
    data, 
    '{facturada}', 
    'false'
)
WHERE data->>'facturada' = 'true' 
  AND data->>'fecha_facturacion' IS NULL;

-- Limpiar fecha_facturacion para cotizaciones que no están realmente facturadas
UPDATE cotizaciones 
SET data = jsonb_set(
    data, 
    '{fecha_facturacion}', 
    'null'
)
WHERE data->>'facturada' = 'false' 
  AND data->>'fecha_facturacion' IS NOT NULL;

-- Verificar resultado
SELECT 
    id,
    folio,
    data->>'estado' as estado,
    data->>'facturada' as facturada,
    data->>'fecha_facturacion' as fecha_facturacion
FROM cotizaciones 
WHERE data->>'facturada' = 'true'
ORDER BY created_at DESC;
