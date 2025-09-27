// ===========================================
// EXTENSIÓN DEL DATASERVICE PARA CORREO
// ===========================================
// Este archivo contiene las funciones adicionales necesarias para 
// integrar el sistema de correo con Supabase

// Agregar estas funciones al dataService.js existente

// ===========================================
// FUNCIONES DE CONFIGURACIÓN DE CORREO
// ===========================================

// Guardar configuración de correo en Supabase
async function guardarConfiguracionCorreo(config) {
    if (!client) throw new Error('Supabase no disponible');
    
    try {
        const { data, error } = await client
            .from('configuraciones_correo')
            .upsert({
                id: 'smtp_config',
                smtp_server: config.smtpServer,
                smtp_port: config.smtpPort,
                from_email: config.fromEmail,
                from_name: config.fromName,
                password: config.password, // En producción, esto debería estar encriptado
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            });
            
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error guardando configuración de correo:', error);
        throw error;
    }
}

// Obtener configuración de correo desde Supabase
async function obtenerConfiguracionCorreo() {
    if (!client) throw new Error('Supabase no disponible');
    
    try {
        const { data, error } = await client
            .from('configuraciones_correo')
            .select('*')
            .eq('id', 'smtp_config')
            .single();
            
        if (error && error.code !== 'PGRST116') throw error; // Ignorar "not found"
        
        if (data) {
            return {
                smtpServer: data.smtp_server,
                smtpPort: data.smtp_port,
                fromEmail: data.from_email,
                fromName: data.from_name,
                password: data.password
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error obteniendo configuración de correo:', error);
        throw error;
    }
}

// ===========================================
// FUNCIONES DE PLANTILLAS DE CORREO
// ===========================================

// Guardar plantilla de correo en Supabase
async function guardarPlantillaCorreo(tipo, plantilla) {
    if (!client) throw new Error('Supabase no disponible');
    
    try {
        const { data, error } = await client
            .from('plantillas_correo')
            .upsert({
                id: tipo,
                tipo: tipo,
                subject: plantilla.subject,
                html: plantilla.html,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            });
            
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error guardando plantilla de correo:', error);
        throw error;
    }
}

// Obtener todas las plantillas de correo desde Supabase
async function obtenerPlantillasCorreo() {
    if (!client) throw new Error('Supabase no disponible');
    
    try {
        const { data, error } = await client
            .from('plantillas_correo')
            .select('*');
            
        if (error) throw error;
        
        const plantillas = {};
        data.forEach(item => {
            plantillas[item.tipo] = {
                subject: item.subject,
                html: item.html
            };
        });
        
        return plantillas;
    } catch (error) {
        console.error('Error obteniendo plantillas de correo:', error);
        throw error;
    }
}

// ===========================================
// FUNCIONES DE CONFIGURACIÓN DE SEGUIMIENTO
// ===========================================

// Guardar configuración de seguimiento en Supabase
async function guardarConfiguracionSeguimiento(config) {
    if (!client) throw new Error('Supabase no disponible');
    
    try {
        const { data, error } = await client
            .from('configuraciones_seguimiento')
            .upsert({
                id: 'seguimiento_config',
                dias_seguimiento: config.diasSeguimiento,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            });
            
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error guardando configuración de seguimiento:', error);
        throw error;
    }
}

// Obtener configuración de seguimiento desde Supabase
async function obtenerConfiguracionSeguimiento() {
    if (!client) throw new Error('Supabase no disponible');
    
    try {
        const { data, error } = await client
            .from('configuraciones_seguimiento')
            .select('*')
            .eq('id', 'seguimiento_config')
            .single();
            
        if (error && error.code !== 'PGRST116') throw error; // Ignorar "not found"
        
        if (data) {
            return {
                diasSeguimiento: data.dias_seguimiento
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error obteniendo configuración de seguimiento:', error);
        throw error;
    }
}

// ===========================================
// FUNCIONES DE REGISTRO DE CORREOS
// ===========================================

// Guardar registro de correo enviado en Supabase
async function guardarRegistroCorreo(registro) {
    if (!client) throw new Error('Supabase no disponible');
    
    try {
        const { data, error } = await client
            .from('registros_correos')
            .insert({
                cotizacion_id: registro.cotizacionId,
                numero_cotizacion: registro.numero,
                destinatarios_principales: JSON.stringify(registro.emails?.principales || []),
                destinatarios_copia: JSON.stringify(registro.emails?.copia || []),
                destinatarios_bcc: JSON.stringify(registro.emails?.bcc || []),
                tipo_envio: registro.tipoEnvio || 'cotizacion',
                cliente_email: registro.cliente?.email,
                cliente_empresa: registro.cliente?.empresa,
                total_cotizacion: registro.total,
                fecha_envio: registro.fecha_envio,
                mensaje_personalizado: registro.mensajePersonalizado,
                created_at: new Date().toISOString()
            });
            
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error guardando registro de correo:', error);
        throw error;
    }
}

// Obtener registros de correos enviados desde Supabase
async function obtenerRegistrosCorreos(filtros = {}) {
    if (!client) throw new Error('Supabase no disponible');
    
    try {
        let query = client.from('registros_correos').select('*');
        
        if (filtros.cotizacionId) {
            query = query.eq('cotizacion_id', filtros.cotizacionId);
        }
        
        if (filtros.fechaDesde) {
            query = query.gte('fecha_envio', filtros.fechaDesde);
        }
        
        if (filtros.fechaHasta) {
            query = query.lte('fecha_envio', filtros.fechaHasta);
        }
        
        query = query.order('created_at', { ascending: false });
        
        const { data, error } = await query;
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Error obteniendo registros de correos:', error);
        throw error;
    }
}

// ===========================================
// SCRIPTS SQL PARA CREAR LAS TABLAS
// ===========================================

/*
-- Tabla para configuración de correo
CREATE TABLE configuraciones_correo (
    id TEXT PRIMARY KEY,
    smtp_server TEXT NOT NULL,
    smtp_port INTEGER NOT NULL,
    from_email TEXT NOT NULL,
    from_name TEXT NOT NULL,
    password TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para plantillas de correo
CREATE TABLE plantillas_correo (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    subject TEXT NOT NULL,
    html TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para configuración de seguimiento
CREATE TABLE configuraciones_seguimiento (
    id TEXT PRIMARY KEY,
    dias_seguimiento INTEGER NOT NULL DEFAULT 7,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para registros de correos enviados
CREATE TABLE registros_correos (
    id SERIAL PRIMARY KEY,
    cotizacion_id TEXT,
    numero_cotizacion TEXT,
    destinatarios_principales JSONB,
    destinatarios_copia JSONB,
    destinatarios_bcc JSONB,
    tipo_envio TEXT DEFAULT 'cotizacion',
    cliente_email TEXT,
    cliente_empresa TEXT,
    total_cotizacion DECIMAL,
    fecha_envio TIMESTAMP WITH TIME ZONE,
    mensaje_personalizado TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_registros_correos_cotizacion_id ON registros_correos(cotizacion_id);
CREATE INDEX idx_registros_correos_fecha_envio ON registros_correos(fecha_envio);
CREATE INDEX idx_registros_correos_tipo_envio ON registros_correos(tipo_envio);

-- Row Level Security (RLS) - ajustar según tus necesidades
ALTER TABLE configuraciones_correo ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_correo ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuraciones_seguimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_correos ENABLE ROW LEVEL SECURITY;

-- Políticas de ejemplo (ajustar según tus roles)
CREATE POLICY "Admin can manage email config" ON configuraciones_correo
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admin can manage email templates" ON plantillas_correo
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admin can manage follow config" ON configuraciones_seguimiento
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Users can view email records" ON registros_correos
    FOR SELECT USING (true);

CREATE POLICY "Admin can manage email records" ON registros_correos
    FOR ALL USING (auth.role() = 'admin');
*/

// ===========================================
// INTEGRACIÓN CON DATASERVICE EXISTENTE
// ===========================================

// Para integrar estas funciones con el dataService.js existente,
// agregar estas líneas al final del archivo dataService.js:

/*
  // Exponer nuevas funciones de correo
  window.dataService = {
    ...window.dataService,
    
    // Funciones de configuración de correo
    guardarConfiguracionCorreo,
    obtenerConfiguracionCorreo,
    
    // Funciones de plantillas
    guardarPlantillaCorreo,
    obtenerPlantillasCorreo,
    
    // Funciones de seguimiento
    guardarConfiguracionSeguimiento,
    obtenerConfiguracionSeguimiento,
    
    // Funciones de registros
    guardarRegistroCorreo,
    obtenerRegistrosCorreos
  };
*/
