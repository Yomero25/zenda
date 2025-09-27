-- Crear la tabla para servicios de datos
CREATE TABLE public.servicios_datos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    tipo_periodicidad text NOT NULL CHECK (tipo_periodicidad IN ('mensual', 'semestral', 'anual')),
    precio_mensual numeric(10,2),
    precio_semestral numeric(10,2),
    precio_anual numeric(10,2),
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT servicios_datos_pkey PRIMARY KEY (id),
    CONSTRAINT servicios_datos_nombre_tipo_key UNIQUE (nombre, tipo_periodicidad)
);

-- Habilitar RLS
ALTER TABLE public.servicios_datos ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Enable read access for all users" ON public.servicios_datos FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.servicios_datos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.servicios_datos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.servicios_datos FOR DELETE USING (auth.role() = 'authenticated');

-- Crear función para actualizar 'updated_at'
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para 'updated_at'
CREATE TRIGGER update_servicios_datos_updated_at BEFORE UPDATE ON public.servicios_datos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar servicios de datos
INSERT INTO public.servicios_datos (nombre, descripcion, tipo_periodicidad, precio_mensual, precio_semestral, precio_anual)
VALUES
    ('Hosting', 'Servicio de hosting para equipos', 'mensual', 150.00, 800.00, 1500.00),
    ('Datos rastreo basico', 'Servicio de datos para rastreo básico', 'mensual', 80.00, 450.00, 850.00),
    ('Datos rastreo avanzado', 'Servicio de datos para rastreo avanzado', 'mensual', 120.00, 650.00, 1200.00),
    ('Datos - Voz', 'Servicio de datos para comunicación de voz', 'mensual', 100.00, 550.00, 1000.00),
    ('Datos video', 'Servicio de datos para transmisión de video', 'mensual', 200.00, 1100.00, 2100.00),
    ('Activación satelital', 'Activación de servicio satelital', 'anual', NULL, NULL, 500.00),
    ('Datos - Satelitales', 'Servicio de datos satelitales', 'anual', NULL, NULL, 3000.00)
ON CONFLICT (nombre, tipo_periodicidad) DO NOTHING;
