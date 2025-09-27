# 🚀 Instrucciones para Crear Edge Function en Supabase

## Paso 1: Acceder a Supabase Dashboard
1. Ve a https://app.supabase.com
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto ZendA

## Paso 2: Crear Edge Function
1. En el menú lateral, busca **"Edge Functions"**
2. Haz clic en **"Create Function"**
3. Configura:
   - **Function Name:** `aceptar-cotizacion`
   - **Runtime:** Deno (por defecto)

## Paso 3: Código de la Función
Copia y pega este código en el editor:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obtener parámetros de la URL
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    
    if (!token) {
      return generateErrorPage('Token no proporcionado', 'El enlace de aceptación no es válido.')
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validar token
    const { data: tokenData, error: tokenError } = await supabase
      .from('acceptance_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_used', false)
      .single()

    if (tokenError || !tokenData) {
      return generateErrorPage('Token inválido', 'El enlace de aceptación no es válido o ya fue utilizado.')
    }

    // Verificar si el token ha expirado
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)
    
    if (now > expiresAt) {
      return generateErrorPage('Enlace expirado', 'Este enlace de aceptación ha expirado. Contacte a su representante de ventas.')
    }

    // Obtener información del cliente
    const clientInfo = {
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      timestamp: now.toISOString()
    }

    // Marcar token como usado
    const { error: updateTokenError } = await supabase
      .from('acceptance_tokens')
      .update({
        is_used: true,
        used_at: now.toISOString(),
        client_info: clientInfo
      })
      .eq('id', tokenData.id)

    if (updateTokenError) {
      console.error('Error updating token:', updateTokenError)
      return generateErrorPage('Error interno', 'Ocurrió un error al procesar la aceptación.')
    }

    // Obtener datos de la cotización
    const { data: cotizacionData, error: cotizacionError } = await supabase
      .from('cotizaciones')
      .select('*')
      .eq('folio', tokenData.cotizacion_folio)
      .single()

    if (cotizacionError || !cotizacionData) {
      console.error('Error fetching cotizacion:', cotizacionError)
      return generateErrorPage('Cotización no encontrada', 'No se pudo encontrar la cotización asociada.')
    }

    // Actualizar estado de la cotización a "aceptada"
    const { error: updateCotizacionError } = await supabase
      .from('cotizaciones')
      .update({
        estado: 'aceptada',
        fecha_aceptacion: now.toISOString(),
        fecha_actualizacion: now.toISOString().split('T')[0]
      })
      .eq('folio', tokenData.cotizacion_folio)

    if (updateCotizacionError) {
      console.error('Error updating cotizacion:', updateCotizacionError)
      return generateErrorPage('Error interno', 'Error al actualizar el estado de la cotización.')
    }

    // Registrar log de aceptación
    await supabase
      .from('logs_aceptacion')
      .insert({
        tipo: 'cotizacion_aceptada',
        folio: cotizacionData.folio,
        cliente: cotizacionData.cliente_nombre || 'Cliente',
        total: cotizacionData.total || 0,
        fecha_aceptacion: now.toISOString(),
        client_info: clientInfo
      })

    // Generar página de confirmación exitosa
    return generateSuccessPage(cotizacionData, clientInfo)

  } catch (error) {
    console.error('Error in aceptar-cotizacion function:', error)
    return generateErrorPage('Error interno', 'Ocurrió un error inesperado.')
  }
})

function generateSuccessPage(cotizacion, clientInfo) {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cotización Aceptada - ZendA</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 600px;
                width: 100%;
                text-align: center;
            }
            .logo {
                width: 120px;
                height: 60px;
                background: #FF6B00;
                border-radius: 10px;
                margin: 0 auto 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 24px;
            }
            .success-icon {
                font-size: 64px;
                color: #28a745;
                margin-bottom: 20px;
            }
            h1 {
                color: #333;
                margin-bottom: 20px;
                font-size: 28px;
            }
            .details {
                background: #f8f9fa;
                border-radius: 15px;
                padding: 25px;
                margin: 30px 0;
                text-align: left;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
                padding-bottom: 15px;
                border-bottom: 1px solid #e9ecef;
            }
            .detail-row:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }
            .detail-label {
                font-weight: 600;
                color: #666;
            }
            .detail-value {
                color: #333;
                font-weight: 500;
            }
            .total {
                font-size: 18px;
                color: #28a745;
                font-weight: bold;
            }
            .next-steps {
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
                padding: 20px;
                margin: 30px 0;
                border-radius: 0 10px 10px 0;
            }
            .contact-info {
                background: #fff3cd;
                border-radius: 10px;
                padding: 20px;
                margin-top: 30px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">ZendA</div>
            
            <div class="success-icon">✅</div>
            <h1>¡Cotización Aceptada Exitosamente!</h1>
            <p style="color: #666; font-size: 16px;">Su cotización ha sido procesada y confirmada.</p>
            
            <div class="details">
                <div class="detail-row">
                    <span class="detail-label">Folio:</span>
                    <span class="detail-value">${cotizacion.folio}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Cliente:</span>
                    <span class="detail-value">${cotizacion.cliente_nombre || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total:</span>
                    <span class="detail-value total">$${(cotizacion.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Fecha de Aceptación:</span>
                    <span class="detail-value">${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}</span>
                </div>
            </div>
            
            <div class="next-steps">
                <h3 style="color: #1976d2; margin-bottom: 15px;">📋 Próximos Pasos</h3>
                <ul style="text-align: left; color: #333;">
                    <li>✅ Su orden será procesada en las próximas 24 horas</li>
                    <li>📦 Recibirá confirmación de preparación de equipos</li>
                    <li>🚚 Se coordinará la instalación en su ubicación</li>
                    <li>📞 Nuestro equipo se pondrá en contacto con usted</li>
                </ul>
            </div>
            
            <div class="contact-info">
                <h3 style="color: #856404; margin-bottom: 10px;">📞 Información de Contacto</h3>
                <p style="color: #666;">Para cualquier consulta sobre su orden:</p>
                <p style="color: #333; font-weight: 500;">
                    📧 ventas@techinnovation.com.mx<br>
                    📱 +52 (xxx) xxx-xxxx
                </p>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
                Gracias por confiar en ZendA para sus soluciones de rastreo y seguridad.
            </p>
        </div>
    </body>
    </html>
  `

  return new Response(html, {
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'text/html; charset=utf-8' 
    },
  })
}

function generateErrorPage(title, message) {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - ZendA</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 500px;
                width: 100%;
                text-align: center;
            }
            .logo {
                width: 120px;
                height: 60px;
                background: #FF6B00;
                border-radius: 10px;
                margin: 0 auto 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 24px;
            }
            .error-icon {
                font-size: 64px;
                color: #dc3545;
                margin-bottom: 20px;
            }
            h1 {
                color: #333;
                margin-bottom: 20px;
                font-size: 24px;
            }
            p {
                color: #666;
                margin-bottom: 30px;
                line-height: 1.5;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">ZendA</div>
            <div class="error-icon">❌</div>
            <h1>${title}</h1>
            <p>${message}</p>
            <p style="color: #999; font-size: 14px;">
                Si necesita asistencia, contacte a su representante de ventas.
            </p>
        </div>
    </body>
    </html>
  `

  return new Response(html, {
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'text/html; charset=utf-8' 
    },
    status: 400
  })
}
```

## Paso 4: Desplegar
1. Haz clic en **"Deploy"**
2. Espera a que se complete el despliegue
3. Anota la URL que te da Supabase

## Paso 5: Probar
La URL será algo como:
```
https://lsmhcpsvjcbduqovbatj.supabase.co/functions/v1/aceptar-cotizacion?token=test
```

## ✅ Estado Actual
- ✅ Tablas creadas en Supabase
- ✅ Código HTML actualizado con URL temporal
- 🔄 Edge Function lista para desplegar
- ⏳ Pendiente: configurar dominio personalizado

## 🎯 Próximo Paso
Una vez desplegada la función, el sistema estará 100% funcional usando la URL de Supabase directamente.

Cuando configures el dominio `zenda.techinnovation.com.mx`, solo necesitarás:
1. Crear el CNAME en DNS
2. Cambiar la URL en `cotizaciones-completo.html` línea ~2941
