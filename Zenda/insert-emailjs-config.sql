-- Insertar configuración de EmailJS directamente en Supabase
-- Reemplaza los valores con tus datos reales de EmailJS

-- Primero, eliminar cualquier configuración existente
DELETE FROM configuraciones_correo WHERE tipo = 'email';

-- Insertar nueva configuración con EmailJS
INSERT INTO configuraciones_correo (
    tipo,
    smtp_server,
    smtp_port,
    smtp_secure,
    smtp_user,
    smtp_password,
    password,
    from_email,
    from_name,
    emailjs_public_key,
    emailjs_service_id,
    emailjs_template_id,
    backend_url,
    is_active,
    estado_prueba
) VALUES (
    'email',
    'smtp.gmail.com',
    587,
    false,
    'belem.rojas@techinnovation.com.mx',
    'B3l3m@2',
    'B3l3m@2',
    'belem.rojas@techinnovation.com.mx',
    'ZendA',
    'XE8rCer6_b-QvgKQu',           -- Public Key de EmailJS
    'service_g7fuvgj',             -- Service ID de EmailJS
    'template_nf6bpis',            -- Tu Template ID
    '',
    true,
    'exitoso'
);

-- Verificar que se insertó correctamente
SELECT * FROM configuraciones_correo WHERE tipo = 'email';
