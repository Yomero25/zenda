# 📋 REGLAS HARDCODEADAS DEL SISTEMA ZENDA

## 🎯 **RESUMEN EJECUTIVO**
Este documento lista todas las reglas de negocio hardcodeadas en el sistema ZendA, organizadas por módulo y funcionalidad.

---

## 🔧 **1. REGLAS DE SUGERENCIA DE EQUIPOS AUTOMÁTICOS**

### **1.1 Reglas de Equipos por Solución**

| **Solución** | **Equipo Sugerido** | **Condición** | **Ubicación** |
|--------------|---------------------|---------------|---------------|
| **Dashcam** | `Dashcam ad2` | Si `ai: true` o `ia: true` | `cotizaciones-wizard-corregido.html:1264` |
| **Dashcam** | `Dashcam c6` | Si NO tiene `ai: true` ni `ia: true` | `cotizaciones-wizard-corregido.html:1264` |
| **Rastreo básico** | `GV75LAU` | Si `ip67: true` | `cotizaciones-wizard-corregido.html:1290` |
| **Rastreo básico** | `GV58LAU` | Si NO tiene `ip67: true` | `cotizaciones-wizard-corregido.html:1290` |
| **Rastreo avanzado** | `GV310LAU` | Siempre | `cotizaciones-wizard-corregido.html:1298` |
| **Rastreo satelital** | `SMOC` | Siempre | `cotizaciones-wizard-corregido.html:1308` |
| **MDVR 4 Ch** | `MDVR 4 Ch` | Siempre (1 por unidad) | `cotizaciones-wizard-corregido.html:1323` |
| **MDVR 8 Ch** | `MDVR 8 Ch` | Siempre (1 por unidad) | `cotizaciones-wizard-corregido.html:1334` |

### **1.2 Reglas de Grabación**

| **Solución** | **Equipo Adicional** | **Condición** | **Ubicación** |
|--------------|---------------------|---------------|---------------|
| **VPC** | `MDVR 4 Ch` | Si `grabacion: true` | `cotizaciones-wizard-corregido.html:1348` |
| **Sideview** | `MDVR 4 Ch` | Si `grabacion: true` | `cotizaciones-wizard-corregido.html:1348` |
| **Encadenamiento señales** | `MDVR 4 Ch` | Si `grabacion: true` | `cotizaciones-wizard-corregido.html:1348` |

### **1.3 Reglas de Unicidad por Unidad**

- **Un solo MDVR por unidad**: No se pueden sugerir `MDVR 4 Ch` y `MDVR 8 Ch` en la misma unidad
- **Una sola variante de Dashcam por unidad**: No se pueden sugerir `Dashcam ad2` y `Dashcam c6` en la misma unidad
- **Un solo Monitor de VPC por unidad**: Evita duplicados

---

## 🛠️ **2. REGLAS DE DETECCIÓN DE SOPORTE**

### **2.1 Soluciones que SIEMPRE requieren soporte**

| **Solución** | **Ubicación** |
|--------------|---------------|
| `rastreo básico` | `modulo-despacho.html:1573` |
| `rastreo avanzado` | `modulo-despacho.html:1574` |
| `rastreo satelital` | `modulo-despacho.html:1575` |
| `mdvr 4 canales` | `modulo-despacho.html:1576` |
| `mdvr 8 canales` | `modulo-despacho.html:1577` |

### **2.2 Soluciones con grabación que requieren soporte**

| **Condición** | **Ubicación** |
|---------------|---------------|
| Cualquier solución que contenga "grabación" o "grabacion" en el nombre | `modulo-despacho.html:1588` |
| Configuraciones con `grabacion: true` o `grabación: true` | `modulo-despacho.html:1595` |

---

## 📦 **3. REGLAS DE INSUMOS Y CANTIDADES**

### **3.1 Reglas Fijas por Unidad (Solo Instalación)**

| **Insumo** | **Cantidad por Unidad** | **Ubicación** |
|------------|-------------------------|---------------|
| `Cinta de tela` | 0.5 | `cotizaciones-wizard-corregido.html:2176` |
| `Cinta de aislar` | 0.5 | `cotizaciones-wizard-corregido.html:2177` |

### **3.2 Reglas de Multiplicación por Lote**

- **Todos los insumos** se multiplican por `cantidadLote` o `vehiculos.length`
- **Excepción**: Los insumos con `reglaFija: true` NO se multiplican
- **Ubicación**: `cotizaciones-wizard-corregido.html:2205-2207`

### **3.3 Reglas de Excepción para Venta sin Instalación**

- **NO se aplican reglas fijas** cuando `tipoVenta !== 'instalacion'`
- **Ubicación**: `cotizaciones-wizard-corregido.html:2175`

---

## ⏰ **4. REGLAS DE VIGENCIA Y FECHAS**

### **4.1 Vigencia de Cotizaciones**

| **Campo** | **Valor** | **Ubicación** |
|-----------|-----------|---------------|
| **Vigencia por defecto** | 15 días | `cotizaciones-wizard-corregido.html:3195, 657` |

---

## 🎨 **5. REGLAS DE INTERFAZ Y UX**

### **5.1 Colores por Categoría de Precios**

| **Categoría** | **Color Bootstrap** | **Ubicación** |
|---------------|-------------------|---------------|
| `Equipo` | `success` (verde) | `administrar-precios.html:411` |
| `Accesorio` | `primary` (azul) | `administrar-precios.html:411` |
| `Insumo` | `secondary` (gris) | `administrar-precios.html:411` |

### **5.2 Ordenamiento de Elementos**

- **Orden alfabético** (case-insensitive) para todos los elementos
- **Ubicación**: `administrar-precios.html:411`

---

## 🔐 **6. REGLAS DE AUTENTICACIÓN Y ROLES**

### **6.1 Roles del Sistema**

| **Rol** | **Módulos Accesibles** | **Ubicación** |
|---------|------------------------|---------------|
| `admin` | Todos los módulos | `accessGuard.js` |
| `ventas` | Cotizaciones, Clientes | `accessGuard.js` |
| `despacho` | Despacho, Instalaciones | `accessGuard.js` |
| `almacen` | Almacén, Precios | `accessGuard.js` |
| `precios` | Solo Precios | `accessGuard.js` |
| `instalaciones` | Solo Instalaciones | `accessGuard.js` |
| `soporte` | Solo Soporte | `accessGuard.js` |

---

## 🗑️ **7. REGLAS DE ELIMINACIÓN CASCADE**

### **7.1 Al eliminar una cotización se eliminan:**

1. **Solicitudes de despacho** relacionadas
2. **Notificaciones de instalaciones** por `cotizacionId`
3. **Notificaciones de soporte** por `cotizacionId`
4. **Notificaciones de instalaciones** por `solicitudDespachoId`
5. **Notificaciones de soporte** por `solicitudDespachoId`

**Ubicación**: `dataService.js:944-962`

---

## 📊 **8. REGLAS DE CÁLCULO DE TOTALES**

### **8.1 Consolidación de Insumos**

- **Suma numérica** de cantidades (no concatenación de strings)
- **Ubicación**: `cotizaciones-wizard-corregido.html:2205-2207`

### **8.2 Aplicación de Descuentos**

- **Descuento por defecto**: 0%
- **Aplicación**: Al total final de la cotización

---

## 🔄 **9. REGLAS DE TIEMPO REAL**

### **9.1 Suscripciones Activas**

| **Tabla** | **Módulo** | **Propósito** |
|-----------|------------|---------------|
| `precios_elementos` | Administrar Precios | Actualización de precios |
| `cotizaciones` | Cotizaciones | Sincronización de cotizaciones |
| `solicitudes_despacho` | Despacho | Actualización de solicitudes |
| `notificaciones_instalaciones` | Instalaciones | Notificaciones en tiempo real |
| `notificaciones_soporte` | Soporte | Notificaciones en tiempo real |

---

## ⚠️ **10. REGLAS DE VALIDACIÓN**

### **10.1 Validaciones de Formularios**

- **Folios únicos**: No se permiten duplicados
- **Campos requeridos**: Cliente, empresa, soluciones
- **Rangos numéricos**: Cantidades > 0

### **10.2 Validaciones de Negocio**

- **Equipos únicos por unidad**: Evita duplicados
- **Soluciones compatibles**: Verificación de configuraciones
- **Estados válidos**: Transiciones de estado permitidas

---

## 📝 **NOTAS IMPORTANTES**

1. **Todas estas reglas están hardcodeadas** en el código JavaScript
2. **Para modificar reglas**, se requiere editar el código fuente
3. **No hay configuración externa** para estas reglas
4. **Las reglas están distribuidas** en múltiples archivos HTML/JS
5. **Algunas reglas tienen dependencias** entre sí

---

## 🔧 **RECOMENDACIONES PARA FUTURAS MEJORAS**

1. **Centralizar reglas** en un archivo de configuración JSON
2. **Crear interfaz de administración** para modificar reglas
3. **Implementar sistema de versionado** para reglas
4. **Agregar validación** de reglas en tiempo de ejecución
5. **Documentar dependencias** entre reglas

---

*Documento generado automáticamente - Última actualización: $(date)*
