-- Insertar insumos SIM en la tabla tipos_insumo
INSERT INTO public.tipos_insumo (nombre, categoria, descripcion, activo)
VALUES
    ('SIM voz', 'insumos', 'SIM card para servicios de voz', true),
    ('SIM 5 Mb', 'insumos', 'SIM card con plan de 5 MB para rastreo básico', true),
    ('SIM 100 Mb', 'insumos', 'SIM card con plan de 100 MB para rastreo avanzado', true),
    ('SIM video', 'insumos', 'SIM card para transmisión de video', true)
ON CONFLICT (nombre) DO NOTHING;
