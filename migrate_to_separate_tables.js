// Script de migración para usar tablas separadas
// Ejecutar en la consola del navegador en administrar-almacen.html

async function migrarATablasSeparadas() {
    console.log('🚀 Iniciando migración a tablas separadas...');
    
    try {
        // Verificar que dataService esté disponible
        if (!window.DataService || !window.DataService.client) {
            console.error('❌ dataService no está disponible');
            return false;
        }
        
        // 1. Obtener tipos existentes de localStorage
        const tiposGlobales = JSON.parse(localStorage.getItem('tipos_globales') || '{"vehiculos":[],"soluciones":[],"insumos":[]}');
        
        console.log('📋 Tipos encontrados en localStorage:', tiposGlobales);
        
        // 2. Migrar tipos de vehículo
        console.log('🚗 Migrando tipos de vehículo...');
        for (const vehiculo of tiposGlobales.vehiculos || []) {
            if (vehiculo && vehiculo.trim()) {
                await window.DataService.upsertTipoUnidad(vehiculo.trim(), `Tipo de vehículo: ${vehiculo}`);
                console.log(`✅ Vehículo migrado: ${vehiculo}`);
            }
        }
        
        // 3. Migrar tipos de solución
        console.log('🔧 Migrando tipos de solución...');
        for (const solucion of tiposGlobales.soluciones || []) {
            if (solucion && solucion.trim()) {
                await window.DataService.upsertTipoSolucion(solucion.trim(), `Tipo de solución: ${solucion}`, 'General');
                console.log(`✅ Solución migrada: ${solucion}`);
            }
        }
        
        // 4. Migrar tipos de insumo
        console.log('📦 Migrando tipos de insumo...');
        for (const insumo of tiposGlobales.insumos || []) {
            if (insumo && insumo.trim()) {
                await window.DataService.upsertTipoInsumo(insumo.trim(), `Tipo de insumo: ${insumo}`, 'General', 'piezas');
                console.log(`✅ Insumo migrado: ${insumo}`);
            }
        }
        
        // 5. Verificar migración
        console.log('🔍 Verificando migración...');
        const vehiculosMigrados = await window.DataService.fetchTiposUnidad();
        const solucionesMigradas = await window.DataService.fetchTiposSolucion();
        const insumosMigrados = await window.DataService.fetchTiposInsumo();
        
        console.log(`✅ Vehículos migrados: ${vehiculosMigrados.length}`);
        console.log(`✅ Soluciones migradas: ${solucionesMigradas.length}`);
        console.log(`✅ Insumos migrados: ${insumosMigrados.length}`);
        
        // 6. Limpiar localStorage (opcional)
        const limpiar = confirm('¿Deseas limpiar los tipos_globales de localStorage? (Recomendado después de la migración)');
        if (limpiar) {
            localStorage.removeItem('tipos_globales');
            console.log('🧹 localStorage limpiado');
        }
        
        console.log('✅ Migración completada exitosamente');
        console.log('🔄 Refresca la página para usar las nuevas tablas');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        return false;
    }
}

// Función para probar las nuevas tablas
async function probarTablasSeparadas() {
    console.log('🧪 Probando tablas separadas...');
    
    try {
        // Probar fetch de cada tabla
        const vehiculos = await window.DataService.fetchTiposUnidad();
        const soluciones = await window.DataService.fetchTiposSolucion();
        const insumos = await window.DataService.fetchTiposInsumo();
        
        console.log('📊 Resultados:');
        console.log(`- Vehículos: ${vehiculos.length} registros`);
        console.log(`- Soluciones: ${soluciones.length} registros`);
        console.log(`- Insumos: ${insumos.length} registros`);
        
        // Mostrar algunos ejemplos
        if (vehiculos.length > 0) {
            console.log('🚗 Ejemplo de vehículo:', vehiculos[0]);
        }
        if (soluciones.length > 0) {
            console.log('🔧 Ejemplo de solución:', soluciones[0]);
        }
        if (insumos.length > 0) {
            console.log('📦 Ejemplo de insumo:', insumos[0]);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error probando tablas:', error);
        return false;
    }
}

// Ejecutar automáticamente
console.log('🔧 Scripts de migración cargados:');
console.log('1. migrarATablasSeparadas() - Migra datos de localStorage a las nuevas tablas');
console.log('2. probarTablasSeparadas() - Prueba que las tablas funcionen correctamente');
console.log('');
console.log('💡 Ejecuta: migrarATablasSeparadas() para comenzar la migración');
