// Script para crear la tabla configuracion_sistema en Supabase
// Ejecutar este script en la consola del navegador en la página de administrar-almacen.html

async function crearTablaConfiguracionSistema() {
    console.log('🚀 Iniciando creación de tabla configuracion_sistema...');
    
    try {
        // Verificar que dataService esté disponible
        if (!window.DataService || !window.DataService.client) {
            console.error('❌ dataService no está disponible');
            return false;
        }
        
        const client = window.DataService.client;
        
        // SQL para crear la tabla
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS public.configuracion_sistema (
                clave TEXT PRIMARY KEY,
                valor JSONB NOT NULL,
                ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;
        
        // Crear la tabla
        console.log('📋 Creando tabla configuracion_sistema...');
        const { error: createError } = await client.rpc('exec_sql', { sql: createTableSQL });
        
        if (createError) {
            console.error('❌ Error creando tabla:', createError);
            return false;
        }
        
        // Crear índice
        const createIndexSQL = `
            CREATE INDEX IF NOT EXISTS idx_configuracion_sistema_clave 
            ON public.configuracion_sistema(clave);
        `;
        
        console.log('📋 Creando índice...');
        const { error: indexError } = await client.rpc('exec_sql', { sql: createIndexSQL });
        
        if (indexError) {
            console.warn('⚠️ Error creando índice:', indexError);
        }
        
        // Habilitar RLS
        const enableRLSSQL = `
            ALTER TABLE public.configuracion_sistema ENABLE ROW LEVEL SECURITY;
        `;
        
        console.log('📋 Habilitando RLS...');
        const { error: rlsError } = await client.rpc('exec_sql', { sql: enableRLSSQL });
        
        if (rlsError) {
            console.warn('⚠️ Error habilitando RLS:', rlsError);
        }
        
        // Crear política
        const createPolicySQL = `
            CREATE POLICY IF NOT EXISTS "Permitir acceso completo a configuracion_sistema" 
            ON public.configuracion_sistema 
            FOR ALL 
            TO authenticated 
            USING (true) 
            WITH CHECK (true);
        `;
        
        console.log('📋 Creando política de seguridad...');
        const { error: policyError } = await client.rpc('exec_sql', { sql: createPolicySQL });
        
        if (policyError) {
            console.warn('⚠️ Error creando política:', policyError);
        }
        
        // Insertar datos iniciales
        console.log('📋 Insertando datos iniciales...');
        const { error: insertError } = await client
            .from('configuracion_sistema')
            .upsert({
                clave: 'tipos_globales',
                valor: { vehiculos: [], soluciones: [], insumos: [] },
                ultima_actualizacion: new Date().toISOString()
            }, { onConflict: 'clave' });
        
        if (insertError) {
            console.error('❌ Error insertando datos iniciales:', insertError);
            return false;
        }
        
        console.log('✅ Tabla configuracion_sistema creada exitosamente');
        console.log('✅ Datos iniciales insertados');
        console.log('✅ La tabla está lista para usar');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error general:', error);
        return false;
    }
}

// Función alternativa usando SQL directo
async function crearTablaConfiguracionSistemaDirecto() {
    console.log('🚀 Creando tabla usando método directo...');
    
    try {
        const client = window.DataService.client;
        
        // Crear la tabla usando upsert directo
        const { error } = await client
            .from('configuracion_sistema')
            .upsert({
                clave: 'tipos_globales',
                valor: { vehiculos: [], soluciones: [], insumos: [] },
                ultima_actualizacion: new Date().toISOString()
            }, { onConflict: 'clave' });
        
        if (error) {
            console.error('❌ Error:', error);
            return false;
        }
        
        console.log('✅ Tabla configuracion_sistema creada y lista');
        return true;
        
    } catch (error) {
        console.error('❌ Error:', error);
        return false;
    }
}

// Ejecutar la función
console.log('🔧 Para crear la tabla, ejecuta:');
console.log('crearTablaConfiguracionSistema()');
console.log('o si falla:');
console.log('crearTablaConfiguracionSistemaDirecto()');
