-- Crear tabla para funciones de rastreo
CREATE TABLE IF NOT EXISTS funciones_rastreo (
    id SERIAL PRIMARY KEY,
    funcionalidad VARCHAR(255) UNIQUE NOT NULL,
    insumos JSONB NOT NULL DEFAULT '[]',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas por funcionalidad
CREATE INDEX IF NOT EXISTS idx_funciones_rastreo_funcionalidad ON funciones_rastreo(funcionalidad);

-- Crear índice para búsquedas por activo
CREATE INDEX IF NOT EXISTS idx_funciones_rastreo_activo ON funciones_rastreo(activo);

-- Insertar datos de ejemplo basados en las funciones hardcodeadas
INSERT INTO funciones_rastreo (funcionalidad, insumos) VALUES
('SOS simple', '[{"nombre": "Boton membrana", "cantidad": 1}, {"nombre": "Cable 2 vias", "cantidad": 2}]'),
('SOS llamada', '[{"nombre": "Boton membrana", "cantidad": 1}, {"nombre": "Microfono", "cantidad": 1}, {"nombre": "Bocina", "cantidad": 1}]'),
('SOS Bloqueo', '[{"nombre": "Boton membrana", "cantidad": 1}]'),
('Bloqueo normal', '[{"nombre": "Relevador", "cantidad": 1}]'),
('Bloqueo CC', '[{"nombre": "Relevador", "cantidad": 1}]'),
('Sensores juntos', '[{"nombre": "Cable 2 vias", "cantidad": 8}, {"nombre": "Relevador", "cantidad": 1}]'),
('Sensores independientes', '[{"nombre": "Sensor magnetico chico", "cantidad": 2}]'),
('Sensores y bloqueo', '[{"nombre": "Sensor magnetico chico", "cantidad": 2}, {"nombre": "Relevador", "cantidad": 1}]'),
('Audio bidireccional', '[{"nombre": "Microfono", "cantidad": 1}, {"nombre": "Bocina", "cantidad": 1}]'),
('Audio espía', '[{"nombre": "Microfono", "cantidad": 1}]'),
('sensor caja', '[{"nombre": "Cable 2 vias", "cantidad": 12}, {"nombre": "Sensor magnetico grande", "cantidad": 1}]'),
('habilitado', '[{"nombre": "Cable 2 vias", "cantidad": 2}, {"nombre": "Teclado sencillo", "cantidad": 1}, {"nombre": "Teclado dinámico", "cantidad": 1}]')
ON CONFLICT (funcionalidad) DO UPDATE SET
    insumos = EXCLUDED.insumos,
    updated_at = NOW();

-- Comentarios sobre la tabla
COMMENT ON TABLE funciones_rastreo IS 'Tabla para almacenar las funciones de rastreo y sus insumos asociados';
COMMENT ON COLUMN funciones_rastreo.funcionalidad IS 'Nombre de la funcionalidad de rastreo (ej: SOS simple, Bloqueo normal)';
COMMENT ON COLUMN funciones_rastreo.insumos IS 'Array JSON con los insumos requeridos para esta funcionalidad';
COMMENT ON COLUMN funciones_rastreo.activo IS 'Indica si la función está activa y disponible para uso';
