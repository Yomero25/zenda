# 📧 Configuración del Sistema de Correo

## 🎯 Funcionalidades Implementadas

### ✅ **Lo que ya está listo:**
- **Interfaz completa** para configurar y enviar correos
- **Plantillas HTML** profesionales para cotizaciones y seguimiento
- **Modales de configuración** con validación de campos
- **Sistema de notificaciones** automáticas de seguimiento
- **Integración con el wizard** - aparece automáticamente en el paso 4
- **Múltiples servicios de correo** compatibles

### 🛠️ **Botones disponibles en el Paso 4:**
- **"Enviar Cotización por Correo"** - Envía la cotización completa al cliente
- **"Configurar Correo"** - Configura credenciales SMTP

---

## 🚀 Opciones de Implementación

### **OPCIÓN 1: EmailJS (Recomendado para inicio rápido)**
**✅ Ventajas:** Sin backend, gratuito hasta 200 correos/mes, fácil configuración
**❌ Desventajas:** Limitado, requiere cuenta externa

#### Configuración EmailJS:
1. Registrarse en [EmailJS](https://www.emailjs.com/)
2. Crear un servicio de correo
3. Crear un template
4. Agregar el SDK a tu HTML:
```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
<script>
    emailjs.init("TU_PUBLIC_KEY");
</script>
```

### **OPCIÓN 2: Backend con Node.js (Recomendado para producción)**
**✅ Ventajas:** Control total, sin límites, más seguro
**❌ Desventajas:** Requiere servidor

#### Ya incluido en el proyecto:
- Archivo `email-backend-example.js` con servidor completo
- Instrucciones detalladas de instalación
- Endpoints para todas las funcionalidades

### **OPCIÓN 3: Gmail SMTP Directo**
**✅ Ventajas:** Usa tu cuenta Gmail directamente
**❌ Desventajas:** Requiere contraseña de aplicación

---

## ⚙️ Configuración Paso a Paso

### **1. Para Gmail (Más común):**

#### A) Habilitar contraseña de aplicación:
1. Ve a [Google Account Security](https://myaccount.google.com/security)
2. Habilita "Verificación en 2 pasos"
3. Ve a "Contraseñas de aplicaciones"
4. Genera una nueva para "Otra aplicación"
5. Copia la contraseña generada

#### B) Configurar en el sistema:
- **Servidor SMTP:** `smtp.gmail.com`
- **Puerto:** `587`
- **Email:** `tu-email@gmail.com`
- **Contraseña:** La contraseña de aplicación generada

### **2. Para Outlook/Hotmail:**
- **Servidor SMTP:** `smtp-mail.outlook.com`
- **Puerto:** `587`
- **Email:** `tu-email@outlook.com`
- **Contraseña:** Tu contraseña normal (o contraseña de aplicación)

### **3. Para otros proveedores:**
Consulta la documentación de tu proveedor de correo para obtener:
- Servidor SMTP
- Puerto (usualmente 587 para TLS o 465 para SSL)
- Credenciales de autenticación

---

## 📋 Funcionalidades del Sistema

### **Envío de Cotizaciones:**
- ✅ Plantilla HTML profesional con colores corporativos
- ✅ Datos del cliente pre-llenados automáticamente
- ✅ Resumen completo de equipos y servicios
- ✅ Validez configurable de la cotización
- ✅ Opción de agregar mensaje personalizado
- ✅ Campo para enviar copia (CC)

### **Seguimiento Automático:**
- ✅ Recordatorios automáticos después de 7 días
- ✅ Plantilla específica para seguimiento
- ✅ Registro de envíos en localStorage/base de datos
- ✅ Estado de cotizaciones (pendiente, enviada, cerrada)

### **Configuración:**
- ✅ Guardado automático en localStorage
- ✅ Validación de campos requeridos
- ✅ Soporte para múltiples servidores SMTP
- ✅ Configuración persistente entre sesiones

---

## 🔧 Instalación del Backend (Opcional)

### **Si eliges usar el backend incluido:**

1. **Crear directorio:**
```bash
mkdir email-backend
cd email-backend
```

2. **Instalar dependencias:**
```bash
npm init -y
npm install express nodemailer cors dotenv
```

3. **Configurar variables de entorno (.env):**
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-password-app
```

4. **Ejecutar servidor:**
```bash
node email-backend-example.js
```

### **Endpoints disponibles:**
- `POST /api/send-email` - Enviar correo individual
- `POST /api/test-email-config` - Probar configuración
- `POST /api/send-bulk-emails` - Envío masivo
- `POST /api/cotizaciones` - Guardar cotización
- `GET /api/cotizaciones/:id` - Obtener cotización
- `PUT /api/cotizaciones/:id` - Actualizar cotización

---

## 📧 Plantillas de Correo

### **Plantilla de Cotización incluye:**
- 🎨 Diseño profesional con colores corporativos (naranja #fb930c)
- 📋 Datos completos del cliente
- 💰 Total destacado de la cotización
- 📅 Fecha y validez
- 🚗 Lista detallada de equipos y servicios por unidad
- 📞 Información de contacto

### **Plantilla de Seguimiento incluye:**
- 👋 Saludo personalizado
- 📄 Recordatorio de la cotización enviada
- 💡 Sugerencias de próximos pasos
- 📞 Invitación a contactar para dudas
- ⏰ Recordatorio de validez

---

## 🎯 Próximos Pasos

1. **Elegir tu opción de envío** (EmailJS o Backend)
2. **Configurar credenciales** en el modal de configuración
3. **Probar envío** con una cotización de ejemplo
4. **Personalizar plantillas** si es necesario (opcional)

---

## 🆘 Solución de Problemas

### **Error: "Authentication failed"**
- ✅ Verifica que uses contraseña de aplicación (no la normal)
- ✅ Confirma que tienes 2FA habilitado en Gmail
- ✅ Revisa que el servidor SMTP sea correcto

### **Error: "Invalid recipients"**
- ✅ Verifica que el email del cliente sea válido
- ✅ Confirma que no haya espacios extra en el email

### **Error: "Connection timeout"**
- ✅ Verifica tu conexión a internet
- ✅ Confirma que el puerto SMTP sea correcto (587 o 465)
- ✅ Revisa si tu firewall bloquea conexiones SMTP

### **No aparece la sección de correo:**
- ✅ Asegúrate de llegar al paso 4 del wizard
- ✅ La sección se muestra automáticamente en el resumen

---

## 📞 Soporte

Si necesitas ayuda adicional:
- Revisa la consola del navegador para errores
- Verifica la configuración SMTP con tu proveedor
- Prueba con EmailJS para una configuración rápida

¡El sistema está listo para usar! 🚀
