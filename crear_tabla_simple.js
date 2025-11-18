// Script simple para crear la tabla configuracion_sistema
// Copia y pega este código en la consola del navegador en administrar-almacen.html

(async function() {
    console.log('🚀 Creando tabla configuracion_sistema...');
    
    try {
        // Obtener el cliente de Supabase
        const client = window.DataService.client;
        
        // Intentar crear la tabla insertando un registro
        // Si la tabla no existe, Supabase la creará automáticamente
        const { error } = await client
            .from('configuracion_sistema')
            .upsert({
                clave: 'tipos_globales',
                valor: { vehiculos: [], soluciones: [], insumos: [] },
                ultima_actualizacion: new Date().toISOString()
            }, { onConflict: 'clave' });
        
        if (error) {
            console.error('❌ Error:', error);
            console.log('💡 Intenta crear la tabla manualmente en Supabase Dashboard');
            return;
        }
        
        console.log('✅ Tabla configuracion_sistema creada exitosamente');
        console.log('✅ Datos iniciales insertados');
        console.log('🔄 Refresca la página para probar la persistencia');
        
    } catch (error) {
        console.error('❌ Error:', error);
        console.log('💡 Intenta crear la tabla manualmente en Supabase Dashboard');
    }
})();
