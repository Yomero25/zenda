/**
 * CONFIGURACIÓN GMAIL PARA ZENDA
 * 
 * Para configurar Gmail, necesitas:
 * 1. Habilitar 2FA en tu cuenta de Gmail
 * 2. Generar una "App Password" específica (no tu contraseña normal)
 * 3. Reemplazar los valores de abajo con tus credenciales reales
 */

const GMAIL_CONFIG = {
    // ⚠️ REEMPLAZA ESTOS VALORES CON TUS CREDENCIALES REALES
    user: 'tu-email@gmail.com',                    // Tu email de Gmail
    password: 'tu-app-password-de-16-caracteres',  // App Password de 16 caracteres
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true para puerto 465, false para otros puertos
    tls: {
        rejectUnauthorized: false
    }
};

/**
 * PLANTILLA DE CORREO PARA COTIZACIONES
 */
const EMAIL_TEMPLATES = {
    cotizacion: {
        subject: 'Cotización ZendA - {{folio}}',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #fb930c 0%, #e67e22 100%); padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">ZendA</h1>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Workflow Manager</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #333; margin-bottom: 20px;">Estimado/a {{cliente_nombre}},</h2>
                    
                    <p style="color: #666; line-height: 1.6;">
                        Adjunto encontrará la cotización <strong>{{folio}}</strong> con los detalles de la propuesta 
                        para su proyecto de {{tipo_solucion}}.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fb930c;">
                        <h3 style="color: #333; margin-top: 0;">Resumen de la Cotización</h3>
                        <p><strong>Folio:</strong> {{folio}}</p>
                        <p><strong>Cliente:</strong> {{cliente_nombre}}</p>
                        <p><strong>Total:</strong> ${{total}}</p>
                        <p><strong>Vigencia:</strong> {{fecha_vencimiento}}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{url_aceptar}}" 
                           style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
                            ✅ Aceptar Cotización
                        </a>
                        <a href="{{url_rechazar}}" 
                           style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            ❌ Rechazar Cotización
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        Si tiene alguna pregunta o requiere aclaraciones, no dude en contactarnos.
                    </p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #666; font-size: 12px;">
                        <p>Este correo fue enviado automáticamente por el sistema ZendA</p>
                    </div>
                </div>
            </div>
        `
    },
    
    seguimiento: {
        subject: 'Seguimiento - Cotización ZendA {{folio}}',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #fb930c 0%, #e67e22 100%); padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">ZendA</h1>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Workflow Manager</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #333; margin-bottom: 20px;">Estimado/a {{cliente_nombre}},</h2>
                    
                    <p style="color: #666; line-height: 1.6;">
                        Le escribimos para dar seguimiento a la cotización <strong>{{folio}}</strong> que enviamos 
                        el {{fecha_envio}}.
                    </p>
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <h3 style="color: #856404; margin-top: 0;">¿Necesita más información?</h3>
                        <p style="color: #856404; margin-bottom: 0;">
                            Si tiene alguna pregunta sobre la propuesta o necesita aclaraciones, 
                            estaremos encantados de ayudarle.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{url_aceptar}}" 
                           style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
                            ✅ Aceptar Cotización
                        </a>
                        <a href="{{url_rechazar}}" 
                           style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            ❌ Rechazar Cotización
                        </a>
                    </div>
                </div>
            </div>
        `
    }
};

/**
 * FUNCIONES DE GMAIL (REQUIEREN NODEMAILER EN EL BACKEND)
 * 
 * Estas funciones están preparadas para cuando implementes el backend con Node.js
 */

// Función para enviar cotización por email
async function enviarCotizacionPorEmail(cotizacion, pdfBuffer) {
    try {
        // Esta función se implementará cuando tengas el backend
        console.log('📧 Enviando cotización por email:', cotizacion.folio);
        
        // Simulación de envío (reemplazar con implementación real)
        const template = EMAIL_TEMPLATES.cotizacion;
        const html = template.html
            .replace(/{{folio}}/g, cotizacion.folio)
            .replace(/{{cliente_nombre}}/g, cotizacion.cliente_nombre)
            .replace(/{{total}}/g, cotizacion.total.toLocaleString())
            .replace(/{{fecha_vencimiento}}/g, cotizacion.fecha_vencimiento)
            .replace(/{{tipo_solucion}}/g, 'solución de rastreo')
            .replace(/{{url_aceptar}}/g, `https://yomero25.github.io/zenda/aceptar-cotizacion.html?id=${cotizacion.id}`)
            .replace(/{{url_rechazar}}/g, `https://yomero25.github.io/zenda/rechazar-cotizacion.html?id=${cotizacion.id}`);
        
        console.log('📧 HTML del email generado:', html);
        
        // Aquí iría la implementación real con Nodemailer
        // const transporter = nodemailer.createTransporter(GMAIL_CONFIG);
        // await transporter.sendMail({...});
        
        return { success: true, message: 'Email enviado exitosamente' };
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        return { success: false, message: 'Error enviando email' };
    }
}

// Función para enviar seguimiento por email
async function enviarSeguimientoPorEmail(cotizacion) {
    try {
        console.log('📧 Enviando seguimiento por email:', cotizacion.folio);
        
        const template = EMAIL_TEMPLATES.seguimiento;
        const html = template.html
            .replace(/{{folio}}/g, cotizacion.folio)
            .replace(/{{cliente_nombre}}/g, cotizacion.cliente_nombre)
            .replace(/{{fecha_envio}}/g, new Date(cotizacion.fecha_envio).toLocaleDateString('es-ES'))
            .replace(/{{url_aceptar}}/g, `https://yomero25.github.io/zenda/aceptar-cotizacion.html?id=${cotizacion.id}`)
            .replace(/{{url_rechazar}}/g, `https://yomero25.github.io/zenda/rechazar-cotizacion.html?id=${cotizacion.id}`);
        
        console.log('📧 HTML del seguimiento generado:', html);
        
        return { success: true, message: 'Seguimiento enviado exitosamente' };
    } catch (error) {
        console.error('❌ Error enviando seguimiento:', error);
        return { success: false, message: 'Error enviando seguimiento' };
    }
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GMAIL_CONFIG, EMAIL_TEMPLATES, enviarCotizacionPorEmail, enviarSeguimientoPorEmail };
} else {
    window.GmailConfig = { GMAIL_CONFIG, EMAIL_TEMPLATES, enviarCotizacionPorEmail, enviarSeguimientoPorEmail };
}
