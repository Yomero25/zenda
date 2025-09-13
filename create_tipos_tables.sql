-- Script para crear tablas separadas de tipos
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- TABLA: tipos_unidad
-- ============================================
CREATE TABLE IF NOT EXISTS public.tipos_unidad (
    id SERIAL PRIMARY KEY,
    nombre TEXT UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para tipos_unidad
CREATE INDEX IF NOT EXISTS idx_tipos_unidad_nombre ON public.tipos_unidad(nombre);
CREATE INDEX IF NOT EXISTS idx_tipos_unidad_activo ON public.tipos_unidad(activo);

-- ============================================
-- TABLA: tipos_solucion
-- ============================================
CREATE TABLE IF NOT EXISTS public.tipos_solucion (
    id SERIAL PRIMARY KEY,
    nombre TEXT UNIQUE NOT NULL,
    descripcion TEXT,
    categoria TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para tipos_solucion
CREATE INDEX IF NOT EXISTS idx_tipos_solucion_nombre ON public.tipos_solucion(nombre);
CREATE INDEX IF NOT EXISTS idx_tipos_solucion_activo ON public.tipos_solucion(activo);
CREATE INDEX IF NOT EXISTS idx_tipos_solucion_categoria ON public.tipos_solucion(categoria);

-- ============================================
-- TABLA: tipos_insumo
-- ============================================
CREATE TABLE IF NOT EXISTS public.tipos_insumo (
    id SERIAL PRIMARY KEY,
    nombre TEXT UNIQUE NOT NULL,
    descripcion TEXT,
    categoria TEXT,
    unidad_medida TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para tipos_insumo
CREATE INDEX IF NOT EXISTS idx_tipos_insumo_nombre ON public.tipos_insumo(nombre);
CREATE INDEX IF NOT EXISTS idx_tipos_insumo_activo ON public.tipos_insumo(activo);
CREATE INDEX IF NOT EXISTS idx_tipos_insumo_categoria ON public.tipos_insumo(categoria);

-- ============================================
-- HABILITAR RLS (Row Level Security)
-- ============================================
ALTER TABLE public.tipos_unidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_solucion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_insumo ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS DE SEGURIDAD
-- ============================================

-- Políticas para tipos_unidad
DROP POLICY IF EXISTS "tipos_unidad_policy" ON public.tipos_unidad;
CREATE POLICY "tipos_unidad_policy" 
ON public.tipos_unidad 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas para tipos_solucion
DROP POLICY IF EXISTS "tipos_solucion_policy" ON public.tipos_solucion;
CREATE POLICY "tipos_solucion_policy" 
ON public.tipos_solucion 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas para tipos_insumo
DROP POLICY IF EXISTS "tipos_insumo_policy" ON public.tipos_insumo;
CREATE POLICY "tipos_insumo_policy" 
ON public.tipos_insumo 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar tipos de unidad básicos
INSERT INTO public.tipos_unidad (nombre, descripcion) VALUES
('1.5 ton', 'Vehículo de 1.5 toneladas'),
('2.5 ton', 'Vehículo de 2.5 toneladas'),
('3.5 ton', 'Vehículo de 3.5 toneladas'),
('4.5 ton', 'Vehículo de 4.5 toneladas'),
('Autobus pasajeros', 'Autobús para transporte de pasajeros'),
('Motocicleta', 'Vehículo de dos ruedas'),
('Rabón', 'Vehículo de carga pesada'),
('SUV', 'Vehículo utilitario deportivo'),
('Sedan', 'Automóvil sedán'),
('Sedan lujo', 'Automóvil sedán de lujo'),
('Torton', 'Camión de carga mediana'),
('Tracto', 'Tractocamión'),
('Tracto Cabina sobre motor', 'Tractocamión con cabina sobre motor'),
('Van pasajeros', 'Van para transporte de pasajeros')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar tipos de solución básicos
INSERT INTO public.tipos_solucion (nombre, descripcion, categoria) VALUES
('VPC', 'Video Protección y Control', 'Seguridad'),
('Rastreo basico', 'Sistema de rastreo básico', 'Rastreo'),
('Rastreo avanzado', 'Sistema de rastreo avanzado', 'Rastreo'),
('Rastreo satelital', 'Sistema de rastreo satelital', 'Rastreo'),
('Dashcam', 'Cámara de tablero', 'Video'),
('Sideview', 'Sistema de vista lateral', 'Video'),
('Sensor VPC', 'Sensores para VPC', 'Sensores')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar tipos de insumo básicos
INSERT INTO public.tipos_insumo (nombre, descripcion, categoria, unidad_medida) VALUES
('Cable 4 pin 1 m', 'Cable de 4 pines de 1 metro', 'Cables', 'metros'),
('Cable 4 pin 3 m', 'Cable de 4 pines de 3 metros', 'Cables', 'metros'),
('Cable 4 pin 5 m', 'Cable de 4 pines de 5 metros', 'Cables', 'metros'),
('Cable 2 vias', 'Cable de 2 vías', 'Cables', 'metros'),
('Cable 4 vias', 'Cable de 4 vías', 'Cables', 'metros'),
('Base Pollak', 'Base conectora Pollak', 'Conectores', 'piezas'),
('Pollak Macho', 'Conector Pollak macho', 'Conectores', 'piezas'),
('Pollak Hembra', 'Conector Pollak hembra', 'Conectores', 'piezas'),
('Cinta de tela', 'Cinta adhesiva de tela', 'Adhesivos', 'metros'),
('Cinta de aislar', 'Cinta aislante', 'Adhesivos', 'metros'),
('Cincho mediado', 'Cincho de tamaño mediano', 'Sujeción', 'piezas'),
('Relevador 12v', 'Relevador de 12 voltios', 'Electrónicos', 'piezas'),
('Relevador 24v', 'Relevador de 24 voltios', 'Electrónicos', 'piezas'),
('Microfono', 'Micrófono', 'Audio', 'piezas'),
('Bocina', 'Bocina de audio', 'Audio', 'piezas')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================
COMMENT ON TABLE public.tipos_unidad IS 'Catálogo de tipos de vehículos/unidades';
COMMENT ON TABLE public.tipos_solucion IS 'Catálogo de tipos de soluciones';
COMMENT ON TABLE public.tipos_insumo IS 'Catálogo de tipos de insumos/suministros';

COMMENT ON COLUMN public.tipos_unidad.nombre IS 'Nombre único del tipo de unidad';
COMMENT ON COLUMN public.tipos_unidad.descripcion IS 'Descripción detallada del tipo';
COMMENT ON COLUMN public.tipos_unidad.activo IS 'Indica si el tipo está activo';

COMMENT ON COLUMN public.tipos_solucion.nombre IS 'Nombre único del tipo de solución';
COMMENT ON COLUMN public.tipos_solucion.descripcion IS 'Descripción detallada de la solución';
COMMENT ON COLUMN public.tipos_solucion.categoria IS 'Categoría de la solución';

COMMENT ON COLUMN public.tipos_insumo.nombre IS 'Nombre único del tipo de insumo';
COMMENT ON COLUMN public.tipos_insumo.descripcion IS 'Descripción detallada del insumo';
COMMENT ON COLUMN public.tipos_insumo.categoria IS 'Categoría del insumo';
COMMENT ON COLUMN public.tipos_insumo.unidad_medida IS 'Unidad de medida del insumo';
