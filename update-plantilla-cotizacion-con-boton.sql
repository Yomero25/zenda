-- Actualizar plantilla de cotización para incluir botón de aceptación
UPDATE plantillas_correo 
SET html = '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #fb930c, #e67e22); color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">Cotización #{numero}</h1>
                        <p style="margin: 5px 0;">Sistema de Cotizaciones</p>
                    </div>
                    
                    <div style="padding: 20px; background: #f8f9fa;">
                        <h2 style="color: #fb930c;">Datos del Cliente</h2>
                        <p><strong>Empresa:</strong> {empresa}</p>
                        <p><strong>Contacto:</strong> {contacto}</p>
                        <p><strong>Email:</strong> {email}</p>
                        <p><strong>Teléfono:</strong> {telefono}</p>
                    </div>
                    
                    <div style="padding: 20px;">
                        <h2 style="color: #fb930c;">Resumen de la Cotización</h2>
                        <p><strong>Fecha:</strong> {fecha}</p>
                        <p><strong>Validez:</strong> {validez}</p>
                        <p><strong>Total de Unidades:</strong> {unidades}</p>
                        
                        <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Total de la Cotización</h3>
                            <p style="font-size: 24px; font-weight: bold; color: #fb930c; margin: 0;">{total}</p>
                        </div>
                        
                        <div style="margin: 20px 0;">
                            <h3 style="color: #fb930c;">Equipos y Servicios</h3>
                            {equipos_servicios}
                        </div>
                        
                        {mensaje_personalizado}
                    </div>
                    
                    <!-- Botón de Aceptación -->
                    <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                        <h3 style="color: #28a745; margin-bottom: 15px;">¿Acepta esta cotización?</h3>
                        <p style="color: #666; margin-bottom: 20px;">Haga clic en el siguiente botón para aceptar formalmente esta cotización:</p>
                        <a href="{enlace_aceptacion}" 
                           style="background: linear-gradient(135deg, #28a745, #20c997); 
                                  color: white; 
                                  padding: 15px 40px; 
                                  text-decoration: none; 
                                  border-radius: 50px; 
                                  font-weight: bold; 
                                  font-size: 16px;
                                  display: inline-block;
                                  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                                  transition: all 0.3s ease;">
                            ✅ ACEPTAR COTIZACIÓN
                        </a>
                        <p style="color: #999; font-size: 12px; margin-top: 15px;">
                            Este enlace expira en 15 días. Al aceptar, recibirá una confirmación inmediata.
                        </p>
                    </div>
                    
                    <div style="background: #2c3e50; color: white; padding: 15px; text-align: center;">
                        <p style="margin: 0;">Gracias por confiar en nosotros</p>
                        <p style="margin: 5px 0; font-size: 12px;">Para cualquier consulta, responda a este correo</p>
                    </div>
                </div>
                '
WHERE tipo = 'cotizacion' AND is_active = true;

-- Verificar que se actualizó correctamente
SELECT tipo, 
       CASE WHEN html LIKE '%ACEPTAR COTIZACIÓN%' THEN 'CON BOTÓN' ELSE 'SIN BOTÓN' END as estado_boton,
       LENGTH(html) as longitud_html
FROM plantillas_correo 
WHERE tipo = 'cotizacion' AND is_active = true;
