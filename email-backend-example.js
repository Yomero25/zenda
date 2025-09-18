// ===========================================
// EJEMPLO DE BACKEND PARA ENVÍO DE CORREOS
// Sistema de Cotizaciones
// ===========================================

// Para usar este ejemplo, instala las dependencias:
// npm install express nodemailer cors dotenv

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ===========================================
// CONFIGURACIÓN DE NODEMAILER
// ===========================================

// Función para crear transportador dinámico
function crearTransportador(config) {
    return nodemailer.createTransporter({
        host: config.smtpServer,
        port: config.smtpPort,
        secure: config.smtpPort === 465, // true para 465, false para otros puertos
        auth: {
            user: config.user,
            pass: config.password
        },
        tls: {
            rejectUnauthorized: false // Para servidores con certificados autofirmados
        }
    });
}

// Configuración por defecto (usar variables de entorno)
const defaultEmailConfig = {
    smtpServer: process.env.SMTP_SERVER || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || ''
};

// ===========================================
// RUTAS DE ENVÍO DE CORREO
// ===========================================

// Ruta principal para enviar correos
app.post('/api/send-email', async (req, res) => {
    try {
        const { to, subject, html, config, cc, attachments } = req.body;
        
        // Validar datos requeridos
        if (!to || !subject || !html) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: to, subject, html'
            });
        }
        
        // Usar configuración enviada o la por defecto
        const emailConfig = config || defaultEmailConfig;
        
        // Validar configuración
        if (!emailConfig.user || !emailConfig.password) {
            return res.status(400).json({
                success: false,
                error: 'Configuración de correo incompleta'
            });
        }
        
        // Crear transportador
        const transporter = crearTransportador(emailConfig);
        
        // Verificar conexión
        await transporter.verify();
        
        // Configurar opciones del mensaje
        const mailOptions = {
            from: `"${emailConfig.fromName || 'Sistema de Cotizaciones'}" <${emailConfig.user}>`,
            to: to,
            subject: subject,
            html: html
        };
        
        // Agregar CC si se especifica
        if (cc) {
            mailOptions.cc = cc;
        }
        
        // Agregar attachments si se especifican
        if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments;
        }
        
        // Enviar correo
        const info = await transporter.sendMail(mailOptions);
        
        console.log('Correo enviado exitosamente:', info.messageId);
        
        res.json({
            success: true,
            messageId: info.messageId,
            message: 'Correo enviado exitosamente'
        });
        
    } catch (error) {
        console.error('Error enviando correo:', error);
        
        res.status(500).json({
            success: false,
            error: error.message || 'Error interno del servidor'
        });
    }
});

// Ruta para probar configuración de correo
app.post('/api/test-email-config', async (req, res) => {
    try {
        const { config } = req.body;
        
        if (!config || !config.user || !config.password) {
            return res.status(400).json({
                success: false,
                error: 'Configuración de correo incompleta'
            });
        }
        
        const transporter = crearTransportador(config);
        await transporter.verify();
        
        res.json({
            success: true,
            message: 'Configuración de correo válida'
        });
        
    } catch (error) {
        console.error('Error probando configuración:', error);
        
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Ruta para enviar correos masivos (seguimiento)
app.post('/api/send-bulk-emails', async (req, res) => {
    try {
        const { emails, config } = req.body;
        
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Lista de correos inválida'
            });
        }
        
        const emailConfig = config || defaultEmailConfig;
        const transporter = crearTransportador(emailConfig);
        
        const resultados = [];
        
        // Enviar correos con un pequeño delay entre cada uno
        for (const emailData of emails) {
            try {
                const mailOptions = {
                    from: `"${emailConfig.fromName || 'Sistema de Cotizaciones'}" <${emailConfig.user}>`,
                    to: emailData.to,
                    subject: emailData.subject,
                    html: emailData.html
                };
                
                const info = await transporter.sendMail(mailOptions);
                
                resultados.push({
                    to: emailData.to,
                    success: true,
                    messageId: info.messageId
                });
                
                // Delay de 1 segundo entre correos para evitar spam
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                resultados.push({
                    to: emailData.to,
                    success: false,
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            resultados: resultados,
            total: emails.length,
            exitosos: resultados.filter(r => r.success).length,
            fallidos: resultados.filter(r => !r.success).length
        });
        
    } catch (error) {
        console.error('Error en envío masivo:', error);
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===========================================
// RUTAS DE GESTIÓN DE COTIZACIONES
// ===========================================

// Simulación de base de datos en memoria (reemplazar con base de datos real)
let cotizaciones = [];
let registrosCorreos = [];

// Guardar cotización
app.post('/api/cotizaciones', (req, res) => {
    try {
        const cotizacion = {
            id: Date.now().toString(),
            ...req.body,
            fecha_creacion: new Date().toISOString()
        };
        
        cotizaciones.push(cotizacion);
        
        res.json({
            success: true,
            cotizacion: cotizacion
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener cotización por ID
app.get('/api/cotizaciones/:id', (req, res) => {
    try {
        const cotizacion = cotizaciones.find(c => c.id === req.params.id);
        
        if (!cotizacion) {
            return res.status(404).json({
                success: false,
                error: 'Cotización no encontrada'
            });
        }
        
        res.json({
            success: true,
            cotizacion: cotizacion
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener cotizaciones pendientes
app.get('/api/cotizaciones/pendientes', (req, res) => {
    try {
        const pendientes = cotizaciones.filter(c => c.estado !== 'cerrada');
        
        res.json({
            success: true,
            cotizaciones: pendientes
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Actualizar cotización
app.put('/api/cotizaciones/:id', (req, res) => {
    try {
        const index = cotizaciones.findIndex(c => c.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: 'Cotización no encontrada'
            });
        }
        
        cotizaciones[index] = {
            ...cotizaciones[index],
            ...req.body,
            fecha_actualizacion: new Date().toISOString()
        };
        
        res.json({
            success: true,
            cotizacion: cotizaciones[index]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Guardar registro de correo
app.post('/api/registros-correos', (req, res) => {
    try {
        const registro = {
            id: Date.now().toString(),
            ...req.body,
            fecha_registro: new Date().toISOString()
        };
        
        registrosCorreos.push(registro);
        
        res.json({
            success: true,
            registro: registro
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===========================================
// MIDDLEWARE DE ERRORES Y SERVIDOR
// ===========================================

// Middleware de manejo de errores
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor de correos funcionando en puerto ${PORT}`);
    console.log(`📧 Endpoints disponibles:`);
    console.log(`   POST /api/send-email - Enviar correo individual`);
    console.log(`   POST /api/test-email-config - Probar configuración`);
    console.log(`   POST /api/send-bulk-emails - Envío masivo`);
    console.log(`   POST /api/cotizaciones - Guardar cotización`);
    console.log(`   GET /api/cotizaciones/:id - Obtener cotización`);
    console.log(`   GET /api/cotizaciones/pendientes - Cotizaciones pendientes`);
    console.log(`   PUT /api/cotizaciones/:id - Actualizar cotización`);
    console.log(`   POST /api/registros-correos - Guardar registro de correo`);
});

// ===========================================
// INSTRUCCIONES DE USO
// ===========================================

/*
INSTALACIÓN:

1. Crea un directorio para el backend:
   mkdir email-backend
   cd email-backend

2. Inicializa npm:
   npm init -y

3. Instala las dependencias:
   npm install express nodemailer cors dotenv

4. Copia este archivo como server.js

5. Crea un archivo .env con tu configuración:
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   EMAIL_USER=tu-email@gmail.com
   EMAIL_PASSWORD=tu-password-app

6. Ejecuta el servidor:
   node server.js

CONFIGURACIÓN PARA GMAIL:

1. Habilita la autenticación de 2 pasos en tu cuenta Google
2. Genera una contraseña de aplicación:
   - Ve a https://myaccount.google.com/security
   - Selecciona "Contraseñas de aplicaciones"
   - Genera una nueva contraseña para "Otra aplicación"
   - Usa esa contraseña en EMAIL_PASSWORD

PRODUCCIÓN:

Para producción, considera usar:
- PM2 para gestión de procesos
- Una base de datos real (PostgreSQL, MySQL, MongoDB)
- Variables de entorno seguras
- HTTPS/SSL
- Rate limiting para prevenir spam
- Logs estructurados
*/
