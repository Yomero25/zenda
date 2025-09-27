﻿        async function cargarPreciosCache() {
            try {
                if (modoCentralizado) {
                    const lista = await window.dataService.fetchPreciosElementos();
                    preciosCache = {};
                    (lista || []).forEach((it) => {
                        const nombre = it.nombre || it.elemento;
                        if (!nombre) return;
                        preciosCache[nombre] = {
                            precio: Number(it.precio || 0),
                            categoria: it.categoria || 'insumos',
                            ultimaActualizacion: it.ultimaActualizacion || it.ultima_actualizacion
                        };
                    });
                } else {
                    const p = JSON.parse(localStorage.getItem('precios_elementos') || '{}');
                    if (Object.keys(p).length === 0) {
                        inicializarPreciosSiNoExisten();
                    }
                    preciosCache = JSON.parse(localStorage.getItem('precios_elementos') || '{}');
                }
            } catch (e) {
                console.warn('No se pudieron cargar precios; usando localStorage si existe', e);
                preciosCache = JSON.parse(localStorage.getItem('precios_elementos') || '{}');
            }
        }

        // Funciones crÃ­ticas (definidas temprano para evitar errores de referencia)
        function nextStep() {
            if (validarPasoActual()) {
                guardarPasoActual();
                currentStepNumber++;
                if (currentStepNumber === 4) {
                    generarResumen();
                }
                mostrarPaso(currentStepNumber);
                actualizarProgreso();
            }
        }

        function previousStep() {
            currentStepNumber--;
            mostrarPaso(currentStepNumber);
            actualizarProgreso();
        }

        function actualizarDescuento() {
            const tipoCliente = document.getElementById('tipo_cliente');
            const descuentoInput = document.getElementById('descuento');
            
            if (tipoCliente && descuentoInput) {
                const descuento = descuentosPorCliente[tipoCliente.value] || 0;
                descuentoInput.value = descuento;
            }
        }

        // FunciÃ³n para inicializar precios si no existen
        function inicializarPreciosSiNoExisten() {
            const preciosElementos = JSON.parse(localStorage.getItem('precios_elementos') || '{}');
            if (Object.keys(preciosElementos).length === 0) {
                console.log('ðŸ”§ Inicializando precios por defecto...');
                
                // Precios estimados bÃ¡sicos
                const preciosEstimados = {
                    'Cable 4 pin 5 m': 95,
                    'Cable 4 pin 7 m': 125,
                    'Cable 6 pin 5 m': 115,
                    'Cinta de aislar': 15,
                    'Cincho mediado': 2,
                    'Poliflex 3/8': 8,
                    'SD 256 Gb': 450,
                    'SD 128 Gb': 250,
                    'Monitor de VPC': 2885,
                    'Grabador de video 4 ch': 3285,
                    'Dashcam ad2': 2485,
                    'Dashcam c6': 1885,
                    'Insider': 1585,
                    'Limitador de velocidad': 1285,
                    'Modulo sensor de cinturon seguridad': 985,
                    'Relevador 12v': 85,
                    'Cable 2 vias': 18,
                    'Base Pollak': 85,
                    'Pollak Macho ': 65,
                    'Pollak Hembra': 65
                };
                
                Object.entries(preciosEstimados).forEach(([elemento, precio]) => {
                    preciosElementos[elemento] = {
                        precio: precio,
                        categoria: 'insumo',
                        ultimaActualizacion: new Date().toISOString().split('T')[0]
                    };
                });
                
                localStorage.setItem('precios_elementos', JSON.stringify(preciosElementos));
                console.log('âœ… Precios inicializados:', Object.keys(preciosElementos).length);
            }
        }

        // FunciÃ³n para calcular el total de la cotizaciÃ³n usando precios del administrador
        function calcularTotalCotizacion(unidades, cotizacionData) {
            const preciosElementos = preciosCache || JSON.parse(localStorage.getItem('precios_elementos') || '{}');
            let total = 0;
            let detalleCalculo = [];

            try {
                console.log('ðŸ’° Iniciando cÃ¡lculo de total...');
                console.log('Precios disponibles:', Object.keys(preciosElementos).length);
                console.log('Unidades:', unidades);
                console.log('CotizacionData:', cotizacionData);

                // Calcular equipos automÃ¡ticos
                if (cotizacionData.equiposAutomaticos) {
                    console.log('ðŸ“¦ Procesando equipos automÃ¡ticos:', cotizacionData.equiposAutomaticos);
                    Object.entries(cotizacionData.equiposAutomaticos).forEach(([equipo, datos]) => {
                        if (datos && datos.cantidad > 0) {
                            if (preciosElementos[equipo]) {
                                const precio = preciosElementos[equipo].precio || 0;
                                const subtotal = precio * datos.cantidad * (cotizacionData.cantidadLote || 1);
                                total += subtotal;
                                detalleCalculo.push(`${equipo}: $${precio} Ã— ${datos.cantidad} Ã— ${cotizacionData.cantidadLote || 1} = $${subtotal}`);
                                console.log(`âœ… ${equipo}: $${precio} Ã— ${datos.cantidad} = $${subtotal}`);
                            } else {
                                console.log(`âš ï¸ Sin precio para equipo: ${equipo}`);
                            }
                        }
                    });
                }

                // Calcular insumos por unidad
                // Calcular insumos y accesorios globales
                if (cotizacionData.insumosSugeridos && Array.isArray(cotizacionData.insumosSugeridos)) {
                    console.log('ðŸ“‹ Procesando insumos sugeridos globales (array):', cotizacionData.insumosSugeridos);
                    cotizacionData.insumosSugeridos.forEach(item => {
                        if (item && item.nombre && item.cantidad > 0) {
                            if (preciosElementos[item.nombre]) {
                                const precio = preciosElementos[item.nombre].precio || 0;
                                const subtotal = precio * item.cantidad;
                                total += subtotal;
                                detalleCalculo.push(`${item.nombre}: $${precio} Ã— ${item.cantidad} = $${subtotal}`);
                                console.log(`âœ… ${item.nombre}: $${precio} Ã— ${item.cantidad} = $${subtotal}`);
                            } else {
                                console.log(`âš ï¸ Sin precio para insumo: ${item.nombre}`);
                            }
                        }
                    });
                }

                if (cotizacionData.accesoriosSugeridos && Array.isArray(cotizacionData.accesoriosSugeridos)) {
                    console.log('ðŸ”§ Procesando accesorios sugeridos globales (array):', cotizacionData.accesoriosSugeridos);
                    cotizacionData.accesoriosSugeridos.forEach(item => {
                        if (item && item.nombre && item.cantidad > 0) {
                            if (preciosElementos[item.nombre]) {
                                const precio = preciosElementos[item.nombre].precio || 0;
                                const subtotal = precio * item.cantidad;
                                total += subtotal;
                                detalleCalculo.push(`${item.nombre}: $${precio} Ã— ${item.cantidad} = $${subtotal}`);
                                console.log(`âœ… ${item.nombre}: $${precio} Ã— ${item.cantidad} = $${subtotal}`);
                            } else {
                                console.log(`âš ï¸ Sin precio para accesorio: ${item.nombre}`);
                            }
                        }
                    });
                }

                // Aplicar descuento si existe
                const descuento = parseFloat(cotizacionData.cliente.descuento || 0);
                if (descuento > 0) {
                    const totalConDescuento = total * (1 - descuento / 100);
                    console.log(`ðŸ·ï¸ Aplicando descuento ${descuento}%: $${total} â†’ $${totalConDescuento}`);
                    total = totalConDescuento;
                }

                console.log('ðŸ’° TOTAL FINAL:', total);
                console.log('ðŸ“‹ Detalle del cÃ¡lculo:', detalleCalculo);
                return Math.round(total * 100) / 100; // Redondear a 2 decimales
            } catch (error) {
                console.error('âŒ Error calculando total:', error);
                return 0;
            }
        }

        async function guardarBorrador() {
            guardarPasoActual();
            try {
                if (window.dataService && window.dataService.hasSupabase && window.dataService.hasSupabase()) {
                    await guardarBorradorSupabase();
                }
                alert('Borrador guardado exitosamente');
            } catch (e) {
                console.warn('No se pudo guardar borrador en Supabase:', e);
                alert('Borrador guardado localmente');
            }
        }

        function establecerFechaVencimiento() {
            const fechaVencimientoInput = document.getElementById('fecha_vencimiento');
            if (fechaVencimientoInput && !fechaVencimientoInput.value) {
                const fechaActual = new Date();
                fechaActual.setDate(fechaActual.getDate() + 15);
                const fechaVencimiento = fechaActual.toISOString().split('T')[0];
                fechaVencimientoInput.value = fechaVencimiento;
            }
        }

        // Sistema de AlmacÃ©n - Matriz de insumos editable
        let almacenInsumos = {
            // Estructura: [tipoUnidad][tipoSolucion][insumo] = cantidad
            'Tracto': {
                'VPC': {
                    'Cable 4 pin 5 m': 1,
                    'Cable 4 pin 7 m': 2,
                    'Cable 4 pin 15 m': 1,
                    '"Y" 4 pines': 4,
                    'Silicon': '1/10',
                    'Cinchos grande': 30,

                    'Cinta de tela': 1,
                    'Cinta de aislar': 1,
                    'Poliflex 3/8': 80,
                    'Cincho mediado': 40,
                    'Cincho con grapa': 6,
                    'Cable de 1 polo': 2,
                    'Poliflex 1/4': 2
                },
                'Sensor VPC': {
                    'Poliflex 1/4': 4,
                    'Sensor derecho VPC': 1,
                    'Sensor izquierda VPC': 1
                },
                'Sensor VPC izquierdo': {
                    'Poliflex 1/4': 2,
                    'Sensor izquierda VPC': 1
                },
                'Sensor VPC derecho': {
                    'Poliflex 1/4': 2,
                    'Sensor derecho VPC': 1
                },
                'Led de giro': {
                    'Cincho mediado': 10,
                    'Cincho con grapa': 2,
                    'Cable de 1 polo': 8,
                    'Poliflex 1/4': 26,
                    'Led de giro a la derecha': 2,
                    'Led de giro a la izquierda': 2
                },
                'Led de giro izquierdo': {
                    'Cincho mediado': 5,
                    'Cincho con grapa': 1,
                    'Cable de 1 polo': 4,
                    'Poliflex 1/4': 13,
                    'Led de giro a la izquierda': 1
                },
                'Led de giro derecho': {
                    'Cincho mediado': 5,
                    'Cincho con grapa': 1,
                    'Cable de 1 polo': 4,
                    'Poliflex 1/4': 13,
                    'Led de giro a la derecha': 1
                },
                'Alarma parlante estandar': {
                    'Tornillo 3/8': 2,
                    'Cinta de tela': '1/2',
                    'Poliflex 3/8': 8,
                    'Cincho mediado': 30,
                    'Pija brocante 5/16': 2,
                    'Cable 4 vias': 6,
                    'Tuerca 3/8': 2,
                    'Rondana 3/8': 2,
                    'Alarma parlante de 3 tonos': 1
                },
                'MDVR 4 Ch': {
                    'Cable 4 pin 3 m': 1,
                    'Cable 4 pin 7 m': 2,
                    'Cable 4 pin 15 m': 1,
                    'Cable 6 pin 5 m': 1,
                    'Silicon': '1/10',

                    'Cinta de aislar': 1,
                    'Poliflex 3/8': 80,
                    'Cincho mediado': 30,
                    'Cincho con grapa': 6,
                    'Poliflex 1/4': 5,
                    'SD 128 Gb': 1
                },
                'MDVR 8 Ch': {
                    'Cable 4 pin 3 m': 1,
                    'Cable 4 pin 7 m': 2,
                    'Cable 4 pin 15 m': 1,
                    'Cable 6 pin 5 m': 1,
                    'Silicon': '1/10',

                    'Cinta de aislar': 1,
                    'Poliflex 3/8': 80,
                    'Cincho mediado': 30,
                    'Cincho con grapa': 6,
                    'Poliflex 1/4': 5,
                    'SD 128 Gb': 1
                },
                'Rastreo basico': {

                    'Cinta de aislar': 15,
                    'Cincho mediado': 1,
                    'Cable de 1 polo': 3,
                    'Poliflex 1/4': 8,
                    'Relevador 2 pasos 2 tiros': 1,
                    'placa perforada': 1,
                    'Gabinete 5*7*3': 1
                },
                'Rastreo avanzado': {

                    'Cinta de aislar': 15,
                    'Cincho mediado': 1,
                    'Cable de 1 polo': 3,
                    'Poliflex 1/4': 8,
                    'Relevador 2 pasos 2 tiros': 1,
                    'placa perforada': 1,
                    'Gabinete 5*7*3': 1
                },
                'Rastreo satelital': {

                    'Cinta de aislar': 15,
                    'Cincho mediado': 1,
                    'Cable de 1 polo': 3,
                    'Poliflex 1/4': 8,
                    'Relevador 2 pasos 2 tiros': 1,
                    'placa perforada': 1,
                    'Gabinete 5*7*3': 1
                },
                'Dashcam': {
                    'Cable 4 pin 3 m': 1,
                    'Cinta de aislar': 5,
                    'Cincho mediado': 10,
                    'Cable de 1 polo': 1,
                    'Poliflex 1/4': 2
                },
                'Sideview': {
                    'Cable 4 pin 7 m': 4,
                    'Cinta de tela': 1,
                    'Poliflex 3/8': 15,
                    'Cincho mediado': 60,
                    'Pija brocante 5/16': 16,
                    'Terminal de ojillo': 2,
                    'Cable 2 vias': 10,
                    'Cable 4 vias': 10,
                    'Camara sideview derecho': 1,
                    'Camara sideview izquierdo': 1,
                    'Sideview derecho': 1,
                    'Sideview izquierdo': 1
                },
                'Sideview izquierdo': {
                    'Cable 4 pin 7 m': 2,
                    'Cinta de tela': 1,
                    'Poliflex 3/8': 7.5,
                    'Cincho mediado': 30,
                    'Pija brocante 5/16': 8,
                    'Terminal de ojillo': 1,
                    'Cable 2 vias': 5,
                    'Cable 4 vias': 5,
                    'Camara sideview izquierdo': 1,
                    'Sideview izquierdo': 1
                },
                'Sideview derecho': {
                    'Cable 4 pin 7 m': 2,
                    'Cinta de tela': 1,
                    'Poliflex 3/8': 7.5,
                    'Cincho mediado': 30,
                    'Pija brocante 5/16': 8,
                    'Terminal de ojillo': 1,
                    'Cable 2 vias': 5,
                    'Cable 4 vias': 5,
                    'Camara sideview derecho': 1,
                    'Sideview derecho': 1
                },
                'Encadenamiento seÃ±ales': {
                    'Cable 4 pin 1 m': 5,
                    'Cable 4 pin 5 m': 1,
                    'Cable 4 pin 7 m': 1,
                    'Cable 4 pin 15 m': 2,
                    'Base Pollak': 7,
                    'Pollak Macho': 4,
                    'Pollak Hembra': 4,
                    'Silicon': '1/10',
                    'Cinta de tela': 1,
                    'Poliflex 3/8': 30,
                    'Cincho mediado': 120,
                    'Cincho con grapa': 80,
                    'Pija brocante 5/16': 40,
                    'Cable 2 vias': 40,
                    'Cable 4 vias': 40,
                    'Espiral negro': 1,
                    'Espiral verde': 2,
                    '7 vias liso 2m': 1,
                    'Relevador 2 pasos 2 tiros': 5,
                    'placa perforada': 2.5,
                    'Gabinete 5*7*3': 4,
                    'Camara de reversa': 2
                },
                'Encadenamiento sencillo': {
                    'Cable 4 pin 1 m': 2,
                    'Cable 4 pin 5 m': 1,
                    'Cable 4 pin 7 m': 1,
                    'Cable 4 pin 15 m': 1,
                    'Base Pollak': 2,
                    'Pollak Macho': 2,
                    'Pollak Hembra': 2,
                    'Silicon': '1/10',
                    'Cinta de tela': 1,
                    'Poliflex 3/8': 20,
                    'Cincho mediado': 80,
                    'Cincho con grapa': 55,
                    'Pija brocante 5/16': 27.5,
                    'Cable 2 vias': 27.5,
                    'Cable 4 vias': 27.5,
                    'Espiral negro': 1,
                    'Espiral verde': 1.5,
                    '7 vias liso 2m': 1,
                    'Relevador 2 pasos 2 tiros': 3.5,
                    'placa perforada': 1.75,
                    'Gabinete 5*7*3': 3,
                    'Camara de reversa': 1
                },
                'Encadenamiento full': {
                    'Cable 4 pin 1 m': 4,
                    'Cable 4 pin 5 m': 2,
                    'Cable 4 pin 7 m': 2,
                    'Cable 4 pin 15 m': 2,
                    'Base Pollak': 4,
                    'Pollak Macho': 4,
                    'Pollak Hembra': 4,
                    'Silicon': '1/10',
                    'Cinta de tela': 1,
                    'Poliflex 3/8': 40,
                    'Cincho mediado': 160,
                    'Cincho con grapa': 110,
                    'Pija brocante 5/16': 55,
                    'Cable 2 vias': 55,
                    'Cable 4 vias': 55,
                    'Espiral negro': 1,
                    'Espiral verde': 3,
                    '7 vias liso 2m': 1,
                    'Relevador 2 pasos 2 tiros': 7,
                    'placa perforada': 3.5,
                    'Gabinete 5*7*3': 6,
                    'Camara de reversa': 2
                },
                'Limitador de velocidad': {
                    'Cable 4 pin 3 m': 1,
                    'Cable 2 vias': 2,
                    'Silicon': '1/10',
                    'Cinta de aislar': 10,
                    'Cincho mediado': 15,
                    'Cable de 1 polo': 3,
                    'Poliflex 1/4': 5,
                    'Relevador 12v': 1
                },
                'Modulo sensor de cinturon seguridad': {
                    'Cable 4 pin 3 m': 1,
                    'Cable 2 vias': 1,
                    'Silicon': '1/10',
                    'Cinta de aislar': 5,
                    'Cincho mediado': 8,
                    'Cable de 1 polo': 2,
                    'Poliflex 1/4': 3
                },
                'Insider': {
                    'Cable 4 pin 3 m': 1,
                    'Silicon': '1/10',
                    'Cinta de aislar': 5,
                    'Cincho mediado': 5,
                    'Cable de 1 polo': 1,
                    'Poliflex 1/4': 2
                }
            },
            'Remolque': {
                'VPC': {
                    'Cable 4 pin 5 m': 1,
                    'Cable 4 pin 7 m': 2,
                    'Cable 4 pin 15 m': 1,
                    '"Y" 4 pines': 4,
                    'Silicon': '1/10',
                    'Cinchos grande': 30,

                    'Cinta de tela': 1,
                    'Cinta de aislar': 1,
                    'Poliflex 3/8': 80,
                    'Cincho mediado': 40,
                    'Cincho con grapa': 6,
                    'Cable de 1 polo': 2,
                    'Poliflex 1/4': 2
                },
                'Sideview': {
                    'Cable 4 pin 5 m': 2,
                    'Cable 4 pin 7 m': 1,
                    'Silicon': '1/10',
                    'Cinchos grande': 20,
                    'Cinta de aislar': 1,
                    'Poliflex 3/8': 40,
                    'Cincho mediado': 20,
                    'Cincho con grapa': 4,
                    'Cable de 1 polo': 1,
                    'Poliflex 1/4': 2
                },
                'Led de giro': {
                    'Cincho mediado': 10,
                    'Cincho con grapa': 2,
                    'Cable de 1 polo': 8,
                    'Poliflex 1/4': 26,
                    'Led de giro a la derecha': 2,
                    'Led de giro a la izquierda': 2
                }
            },
            'Motocicleta': {
                'Rastreo basico': {
                    'Cable 4 pin 3 m': 1,
                    'Cinta de aislar': 8,
                    'Cincho mediado': 5,
                    'Cable de 1 polo': 2,
                    'Poliflex 1/4': 3,
                    'Relevador 2 pasos 2 tiros': 1
                },
                'Rastreo avanzado': {
                    'Cable 4 pin 3 m': 1,
                    'Cinta de aislar': 8,
                    'Cincho mediado': 5,
                    'Cable de 1 polo': 2,
                    'Poliflex 1/4': 3,
                    'Relevador 2 pasos 2 tiros': 1
                },
                'Dashcam': {
                    'Cable 4 pin 3 m': 1,
                    'Cinta de aislar': 3,
                    'Cincho mediado': 5,
                    'Cable de 1 polo': 1,
                    'Poliflex 1/4': 2
                }
            }
        };

        // FunciÃ³n para cargar tipos globales desde localStorage
        function cargarTiposGlobales() {
            try {
                const tiposGlobales = JSON.parse(localStorage.getItem('tipos_globales') || '{}');
                return {
                    vehiculos: tiposGlobales.vehiculos || [],
                    soluciones: tiposGlobales.soluciones || [],
                    insumos: tiposGlobales.insumos || []
                };
            } catch (error) {
                console.warn('Error cargando tipos globales:', error);
                return { vehiculos: [], soluciones: [], insumos: [] };
            }
        }

        // FunciÃ³n para cargar almacÃ©n desde Supabase
        async function cargarAlmacenDesdeSupabase() {
            try {
                if (!modoCentralizado) {
                    console.log('â„¹ï¸ Modo no centralizado, usando localStorage');
                    return;
                }

                console.log('ðŸ”„ Cargando almacÃ©n desde Supabase...');
                const registros = await window.dataService.fetchAlmacenInsumos();
                
                // Convertir registros de Supabase al formato esperado
                const nuevoAlmacen = {};
                (registros || []).forEach(r => {
                    const tipoUnidad = r.tipoUnidad;
                    const tipoSolucion = r.tipoSolucion;
                    const insumos = r.insumos || {};
                    
                    if (!nuevoAlmacen[tipoUnidad]) {
                        nuevoAlmacen[tipoUnidad] = {};
                    }
                    nuevoAlmacen[tipoUnidad][tipoSolucion] = insumos;
                });
                
                // Actualizar la variable global almacenInsumos
                Object.keys(nuevoAlmacen).forEach(tipoUnidad => {
                    if (!almacenInsumos[tipoUnidad]) {
                        almacenInsumos[tipoUnidad] = {};
                    }
                    Object.keys(nuevoAlmacen[tipoUnidad]).forEach(tipoSolucion => {
                        almacenInsumos[tipoUnidad][tipoSolucion] = nuevoAlmacen[tipoUnidad][tipoSolucion];
                    });
                });
                
                console.log(`âœ… AlmacÃ©n cargado desde Supabase: ${Object.keys(almacenInsumos).length} tipos de unidad`);
            } catch (error) {
                console.error('âŒ Error cargando almacÃ©n desde Supabase:', error);
            }
        }

        // Cargar tipos globales
        const tiposGlobales = cargarTiposGlobales();
        console.log('ðŸ“‹ Tipos globales cargados:', tiposGlobales);

        // Lista de todos los insumos disponibles (combinar con tipos globales)
        const listaInsumosBase = [
            'Cable 4 pin 1 m', 'Cable 4 pin 3 m', 'Cable 4 pin 5 m', 'Cable 4 pin 7 m', 
            'Cable 4 pin 15 m', 'Cable 4 pin 30 m', 'Cable 6 pin 5 m', '"Y" 4 pines',
            'Base Pollak', 'Pollak Macho', 'Pollak Hembra', 'Tornillo hexagonal 5/16',
            'Tornillo 3/8', 'Silicon', 'Cinchos grande', 'Cinta de tela',
            'Cinta de aislar', 'Poliflex 3/8', 'Cincho mediado', 'Cincho con grapa',
            'Pija brocante 5/16', 'Cable de 1 polo', 'Terminal de ojillo', 'Poliflex 1/4',
            'Cable 2 vias', 'Cable 4 vias', 'Tuerca 5/16', 'Rondana 5/16', 'Tuerca 3/8',
            'Rondana 3/8', 'Espiral negro', 'Espiral verde', '7 vias liso 2m',
            'Relevador 2 pasos 2 tiros', 'placa perforada', 'Gabinete 5*7*3',
            'Relevador 12v', 'Relevador 24v', 'Portarelevador', 'Alarma parlante de 3 tonos',
            'Alarma parlante programable', 'Camara + radar', 'Camara con microfono',
            'Camara de reversa', 'Camara Digital (IP)', 'Camara exterior mini',
            'Camara lateral derecha de VPC', 'Camara lateral izquierda de VPC',
            'Camara sideview derecho', 'Camara sideview izquierdo', 'Camara tipo clavo',
            'Dashcam ad2', 'Dashcam c6', 'Bocina', 'BotÃ³n balancin', 'Boton de panico',
            'Microfono', 'Sensor magnetico chico', 'Sensor magnetico grande', 'Insider',
            'Led de giro a la derecha', 'Led de giro a la izquierda', 'Limitador de velocidad',
            'Modulo sensor de cinturon seguridad', 'Monitor de VPC', 'SD 128 Gb', 'SD 256 Gb',
            'SD 512 Gb', 'Sensor derecho VPC', 'Sensor izquierda VPC', 'Sideview derecho',
            'Sideview izquierdo'
        ];
        
        // Combinar insumos base con tipos globales
        const listaInsumos = [...new Set([...listaInsumosBase, ...tiposGlobales.insumos])].sort();

        // FunciÃ³n para actualizar selects de tipos de vehÃ­culos
        function actualizarSelectsVehiculos() {
            const selectsVehiculos = document.querySelectorAll('select[name*="vehiculo_tipo"]');
            selectsVehiculos.forEach(select => {
                const valorActual = select.value;
                const opcionesBase = [
                    '1.5 ton', '2.5 ton', '3.5 ton', '4.5 ton', 'Autobus pasajeros',
                    'Motocicleta', 'RabÃ³n', 'Sedan', 'Sedan lujo', 'SUV',
                    'Torton', 'Tracto', 'Tracto Cabina sobre motor', 'Van pasajeros'
                ];
                const opcionesCompletas = [...new Set([...opcionesBase, ...tiposGlobales.vehiculos])].sort();
                
                select.innerHTML = '<option value="">Seleccionar tipo</option>' +
                    opcionesCompletas.map(tipo => `<option value="${tipo}">${tipo}</option>`).join('');
                
                // Restaurar valor seleccionado si existe
                if (valorActual && opcionesCompletas.includes(valorActual)) {
                    select.value = valorActual;
                }
            });
        }

        // FunciÃ³n para actualizar selects de tipos de soluciones
        function actualizarSelectsSoluciones() {
            const selectsSoluciones = document.querySelectorAll('select[name*="solucion_tipo"]');
            selectsSoluciones.forEach(select => {
                const valorActual = select.value;
                const opcionesBase = [
                    'Encadenamiento seÃ±ales', 'Insider', 'Led de giro', 'Limitador de velocidad',
                    'MDVR 4 Ch', 'MDVR 8 Ch', 'Modulo sensor cinturon', 'Rastreo avanzado',
                    'Rastreo basico', 'Rastreo satelital', 'Sensor VPC', 'Sideview', 'VPC'
                ];
                const opcionesCompletas = [...new Set([...opcionesBase, ...tiposGlobales.soluciones])].sort();
                
                select.innerHTML = '<option value="">Seleccionar soluciÃ³n</option>' +
                    opcionesCompletas.map(tipo => `<option value="${tipo}">${tipo}</option>`).join('');
                
                // Restaurar valor seleccionado si existe
                if (valorActual && opcionesCompletas.includes(valorActual)) {
                    select.value = valorActual;
                }
            });
        }

        // FunciÃ³n para actualizar todos los selects
        function actualizarTodosLosSelects() {
            actualizarSelectsVehiculos();
            actualizarSelectsSoluciones();
        }

        // Cargar funciones de rastreo desde Supabase
        async function cargarFuncionesRastreo() {
            try {
                if (!modoCentralizado) {
                    console.log('â„¹ï¸ Modo no centralizado, funciones de rastreo no disponibles');
                    return;
                }

                console.log('ðŸ”„ Cargando funciones de rastreo desde Supabase...');
                funcionesRastreo = await window.dataService.fetchFuncionesRastreo();
                console.log(`âœ… Funciones de rastreo cargadas: ${funcionesRastreo.length}`);
            } catch (error) {
                console.error('âŒ Error cargando funciones de rastreo:', error);
            }
        }

        // Cargar almacÃ©n desde Supabase o localStorage
        async function inicializarAlmacen() {
            if (modoCentralizado) {
                // Cargar desde Supabase
                await cargarAlmacenDesdeSupabase();
                // Cargar funciones de rastreo
                await cargarFuncionesRastreo();
            } else {
                // Cargar desde localStorage si existe
                const almacenGuardado = localStorage.getItem('almacen_insumos');
                if (almacenGuardado) {
                    try {
                        const almacenCargado = JSON.parse(almacenGuardado);
                        // Fusionar con el almacÃ©n por defecto
                        Object.keys(almacenCargado).forEach(tipoUnidad => {
                            if (!almacenInsumos[tipoUnidad]) {
                                almacenInsumos[tipoUnidad] = {};
                            }
                            Object.keys(almacenCargado[tipoUnidad]).forEach(tipoSolucion => {
                                almacenInsumos[tipoUnidad][tipoSolucion] = almacenCargado[tipoUnidad][tipoSolucion];
                            });
                        });
                        console.log('âœ“ AlmacÃ©n cargado desde localStorage');
                    } catch (error) {
                        console.error('Error al cargar almacÃ©n:', error);
                    }
                }
            }
        }

        // Inicializar almacÃ©n
        inicializarAlmacen();

        // DefiniciÃ³n de categorÃ­as de insumos
        const categoriasInsumos = {
            insumos: [
                'Cable 4 pin 1 m', 'Cable 4 pin 3 m', 'Cable 4 pin 5 m', 'Cable 4 pin 7 m', 
                'Cable 4 pin 15 m', 'Cable 4 pin 30 m', 'Cable 6 pin 5 m', '"Y" 4 pines', 
                'Base Pollak', 'Pollak Macho', 'Pollak Hembra', 'Tornillo hexagonal 5/16', 
                'Tornillo 3/8', 'Silicon', 'Cinchos grande', 'Cinta de tela', 
                'Cinta de aislar', 'Poliflex 3/8', 'Cincho mediado', 'Cincho con grapa', 
                'Pija brocante 5/16', 'Cable de 1 polo', 'Terminal de ojillo', 'Poliflex 1/4', 
                'Cable 2 vias', 'Cable 4 vias', 'Tuerca 5/16', 'Rondana 5/16', 'Tuerca 3/8', 
                'Rondana 3/8', 'Espiral negro', 'Espiral verde', '7 vias liso 2m', 
                'Relevador 2 pasos 2 tiros', 'placa perforada', 'Gabinete 5*7*3', 'Relevador 12v', 
                'Relevador 24v', 'Portarelevador', 'SD 128 Gb', 'SD 256 Gb', 'SD 512 Gb'
            ],
            accesorios: [
                'Alarma parlante de 3 tonos', 'Alarma parlante programable', 'Camara + radar', 
                'Camara con microfono', 'Camara de reversa', 'Camara Digital (IP)', 
                'Camara exterior mini', 'Camara lateral derecha de VPC', 'Camara lateral izquierda de VPC', 
                'Camara sideview derecho', 'Camara sideview izquierdo', 'Camara tipo clavo', 
                'Led de giro a la derecha', 'Led de giro a la izquierda', 'Bocina', 'BotÃ³n balancin', 
                'Boton de panico', 'Microfono', 'Sensor magnetico chico', 'Sensor magnetico grande',
                'Sensor derecho VPC', 'Sensor izquierda VPC', 'Sideview derecho', 'Sideview izquierdo',
                'Camara frontal', 'Camara izquierda', 'Camara derecha'
            ],
            equipos: [
                'Dashcam ad2', 'Dashcam c6', 'GV310LAU', 'GV58LAU', 'GV75LAU', 'SMOC', 
                'MDVR 4 Ch', 'MDVR 8 Ch', 'Insider', 'Modulo sensor de cinturon seguridad', 
                'Limitador de velocidad', 'Monitor de VPC', 'Grabador de video 4 ch'
            ]
        };

        // Matriz de funciones de telemetrÃ­a (formato CSV)
        const matrizTelemetriaCSV = `SOS simple,1,2,0,0,0,0,0,0,0
SOS llamada,1,0,0,0,0,0,1,1,0
SOS Bloqueo,1,0,0,0,0,0,0,0,0
Bloqueo normal,0,0,0,0,0,0,0,0,1
Bloqueo CC,0,0,0,0,0,0,0,0,1
Sensores juntos,0,8,0,0,0,0,0,0,1
Sensores independientes,0,0,2,0,0,0,0,0,0
Sensores y bloqueo,0,0,2,0,0,0,0,0,1
Audio bidireccional,0,0,0,0,0,0,1,1,0
Audio espÃ­a,0,0,0,0,0,0,1,0,0
sensor caja,0,12,0,1,0,0,0,0,0
habilitado,0,2,0,0,1,1,0,0,0`;

        // Headers de la matriz de telemetrÃ­a
        const headersTelemetria = ['Boton membrana','Cable 2 vias','Sensor magnetico chico','Sensor magnetico grande','Teclado sencillo','Teclado dinÃ¡mico','Microfono','Bocina','Relevador'];

        // FunciÃ³n para obtener insumos de rastreo desde el CSV actualizado
        function obtenerInsumosRastreo(funcionalidad) {
            // Buscar la funciÃ³n en los datos de Supabase
            const funcion = funcionesRastreo.find(f => f.funcionalidad === funcionalidad);
            
            if (funcion && funcion.insumos) {
                console.log(`ðŸ“¦ FunciÃ³n de rastreo encontrada en Supabase: ${funcionalidad}`, funcion.insumos);
                return funcion.insumos;
            }
            
            // Fallback a datos hardcodeados si no se encuentra en Supabase
            console.log(`âš ï¸ FunciÃ³n de rastreo no encontrada en Supabase: ${funcionalidad}, usando fallback`);
            const insumosRastreoFallback = {
                'SOS simple': [
                    { nombre: 'Boton membrana', cantidad: 1 },
                    { nombre: 'Cable 2 vias', cantidad: 2 }
                ],
                'SOS llamada': [
                    { nombre: 'Boton membrana', cantidad: 1 },
                    { nombre: 'Microfono', cantidad: 1 },
                    { nombre: 'Bocina', cantidad: 1 }
                ],
                'SOS Bloqueo': [
                    { nombre: 'Boton membrana', cantidad: 1 }
                ],
                'Bloqueo normal': [
                    { nombre: 'Relevador', cantidad: 1 }
                ],
                'Bloqueo CC': [
                    { nombre: 'Relevador', cantidad: 1 }
                ],
                'Sensores juntos': [
                    { nombre: 'Cable 2 vias', cantidad: 8 },
                    { nombre: 'Relevador', cantidad: 1 }
                ],
                'Sensores independientes': [
                    { nombre: 'Sensor magnetico chico', cantidad: 2 }
                ],
                'Sensores y bloqueo': [
                    { nombre: 'Sensor magnetico chico', cantidad: 2 },
                    { nombre: 'Relevador', cantidad: 1 }
                ],
                'Audio bidireccional': [
                    { nombre: 'Microfono', cantidad: 1 },
                    { nombre: 'Bocina', cantidad: 1 }
                ],
                'Audio espÃ­a': [
                    { nombre: 'Microfono', cantidad: 1 }
                ],
                'sensor caja': [
                    { nombre: 'Cable 2 vias', cantidad: 12 },
                    { nombre: 'Sensor magnetico grande', cantidad: 1 }
                ],
                'habilitado': [
                    { nombre: 'Cable 2 vias', cantidad: 2 },
                    { nombre: 'Teclado sencillo', cantidad: 1 },
                    { nombre: 'Teclado dinÃ¡mico', cantidad: 1 }
                ]
            };
            
            return insumosRastreoFallback[funcionalidad] || [];
        }

        // FunciÃ³n para obtener insumos sugeridos basados en tipo de unidad y soluciÃ³n
        function obtenerInsumosSugeridos(tipoUnidad, tipoSolucion) {
            console.log(`Buscando en almacÃ©n: "${tipoUnidad}" + "${tipoSolucion}"`);
            
            // Verificar si existe la combinaciÃ³n en el almacÃ©n
            if (almacenInsumos[tipoUnidad] && almacenInsumos[tipoUnidad][tipoSolucion]) {
                const insumosSolucion = almacenInsumos[tipoUnidad][tipoSolucion];
                const insumos = [];
                
                // Convertir objeto a array de insumos
                Object.keys(insumosSolucion).forEach(insumo => {
                    const cantidad = insumosSolucion[insumo];
                    if (cantidad && cantidad !== 0 && cantidad !== '0') {
                        insumos.push({
                            nombre: insumo,
                            cantidad: cantidad,
                            sugerido: true
                        });
                    }
                });
                
                console.log(`âœ“ Encontrada combinaciÃ³n en almacÃ©n: ${insumos.length} insumos`);
                return insumos;
            }
            
            console.log(`âœ— No se encontrÃ³ combinaciÃ³n: "${tipoUnidad}" + "${tipoSolucion}"`);
            return [];
        }

        // FunciÃ³n para obtener accesorios de telemetrÃ­a basados en funciones seleccionadas
        function obtenerAccesoriosTelemetria(funcionesSeleccionadas) {
            const lineas = matrizTelemetriaCSV.split('\n');
            let accesoriosConsolidados = {};
            
            funcionesSeleccionadas.forEach(funcion => {
                // Buscar la fila correspondiente a esta funciÃ³n
                for (let i = 0; i < lineas.length; i++) {
                    const valores = lineas[i].split(',');
                    if (valores[0] === funcion) {
                        // Procesar cada accesorio (desde Ã­ndice 1)
                        for (let j = 1; j < valores.length; j++) {
                            const cantidad = parseInt(valores[j]) || 0;
                            if (cantidad > 0) {
                                const headerIndex = j - 1; // Ajustar Ã­ndice para headers
                                if (headerIndex < headersTelemetria.length) {
                                    const nombreAccesorio = headersTelemetria[headerIndex];
                                    
                                    // LÃ³gica especial para relevador (mÃ¡ximo 1 por unidad)
                                    if (nombreAccesorio === 'Relevador') {
                                        accesoriosConsolidados[nombreAccesorio] = 1;
                                    } else {
                                        // Sumar cantidades para otros accesorios
                                        if (accesoriosConsolidados[nombreAccesorio]) {
                                            accesoriosConsolidados[nombreAccesorio] += cantidad;
                                        } else {
                                            accesoriosConsolidados[nombreAccesorio] = cantidad;
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
            });
            
            // Convertir a array de objetos
            return Object.keys(accesoriosConsolidados).map(nombre => ({
                nombre: nombre,
                cantidad: accesoriosConsolidados[nombre],
                deTelemetria: true
            }));
        }

        // FunciÃ³n para obtener la categorÃ­a de un insumo
        function obtenerCategoriaInsumo(nombreInsumo) {
            if (categoriasInsumos.insumos.includes(nombreInsumo)) return 'insumos';
            if (categoriasInsumos.accesorios.includes(nombreInsumo)) return 'accesorios';
            if (categoriasInsumos.equipos.includes(nombreInsumo)) return 'equipos';
            return 'insumos'; // Default a insumos si no se encuentra
        }

        // FunciÃ³n para generar equipos automÃ¡ticamente basados en las soluciones
        function generarEquiposAutomaticos(vehiculos) {
            let equiposAutomaticos = {};
            
            vehiculos.forEach((vehiculo, unidadIndex) => {
                const tipoUnidad = vehiculo.tipo || 'Tracto';
                
                // Equipos Ãºnicos por unidad (evitar duplicados por mÃºltiples soluciones en la misma unidad)
                let equiposUnicosEnUnidad = {
                    'Monitor de VPC': false,
                    'MDVR 4 Ch': false,
                    'MDVR 8 Ch': false,
                    'Dashcam': null // asegura una sola variante por unidad (AD2 o C6)
                };
                
                // Auto-sugerencia para motocicletas
                if (tipoUnidad === 'Motocicleta') {
                    equiposAutomaticos['GV75LAU'] = {
                        nombre: 'GV75LAU',
                        cantidad: (equiposAutomaticos['GV75LAU']?.cantidad || 0) + 1,
                        unidades: [...(equiposAutomaticos['GV75LAU']?.unidades || []), `Unidad ${unidadIndex + 1} (Motocicleta - Auto)`],
                        sugerido: true,
                        categoria: 'equipos'
                    };
                }
                
                if (vehiculo.soluciones && vehiculo.soluciones.length > 0) {
                    vehiculo.soluciones.forEach(solucion => {
                        const tipoSolucion = solucion.tipo_solucion;
                        const configs = solucion.configuraciones || {};
                        
                        // LÃ³gica para Dashcam
                        if (tipoSolucion === 'Dashcam') {
                            const equipoDashcam = (configs.ai === true || configs.ia === true) ? 'Dashcam ad2' : 'Dashcam c6';
                            // Evitar sugerir ambas variantes en la misma unidad
                            if (!equiposUnicosEnUnidad['Dashcam']) {
                                equiposAutomaticos[equipoDashcam] = {
                                    nombre: equipoDashcam,
                                    cantidad: (equiposAutomaticos[equipoDashcam]?.cantidad || 0) + 1,
                                    unidades: [...(equiposAutomaticos[equipoDashcam]?.unidades || []), `Unidad ${unidadIndex + 1} (${tipoSolucion})`],
                                    sugerido: true,
                                    categoria: 'equipos'
                                };
                                equiposUnicosEnUnidad['Dashcam'] = equipoDashcam;
                            }

                            // La memoria seleccionada se maneja en los insumos sugeridos (no como equipo automÃ¡tico)
                        }
                        
                        // LÃ³gica para Rastreo
                        if (tipoSolucion === 'Rastreo avanzado') {
                            equiposAutomaticos['GV310LAU'] = {
                                nombre: 'GV310LAU',
                                cantidad: (equiposAutomaticos['GV310LAU']?.cantidad || 0) + 1,
                                unidades: [...(equiposAutomaticos['GV310LAU']?.unidades || []), `Unidad ${unidadIndex + 1} (${tipoSolucion})`],
                                sugerido: true,
                                categoria: 'equipos'
                            };
                        } else if (tipoSolucion === 'Rastreo basico') {
                            const equipoGPS = configs.ip67 === true ? 'GV75LAU' : 'GV58LAU';
                            equiposAutomaticos[equipoGPS] = {
                                nombre: equipoGPS,
                                cantidad: (equiposAutomaticos[equipoGPS]?.cantidad || 0) + 1,
                                unidades: [...(equiposAutomaticos[equipoGPS]?.unidades || []), `Unidad ${unidadIndex + 1} (${tipoSolucion})`],
                                sugerido: true,
                                categoria: 'equipos'
                            };
                        } else if (tipoSolucion === 'Rastreo satelital') {
                            equiposAutomaticos['SMOC'] = {
                                nombre: 'SMOC',
                                cantidad: (equiposAutomaticos['SMOC']?.cantidad || 0) + 1,
                                unidades: [...(equiposAutomaticos['SMOC']?.unidades || []), `Unidad ${unidadIndex + 1} (${tipoSolucion})`],
                                sugerido: true,
                                categoria: 'equipos'
                            };
                        }
                        
                        // LÃ³gica para VPC y Encadenamiento (Monitor VPC) - UNO por unidad
                        if (['VPC', 'Encadenamiento seÃ±ales'].includes(tipoSolucion)) {
                            if (!equiposUnicosEnUnidad['Monitor de VPC']) {
                                equiposAutomaticos['Monitor de VPC'] = {
                                    nombre: 'Monitor de VPC',
                                    cantidad: (equiposAutomaticos['Monitor de VPC']?.cantidad || 0) + 1,
                                    unidades: [...(equiposAutomaticos['Monitor de VPC']?.unidades || []), `Unidad ${unidadIndex + 1} (${tipoSolucion})`],
                                    sugerido: true,
                                    categoria: 'equipos'
                                };
                                equiposUnicosEnUnidad['Monitor de VPC'] = true;
                            }
                        }
                        
                        // LÃ³gica para MDVR - UNO por unidad
                        if (tipoSolucion === 'MDVR 4 Ch') {
                            if (!equiposUnicosEnUnidad['MDVR 4 Ch']) {
                                equiposAutomaticos['MDVR 4 Ch'] = {
                                    nombre: 'MDVR 4 Ch',
                                    cantidad: (equiposAutomaticos['MDVR 4 Ch']?.cantidad || 0) + 1,
                                    unidades: [...(equiposAutomaticos['MDVR 4 Ch']?.unidades || []), `Unidad ${unidadIndex + 1} (${tipoSolucion})`],
                                    sugerido: true,
                                    categoria: 'equipos'
                                };
                                equiposUnicosEnUnidad['MDVR 4 Ch'] = true;
                            }
                        } else if (tipoSolucion === 'MDVR 8 Ch') {
                            if (!equiposUnicosEnUnidad['MDVR 8 Ch']) {
                                equiposAutomaticos['MDVR 8 Ch'] = {
                                    nombre: 'MDVR 8 Ch',
                                    cantidad: (equiposAutomaticos['MDVR 8 Ch']?.cantidad || 0) + 1,
                                    unidades: [...(equiposAutomaticos['MDVR 8 Ch']?.unidades || []), `Unidad ${unidadIndex + 1} (${tipoSolucion})`],
                                    sugerido: true,
                                    categoria: 'equipos'
                                };
                                equiposUnicosEnUnidad['MDVR 8 Ch'] = true;
                            }
                        }
                        
                        // Verificar si hay grabaciÃ³n en otras soluciones (VPC, Sideview, Encadenamiento)
                        if (['VPC', 'Sideview', 'Encadenamiento seÃ±ales'].includes(tipoSolucion) && configs.grabacion === true) {
                            if (!equiposUnicosEnUnidad['MDVR 4 Ch']) {
                                equiposAutomaticos['MDVR 4 Ch'] = {
                                    nombre: 'MDVR 4 Ch',
                                    cantidad: (equiposAutomaticos['MDVR 4 Ch']?.cantidad || 0) + 1,
                                    unidades: [...(equiposAutomaticos['MDVR 4 Ch']?.unidades || []), `Unidad ${unidadIndex + 1} (${tipoSolucion} - GrabaciÃ³n)`],
                                    sugerido: true,
                                    categoria: 'equipos'
                                };
                                equiposUnicosEnUnidad['MDVR 4 Ch'] = true;
                            }
                            // Marcar bandera para notificar soporte
                            try { cotizacionData.requiereSoporte = true; } catch(_) {}
                        }
                        
                        // Procesar configuraciones especÃ­ficas de VPC
                        if (tipoSolucion === 'VPC') {
                            // Procesar cÃ¡maras VPC seleccionadas
                            if (configs.camara_izquierda === true) {
                                equiposAutomaticos['Camara lateral izquierda de VPC'] = {
                                    nombre: 'Camara lateral izquierda de VPC',
                                    cantidad: (equiposAutomaticos['Camara lateral izquierda de VPC']?.cantidad || 0) + 1,
                                    unidades: [...(equiposAutomaticos['Camara lateral izquierda de VPC']?.unidades || []), `Unidad ${unidadIndex + 1} (VPC - CÃ¡mara Izquierda)`],
                                    sugerido: true,
                                    categoria: 'accesorios'
                                };
                            }
                            
                            if (configs.camara_derecha === true) {
                                equiposAutomaticos['Camara lateral derecha de VPC'] = {
                                    nombre: 'Camara lateral derecha de VPC',
                                    cantidad: (equiposAutomaticos['Camara lateral derecha de VPC']?.cantidad || 0) + 1,
                                    unidades: [...(equiposAutomaticos['Camara lateral derecha de VPC']?.unidades || []), `Unidad ${unidadIndex + 1} (VPC - CÃ¡mara Derecha)`],
                                    sugerido: true,
                                    categoria: 'accesorios'
                                };
                            }
                            
                            if (configs.camara_reversa === true) {
                                equiposAutomaticos['Camara de reversa'] = {
                                    nombre: 'Camara de reversa',
                                    cantidad: (equiposAutomaticos['Camara de reversa']?.cantidad || 0) + 1,
                                    unidades: [...(equiposAutomaticos['Camara de reversa']?.unidades || []), `Unidad ${unidadIndex + 1} (VPC - CÃ¡mara Reversa)`],
                                    sugerido: true,
                                    categoria: 'accesorios'
                                };
                            }
                            
                            if (configs.camara_frontal === true) {
                                equiposAutomaticos['Camara frontal'] = {
                                    nombre: 'Camara frontal',
                                    cantidad: (equiposAutomaticos['Camara frontal']?.cantidad || 0) + 1,
                                    unidades: [...(equiposAutomaticos['Camara frontal']?.unidades || []), `Unidad ${unidadIndex + 1} (VPC - CÃ¡mara Frontal)`],
                                    sugerido: true,
                                    categoria: 'accesorios'
                                };
                            }
                            
                            // Procesar alarmas VPC seleccionadas
                            if (configs.alarma_parlante === true) {
                                equiposAutomaticos['Alarma parlante programable'] = {
                                    nombre: 'Alarma parlante programable',
                                    cantidad: (equiposAutomaticos['Alarma parlante programable']?.cantidad || 0) + 1,
                                    unidades: [...(equiposAutomaticos['Alarma parlante programable']?.unidades || []), `Unidad ${unidadIndex + 1} (VPC - Alarma Parlante)`],
                                    sugerido: true,
                                    categoria: 'accesorios'
                                };
                            }
                            
                            if (configs.boton_panico === true) {
                                equiposAutomaticos['Boton de panico'] = {
                                    nombre: 'Boton de panico',
                                    cantidad: (equiposAutomaticos['Boton de panico']?.cantidad || 0) + 1,
                                    unidades: [...(equiposAutomaticos['Boton de panico']?.unidades || []), `Unidad ${unidadIndex + 1} (VPC - BotÃ³n PÃ¡nico)`],
                                    sugerido: true,
                                    categoria: 'accesorios'
                                };
                            }
                            
                            if (configs.microfono === true) {
                                equiposAutomaticos['Microfono'] = {
                                    nombre: 'Microfono',
                                    cantidad: (equiposAutomaticos['Microfono']?.cantidad || 0) + 1,
                                    unidades: [...(equiposAutomaticos['Microfono']?.unidades || []), `Unidad ${unidadIndex + 1} (VPC - MicrÃ³fono)`],
                                    sugerido: true,
                                    categoria: 'accesorios'
                                };
                            }
                        }
                        
                        // Equipos directos
                        if (tipoSolucion === 'Insider') {
                            equiposAutomaticos['Insider'] = {
                                nombre: 'Insider',
                                cantidad: (equiposAutomaticos['Insider']?.cantidad || 0) + 1,
                                unidades: [...(equiposAutomaticos['Insider']?.unidades || []), `Unidad ${unidadIndex + 1} (${tipoSolucion})`],
                                sugerido: true,
                                categoria: 'equipos'
                            };
                        }
                        
                        if (tipoSolucion === 'Limitador de velocidad') {
                            equiposAutomaticos['Limitador de velocidad'] = {
                                nombre: 'Limitador de velocidad',
                                cantidad: (equiposAutomaticos['Limitador de velocidad']?.cantidad || 0) + 1,
                                unidades: [...(equiposAutomaticos['Limitador de velocidad']?.unidades || []), `Unidad ${unidadIndex + 1} (${tipoSolucion})`],
                                sugerido: true,
                                categoria: 'equipos'
                            };
                        }
                        
                        if (tipoSolucion === 'Modulo sensor cinturon') {
                            equiposAutomaticos['Modulo sensor de cinturon seguridad'] = {
                                nombre: 'Modulo sensor de cinturon seguridad',
                                cantidad: (equiposAutomaticos['Modulo sensor de cinturon seguridad']?.cantidad || 0) + 1,
                                unidades: [...(equiposAutomaticos['Modulo sensor de cinturon seguridad']?.unidades || []), `Unidad ${unidadIndex + 1} (${tipoSolucion})`],
                                sugerido: true,
                                categoria: 'equipos'
                            };
                        }
                    });
                }
            });
            
            return equiposAutomaticos;
        }

        // ===== VALIDACIONES DE ENTRADAS/SALIDAS GPS GV310LAU =====
        
        // FunciÃ³n para validar entradas y salidas del GPS
        function validarEntradasSalidasGPS(unidadIndex, solucionIndex) {
            const vehiculo = cotizacionData.vehiculos[unidadIndex];
            const solucion = vehiculo.soluciones[solucionIndex];
            
            if (!solucion || solucion.tipo_solucion !== 'Rastreo avanzado') {
                return { valido: true };
            }
            
            const configs = solucion.configuraciones || {};
            const entradasUsadas = [];
            const salidasUsadas = [];
            
            // Mapear configuraciones a entradas/salidas
            if (configs.sos_simple || configs.sos_llamada || configs.sos_bloqueo) {
                entradasUsadas.push(1); // SOS usa entrada 1
            }
            
            if (configs.sensores_puertas === 'juntos') {
                entradasUsadas.push(2); // Sensores juntos usa entrada 2
            } else if (configs.sensores_puertas === 'independientes') {
                entradasUsadas.push(2, 3); // Sensores independientes usa entradas 2 y 3
            }
            
            if (configs.teclado_sencillo || configs.teclado_dinamico) {
                // Teclado usa entrada 3, pero si sensores independientes ya la usa, necesitamos otra entrada
                if (configs.sensores_puertas === 'independientes') {
                    // Si sensores independientes ya usa entrada 3, teclado no puede usarla
                    console.log('âš ï¸ Teclado no puede usarse con sensores independientes (ambos necesitan entrada 3)');
                } else {
                    entradasUsadas.push(3); // Teclado usa entrada 3
                }
            }
            
            if (configs.bloqueo_normal || configs.bloqueo_gradual || configs.bloqueo_cortacorriente) {
                salidasUsadas.push(1); // Bloqueo usa salida 1
            }
            
            if (configs.bloqueo_apertura) {
                if (configs.sensores_puertas === 'juntos') {
                    salidasUsadas.push(2); // Bloqueo por puertas juntos usa salida 2
                } else if (configs.sensores_puertas === 'independientes') {
                    salidasUsadas.push(2, 3); // Bloqueo por puertas independientes usa salidas 2 y 3
                }
            }
            
            console.log(`ðŸ” DEBUG: Verificando deteccion_jammer: "${configs.deteccion_jammer}"`);
            
            if (configs.deteccion_jammer === 'alerta' || configs.deteccion_jammer === 'alerta_bloqueo') {
                console.log(`ðŸ” DEBUG: Procesando detecciÃ³n jammer: ${configs.deteccion_jammer}`);
                // DetecciÃ³n jammer siempre usa una entrada
                const entradaLibre = [1, 2, 3].find(entrada => !entradasUsadas.includes(entrada));
                if (entradaLibre) {
                    entradasUsadas.push(entradaLibre);
                    console.log(`ðŸ” DEBUG: DetecciÃ³n jammer usando entrada ${entradaLibre}`);
                } else {
                    console.log('âš ï¸ No hay entradas libres para detecciÃ³n jammer');
                }
                
                // Si es alerta y bloqueo, tambiÃ©n usa salida 3
                if (configs.deteccion_jammer === 'alerta_bloqueo') {
                    salidasUsadas.push(3);
                    console.log(`ðŸ” DEBUG: DetecciÃ³n jammer con bloqueo usando salida 3`);
                }
            } else {
                console.log(`ðŸ” DEBUG: DetecciÃ³n jammer no activa o valor invÃ¡lido: "${configs.deteccion_jammer}"`);
            }
            
            // Verificar si excede las capacidades del GPS (3 entradas, 3 salidas)
            const entradasUnicas = [...new Set(entradasUsadas)];
            const salidasUnicas = [...new Set(salidasUsadas)];
            
            console.log(`ðŸ” DEBUG: ValidaciÃ³n GPS - Entradas usadas: [${entradasUnicas.join(', ')}], Salidas usadas: [${salidasUnicas.join(', ')}]`);
            console.log(`ðŸ” DEBUG: Configuraciones actuales:`, configs);
            
            // Verificar si excede las capacidades (mÃ¡s de 3 entradas o salidas)
            if (entradasUnicas.length > 3 || salidasUnicas.length > 3) {
                console.log(`âŒ DEBUG: Excede capacidades - Entradas: ${entradasUnicas.length}/3, Salidas: ${salidasUnicas.length}/3`);
                return {
                    valido: false,
                    entradasUsadas: entradasUnicas,
                    salidasUsadas: salidasUnicas,
                    mensaje: 'Las configuraciones seleccionadas exceden las capacidades fÃ­sicas del GPS GV310LAU (3 entradas, 3 salidas).'
                };
            }
            
            // Verificar conflictos especÃ­ficos que requieren Insider
            const conflictos = [];
            
            // Conflicto: Sensores independientes + Teclado (ambos necesitan entrada 3)
            if (configs.sensores_puertas === 'independientes' && (configs.teclado_sencillo || configs.teclado_dinamico)) {
                conflictos.push('Sensores independientes y teclado requieren la misma entrada (3)');
            }
            
            // Conflicto: Bloqueo con apertura independientes + DetecciÃ³n jammer con bloqueo (ambos necesitan salida 3)
            if (configs.sensores_puertas === 'independientes' && configs.bloqueo_apertura && configs.deteccion_jammer === 'alerta_bloqueo') {
                conflictos.push('Bloqueo con apertura independientes y detecciÃ³n jammer con bloqueo requieren la misma salida (3)');
            }
            
            // Si hay conflictos, mostrar modal
            if (conflictos.length > 0) {
                console.log(`âŒ DEBUG: Conflictos detectados: ${conflictos.join(', ')}`);
                return {
                    valido: false,
                    entradasUsadas: entradasUnicas,
                    salidasUsadas: salidasUnicas,
                    mensaje: `Conflictos detectados: ${conflictos.join(', ')}. Se requiere un mÃ³dulo Insider para resolver estos conflictos.`
                };
            }
            
            // Verificar si estÃ¡ al lÃ­mite (exactamente 3 entradas o salidas) - esto es vÃ¡lido
            if (entradasUnicas.length === 3 || salidasUnicas.length === 3) {
                console.log(`âš ï¸ DEBUG: Al lÃ­mite de capacidades - Entradas: ${entradasUnicas.length}/3, Salidas: ${salidasUnicas.length}/3`);
            }
            
            console.log(`âœ… DEBUG: ConfiguraciÃ³n vÃ¡lida - Entradas: ${entradasUnicas.length}/3, Salidas: ${salidasUnicas.length}/3`);
            return { valido: true };
        }
        
        // FunciÃ³n para mostrar modal de advertencia
        function mostrarModalAdvertenciaGPS(unidadIndex, solucionIndex, validacion) {
            const modalHtml = `
                <div class="modal fade" id="modalAdvertenciaGPS" tabindex="-1" aria-labelledby="modalAdvertenciaGPSLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header bg-warning">
                                <h5 class="modal-title" id="modalAdvertenciaGPSLabel">
                                    <i class="bi bi-exclamation-triangle-fill me-2"></i>Advertencia - Capacidades del GPS
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-warning">
                                    <h6><i class="bi bi-info-circle me-2"></i>ConfiguraciÃ³n no compatible</h6>
                                    <p class="mb-0">${validacion.mensaje}</p>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Entradas utilizadas: ${validacion.entradasUsadas.length}/3</h6>
                                        <div class="d-flex flex-wrap gap-1">
                                            ${validacion.entradasUsadas.map(entrada => 
                                                `<span class="badge bg-primary">Entrada ${entrada}</span>`
                                            ).join('')}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Salidas utilizadas: ${validacion.salidasUsadas.length}/3</h6>
                                        <div class="d-flex flex-wrap gap-1">
                                            ${validacion.salidasUsadas.map(salida => 
                                                `<span class="badge bg-success">Salida ${salida}</span>`
                                            ).join('')}
                                        </div>
                                    </div>
                                </div>
                                <hr>
                                <h6>Opciones disponibles:</h6>
                                <ul>
                                    <li><strong>Agregar mÃ³dulo Insider:</strong> Permite expandir las capacidades del sistema</li>
                                    <li><strong>Editar configuraciÃ³n:</strong> Modificar las opciones seleccionadas</li>
                                </ul>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="bi bi-pencil-square me-1"></i>Editar configuraciÃ³n
                                </button>
                                <button type="button" class="btn btn-warning" onclick="agregarModuloInsider(${unidadIndex}, ${solucionIndex})">
                                    <i class="bi bi-plus-circle me-1"></i>Agregar mÃ³dulo Insider
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remover modal existente si existe
            const modalExistente = document.getElementById('modalAdvertenciaGPS');
            if (modalExistente) {
                modalExistente.remove();
            }
            
            // Agregar nuevo modal al DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('modalAdvertenciaGPS'));
            modal.show();
        }
        
        // FunciÃ³n para agregar mÃ³dulo Insider
        function agregarModuloInsider(unidadIndex, solucionIndex) {
            console.log(`ðŸš¨ EJECUTANDO agregarModuloInsider - unidadIndex: ${unidadIndex}, solucionIndex: ${solucionIndex}`);
            
            const vehiculo = cotizacionData.vehiculos[unidadIndex];
            const solucion = vehiculo.soluciones[solucionIndex];
            
            console.log(`ðŸš¨ ANTES - solucion.configuraciones:`, solucion.configuraciones);
            
            // Marcar el mÃ³dulo Insider como activo en la configuraciÃ³n
            if (!solucion.configuraciones) {
                solucion.configuraciones = {};
            }
            
            // MÃšLTIPLES MÃ‰TODOS DE ASIGNACIÃ“N PARA FORZAR
            console.log(`ðŸš¨ ANTES de asignar - configuraciones:`, JSON.stringify(solucion.configuraciones));
            
            // MÃ©todo 1: AsignaciÃ³n directa
            solucion.configuraciones.modulo_insider = true;
            console.log(`ðŸš¨ MÃ‰TODO 1 - DespuÃ©s de asignaciÃ³n directa:`, JSON.stringify(solucion.configuraciones));
            
            // MÃ©todo 2: Object.assign
            solucion.configuraciones = Object.assign(solucion.configuraciones, { modulo_insider: true });
            console.log(`ðŸš¨ MÃ‰TODO 2 - DespuÃ©s de Object.assign:`, JSON.stringify(solucion.configuraciones));
            
            // MÃ©todo 3: Spread operator
            solucion.configuraciones = { ...solucion.configuraciones, modulo_insider: true };
            console.log(`ðŸš¨ MÃ‰TODO 3 - DespuÃ©s de spread:`, JSON.stringify(solucion.configuraciones));
            
            // MÃ©todo 4: Forzar en cotizacionData directamente
            cotizacionData.vehiculos[unidadIndex].soluciones[solucionIndex].configuraciones.modulo_insider = true;
            console.log(`ðŸš¨ MÃ‰TODO 4 - DespuÃ©s de forzar directo:`, JSON.stringify(cotizacionData.vehiculos[unidadIndex].soluciones[solucionIndex].configuraciones));
            
            console.log(`ðŸš¨ DESPUÃ‰S - solucion.configuraciones:`, solucion.configuraciones);
            console.log(`ðŸš¨ VERIFICACIÃ“N - cotizacionData.vehiculos[${unidadIndex}].soluciones[${solucionIndex}].configuraciones:`, cotizacionData.vehiculos[unidadIndex].soluciones[solucionIndex].configuraciones);
            
            // NO llamar actualizarInterfazSoluciones aquÃ­ porque estÃ¡ perdiendo el valor
            // En su lugar, actualizar directamente el checkbox si existe
            const solucionId = `wizard_unidad_${unidadIndex + 1}_solucion_${solucionIndex + 1}`;
            const moduloInsiderElement = document.getElementById(`${solucionId}_modulo_insider`);
            if (moduloInsiderElement) {
                moduloInsiderElement.checked = true;
                console.log(`ðŸš¨ Checkbox marcado: ${solucionId}_modulo_insider`);
            } else {
                console.log(`ðŸš¨ NO se encontrÃ³ checkbox: ${solucionId}_modulo_insider`);
            }
            
            // Mostrar mensaje de Ã©xito
            mostrarAlerta('âœ… MÃ³dulo Insider agregado exitosamente', 'success');
            
            // DEPURAR: Verificar estado ANTES de cerrar modal
            console.log(`ðŸš¨ ANTES DE CERRAR MODAL:`, cotizacionData.vehiculos[unidadIndex].soluciones[solucionIndex].configuraciones);
            
            // Cerrar el modal
            const modal = document.getElementById('modalAdvertenciaGPS');
            if (modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                }
            }
            
            // DEPURAR: Verificar estado DESPUÃ‰S de cerrar modal (con delay)
            setTimeout(() => {
                console.log(`ðŸš¨ DESPUÃ‰S DE CERRAR MODAL (500ms):`, cotizacionData.vehiculos[unidadIndex].soluciones[solucionIndex].configuraciones);
                console.log(`ðŸš¨ KEYS DESPUÃ‰S DEL MODAL (500ms):`, Object.keys(cotizacionData.vehiculos[unidadIndex].soluciones[solucionIndex].configuraciones));
            }, 500);
            
            // DEPURAR: Verificar inmediatamente despuÃ©s del modal
            setTimeout(() => {
                console.log(`ðŸš¨ INMEDIATO DESPUÃ‰S DEL MODAL (100ms):`, cotizacionData.vehiculos[unidadIndex].soluciones[solucionIndex].configuraciones);
                console.log(`ðŸš¨ KEYS INMEDIATO (100ms):`, Object.keys(cotizacionData.vehiculos[unidadIndex].soluciones[solucionIndex].configuraciones));
            }, 100);
        }
        
        // FunciÃ³n para aplicar reglas de exclusiÃ³n
        function aplicarReglasExclusion(unidadIndex, solucionIndex, elementoModificado) {
            const vehiculo = cotizacionData.vehiculos[unidadIndex];
            const solucion = vehiculo.soluciones[solucionIndex];
            const configs = solucion.configuraciones || {};
            
            // Construir el prefijo correcto del ID
            const unidadId = unidadIndex + 1; // Convertir a base 1
            const solucionId = `wizard_unidad_${unidadId}_solucion_${solucionIndex + 1}`;
            
            console.log(`ðŸ”§ DEBUG: Aplicando reglas de exclusiÃ³n para ${solucionId}, elemento: ${elementoModificado}`);
            
            // Reglas de exclusiÃ³n para SOS
            if (elementoModificado.includes('sos_')) {
                const sosSimple = document.getElementById(`${solucionId}_sos_simple`);
                const sosLlamada = document.getElementById(`${solucionId}_sos_llamada`);
                const sosBloqueo = document.getElementById(`${solucionId}_sos_bloqueo`);
                
                if (elementoModificado === 'sos_simple' && sosSimple && sosSimple.checked) {
                    // Si se selecciona SOS simple, deshabilitar SOS llamada
                    if (sosLlamada) {
                        sosLlamada.disabled = true;
                        if (sosLlamada.checked) {
                            sosLlamada.checked = false;
                            configs.sos_llamada = false;
                        }
                    }
                } else if (elementoModificado === 'sos_llamada' && sosLlamada && sosLlamada.checked) {
                    // Si se selecciona SOS llamada, deshabilitar SOS simple
                    if (sosSimple) {
                        sosSimple.disabled = true;
                        if (sosSimple.checked) {
                            sosSimple.checked = false;
                            configs.sos_simple = false;
                        }
                    }
                } else if (elementoModificado === 'sos_simple' && sosSimple && !sosSimple.checked) {
                    // Si se deselecciona SOS simple, habilitar SOS llamada
                    if (sosLlamada) {
                        sosLlamada.disabled = false;
                    }
                } else if (elementoModificado === 'sos_llamada' && sosLlamada && !sosLlamada.checked) {
                    // Si se deselecciona SOS llamada, habilitar SOS simple
                    if (sosSimple) {
                        sosSimple.disabled = false;
                    }
                }
            }
            
            // Reglas de exclusiÃ³n para bloqueo
            if (elementoModificado.includes('bloqueo_')) {
                const bloqueoNormal = document.getElementById(`${solucionId}_bloqueo_normal`);
                const bloqueoGradual = document.getElementById(`${solucionId}_bloqueo_gradual`);
                const bloqueoCortacorriente = document.getElementById(`${solucionId}_bloqueo_cortacorriente`);
                
                if (elementoModificado === 'bloqueo_normal' && bloqueoNormal && bloqueoNormal.checked) {
                    if (bloqueoGradual) {
                        bloqueoGradual.disabled = true;
                        if (bloqueoGradual.checked) {
                            bloqueoGradual.checked = false;
                            configs.bloqueo_gradual = false;
                        }
                    }
                    if (bloqueoCortacorriente) {
                        bloqueoCortacorriente.disabled = true;
                        if (bloqueoCortacorriente.checked) {
                            bloqueoCortacorriente.checked = false;
                            configs.bloqueo_cortacorriente = false;
                        }
                    }
                } else if (elementoModificado === 'bloqueo_gradual' && bloqueoGradual && bloqueoGradual.checked) {
                    if (bloqueoNormal) {
                        bloqueoNormal.disabled = true;
                        if (bloqueoNormal.checked) {
                            bloqueoNormal.checked = false;
                            configs.bloqueo_normal = false;
                        }
                    }
                    if (bloqueoCortacorriente) {
                        bloqueoCortacorriente.disabled = true;
                        if (bloqueoCortacorriente.checked) {
                            bloqueoCortacorriente.checked = false;
                            configs.bloqueo_cortacorriente = false;
                        }
                    }
                } else if (elementoModificado === 'bloqueo_cortacorriente' && bloqueoCortacorriente && bloqueoCortacorriente.checked) {
                    if (bloqueoNormal) {
                        bloqueoNormal.disabled = true;
                        if (bloqueoNormal.checked) {
                            bloqueoNormal.checked = false;
                            configs.bloqueo_normal = false;
                        }
                    }
                    if (bloqueoGradual) {
                        bloqueoGradual.disabled = true;
                        if (bloqueoGradual.checked) {
                            bloqueoGradual.checked = false;
                            configs.bloqueo_gradual = false;
                        }
                    }
                } else if (elementoModificado === 'bloqueo_normal' && bloqueoNormal && !bloqueoNormal.checked) {
                    if (bloqueoGradual) bloqueoGradual.disabled = false;
                    if (bloqueoCortacorriente) bloqueoCortacorriente.disabled = false;
                } else if (elementoModificado === 'bloqueo_gradual' && bloqueoGradual && !bloqueoGradual.checked) {
                    if (bloqueoNormal) bloqueoNormal.disabled = false;
                    if (bloqueoCortacorriente) bloqueoCortacorriente.disabled = false;
                } else if (elementoModificado === 'bloqueo_cortacorriente' && bloqueoCortacorriente && !bloqueoCortacorriente.checked) {
                    if (bloqueoNormal) bloqueoNormal.disabled = false;
                    if (bloqueoGradual) bloqueoGradual.disabled = false;
                }
            }
            
            // Reglas de exclusiÃ³n para audio en cabina
            if (elementoModificado.includes('audio_')) {
                const audioBidireccional = document.getElementById(`${solucionId}_audio_bidireccional`);
                const audioEspia = document.getElementById(`${solucionId}_audio_espia`);
                
                if (elementoModificado === 'audio_bidireccional' && audioBidireccional && audioBidireccional.checked) {
                    if (audioEspia) {
                        audioEspia.disabled = true;
                        if (audioEspia.checked) {
                            audioEspia.checked = false;
                            configs.audio_espia = false;
                        }
                    }
                } else if (elementoModificado === 'audio_espia' && audioEspia && audioEspia.checked) {
                    if (audioBidireccional) {
                        audioBidireccional.disabled = true;
                        if (audioBidireccional.checked) {
                            audioBidireccional.checked = false;
                            configs.audio_bidireccional = false;
                        }
                    }
                } else if (elementoModificado === 'audio_bidireccional' && audioBidireccional && !audioBidireccional.checked) {
                    if (audioEspia) audioEspia.disabled = false;
                } else if (elementoModificado === 'audio_espia' && audioEspia && !audioEspia.checked) {
                    if (audioBidireccional) audioBidireccional.disabled = false;
                }
            }
            
            // Reglas de exclusiÃ³n para habilitado en cabina
            if (elementoModificado.includes('teclado_')) {
                const tecladoSencillo = document.getElementById(`${solucionId}_teclado_sencillo`);
                const tecladoDinamico = document.getElementById(`${solucionId}_teclado_dinamico`);
                
                if (elementoModificado === 'teclado_sencillo' && tecladoSencillo && tecladoSencillo.checked) {
                    if (tecladoDinamico) {
                        tecladoDinamico.disabled = true;
                        if (tecladoDinamico.checked) {
                            tecladoDinamico.checked = false;
                            configs.teclado_dinamico = false;
                        }
                    }
                } else if (elementoModificado === 'teclado_dinamico' && tecladoDinamico && tecladoDinamico.checked) {
                    if (tecladoSencillo) {
                        tecladoSencillo.disabled = true;
                        if (tecladoSencillo.checked) {
                            tecladoSencillo.checked = false;
                            configs.teclado_sencillo = false;
                        }
                    }
                } else if (elementoModificado === 'teclado_sencillo' && tecladoSencillo && !tecladoSencillo.checked) {
                    if (tecladoDinamico) tecladoDinamico.disabled = false;
                } else if (elementoModificado === 'teclado_dinamico' && tecladoDinamico && !tecladoDinamico.checked) {
                    if (tecladoSencillo) tecladoSencillo.disabled = false;
                }
            }
            
            // Reglas de exclusiÃ³n para sensores de puertas
            if (elementoModificado === 'sensores_puertas') {
                const sensoresJuntos = document.getElementById(`${solucionId}_sensores_juntos`);
                const sensoresIndependientes = document.getElementById(`${solucionId}_sensores_independientes`);
                
                // Los sensores de puertas son radio buttons, por lo que son mutuamente excluyentes por naturaleza
                // Solo necesitamos actualizar la configuraciÃ³n
                if (sensoresJuntos && sensoresJuntos.checked) {
                    configs.sensores_puertas = 'juntos';
                    console.log(`ðŸ”§ DEBUG: Sensores configurados como juntos`);
                } else if (sensoresIndependientes && sensoresIndependientes.checked) {
                    configs.sensores_puertas = 'independientes';
                    console.log(`ðŸ”§ DEBUG: Sensores configurados como independientes`);
                } else {
                    configs.sensores_puertas = null;
                    console.log(`ðŸ”§ DEBUG: Sensores deseleccionados`);
                }
            }
            
            // Regla para bloqueo con apertura de puertas
            if (elementoModificado === 'bloqueo_apertura') {
                const bloqueoApertura = document.getElementById(`${solucionId}_bloqueo_apertura`);
                const sensoresJuntos = document.getElementById(`${solucionId}_sensores_juntos`);
                const sensoresIndependientes = document.getElementById(`${solucionId}_sensores_independientes`);
                
                if (bloqueoApertura && bloqueoApertura.checked) {
                    const tieneSensores = (sensoresJuntos && sensoresJuntos.checked) || 
                                        (sensoresIndependientes && sensoresIndependientes.checked);
                    
                    if (!tieneSensores) {
                        // No se puede seleccionar bloqueo con apertura sin sensores de puertas
                        bloqueoApertura.checked = false;
                        configs.bloqueo_apertura = false;
                        mostrarAlerta('Debe seleccionar sensores de puertas antes de activar el bloqueo con apertura', 'warning');
                    }
                }
            }
        }

        // FunciÃ³n para manejar cambios en configuraciones
        function manejarCambioConfiguracion(solucionId, configKey, unidadIndex, solucionIndex) {
            console.log(`ðŸ”„ DEBUG: Cambio en configuraciÃ³n: ${configKey} para ${solucionId}`);
            
            // Verificar que cotizacionData.vehiculos estÃ© inicializado
            if (!cotizacionData.vehiculos || !Array.isArray(cotizacionData.vehiculos)) {
                console.warn('âš ï¸ cotizacionData.vehiculos no estÃ¡ inicializado, inicializando...');
                cotizacionData.vehiculos = [];
            }
            
            // Verificar que el Ã­ndice de unidad sea vÃ¡lido
            if (unidadIndex >= cotizacionData.vehiculos.length) {
                console.warn(`âš ï¸ Unidad ${unidadIndex} no existe, creando...`);
                // Crear vehÃ­culo bÃ¡sico si no existe
                cotizacionData.vehiculos[unidadIndex] = {
                    soluciones: []
                };
            }
            
            const vehiculo = cotizacionData.vehiculos[unidadIndex];
            
            // Verificar que el vehÃ­culo tenga soluciones
            if (!vehiculo.soluciones || !Array.isArray(vehiculo.soluciones)) {
                console.warn(`âš ï¸ Soluciones no inicializadas para unidad ${unidadIndex}, inicializando...`);
                vehiculo.soluciones = [];
            }
            
            // Verificar que el Ã­ndice de soluciÃ³n sea vÃ¡lido
            if (solucionIndex >= vehiculo.soluciones.length) {
                console.warn(`âš ï¸ SoluciÃ³n ${solucionIndex} no existe para unidad ${unidadIndex}, creando...`);
                // Crear soluciÃ³n bÃ¡sica si no existe
                vehiculo.soluciones[solucionIndex] = {
                    tipo_solucion: '',
                    configuraciones: {}
                };
            }
            
            const solucion = vehiculo.soluciones[solucionIndex];
            
            if (!solucion.configuraciones) {
                solucion.configuraciones = {};
            }
            
            // ðŸš¨ CRÃTICO: Verificar si modulo_insider existe ANTES de actualizar
            const moduloInsiderAntes = solucion.configuraciones.modulo_insider;
            console.log(`ðŸš¨ ANTES manejarCambioConfiguracion - modulo_insider: ${moduloInsiderAntes}, configKey: ${configKey}`);
            
            // Actualizar el tipo de soluciÃ³n si es necesario
            const tipoSelect = document.getElementById(`${solucionId}_tipo`);
            if (tipoSelect && tipoSelect.value) {
                solucion.tipo_solucion = tipoSelect.value;
                console.log(`ðŸ”§ DEBUG: Tipo de soluciÃ³n actualizado: ${tipoSelect.value}`);
            }
            
            // Actualizar la configuraciÃ³n en el objeto de datos
            let elemento;
            
            // Para detecciÃ³n jammer, buscar el radio button seleccionado del grupo
            if (configKey === 'deteccion_jammer') {
                const jammerAlerta = document.getElementById(`${solucionId}_jammer_alerta`);
                const jammerAlertaBloqueo = document.getElementById(`${solucionId}_jammer_alerta_bloqueo`);
                
                if (jammerAlertaBloqueo && jammerAlertaBloqueo.checked) {
                    elemento = jammerAlertaBloqueo;
                } else if (jammerAlerta && jammerAlerta.checked) {
                    elemento = jammerAlerta;
                } else {
                    elemento = null;
                }
            } else {
                elemento = document.getElementById(`${solucionId}_${configKey}`);
            }
            
            if (elemento) {
                if (elemento.type === 'checkbox') {
                    solucion.configuraciones[configKey] = elemento.checked;
                    
                    // Si es hosting, tambiÃ©n guardar la periodicidad
                    if (configKey === 'hosting' && elemento.checked) {
                        const periodoSelect = document.getElementById(`${solucionId}_hosting_periodo`);
                        if (periodoSelect) {
                            solucion.configuraciones['hosting_periodo'] = periodoSelect.value;
                        }
                    }
                } else if (elemento.type === 'radio') {
                    if (elemento.checked) {
                        if (configKey === 'sensores_puertas') {
                            solucion.configuraciones[configKey] = elemento.value;
                        } else if (configKey === 'deteccion_jammer') {
                            solucion.configuraciones[configKey] = elemento.value;
                            console.log(`ðŸ”§ DEBUG: DetecciÃ³n jammer guardada: ${elemento.value}`);
                        } else if (configKey === 'audio_bidireccional') {
                            solucion.configuraciones[configKey] = true;
                            solucion.configuraciones['audio_espia'] = false;
                        } else if (configKey === 'audio_espia') {
                            solucion.configuraciones[configKey] = true;
                            solucion.configuraciones['audio_bidireccional'] = false;
                        } else if (configKey === 'teclado_sencillo') {
                            solucion.configuraciones[configKey] = true;
                            solucion.configuraciones['teclado_dinamico'] = false;
                        } else if (configKey === 'teclado_dinamico') {
                            solucion.configuraciones[configKey] = true;
                            solucion.configuraciones['teclado_sencillo'] = false;
                        } else if (configKey === 'modulo_insider') {
                            solucion.configuraciones[configKey] = elemento.checked;
                        }
                }
            }
            
            // Aplicar reglas de exclusiÃ³n
            aplicarReglasExclusion(unidadIndex, solucionIndex, configKey);
            
            // Validar entradas y salidas del GPS
            const validacion = validarEntradasSalidasGPS(unidadIndex, solucionIndex);
            
            if (!validacion.valido) {
                console.log(`ðŸš¨ DEBUG: Mostrando modal de advertencia GPS - ${validacion.mensaje}`);
                mostrarModalAdvertenciaGPS(unidadIndex, solucionIndex, validacion);
            } else {
                console.log(`âœ… DEBUG: ConfiguraciÃ³n vÃ¡lida, no se muestra modal`);
                console.log(`âœ… DEBUG: ConfiguraciÃ³n vÃ¡lida`);
            }
            
            // ðŸš¨ CRÃTICO: Verificar si modulo_insider SIGUE existiendo DESPUÃ‰S de actualizar
            const moduloInsiderDespues = solucion.configuraciones.modulo_insider;
            console.log(`ðŸš¨ DESPUÃ‰S manejarCambioConfiguracion - modulo_insider: ${moduloInsiderDespues}, configKey: ${configKey}`);
            
            // Si se perdiÃ³ modulo_insider, restaurarlo
            if (moduloInsiderAntes && !moduloInsiderDespues) {
                console.log(`ðŸš¨ RESTAURANDO modulo_insider que se perdiÃ³ en manejarCambioConfiguracion`);
                solucion.configuraciones.modulo_insider = moduloInsiderAntes;
            }
            
            // Actualizar la interfaz si es necesario
            actualizarInterfazSoluciones(unidadIndex);
        }

        // FunciÃ³n para actualizar la interfaz de soluciones
        function actualizarInterfazSoluciones(unidadIndex) {
            console.log(`ðŸ”„ DEBUG: Actualizando interfaz de soluciones para unidad ${unidadIndex + 1}`);
            
            const vehiculo = cotizacionData.vehiculos[unidadIndex];
            console.log(`ðŸ“‹ DEBUG: Soluciones actuales para unidad ${unidadIndex + 1}:`, vehiculo.soluciones.map(s => s.tipo_solucion));
            
            // Buscar el contenedor de soluciones para esta unidad
            const contenedorSoluciones = document.querySelector(`.soluciones-unidad-container-${unidadIndex + 1}`);
            if (!contenedorSoluciones) {
                console.log(`âš ï¸ DEBUG: No se encontrÃ³ contenedor de soluciones para unidad ${unidadIndex + 1}`);
                return;
            }
            
            // Verificar si hay soluciones que no tienen HTML en el DOM
            const solucionesExistentes = contenedorSoluciones.querySelectorAll('.card');
            const solucionesEnDOM = solucionesExistentes.length;
            const solucionesEnDatos = vehiculo.soluciones.length;
            
            console.log(`ðŸ” DEBUG: Soluciones en DOM: ${solucionesEnDOM}, Soluciones en datos: ${solucionesEnDatos}`);
            console.log(`ðŸ” DEBUG: Configuraciones antes de actualizar:`, vehiculo.soluciones[0]?.configuraciones);
            
            // Solo crear soluciones faltantes, NO regenerar las existentes
            if (solucionesEnDatos > solucionesEnDOM) {
                console.log(`ðŸ”§ DEBUG: Creando ${solucionesEnDatos - solucionesEnDOM} soluciones faltantes`);
                
                for (let i = solucionesEnDOM; i < solucionesEnDatos; i++) {
                    const solucion = vehiculo.soluciones[i];
                    const solucionId = `wizard_unidad_${unidadIndex + 1}_solucion_${i + 1}`;
                    
                    let htmlSolucion = '';
                    
                    if (solucion.tipo_solucion === 'Insider') {
                        // HTML especÃ­fico para soluciÃ³n Insider
                        htmlSolucion = `
                            <div class="card mb-3" id="solucion_${unidadIndex + 1}_${i + 1}">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0">SoluciÃ³n ${i + 1}</h6>
                                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarSolucion(${unidadIndex}, ${i})">
                                        <i class="bi bi-trash"></i> Eliminar
                                    </button>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <label class="form-label">Tipo de SoluciÃ³n:</label>
                                            <select class="form-select" id="${solucionId}_tipo" disabled>
                                                <option value="Insider" selected>Insider</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="alert alert-info mt-3">
                                        <i class="bi bi-info-circle me-2"></i>
                                        <strong>MÃ³dulo Insider:</strong> Proporciona entradas y salidas adicionales para resolver conflictos de capacidades del GPS.
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        // HTML para otras soluciones
                        htmlSolucion = `
                            <div class="card mb-3" id="solucion_${unidadIndex + 1}_${i + 1}">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0">SoluciÃ³n ${i + 1}</h6>
                                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarSolucion(${unidadIndex}, ${i})">
                                        <i class="bi bi-trash"></i> Eliminar
                                    </button>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <label class="form-label">Tipo de SoluciÃ³n:</label>
                                            <select class="form-select" id="${solucionId}_tipo" disabled>
                                                <option value="${solucion.tipo_solucion}" selected>${solucion.tipo_solucion}</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                    
                    contenedorSoluciones.insertAdjacentHTML('beforeend', htmlSolucion);
                    console.log(`âœ… DEBUG: SoluciÃ³n ${i + 1} (${solucion.tipo_solucion}) agregada al DOM`);
                }
            }
            
            // Actualizar los valores de todas las soluciones
            vehiculo.soluciones.forEach((solucion, solucionIndex) => {
                if (solucion.configuraciones && Object.keys(solucion.configuraciones).length > 0) {
                    const solucionId = `wizard_unidad_${unidadIndex + 1}_solucion_${solucionIndex + 1}`;
                    
                    console.log(`ðŸ”§ DEBUG: Aplicando configuraciones para ${solucionId}:`, solucion.configuraciones);
                    
                    // Aplicar cada configuraciÃ³n
                    Object.keys(solucion.configuraciones).forEach(configKey => {
                        const configValue = solucion.configuraciones[configKey];
                        
                        // Buscar el elemento por nombre
                        const elemento = contenedorSoluciones.querySelector(`[name="${solucionId}_${configKey}"]`);
                        if (elemento) {
                            if (elemento.type === 'checkbox') {
                                elemento.checked = !!configValue;
                            } else if (elemento.type === 'radio') {
                                elemento.checked = elemento.value === configValue;
                            } else if (elemento.tagName === 'SELECT') {
                                elemento.value = configValue;
                            } else {
                                elemento.value = configValue;
                            }
                            console.log(`âœ… DEBUG: Aplicado ${configKey} = ${configValue}`);
                        } else {
                            console.log(`âš ï¸ DEBUG: No se encontrÃ³ elemento para ${configKey}`);
                        }
                    });
                }
                
                // Aplicar estado del mÃ³dulo Insider
                const solucionId = `wizard_unidad_${unidadIndex + 1}_solucion_${solucionIndex + 1}`;
                const moduloInsiderElement = document.getElementById(`${solucionId}_modulo_insider`);
                if (moduloInsiderElement) {
                    moduloInsiderElement.checked = solucion.configuraciones.modulo_insider || false;
                }
            });
            
            console.log(`âœ… DEBUG: Interfaz de soluciones actualizada para unidad ${unidadIndex + 1}`);
        }

        // FunciÃ³n para mapear configuraciones de rastreo a funciones de telemetrÃ­a
        function mapearConfiguracionAFuncion(configKey) {
            const mapeoConfiguraciones = {
                // SOS
                'sos_simple': 'SOS simple',
                'sos_llamada': 'SOS llamada', 
                'sos_bloqueo': 'SOS Bloqueo',
                
                // Bloqueos
                'bloqueo_normal': 'Bloqueo normal',
                'bloqueo_cc': 'Bloqueo CC',
                'bloqueo_gradual': 'Bloqueo normal', // Se mapea a bloqueo normal
                'bloqueo_cortacorriente': 'Bloqueo CC',
                
                // Sensores
                'sensores_juntos': 'Sensores juntos',
                'sensores_independientes': 'Sensores independientes',
                'sensores_y_bloqueo': 'Sensores y bloqueo',
                'sensar_puertas': 'sensor caja',
                
                // Audio
                'audio_bidireccional': 'Audio bidireccional',
                'audio_espia': 'Audio espÃ­a',
                'audio_en_cabina': 'Audio bidireccional', // Se mapea a bidireccional
                
                // Habilitado en cabina
                'habilitado_en_cabina': 'habilitado',
                'teclado_sencillo': 'habilitado',
                'teclado_dinamico': 'habilitado'
            };
            
            return mapeoConfiguraciones[configKey] || null;
        }

        // FunciÃ³n para generar insumos sugeridos basados en las unidades y soluciones seleccionadas
        let generandoInsumos = false; // Flag para evitar ejecuciones mÃºltiples
        let ultimaGeneracion = 0; // Timestamp de la Ãºltima generaciÃ³n
        
        // FunciÃ³n para detectar servicios necesarios segÃºn las soluciones
        function detectarServiciosNecesarios(vehiculos) {
            const serviciosNecesarios = [];
            
            vehiculos.forEach((vehiculo, unidadIndex) => {
                if (vehiculo.soluciones && vehiculo.soluciones.length > 0) {
                    vehiculo.soluciones.forEach(solucion => {
                        const tipoSolucion = solucion.tipo_solucion;
                        const configuraciones = solucion.configuraciones || {};
                        
                        // Detectar servicios segÃºn las soluciones y configuraciones
                        if (configuraciones.hosting) {
                            // Servicios que requieren hosting
                            if (tipoSolucion === 'VPC' || tipoSolucion === 'Dashcam' || 
                                tipoSolucion === 'Encadenamiento de seÃ±ales' || tipoSolucion === 'Sideview' ||
                                tipoSolucion === 'MDVR 4 Ch' || tipoSolucion === 'MDVR 8 Ch') {
                                serviciosNecesarios.push({
                                    nombre: 'Datos video',
                                    periodicidad: 'mensual',
                                    cantidad: 1,
                                    unidad: unidadIndex + 1,
                                    solucion: tipoSolucion
                                });
                            } else if (tipoSolucion === 'Rastreo basico' || tipoSolucion === 'Rastreo avanzado') {
                                serviciosNecesarios.push({
                                    nombre: 'Datos rastreo basico',
                                    periodicidad: 'mensual',
                                    cantidad: 1,
                                    unidad: unidadIndex + 1,
                                    solucion: tipoSolucion
                                });
                            } else if (tipoSolucion === 'Rastreo satelital') {
                                serviciosNecesarios.push({
                                    nombre: 'Datos - Satelitales',
                                    periodicidad: 'anual',
                                    cantidad: 1,
                                    unidad: unidadIndex + 1,
                                    solucion: tipoSolucion
                                });
                                serviciosNecesarios.push({
                                    nombre: 'ActivaciÃ³n satelital',
                                    periodicidad: 'anual',
                                    cantidad: 1,
                                    unidad: unidadIndex + 1,
                                    solucion: tipoSolucion
                                });
                            }
                        }
                        
                        // Detectar servicios de voz
                        if (configuraciones.audio_bidireccional || configuraciones.audio_espia || 
                            configuraciones.sos_llamada) {
                            serviciosNecesarios.push({
                                nombre: 'Datos - Voz',
                                periodicidad: 'mensual',
                                cantidad: 1,
                                unidad: unidadIndex + 1,
                                solucion: tipoSolucion
                            });
                        }
                        
                        // Detectar servicios de rastreo avanzado
                        if (tipoSolucion === 'Rastreo avanzado' && configuraciones.hosting) {
                            // Reemplazar el servicio bÃ¡sico con el avanzado
                            const index = serviciosNecesarios.findIndex(s => 
                                s.nombre === 'Datos rastreo basico' && s.unidad === unidadIndex + 1
                            );
                            if (index !== -1) {
                                serviciosNecesarios[index].nombre = 'Datos rastreo avanzado';
                            }
                        }
                    });
                }
            });
            
            return serviciosNecesarios;
        }
        
        // FunciÃ³n para detectar SIMs necesarias segÃºn los servicios
        function detectarSIMsNecesarias(vehiculos) {
            const simsNecesarias = [];
            
            vehiculos.forEach((vehiculo, unidadIndex) => {
                if (vehiculo.soluciones && vehiculo.soluciones.length > 0) {
                    let tieneVideo = false;
                    let tieneVoz = false;
                    let tieneRastreo = false;
                    
                    vehiculo.soluciones.forEach(solucion => {
                        const tipoSolucion = solucion.tipo_solucion;
                        const configuraciones = solucion.configuraciones || {};
                        
                        if (configuraciones.hosting) {
                            if (tipoSolucion === 'VPC' || tipoSolucion === 'Dashcam' || 
                                tipoSolucion === 'Encadenamiento de seÃ±ales' || tipoSolucion === 'Sideview' ||
                                tipoSolucion === 'MDVR 4 Ch' || tipoSolucion === 'MDVR 8 Ch') {
                                tieneVideo = true;
                            } else if (tipoSolucion === 'Rastreo basico' || tipoSolucion === 'Rastreo avanzado') {
                                tieneRastreo = true;
                            }
                        }
                        
                        if (configuraciones.audio_bidireccional || configuraciones.audio_espia || 
                            configuraciones.sos_llamada) {
                            tieneVoz = true;
                        }
                    });
                    
                    // Agregar SIMs segÃºn los servicios detectados con lÃ³gica de prioridad
                    if (tieneVideo) {
                        simsNecesarias.push({
                            nombre: 'SIM video',
                            cantidad: 1,
                            unidad: unidadIndex + 1,
                            razon: 'Servicio de video'
                        });
                    }
                    
                    if (tieneVoz) {
                        simsNecesarias.push({
                            nombre: 'SIM voz',
                            cantidad: 1,
                            unidad: unidadIndex + 1,
                            razon: 'Servicio de voz y datos (cubre ambos)'
                        });
                    } else if (tieneRastreo) {
                        // Solo agregar SIM 5 Mb si NO hay SIM voz, ya que SIM voz cubre datos tambiÃ©n
                        simsNecesarias.push({
                            nombre: 'SIM 5 Mb',
                            cantidad: 1,
                            unidad: unidadIndex + 1,
                            razon: 'Servicio de rastreo (solo datos)'
                        });
                    }
                }
            });
            
            return simsNecesarias;
        }
        
        async function generarInsumosSugeridos() {
            console.log('ðŸ”„ DEBUG: Iniciando generarInsumosSugeridos()...');
            const container = document.getElementById('insumosSugeridosContainer');
            if (!container) {
                console.log('âŒ DEBUG: Container insumosSugeridosContainer no encontrado');
                return;
            }
            
            const ahora = Date.now();
            
            if (generandoInsumos) {
                console.log('â³ Ya se estÃ¡n generando insumos, saltando...');
                return;
            }
            
            // Evitar generaciones muy frecuentes (menos de 2 segundos)
            if (ahora - ultimaGeneracion < 2000) {
                console.log('â³ GeneraciÃ³n muy reciente, saltando...');
                return;
            }
            
            generandoInsumos = true;
            ultimaGeneracion = ahora;
            console.log('Generando insumos sugeridos...');
            
            // Asegurar que el almacÃ©n estÃ© cargado desde Supabase
            if (modoCentralizado) {
                await cargarAlmacenDesdeSupabase();
                // TambiÃ©n recargar funciones de rastreo
                await cargarFuncionesRastreo();
            }
            
            // Obtener datos actuales (sin guardar - para evitar sobrescribir estado)
            const vehiculos = cotizacionData.vehiculos || [];
            console.log(`ðŸ” DEBUG: cotizacionData.vehiculos en generarInsumosSugeridos:`, cotizacionData.vehiculos);
            console.log(`ðŸ” DEBUG: vehiculos.length:`, vehiculos.length);
            let todosLosInsumos = {};
            
            // Generar equipos automÃ¡ticos
            const equiposAutomaticos = generarEquiposAutomaticos(vehiculos);
            
            // Agregar equipos automÃ¡ticos a la lista de insumos
            Object.values(equiposAutomaticos).forEach(equipo => {
                todosLosInsumos[equipo.nombre] = {
                    nombre: equipo.nombre,
                    cantidad: equipo.cantidad,
                    unidades: equipo.unidades,
                    sugerido: true,
                    categoria: equipo.categoria || 'equipos' // Usar la categorÃ­a definida en el equipo
                };
            });

            // Procesar cada unidad y sus soluciones
            vehiculos.forEach((vehiculo, unidadIndex) => {
                const tipoUnidad = vehiculo.tipo || 'Tracto'; // Default a Tracto si no hay tipo
                
                // Accesorios Ãºnicos por unidad (evitar duplicados por mÃºltiples soluciones en la misma unidad)
                let accesoriosUnicosEnUnidad = {};
                
                if (vehiculo.soluciones && vehiculo.soluciones.length > 0) {
                    vehiculo.soluciones.forEach(solucion => {
                        const tipoSolucion = solucion.tipo_solucion;
                        const insumosSugeridos = obtenerInsumosSugeridos(tipoUnidad, tipoSolucion);

                        // Ajustes por reglas de negocio
                        let insumosAjustados = Array.isArray(insumosSugeridos) ? [...insumosSugeridos] : [];

                        // 0) Dashcam: limpiar variantes del almacÃ©n (AD2/C6) para no duplicar
                        if (tipoSolucion === 'Dashcam') {
                            insumosAjustados = insumosAjustados.filter(i => i.nombre !== 'Dashcam ad2' && i.nombre !== 'Dashcam c6');
                        }

                        // 1) Memoria seleccionada en Dashcam
                        if (tipoSolucion === 'Dashcam') {
                            const memoriaSel = solucion.configuraciones?.memoria;
                            if (memoriaSel === '128' || memoriaSel === '256' || memoriaSel === '512') {
                                insumosAjustados = insumosAjustados.filter(i => i.nombre !== 'SD 128 Gb' && i.nombre !== 'SD 256 Gb' && i.nombre !== 'SD 512 Gb');
                                insumosAjustados.push({ nombre: `SD ${memoriaSel} Gb`, cantidad: 1, sugerido: true });
                            }
                        }

                        // 2) Silicon solo para cÃ¡maras laterales y encadenamiento
                        const permitirSilicon = (
                            tipoSolucion === 'Sideview' ||
                            (tipoSolucion && tipoSolucion.toLowerCase().startsWith('encadenamiento')) ||
                            (tipoSolucion === 'VPC' && (solucion.configuraciones?.camara_izquierda === true || solucion.configuraciones?.camara_derecha === true || solucion.configuraciones?.encadenamiento === true))
                        );
                        if (!permitirSilicon) {
                            insumosAjustados = insumosAjustados.filter(i => i.nombre !== 'Silicon');
                        }

                        // Consolidar insumos bÃ¡sicos (sumar cantidades si se repiten)
                        insumosAjustados.forEach(insumo => {
                            const key = insumo.nombre;
                            const categoria = obtenerCategoriaInsumo(insumo.nombre);
                            
                            // Para accesorios, verificar si ya se agregÃ³ en esta unidad
                            if (categoria === 'accesorios') {
                                if (accesoriosUnicosEnUnidad[key]) {
                                    // Ya se agregÃ³ este accesorio en esta unidad, no duplicar
                                    return;
                                } else {
                                    // Marcar como agregado en esta unidad
                                    accesoriosUnicosEnUnidad[key] = true;
                                }
                            }
                            
                            if (todosLosInsumos[key]) {
                                // Si ya existe, sumar cantidades (convertir a nÃºmero si es posible)
                                const cantidadAnterior = parseFloat(todosLosInsumos[key].cantidad) || 0;
                                const cantidadNueva = parseFloat(insumo.cantidad) || 0;
                                
                                if (!isNaN(cantidadAnterior) && !isNaN(cantidadNueva)) {
                                    todosLosInsumos[key].cantidad = cantidadAnterior + cantidadNueva;
                                } else {
                                    // Si no se pueden convertir a nÃºmeros, mantener como string
                                    todosLosInsumos[key].cantidad = `${todosLosInsumos[key].cantidad} + ${insumo.cantidad}`;
                                }
                                todosLosInsumos[key].unidades.push(`Unidad ${unidadIndex + 1} (${tipoSolucion})`);
                            } else {
                                todosLosInsumos[key] = {
                                    nombre: insumo.nombre,
                                    cantidad: insumo.cantidad,
                                    unidades: [`Unidad ${unidadIndex + 1} (${tipoSolucion})`],
                                    sugerido: true,
                                    categoria: categoria
                                };
                            }
                        });

                        // Procesar accesorios de telemetrÃ­a para soluciones de rastreo
                        if (['Rastreo basico', 'Rastreo avanzado', 'Rastreo satelital'].includes(tipoSolucion)) {
                            const funcionesSeleccionadas = [];
                            
                            // Extraer funciones seleccionadas de las configuraciones
                            if (solucion.configuraciones) {
                                Object.keys(solucion.configuraciones).forEach(configKey => {
                                    const configValue = solucion.configuraciones[configKey];
                                    
                                    // Mapear configuraciones a funciones de telemetrÃ­a
                                    if (configValue === true || configValue === 'true') {
                                        const funcionTelemetria = mapearConfiguracionAFuncion(configKey);
                                        if (funcionTelemetria) {
                                            funcionesSeleccionadas.push(funcionTelemetria);
                                        }
                                    }
                                });
                            }

                            // Obtener accesorios de telemetrÃ­a
                            if (funcionesSeleccionadas.length > 0) {
                                const accesoriosTelemetria = obtenerAccesoriosTelemetria(funcionesSeleccionadas);
                                
                                // Agregar accesorios de telemetrÃ­a a la lista de insumos
                                accesoriosTelemetria.forEach(accesorio => {
                                    const key = accesorio.nombre;
                                    if (todosLosInsumos[key]) {
                                        // LÃ³gica especial para relevador (mÃ¡ximo 1 por unidad)
                                        if (accesorio.nombre === 'Relevador') {
                                            todosLosInsumos[key].cantidad = 1;
                                        } else {
                                            todosLosInsumos[key].cantidad = parseFloat(todosLosInsumos[key].cantidad) + accesorio.cantidad;
                                        }
                                        todosLosInsumos[key].unidades.push(`Unidad ${unidadIndex + 1} (${tipoSolucion} - TelemetrÃ­a)`);
                                    } else {
                                        todosLosInsumos[key] = {
                                            nombre: accesorio.nombre,
                                            cantidad: accesorio.cantidad,
                                            unidades: [`Unidad ${unidadIndex + 1} (${tipoSolucion} - TelemetrÃ­a)`],
                                            sugerido: true,
                                            deTelemetria: true,
                                            categoria: obtenerCategoriaInsumo(accesorio.nombre)
                                        };
                                    }
                                });
                            }
                        }
                        
                        // Procesar insumos para soluciones compatibles de VPC
                        console.log(`ðŸ” DEBUG: Verificando compatibles para soluciÃ³n: ${tipoSolucion}`);
                        console.log(`ðŸ” DEBUG: Configuraciones:`, solucion.configuraciones);
                        
                        if (tipoSolucion === 'VPC' && solucion.configuraciones) {
                            console.log(`âœ… DEBUG: Procesando compatibles de VPC para Unidad ${unidadIndex + 1}`);
                            const configs = solucion.configuraciones;
                            console.log(`ðŸ”‘ DEBUG: Claves disponibles en configuraciones:`, Object.keys(configs));
                            const solucionesCompatibles = [];
                            
                            // Identificar soluciones compatibles seleccionadas con configuraciones especÃ­ficas
                            if (configs.sensor_vpc === true) {
                                // Procesar sensores VPC con lados especÃ­ficos
                                const sensorCantidad = parseInt(configs.sensor_cantidad) || 1;
                                if (configs.sensor_izquierda === true) {
                                    solucionesCompatibles.push({
                                        nombre: 'Sensor VPC izquierdo',
                                        cantidad: sensorCantidad
                                    });
                                    console.log(`âœ… DEBUG: Sensor VPC izquierdo x${sensorCantidad}`);
                                }
                                if (configs.sensor_derecha === true) {
                                    solucionesCompatibles.push({
                                        nombre: 'Sensor VPC derecho',
                                        cantidad: sensorCantidad
                                    });
                                    console.log(`âœ… DEBUG: Sensor VPC derecho x${sensorCantidad}`);
                                }
                            }
                            
                            // Reglas: Silicon solo si hay cÃ¡maras laterales o encadenamiento
                            if ((configs.camara_izquierda === true || configs.camara_derecha === true) || configs.encadenamiento === true) {
                                const keySilicon = 'Silicon';
                                const cantidadSilicon = '1/10';
                                if (!todosLosInsumos[keySilicon]) {
                                    todosLosInsumos[keySilicon] = {
                                        nombre: keySilicon,
                                        cantidad: cantidadSilicon,
                                        unidades: [`Unidad ${unidadIndex + 1} (${tipoSolucion} - Requisito instalaciÃ³n cÃ¡maras/encadenamiento)`],
                                        sugerido: true,
                                        categoria: obtenerCategoriaInsumo(keySilicon)
                                    };
                                }
                            }

                            if (configs.alarma_parlante_estandar === true) {
                                const alarmaCantidad = parseInt(configs.alarma_cantidad) || 1;
                                solucionesCompatibles.push({
                                    nombre: 'Alarma parlante estandar',
                                    cantidad: alarmaCantidad
                                });
                                console.log(`âœ… DEBUG: Alarma parlante x${alarmaCantidad}`);
                            }
                            
                            if (configs.led_giro === true) {
                                // Procesar leds de giro con lados especÃ­ficos
                                const ledCantidad = parseInt(configs.led_cantidad) || 1;
                                if (configs.led_izquierda === true) {
                                    solucionesCompatibles.push({
                                        nombre: 'Led de giro izquierdo',
                                        cantidad: ledCantidad
                                    });
                                    console.log(`âœ… DEBUG: Led de giro izquierdo x${ledCantidad}`);
                                }
                                if (configs.led_derecha === true) {
                                    solucionesCompatibles.push({
                                        nombre: 'Led de giro derecho',
                                        cantidad: ledCantidad
                                    });
                                    console.log(`âœ… DEBUG: Led de giro derecho x${ledCantidad}`);
                                }
                            }
                            
                            if (configs.encadenamiento === true) {
                                // Para encadenamiento, usar el tipo especÃ­fico
                                const tipoEncadenamiento = configs.tipo_encadenamiento || 'sencillo';
                                solucionesCompatibles.push({
                                    nombre: `Encadenamiento ${tipoEncadenamiento}`,
                                    cantidad: 1
                                });
                                console.log(`âœ… DEBUG: Encadenamiento ${tipoEncadenamiento} detectado`);
                            }
                            
                            console.log(`ðŸ“‹ DEBUG: Soluciones compatibles encontradas:`, solucionesCompatibles);
                            
                            // Buscar insumos para cada soluciÃ³n compatible
                            solucionesCompatibles.forEach(solucionCompatible => {
                                const nombreSolucion = solucionCompatible.nombre;
                                const cantidadSolucion = solucionCompatible.cantidad;
                                
                                console.log(`ðŸ” DEBUG: Buscando insumos para: ${nombreSolucion} x${cantidadSolucion}`);
                                const insumosCompatible = obtenerInsumosSugeridos(tipoUnidad, nombreSolucion);
                                console.log(`ðŸ“¦ DEBUG: Insumos encontrados:`, insumosCompatible.length);
                                
                                if (insumosCompatible && insumosCompatible.length > 0) {
                                    insumosCompatible.forEach(insumo => {
                                        const key = insumo.nombre;
                                        const categoria = obtenerCategoriaInsumo(insumo.nombre);
                                        
                                        // Multiplicar la cantidad del insumo por la cantidad de la soluciÃ³n
                                        // Manejar valores fraccionarios como strings
                                        let cantidadInsumo = insumo.cantidad;
                                        let cantidadFinal;
                                        if (typeof cantidadInsumo === 'string' && cantidadInsumo.includes('/')) {
                                            // Para valores como '1/2', '1/10', mantener como string
                                            cantidadFinal = cantidadInsumo;
                                        } else {
                                            // Para valores numÃ©ricos, multiplicar
                                            cantidadFinal = parseFloat(cantidadInsumo) * cantidadSolucion;
                                        }
                                        
                                        console.log(`âž• DEBUG: Agregando: ${insumo.nombre} (${categoria}) x${cantidadFinal}`);
                                        
                                        // Para accesorios, verificar si ya se agregÃ³ en esta unidad
                                        if (categoria === 'accesorios') {
                                            if (accesoriosUnicosEnUnidad[key]) {
                                                // Ya se agregÃ³ este accesorio en esta unidad, no duplicar
                                                console.log(`âš ï¸ DEBUG: Accesorio ya agregado: ${key}`);
                                                return;
                                            } else {
                                                // Marcar como agregado en esta unidad
                                                accesoriosUnicosEnUnidad[key] = true;
                                            }
                                        }
                                        
                                        if (todosLosInsumos[key]) {
                                            // Si ya existe, sumar cantidades
                                            if (typeof cantidadFinal === 'string' && cantidadFinal.includes('/')) {
                                                // Para valores fraccionarios, mantener el string
                                                todosLosInsumos[key].cantidad = cantidadFinal;
                                            } else {
                                                // Para valores numÃ©ricos, sumar
                                                todosLosInsumos[key].cantidad += cantidadFinal;
                                            }
                                            todosLosInsumos[key].unidades.push(`Unidad ${unidadIndex + 1} (VPC - ${nombreSolucion} x${cantidadSolucion})`);
                                            console.log(`ðŸ“Š DEBUG: Sumando: ${key} = ${todosLosInsumos[key].cantidad}`);
                                        } else {
                                            // Crear nuevo insumo
                                            todosLosInsumos[key] = {
                                                nombre: insumo.nombre,
                                                cantidad: cantidadFinal,
                                                unidades: [`Unidad ${unidadIndex + 1} (VPC - ${nombreSolucion} x${cantidadSolucion})`],
                                                sugerido: true,
                                                categoria: categoria
                                            };
                                            console.log(`âœ¨ DEBUG: Nuevo insumo: ${key} = ${cantidadFinal}`);
                                        }
                                    });
                                }
                            });
                        } else if (tipoSolucion === 'Sideview' && solucion.configuraciones) {
                            console.log(`âœ… DEBUG: Procesando compatibles de Sideview para Unidad ${unidadIndex + 1}`);
                            const configs = solucion.configuraciones;
                            console.log(`ðŸ”‘ DEBUG: Claves disponibles en configuraciones:`, Object.keys(configs));
                            const solucionesCompatibles = [];
                            
                            // Para Sideview, procesar lados especÃ­ficos
                            if (configs.izquierdo === true) {
                                solucionesCompatibles.push({
                                    nombre: 'Sideview izquierdo',
                                    cantidad: 1
                                });
                                console.log(`âœ… DEBUG: Sideview izquierdo detectado`);
                            }
                            if (configs.derecho === true) {
                                solucionesCompatibles.push({
                                    nombre: 'Sideview derecho',
                                    cantidad: 1
                                });
                                console.log(`âœ… DEBUG: Sideview derecho detectado`);
                            }
                            
                            console.log(`ðŸ“‹ DEBUG: Soluciones compatibles encontradas:`, solucionesCompatibles);
                            
                            // Buscar insumos para cada soluciÃ³n compatible
                            solucionesCompatibles.forEach(solucionCompatible => {
                                const nombreSolucion = solucionCompatible.nombre;
                                const cantidadSolucion = solucionCompatible.cantidad;
                                
                                console.log(`ðŸ” DEBUG: Buscando insumos para: ${nombreSolucion} x${cantidadSolucion}`);
                                const insumosCompatible = obtenerInsumosSugeridos(tipoUnidad, nombreSolucion);
                                console.log(`ðŸ“¦ DEBUG: Insumos encontrados:`, insumosCompatible.length);
                                
                                if (insumosCompatible && insumosCompatible.length > 0) {
                                    insumosCompatible.forEach(insumo => {
                                        const key = insumo.nombre;
                                        const categoria = obtenerCategoriaInsumo(insumo.nombre);
                                        
                                        // Multiplicar la cantidad del insumo por la cantidad de la soluciÃ³n
                                        let cantidadInsumo = insumo.cantidad;
                                        let cantidadFinal;
                                        if (typeof cantidadInsumo === 'string' && cantidadInsumo.includes('/')) {
                                            cantidadFinal = cantidadInsumo;
                                        } else {
                                            cantidadFinal = parseFloat(cantidadInsumo) * cantidadSolucion;
                                        }
                                        
                                        console.log(`âž• DEBUG: Agregando: ${insumo.nombre} (${categoria}) x${cantidadFinal}`);
                                        
                                        // Para accesorios, verificar si ya se agregÃ³ en esta unidad
                                        if (categoria === 'accesorios') {
                                            if (accesoriosUnicosEnUnidad[key]) {
                                                console.log(`âš ï¸ DEBUG: Accesorio ya agregado: ${key}`);
                                                return;
                                            } else {
                                                accesoriosUnicosEnUnidad[key] = true;
                                            }
                                        }
                                        
                                        if (todosLosInsumos[key]) {
                                            if (typeof cantidadFinal === 'string' && cantidadFinal.includes('/')) {
                                                todosLosInsumos[key].cantidad = cantidadFinal;
                                            } else {
                                                todosLosInsumos[key].cantidad += cantidadFinal;
                                            }
                                            todosLosInsumos[key].unidades.push(`Unidad ${unidadIndex + 1} (Sideview - ${nombreSolucion} x${cantidadSolucion})`);
                                            console.log(`ðŸ“Š DEBUG: Sumando: ${key} = ${todosLosInsumos[key].cantidad}`);
                                        } else {
                                            todosLosInsumos[key] = {
                                                nombre: insumo.nombre,
                                                cantidad: cantidadFinal,
                                                unidades: [`Unidad ${unidadIndex + 1} (Sideview - ${nombreSolucion} x${cantidadSolucion})`],
                                                sugerido: true,
                                                categoria: categoria
                                            };
                                            console.log(`âœ¨ DEBUG: Nuevo insumo: ${key} = ${cantidadFinal}`);
                                        }
                                    });
                                }
                            });

                            // Regla: Silicon para Sideview (cÃ¡maras laterales)
                            const keySiliconSV = 'Silicon';
                            const cantidadSiliconSV = '1/10';
                            if (!todosLosInsumos[keySiliconSV]) {
                                todosLosInsumos[keySiliconSV] = {
                                    nombre: keySiliconSV,
                                    cantidad: cantidadSiliconSV,
                                    unidades: [`Unidad ${unidadIndex + 1} (Sideview - CÃ¡maras laterales)`],
                                    sugerido: true,
                                    categoria: obtenerCategoriaInsumo(keySiliconSV)
                                };
                            }
                        } else if (tipoSolucion === 'Rastreo avanzado' && solucion.configuraciones) {
                            console.log(`âœ… DEBUG: Procesando compatibles de Rastreo avanzado para Unidad ${unidadIndex + 1}`);
                            const configs = solucion.configuraciones;
                            console.log(`ðŸ”‘ DEBUG: Claves disponibles en configuraciones:`, Object.keys(configs));
                            const solucionesCompatibles = [];
                            
                            // Obtener cantidad de botones configurada
                            const cantidadBotones = configs.cantidad_botones || 1;
                            console.log(`ðŸ”¢ DEBUG: Cantidad de botones configurada: ${cantidadBotones}`);
                            
                            // Procesar funcionalidades de rastreo
                            if (configs.sos_simple === true) {
                                solucionesCompatibles.push({
                                    nombre: 'SOS simple',
                                    cantidad: cantidadBotones
                                });
                                console.log(`âœ… DEBUG: SOS simple detectado x${cantidadBotones}`);
                            }
                            if (configs.sos_llamada === true) {
                                solucionesCompatibles.push({
                                    nombre: 'SOS llamada',
                                    cantidad: cantidadBotones
                                });
                                console.log(`âœ… DEBUG: SOS llamada detectado x${cantidadBotones}`);
                            }
                            if (configs.sos_bloqueo === true) {
                                solucionesCompatibles.push({
                                    nombre: 'SOS Bloqueo',
                                    cantidad: 1
                                });
                                console.log(`âœ… DEBUG: SOS Bloqueo detectado`);
                            }
                            
                            // Verificar si hay algÃºn tipo de bloqueo para agregar relevador
                            let tieneBloqueo = false;
                            if (configs.bloqueo_normal === true) {
                                solucionesCompatibles.push({
                                    nombre: 'Bloqueo normal',
                                    cantidad: 1
                                });
                                console.log(`âœ… DEBUG: Bloqueo normal detectado`);
                                tieneBloqueo = true;
                            }
                            if (configs.bloqueo_gradual === true) {
                                solucionesCompatibles.push({
                                    nombre: 'Bloqueo gradual',
                                    cantidad: 1
                                });
                                console.log(`âœ… DEBUG: Bloqueo gradual detectado`);
                                tieneBloqueo = true;
                            }
                            if (configs.bloqueo_cortacorriente === true) {
                                solucionesCompatibles.push({
                                    nombre: 'Bloqueo cortacorriente',
                                    cantidad: 1
                                });
                                console.log(`âœ… DEBUG: Bloqueo cortacorriente detectado`);
                                tieneBloqueo = true;
                            }
                            if (configs.bloqueo_cc === true) {
                                solucionesCompatibles.push({
                                    nombre: 'Bloqueo CC',
                                    cantidad: 1
                                });
                                console.log(`âœ… DEBUG: Bloqueo CC detectado`);
                                tieneBloqueo = true;
                            }
                            
                            // Procesar sensores
                            if (configs.sensores_puertas === 'juntos') {
                                solucionesCompatibles.push({
                                    nombre: 'Sensores juntos',
                                    cantidad: 1
                                });
                                console.log(`âœ… DEBUG: Sensores juntos detectado`);
                            } else if (configs.sensores_puertas === 'independientes') {
                                solucionesCompatibles.push({
                                    nombre: 'Sensores independientes',
                                    cantidad: 1
                                });
                                console.log(`âœ… DEBUG: Sensores independientes detectado`);
                            }
                            
                            // Procesar audio
                            if (configs.audio_cabina === 'bidireccional') {
                                solucionesCompatibles.push({
                                    nombre: 'Audio bidireccional',
                                    cantidad: 1
                                });
                                console.log(`âœ… DEBUG: Audio bidireccional detectado`);
                            } else if (configs.audio_cabina === 'espia') {
                                solucionesCompatibles.push({
                                    nombre: 'Audio espÃ­a',
                                    cantidad: 1
                                });
                                console.log(`âœ… DEBUG: Audio espÃ­a detectado`);
                            }
                            
                            // Procesar sensor de caja
                            if (configs.sensor_caja === true) {
                                solucionesCompatibles.push({
                                    nombre: 'sensor caja',
                                    cantidad: 1
                                });
                                console.log(`âœ… DEBUG: Sensor caja detectado`);
                            }
                            
                            // Procesar teclado
                            if (configs.teclado === 'sencillo') {
                                solucionesCompatibles.push({
                                    nombre: 'teclado_sencillo',
                                    cantidad: 1
                                });
                                console.log(`âœ… DEBUG: Teclado sencillo detectado`);
                            } else if (configs.teclado === 'dinamico') {
                                solucionesCompatibles.push({
                                    nombre: 'teclado_dinamico',
                                    cantidad: 1
                                });
                                console.log(`âœ… DEBUG: Teclado dinÃ¡mico detectado`);
                            }
                            
                            console.log(`ðŸ“‹ DEBUG: Soluciones compatibles encontradas:`, solucionesCompatibles);
                            
                            // Agregar botÃ³n membrana basado en la cantidad configurada
                            if (cantidadBotones > 0) {
                                const key = 'Boton membrana';
                                const categoria = 'accesorios';
                                
                                console.log(`ðŸ”˜ DEBUG: Agregando botÃ³n membrana x${cantidadBotones} por unidad`);
                                
                                if (todosLosInsumos[key]) {
                                    // Los botones se multiplican por unidad, no se suman
                                    todosLosInsumos[key].cantidad = cantidadBotones; // Se multiplicarÃ¡ despuÃ©s por cantidadUnidades
                                    todosLosInsumos[key].unidades = [`Unidad ${unidadIndex + 1} (Rastreo - Botones x${cantidadBotones})`];
                                    console.log(`ðŸ“Š DEBUG: Configurando: ${key} = ${cantidadBotones} por unidad`);
                                } else {
                                    todosLosInsumos[key] = {
                                        nombre: 'Boton membrana',
                                        cantidad: cantidadBotones, // Se multiplicarÃ¡ despuÃ©s por cantidadUnidades
                                        unidades: [`Unidad ${unidadIndex + 1} (Rastreo - Botones x${cantidadBotones})`],
                                        sugerido: true,
                                        categoria: categoria
                                    };
                                    console.log(`âœ¨ DEBUG: Nuevo insumo: ${key} = ${cantidadBotones} por unidad`);
                                }
                            }
                            
                            // Agregar relevador si hay algÃºn tipo de bloqueo (1 por unidad)
                            if (tieneBloqueo) {
                                // Obtener voltaje de la unidad actual
                                const voltaje = vehiculo.voltaje || '12v'; // Default a 12v si no se especifica
                                const keyRelevador = voltaje === '24v' ? 'Relevador 24v' : 'Relevador 12v';
                                const keyPortarelevador = 'Portarelevador';
                                const categoria = 'insumos';
                                
                                console.log(`ðŸ”Œ DEBUG: Agregando relevador ${voltaje} x1 por unidad (hay bloqueo)`);
                                
                                // ELIMINAR TODOS los tipos de relevadores existentes para evitar duplicaciÃ³n
                                Object.keys(todosLosInsumos).forEach(key => {
                                    if (key.includes('Relevador') && key !== keyRelevador) {
                                        console.log(`ðŸ—‘ï¸ DEBUG: Eliminando relevador duplicado: ${key}`);
                                        delete todosLosInsumos[key];
                                    }
                                });
                                
                                // Agregar relevador segÃºn voltaje
                                todosLosInsumos[keyRelevador] = {
                                    nombre: keyRelevador,
                                    cantidad: 1, // Se multiplicarÃ¡ despuÃ©s por cantidadUnidades
                                    unidades: [`Unidad ${unidadIndex + 1} (Rastreo - Bloqueo x1)`],
                                    sugerido: true,
                                    categoria: categoria
                                };
                                console.log(`âœ¨ DEBUG: Agregando relevador correcto: ${keyRelevador} = 1 por unidad`);
                                
                                // Agregar portarelevador automÃ¡ticamente
                                todosLosInsumos[keyPortarelevador] = {
                                    nombre: keyPortarelevador,
                                    cantidad: 1, // Se multiplicarÃ¡ despuÃ©s por cantidadUnidades
                                    unidades: [`Unidad ${unidadIndex + 1} (Rastreo - Bloqueo x1)`],
                                    sugerido: true,
                                    categoria: categoria
                                };
                                console.log(`âœ¨ DEBUG: Agregando portarelevador: ${keyPortarelevador} = 1 por unidad`);
                            }
                            
                            // Buscar insumos para cada soluciÃ³n compatible
                            solucionesCompatibles.forEach(solucionCompatible => {
                                const nombreSolucion = solucionCompatible.nombre;
                                const cantidadSolucion = solucionCompatible.cantidad;
                                
                                console.log(`ðŸ” DEBUG: Buscando insumos para: ${nombreSolucion} x${cantidadSolucion}`);
                                const insumosCompatible = obtenerInsumosRastreo(nombreSolucion);
                                console.log(`ðŸ“¦ DEBUG: Insumos encontrados:`, insumosCompatible.length);
                                
                                if (insumosCompatible && insumosCompatible.length > 0) {
                                    insumosCompatible.forEach(insumo => {
                                        const key = insumo.nombre;
                                        const categoria = obtenerCategoriaInsumo(insumo.nombre);
                                        
                                        // Saltar TODOS los tipos de relevadores si ya los manejamos de manera especial
                                        if (key.includes('Relevador') && tieneBloqueo) {
                                            console.log(`â­ï¸ DEBUG: Saltando ${key} (ya manejado por bloqueo - voltaje ${vehiculo.voltaje || '12v'})`);
                                            return;
                                        }
                                        
                                        // Multiplicar la cantidad del insumo por la cantidad de la soluciÃ³n
                                        let cantidadInsumo = insumo.cantidad;
                                        let cantidadFinal;
                                        if (typeof cantidadInsumo === 'string' && cantidadInsumo.includes('/')) {
                                            cantidadFinal = cantidadInsumo;
                                        } else {
                                            cantidadFinal = parseFloat(cantidadInsumo) * cantidadSolucion;
                                        }
                                        
                                        console.log(`âž• DEBUG: Agregando: ${insumo.nombre} (${categoria}) x${cantidadFinal}`);
                                        
                                        // Para accesorios, verificar si ya se agregÃ³ en esta unidad
                                        if (categoria === 'accesorios') {
                                            if (accesoriosUnicosEnUnidad[key]) {
                                                console.log(`âš ï¸ DEBUG: Accesorio ya agregado: ${key}`);
                                                return;
                                            } else {
                                                accesoriosUnicosEnUnidad[key] = true;
                                            }
                                        }
                                        
                                        if (todosLosInsumos[key]) {
                                            // Para botones, reemplazar en lugar de sumar
                                            if (key === 'Boton membrana') {
                                                todosLosInsumos[key].cantidad = cantidadFinal;
                                                console.log(`ðŸ“Š DEBUG: Reemplazando botones: ${key} = ${cantidadFinal}`);
                                            } else if (typeof cantidadFinal === 'string' && cantidadFinal.includes('/')) {
                                                todosLosInsumos[key].cantidad = cantidadFinal;
                                            } else {
                                                todosLosInsumos[key].cantidad += cantidadFinal;
                                            }
                                            todosLosInsumos[key].unidades.push(`Unidad ${unidadIndex + 1} (Rastreo - ${nombreSolucion} x${cantidadSolucion})`);
                                            console.log(`ðŸ“Š DEBUG: Sumando: ${key} = ${todosLosInsumos[key].cantidad}`);
                                        } else {
                                            todosLosInsumos[key] = {
                                                nombre: insumo.nombre,
                                                cantidad: cantidadFinal,
                                                unidades: [`Unidad ${unidadIndex + 1} (Rastreo - ${nombreSolucion} x${cantidadSolucion})`],
                                                sugerido: true,
                                                categoria: categoria
                                            };
                                            console.log(`âœ¨ DEBUG: Nuevo insumo: ${key} = ${cantidadFinal}`);
                                        }
                                        
                                    });
                                }
                            });
                        } else {
                            console.log(`âŒ DEBUG: No se procesan compatibles - tipoSolucion: ${tipoSolucion}, configuraciones:`, !!solucion.configuraciones);
                        }
                    });
                }
            });
            
            // CRÃTICO: Verificar el estado EXACTO antes de la bÃºsqueda de Insider
            console.log(`ðŸš¨ CRÃTICO: Verificando cotizacionData DIRECTAMENTE en generarInsumosSugeridos`);
            console.log(`ðŸš¨ CRÃTICO: cotizacionData.vehiculos[0].soluciones[0].configuraciones:`, cotizacionData.vehiculos[0]?.soluciones[0]?.configuraciones);
            console.log(`ðŸš¨ CRÃTICO: Valor especÃ­fico modulo_insider:`, cotizacionData.vehiculos[0]?.soluciones[0]?.configuraciones?.modulo_insider);
            
            // Verificar mÃ³dulos Insider en todas las unidades - USAR cotizacionData.vehiculos directamente
            console.log(`ðŸš¨ ESTADO COMPLETO cotizacionData.vehiculos:`, JSON.stringify(cotizacionData.vehiculos, null, 2));
            
            cotizacionData.vehiculos.forEach((vehiculo, unidadIndex) => {
                console.log(`ðŸ” DEBUG: Verificando Insider en Unidad ${unidadIndex + 1}:`, vehiculo.soluciones);
                
                // Buscar en todas las soluciones si alguna tiene mÃ³dulo Insider activado
                const tieneInsider = vehiculo.soluciones?.some(sol => {
                    const tieneModulo = sol.configuraciones?.modulo_insider === true;
                    console.log(`ðŸš¨ CRÃTICO: SoluciÃ³n ${sol.tipo_solucion} - modulo_insider: ${sol.configuraciones?.modulo_insider}, tieneModulo: ${tieneModulo}`);
                    console.log(`ðŸš¨ CRÃTICO: Configuraciones COMPLETAS:`, sol.configuraciones);
                    console.log(`ðŸš¨ CRÃTICO: Object.keys(configuraciones):`, Object.keys(sol.configuraciones || {}));
                    
                    // BUSCAR MANUALMENTE modulo_insider
                    if (sol.configuraciones) {
                        for (let key in sol.configuraciones) {
                            if (key.includes('insider') || key.includes('modulo')) {
                                console.log(`ðŸš¨ ENCONTRADO: Clave similar: "${key}" = ${sol.configuraciones[key]}`);
                            }
                        }
                    }
                    
                    return tieneModulo;
                }) || false;
                
                console.log(`ðŸ” DEBUG: Unidad ${unidadIndex + 1} tiene Insider: ${tieneInsider}`);
                
                if (tieneInsider) {
                    const keyInsider = 'MÃ³dulo Insider';
                    todosLosInsumos[keyInsider] = {
                        nombre: keyInsider,
                        cantidad: 1,
                        unidades: [`Unidad ${unidadIndex + 1} (MÃ³dulo Insider - ResoluciÃ³n de conflictos GPS)`],
                        sugerido: true,
                        categoria: 'equipos'
                    };
                    console.log(`âœ… DEBUG: MÃ³dulo Insider agregado a insumos para Unidad ${unidadIndex + 1}`);
                }
            });

            // Detectar servicios necesarios
            const serviciosNecesarios = detectarServiciosNecesarios(vehiculos);
            const simsNecesarias = detectarSIMsNecesarias(vehiculos);
            
            // Agregar SIMs como insumos
            simsNecesarias.forEach(sim => {
                const key = sim.nombre;
                if (todosLosInsumos[key]) {
                    todosLosInsumos[key].cantidad += sim.cantidad;
                    todosLosInsumos[key].unidades.push(`Unidad ${sim.unidad} (${sim.razon})`);
                } else {
                    todosLosInsumos[key] = {
                        nombre: sim.nombre,
                        cantidad: sim.cantidad,
                        unidades: [`Unidad ${sim.unidad} (${sim.razon})`],
                        sugerido: true,
                        categoria: 'insumos'
                    };
                }
            });
            
            // Guardar servicios en cotizacionData
            cotizacionData.serviciosSugeridos = serviciosNecesarios;
            
            // Aplicar reglas fijas por unidad y multiplicar por cantidad de unidades
            const cantidadUnidades = cotizacionData.cantidadLote || vehiculos.length;
            const tipoVenta = cotizacionData.tipoVenta || 'instalacion';
            console.log(`ðŸ”¢ DEBUG: Aplicando reglas para ${cantidadUnidades} unidades (lote: ${cotizacionData.cantidadLote}, vehiculos: ${vehiculos.length}, tipo: ${tipoVenta})`);
            
            // Insumos de excepciÃ³n para venta sin instalaciÃ³n
            const insumosExcepcion = [
                'Boton membrana',
                'Relevador 12v',
                'Boton de balancin'
            ];
            
            // Si es solo venta, filtrar solo insumos (mantener equipos y accesorios)
            if (tipoVenta === 'venta') {
                console.log(`ðŸ›’ DEBUG: Modo venta - filtrando solo insumos, manteniendo equipos y accesorios`);
                const insumosFiltrados = {};
                
                Object.keys(todosLosInsumos).forEach(key => {
                    const insumo = todosLosInsumos[key];
                    
                    // Mantener todos los equipos y accesorios
                    if (insumo.categoria === 'equipos' || insumo.categoria === 'accesorios') {
                        insumosFiltrados[key] = insumo;
                        console.log(`âœ… DEBUG: Manteniendo ${insumo.categoria}: ${insumo.nombre}`);
                    }
                    // Para insumos, mantener solo los de excepciÃ³n
                    else if (insumo.categoria === 'insumos') {
                        if (insumosExcepcion.some(excepcion => insumo.nombre.includes(excepcion))) {
                            insumosFiltrados[key] = insumo;
                            console.log(`âœ… DEBUG: Manteniendo insumo de excepciÃ³n: ${insumo.nombre}`);
                        } else {
                            console.log(`âŒ DEBUG: Eliminando insumo: ${insumo.nombre}`);
                        }
                    }
                    // Mantener otros tipos (por si acaso)
                    else {
                        insumosFiltrados[key] = insumo;
                        console.log(`âœ… DEBUG: Manteniendo ${insumo.categoria || 'desconocido'}: ${insumo.nombre}`);
                    }
                });
                
                // Reemplazar todosLosInsumos con los filtrados
                Object.keys(todosLosInsumos).forEach(key => delete todosLosInsumos[key]);
                Object.assign(todosLosInsumos, insumosFiltrados);
            }
            
            // Reglas fijas por unidad (solo para instalaciÃ³n)
            // Nota: Se elimina 'Silicon' de las reglas fijas. Solo se sugiere
            // en soluciones con cÃ¡maras laterales y encadenamiento de seÃ±al.
            const reglasFijas = tipoVenta === 'instalacion' ? {
                'Cinta de tela': 0.5,
                'Cinta de aislar': 0.5
            } : {};
            
            // Aplicar reglas fijas (por unidad)
            Object.keys(reglasFijas).forEach(insumo => {
                const cantidadPorUnidad = reglasFijas[insumo];
                const cantidadTotal = cantidadPorUnidad * cantidadUnidades;
                
                if (todosLosInsumos[insumo]) {
                    // Si ya existe, reemplazar con la cantidad calculada
                    todosLosInsumos[insumo].cantidad = cantidadTotal;
                    todosLosInsumos[insumo].unidades = [`Regla fija: ${cantidadPorUnidad} por unidad x ${cantidadUnidades} unidades`];
                    todosLosInsumos[insumo].reglaFija = true;
                    console.log(`ðŸ”§ DEBUG: Regla fija aplicada: ${insumo} = ${cantidadPorUnidad} x ${cantidadUnidades} = ${cantidadTotal}`);
                } else {
                    // Si no existe, crear con la cantidad calculada
                    todosLosInsumos[insumo] = {
                        nombre: insumo,
                        cantidad: cantidadTotal,
                        unidades: [`Regla fija: ${cantidadPorUnidad} por unidad x ${cantidadUnidades} unidades`],
                        sugerido: true,
                        categoria: 'insumos',
                        reglaFija: true
                    };
                    console.log(`ðŸ”§ DEBUG: Regla fija creada: ${insumo} = ${cantidadPorUnidad} x ${cantidadUnidades} = ${cantidadTotal}`);
                }
            });
            
            // Multiplicar todos los demÃ¡s insumos por la cantidad de unidades
            Object.keys(todosLosInsumos).forEach(key => {
                const insumo = todosLosInsumos[key];
                if (!insumo.reglaFija && typeof insumo.cantidad === 'number') {
                    const cantidadOriginal = insumo.cantidad;
                    insumo.cantidad = cantidadOriginal * cantidadUnidades;
                    console.log(`ðŸ”¢ DEBUG: Multiplicado: ${key} = ${cantidadOriginal} x ${cantidadUnidades} = ${insumo.cantidad}`);
                }
            });

            // Generar HTML para mostrar los insumos sugeridos
            if (Object.keys(todosLosInsumos).length === 0) {
                container.innerHTML = '<p class="text-muted">No se encontraron sugerencias de insumos. AsegÃºrate de haber seleccionado unidades y soluciones.</p>';
                return;
            }

            // Organizar insumos por categorÃ­a y tipo (automÃ¡tico vs sugerido)
            const insumosPorCategoria = {
                equipos: [],
                accesorios: [],
                insumos: []
            };
            
            const insumosAutomaticos = {
                equipos: [],
                accesorios: [],
                insumos: []
            };

            Object.values(todosLosInsumos).forEach(insumo => {
                const categoria = insumo.categoria || 'insumos';
                if (insumosPorCategoria[categoria]) {
                    insumosPorCategoria[categoria].push(insumo);
                    
                    // Separar automÃ¡ticos de sugeridos
                    if (insumo.sugerido === true) {
                        insumosAutomaticos[categoria].push(insumo);
                    }
                }
            });

            // Contar totales por categorÃ­a
            const totalesPorCategoria = {
                equipos: insumosPorCategoria.equipos.length,
                accesorios: insumosPorCategoria.accesorios.length,
                insumos: insumosPorCategoria.insumos.length,
                servicios: serviciosNecesarios.length
            };

            let html = `
                <div class="alert alert-info">
                    <h6><i class="bi bi-lightbulb"></i> Insumos Sugeridos AutomÃ¡ticamente</h6>
                    <small>Basados en las unidades y soluciones seleccionadas. Organizados por categorÃ­as.</small>
                    <div class="mt-2">
                        <span class="badge ${tipoVenta === 'instalacion' ? 'bg-success' : 'bg-warning'}">
                            ${tipoVenta === 'instalacion' ? 'InstalaciÃ³n completa' : 'Solo venta de equipos'}
                        </span>
                        ${tipoVenta === 'venta' ? '<small class="text-muted ms-2">(Solo insumos de excepciÃ³n)</small>' : ''}
                    </div>
                </div>

                <!-- PestaÃ±as de categorÃ­as -->
                <ul class="nav nav-tabs" id="categoriasTab" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="equipos-tab" data-bs-toggle="tab" data-bs-target="#equipos" 
                                type="button" role="tab" aria-controls="equipos" aria-selected="true">
                            <i class="bi bi-cpu"></i> Equipos <span class="badge ms-1" style="background-color: #fb930c;">${totalesPorCategoria.equipos}</span>
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="accesorios-tab" data-bs-toggle="tab" data-bs-target="#accesorios" 
                                type="button" role="tab" aria-controls="accesorios" aria-selected="false">
                            <i class="bi bi-puzzle"></i> Accesorios <span class="badge bg-success ms-1">${totalesPorCategoria.accesorios}</span>
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="insumos-tab" data-bs-toggle="tab" data-bs-target="#insumos" 
                                type="button" role="tab" aria-controls="insumos" aria-selected="false">
                            <i class="bi bi-tools"></i> Materia Prima <span class="badge bg-warning ms-1">${totalesPorCategoria.insumos}</span>
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="servicios-tab" data-bs-toggle="tab" data-bs-target="#servicios" 
                                type="button" role="tab" aria-controls="servicios" aria-selected="false">
                            <i class="bi bi-cloud"></i> Servicios <span class="badge bg-info ms-1">${totalesPorCategoria.servicios}</span>
                        </button>
                    </li>
                </ul>

                <!-- Contenido de las pestaÃ±as -->
                <div class="tab-content" id="categoriasTabContent">
            `;

            // Generar contenido para cada categorÃ­a
            ['equipos', 'accesorios', 'insumos', 'servicios'].forEach((categoria, categoriaIndex) => {
                const isActive = categoriaIndex === 0 ? 'show active' : '';
                const iconosCategoria = {
                    equipos: '<i class="bi bi-cpu me-1" style="color: #fb930c;"></i>',
                    accesorios: '<i class="bi bi-puzzle text-success me-1"></i>',
                    insumos: '<i class="bi bi-tools text-warning me-1"></i>',
                    servicios: '<i class="bi bi-cloud text-info me-1"></i>'
                };

                // Manejar servicios de manera especial
                if (categoria === 'servicios') {
                    html += `
                        <div class="tab-pane fade ${isActive}" id="${categoria}" role="tabpanel" aria-labelledby="${categoria}-tab">
                            <div class="mb-4">
                                <h6 style="color: #17a2b8;">
                                    ${iconosCategoria[categoria]} Servicios de Datos Sugeridos
                                    <span class="badge ms-2" style="background-color: #17a2b8;">${serviciosNecesarios.length}</span>
                                </h6>
                                <div class="table-responsive">
                                    <table class="table table-hover table-sm">
                                        <thead class="table-dark">
                                            <tr>
                                                <th width="50">Usar</th>
                                                <th>Servicio</th>
                                                <th width="120">Periodicidad</th>
                                                <th width="80">Cantidad</th>
                                                <th>Aplicado en</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                    `;
                    
                    if (serviciosNecesarios.length === 0) {
                        html += `
                            <tr>
                                <td colspan="5" class="text-center text-muted">
                                    <i class="bi bi-info-circle"></i> No se requieren servicios de datos
                                </td>
                            </tr>
                        `;
                    } else {
                        serviciosNecesarios.forEach(servicio => {
                            const servicioId = `servicio_${servicio.nombre.replace(/\s+/g, '_').toLowerCase()}_${servicio.unidad}`;
                            html += `
                                <tr>
                                    <td>
                                        <div class="form-check">
                                            <input class="form-check-input servicio-checkbox" type="checkbox" 
                                                   id="${servicioId}" value="${servicio.nombre}" checked>
                                        </div>
                                    </td>
                                    <td><strong>${servicio.nombre}</strong></td>
                                    <td>
                                        <span class="badge ${servicio.periodicidad === 'anual' ? 'bg-danger' : 'bg-primary'}">
                                            ${servicio.periodicidad}
                                        </span>
                                    </td>
                                    <td><span class="badge bg-secondary">${servicio.cantidad}</span></td>
                                    <td>
                                        <small class="text-muted">
                                            Unidad ${servicio.unidad} (${servicio.solucion})
                                        </small>
                                    </td>
                                </tr>
                            `;
                        });
                    }
                    
                    html += `
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div class="row mt-2 mb-3">
                                <div class="col-12">
                                    <button type="button" class="btn btn-outline-info btn-sm me-2" onclick="seleccionarCategoria('${categoria}', true)">
                                        <i class="bi bi-check-all"></i> Seleccionar Servicios
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm" onclick="seleccionarCategoria('${categoria}', false)">
                                        <i class="bi bi-x-square"></i> Deseleccionar Servicios
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    return; // Salir del bucle para servicios
                }
                
                // Separar automÃ¡ticos de sugeridos por matriz
                const automaticos = insumosAutomaticos[categoria];
                const sugeridos = insumosPorCategoria[categoria].filter(insumo => !insumo.sugerido);
                
                html += `
                    <div class="tab-pane fade ${isActive}" id="${categoria}" role="tabpanel" aria-labelledby="${categoria}-tab">
                `;
                
                // SecciÃ³n de automÃ¡ticos
                if (automaticos.length > 0) {
                    html += `
                        <div class="mb-4">
                            <h6 style="color: #fb930c;">
                                <i class="bi bi-magic"></i> ${categoria.charAt(0).toUpperCase() + categoria.slice(1)} AutomÃ¡ticos
                                <span class="badge ms-2" style="background-color: #fb930c;">${automaticos.length}</span>
                            </h6>
                            <div class="table-responsive">
                                <table class="table table-hover table-sm">
                                    <thead class="table-dark">
                                        <tr>
                                            <th width="50">Usar</th>
                                            <th>Nombre</th>
                                            <th width="80">Cantidad</th>
                                            <th>Aplicado en</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                    `;
                    
                    automaticos.forEach((insumo, index) => {
                        const esTelemetria = insumo.deTelemetria;
                        const iconoTipo = esTelemetria ? '<i class="bi bi-broadcast text-warning me-1" title="TelemetrÃ­a"></i>' : iconosCategoria[categoria];
                        const colorBadge = esTelemetria ? 'bg-warning' : (categoria === 'equipos' ? 'style="background-color: #fb930c;"' : (categoria === 'accesorios' ? 'bg-success' : 'bg-warning'));
                        const globalIndex = Object.values(todosLosInsumos).findIndex(item => item.nombre === insumo.nombre);
                        
                        html += `
                            <tr ${esTelemetria ? 'class="table-warning"' : ''}>
                                <td>
                                    <div class="form-check">
                                        <input class="form-check-input sugerido-checkbox" type="checkbox" id="sugerido_${globalIndex}" 
                                               name="insumo_sugerido_${globalIndex}" value="${insumo.nombre}" checked>
                                    </div>
                                </td>
                                <td>
                                    ${iconoTipo}
                                    <strong>${insumo.nombre}</strong>
                                    ${esTelemetria ? '<span class="badge bg-warning ms-1">TelemetrÃ­a</span>' : ''}
                                </td>
                                <td>
                                    <span class="badge ${colorBadge}">${insumo.cantidad}</span>
                                </td>
                                <td>
                                    <small class="text-muted">
                                        ${insumo.unidades ? insumo.unidades.join('<br>') : 'N/A'}
                                    </small>
                                </td>
                            </tr>
                        `;
                    });
                    
                    html += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }
                
                // SecciÃ³n de sugeridos por matriz
                if (sugeridos.length > 0) {
                    html += `
                        <div class="mb-4">
                            <h6 class="text-secondary">
                                <i class="bi bi-lightbulb"></i> ${categoria.charAt(0).toUpperCase() + categoria.slice(1)} Sugeridos por Matriz
                                <span class="badge bg-secondary ms-2">${sugeridos.length}</span>
                            </h6>
                            <div class="table-responsive">
                                <table class="table table-hover table-sm">
                                    <thead class="table-dark">
                                        <tr>
                                            <th width="50">Usar</th>
                                            <th>Nombre</th>
                                            <th width="80">Cantidad</th>
                                            <th>Aplicado en</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                    `;
                    
                    sugeridos.forEach((insumo, index) => {
                        const esTelemetria = insumo.deTelemetria;
                        const iconoTipo = esTelemetria ? '<i class="bi bi-broadcast text-warning me-1" title="TelemetrÃ­a"></i>' : iconosCategoria[categoria];
                        const colorBadge = esTelemetria ? 'bg-warning' : (categoria === 'equipos' ? 'style="background-color: #fb930c;"' : (categoria === 'accesorios' ? 'bg-success' : 'bg-warning'));
                        const globalIndex = Object.values(todosLosInsumos).findIndex(item => item.nombre === insumo.nombre);
                        
                        html += `
                            <tr ${esTelemetria ? 'class="table-warning"' : ''}>
                                <td>
                                    <div class="form-check">
                                        <input class="form-check-input sugerido-checkbox" type="checkbox" id="sugerido_${globalIndex}" 
                                               name="insumo_sugerido_${globalIndex}" value="${insumo.nombre}" checked>
                                    </div>
                                </td>
                                <td>
                                    ${iconoTipo}
                                    <strong>${insumo.nombre}</strong>
                                    ${esTelemetria ? '<span class="badge bg-warning ms-1">TelemetrÃ­a</span>' : ''}
                                </td>
                                <td>
                                    <span class="badge ${colorBadge}">${insumo.cantidad}</span>
                                </td>
                                <td>
                                    <small class="text-muted">
                                        ${insumo.unidades ? insumo.unidades.join('<br>') : 'N/A'}
                                    </small>
                                </td>
                            </tr>
                        `;
                    });
                    
                    html += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }

                html += `
                    </div>
                `;

                // Botones de selecciÃ³n por categorÃ­a
                html += `
                        <div class="row mt-2 mb-3">
                            <div class="col-12">
                                <button type="button" class="btn btn-outline-success btn-sm me-2" onclick="seleccionarCategoria('${categoria}', true)">
                                    <i class="bi bi-check-all"></i> Seleccionar ${categoria === 'insumos' ? 'Materia Prima' : (categoria.charAt(0).toUpperCase() + categoria.slice(1))}
                                </button>
                                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="seleccionarCategoria('${categoria}', false)">
                                    <i class="bi bi-x-square"></i> Deseleccionar ${categoria === 'insumos' ? 'Materia Prima' : (categoria.charAt(0).toUpperCase() + categoria.slice(1))}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `
                </div>

                <!-- Botones generales -->
                <div class="row mt-3">
                    <div class="col-12">
                        <button type="button" class="btn btn-success me-2" onclick="seleccionarTodosSugeridos(true)">
                            <i class="bi bi-check-all"></i> Seleccionar Todo
                        </button>
                        <button type="button" class="btn btn-outline-secondary" onclick="seleccionarTodosSugeridos(false)">
                            <i class="bi bi-x-square"></i> Deseleccionar Todo
                        </button>
                    </div>
                </div>
            `;

            console.log('ðŸ”„ DEBUG: Actualizando contenedor con HTML generado...');
            console.log('ðŸ”„ DEBUG: HTML generado:', html.substring(0, 200) + '...');
            container.innerHTML = html;
            
            // Liberar el flag
            generandoInsumos = false;
            console.log('âœ… GeneraciÃ³n de insumos completada');
            console.log(`ðŸ“‹ DEBUG: Insumos finales generados:`, Object.keys(todosLosInsumos));
        }

        // FunciÃ³n para seleccionar/deseleccionar todos los insumos sugeridos
        function seleccionarTodosSugeridos(seleccionar) {
            const checkboxes = document.querySelectorAll('.sugerido-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = seleccionar;
            });
        }

        // FunciÃ³n para seleccionar/deseleccionar por categorÃ­a
        function seleccionarCategoria(categoria, seleccionar) {
            const tabPane = document.getElementById(categoria);
            if (tabPane) {
                const checkboxes = tabPane.querySelectorAll('.sugerido-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = seleccionar;
                });
            }
        }

        // FunciÃ³n legacy para compatibilidad
        function toggleAllSugeridos(masterCheckbox) {
            seleccionarTodosSugeridos(masterCheckbox.checked);
        }

        // Array para almacenar insumos adicionales
        let insumosAdicionalesSeleccionados = [];

        // FunciÃ³n para agregar insumo adicional
        function agregarInsumoAdicional() {
            const selectInsumo = document.getElementById('selectInsumoAdicional');
            const cantidadInput = document.getElementById('cantidadInsumoAdicional');
            
            const insumoNombre = selectInsumo.value;
            const cantidad = parseFloat(cantidadInput.value);
            
            if (!insumoNombre || !cantidad || cantidad <= 0) {
                alert('Por favor selecciona un insumo y especifica una cantidad vÃ¡lida.');
                return;
            }
            
            // Verificar si ya existe el insumo
            const existeIndex = insumosAdicionalesSeleccionados.findIndex(item => item.nombre === insumoNombre);
            
            if (existeIndex >= 0) {
                // Si existe, sumar la cantidad
                insumosAdicionalesSeleccionados[existeIndex].cantidad += cantidad;
            } else {
                // Si no existe, agregarlo
                insumosAdicionalesSeleccionados.push({
                    nombre: insumoNombre,
                    cantidad: cantidad
                });
            }
            
            // Limpiar campos
            selectInsumo.value = '';
            cantidadInput.value = '';
            
            // Actualizar visualizaciÃ³n
            actualizarVisualizacionInsumosAdicionales();
        }

        // FunciÃ³n para actualizar la visualizaciÃ³n de insumos adicionales
        function actualizarVisualizacionInsumosAdicionales() {
            const container = document.getElementById('insumosAdicionalesContainer');
            
            if (insumosAdicionalesSeleccionados.length === 0) {
                container.innerHTML = '<p class="text-muted small">No hay insumos adicionales agregados.</p>';
                return;
            }
            
            let html = '<div class="list-group list-group-flush">';
            insumosAdicionalesSeleccionados.forEach((insumo, index) => {
                html += `
                    <div class="list-group-item d-flex justify-content-between align-items-center py-2">
                        <div>
                            <strong class="text-info">${insumo.nombre}</strong>
                            <span class="badge bg-info ms-2">${insumo.cantidad}</span>
                        </div>
                        <button class="btn btn-outline-danger btn-sm" onclick="eliminarInsumoAdicional(${index})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                `;
            });
            html += '</div>';
            
            container.innerHTML = html;
        }

        // FunciÃ³n para eliminar insumo adicional
        function eliminarInsumoAdicional(index) {
            insumosAdicionalesSeleccionados.splice(index, 1);
            actualizarVisualizacionInsumosAdicionales();
        }

        // Datos maestros
        const descuentosPorCliente = {
            "Distribuidor A": 25,
            "Distribuidor B": 20,
            "Distribuidor C": 15,
            "Cliente final A": 10,
            "Cliente final B": 5,
            "Cliente final C": 0,
            "Cliente corporativo A": 30,
            "Cliente corporativo B": 20,
            "Cliente corporativo C": 10,
            "Integrador A": 25,
            "Integrador B": 20,
            "Integrador C": 15
        };

        const solucionesMaestras = [
            {
                id: 'vpc',
                nombre: 'VPC',
                descripcion: 'Sistema de video para vehÃ­culos',
                configuraciones: ['camara_izquierda', 'camara_derecha', 'camara_reversa', 'camara_frontal', 'grabacion', 'transmision']
            },
            {
                id: 'sensor_vpc',
                nombre: 'Sensor VPC',
                descripcion: 'Sensores para sistema VPC'
            },
            {
                id: 'led_giro',
                nombre: 'Led de giro',
                descripcion: 'Luces LED direccionales'
            },
            {
                id: 'alarma_parlante_estandar',
                nombre: 'Alarma parlante estÃ¡ndar',
                descripcion: 'Sistema de alarma con parlante'
            },
            {
                id: 'alarma_parlante_programable',
                nombre: 'Alarma parlante programable',
                descripcion: 'Sistema de alarma programable'
            },
            {
                id: 'encadenamiento_seÃ±ales',
                nombre: 'Encadenamiento seÃ±ales',
                descripcion: 'Sistema de encadenamiento de seÃ±ales'
            },
            {
                id: 'mvr4_ch',
                nombre: 'MVR/4 Ch',
                descripcion: 'Sistema de grabaciÃ³n 4 canales'
            },
            {
                id: 'mvr8_ch',
                nombre: 'MVR/8 Ch',
                descripcion: 'Sistema de grabaciÃ³n 8 canales'
            },
            {
                id: 'sideview',
                nombre: 'Sideview',
                descripcion: 'Sistema de vista lateral'
            },
            {
                id: 'dashcam',
                nombre: 'Dashcam',
                descripcion: 'CÃ¡mara frontal para vehÃ­culo'
            },
            {
                id: 'rastreo_basico',
                nombre: 'Rastreo bÃ¡sico',
                descripcion: 'Sistema bÃ¡sico de rastreo GPS',
                configuraciones: ['sos_simple', 'sos_llamada', 'bloqueo_normal', 'sensores_juntos', 'alerta']
            },
            {
                id: 'rastreo_avanzado',
                nombre: 'Rastreo avanzado',
                descripcion: 'Sistema avanzado de rastreo GPS',
                configuraciones: ['sos_simple', 'sos_llamada', 'sos_bloqueo', 'bloqueo_normal', 'bloqueo_cc', 'sensores_juntos', 'sensores_independientes', 'sensores_y_bloqueo', 'audio_bidireccional', 'audio_espia', 'alerta', 'alerta_y_bloqueo']
            },
            {
                id: 'rastreo_satelital',
                nombre: 'Rastreo satelital',
                descripcion: 'Sistema satelital de rastreo'
            },
            {
                id: 'insider',
                nombre: 'Insider',
                descripcion: 'Sistema insider'
            },
            {
                id: 'limitador_velocidad',
                nombre: 'Limitador de velocidad',
                descripcion: 'Sistema limitador de velocidad'
            },
            {
                id: 'modulo_sensor_cinturon',
                nombre: 'MÃ³dulo sensor cinturÃ³n',
                descripcion: 'Sensor de cinturÃ³n de seguridad'
            }
        ];

        const insumosMaestros = [
            'Cable 4 pin 1 m', 'Cable 4 pin 3 m', 'Cable 4 pin 5 m', 'Cable 4 pin 7 m', 'Cable 4 pin 15 m', 'Cable 4 pin 30 m',
            'Cable 6 pin 5 m', '"Y" 4 pines', 'Base Pollak', 'Base Macho Pollak', 'Base Hembra', 'Tornillo hexagonal 5/16',
            'Tornillo 3/8', 'Silicon', 'Cinchos grande', 'Cinta de tela', 'Cinta de aislar', 'Poliflex 3/8',
            'Cincho mediado', 'Cincho con grapa', 'Pija brocante 5/16', 'Cable de 1 polo', 'Terminal de ojillo', 'Poliflex 1/4',
            'Cable 2 vias', 'Cable 4 vias', 'Tuerca 5/16', 'Rondana 5/16', 'Espiral negro', 'Espiral verde',
            'Relevador 2 pasos 2 tiros', 'placa perforada', 'Gabinete 5*7*3', 'Relevador 12v', 'Relevador 24v', 'Portarelevador'
        ];

        const serviciosMaestros = [
            'Hosting', 'Datos rastreo basico', 'Datos rastreo avanzado', 'Datos - Voz', 'Datos video'
        ];

        const accesoriosMaestros = [
            'Bocina', 'BotÃ³n balancin', 'Boton de panico', 'Microfono', 'Sensor magnetico chico', 'Sensor magnetico grande', 'Interfaz de leds'
        ];

        // FunciÃ³n establecerFechaVencimiento movida al inicio del script

        // FunciÃ³n para manejar opciones de encadenamiento
        function toggleEncadenamientoOptions(solucionId) {
            const checkbox = document.getElementById(`${solucionId}_encadenamiento`);
            const options = document.getElementById(`${solucionId}_encadenamiento_options`);
            
            if (checkbox && options) {
                options.style.display = checkbox.checked ? 'block' : 'none';
                
                // Limpiar selecciones si se desmarca
                if (!checkbox.checked) {
                    const radios = options.querySelectorAll('input[type="radio"]');
                    radios.forEach(radio => radio.checked = false);
                }
            }
        }

        // Funciones para manejar opciones especÃ­ficas
        function toggleSensorVpcOptions(solucionId) {
            const checkbox = document.getElementById(`${solucionId}_sensor_vpc`);
            const options = document.getElementById(`${solucionId}_sensor_vpc_options`);
            if (checkbox && options) {
                options.style.display = checkbox.checked ? 'block' : 'none';
            }
        }

        function toggleAlarmaOptions(solucionId) {
            const checkbox = document.getElementById(`${solucionId}_alarma_parlante_estandar`);
            const options = document.getElementById(`${solucionId}_alarma_options`);
            if (checkbox && options) {
                options.style.display = checkbox.checked ? 'block' : 'none';
            }
        }

        function toggleLedOptions(solucionId) {
            const checkbox = document.getElementById(`${solucionId}_led_giro`);
            const options = document.getElementById(`${solucionId}_led_options`);
            if (checkbox && options) {
                options.style.display = checkbox.checked ? 'block' : 'none';
            }
        }

        function toggleCanalIPExtra(solucionId) {
            const checkbox = document.getElementById(`${solucionId}_canal_ip_extra`);
            const container = document.getElementById(`${solucionId}_canal_ip_container`);
            const select = document.querySelector(`[name="${solucionId}_canal_ip_tipo"]`);
            
            if (checkbox && container && select) {
                container.style.display = checkbox.checked ? 'block' : 'none';
                select.disabled = !checkbox.checked;
                if (checkbox.checked) {
                    select.value = 'digital'; // Poner cÃ¡mara IP por defecto
                }
            }
        }

        function toggleJammerTime(solucionId) {
            const jammerRadios = document.querySelectorAll(`[name="${solucionId}_jammer"]:checked`);
            const timeContainer = document.getElementById(`${solucionId}_jammer_time_container`);
            
            if (timeContainer) {
                const hasJammerSelected = jammerRadios.length > 0;
                timeContainer.style.display = hasJammerSelected ? 'block' : 'none';
            }
        }

        function toggleHostingPeriodicity(solucionId) {
            const hostingCheckbox = document.getElementById(`${solucionId}_hosting`);
            const periodicityContainer = document.getElementById(`${solucionId}_hosting_periodicity`);
            
            if (periodicityContainer && hostingCheckbox) {
                periodicityContainer.style.display = hostingCheckbox.checked ? 'block' : 'none';
            }
        }

        function guardarHostingPeriodo(solucionId, unidadIndex, solucionIndex) {
            const periodoSelect = document.getElementById(`${solucionId}_hosting_periodo`);
            if (periodoSelect && cotizacionData.vehiculos[unidadIndex] && cotizacionData.vehiculos[unidadIndex].soluciones[solucionIndex]) {
                cotizacionData.vehiculos[unidadIndex].soluciones[solucionIndex].configuraciones['hosting_periodo'] = periodoSelect.value;
                console.log(`âœ… Hosting periodicidad actualizada: ${periodoSelect.value}`);
            }
        }

        // FunciÃ³n para mostrar alertas
        function mostrarAlerta(mensaje, tipo = 'info') {
            // Crear elemento de alerta
            const alerta = document.createElement('div');
            alerta.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
            alerta.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
            alerta.innerHTML = `
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            // Agregar al body
            document.body.appendChild(alerta);
            
            // Auto-remover despuÃ©s de 4 segundos
            setTimeout(() => {
                if (alerta.parentNode) {
                    alerta.remove();
                }
            }, 4000);
        }

        // FunciÃ³n para cargar datos de ediciÃ³n
        function cargarDatosEdicion() {
            const urlParams = new URLSearchParams(window.location.search);
            const editarId = urlParams.get('editar');
            const datosEdicion = localStorage.getItem('cotizacion_editar');
            
            if (editarId && datosEdicion) {
                try {
                    const cotizacion = JSON.parse(datosEdicion);
                    console.log('Cargando datos para editar:', cotizacion);
                    
                    // Cargar datos del cliente con validaciones
                    const clienteNombre = document.getElementById('cliente_nombre');
                    const empresa = document.getElementById('empresa');
                    const tipoCliente = document.getElementById('tipo_cliente');
                    const descuento = document.getElementById('descuento');
                    const fechaVencimiento = document.getElementById('fecha_vencimiento');
                    const urgente = document.getElementById('urgente');
                    const diasSeguimiento = document.getElementById('dias_seguimiento');
                    const observaciones = document.getElementById('observaciones');
                    
                    if (cotizacion.cliente_nombre && clienteNombre) {
                        clienteNombre.value = cotizacion.cliente_nombre;
                    }
                    if (cotizacion.empresa && empresa) {
                        empresa.value = cotizacion.empresa;
                    }
                    if (cotizacion.tipo_cliente && tipoCliente) {
                        tipoCliente.value = cotizacion.tipo_cliente;
                    }
                    if (cotizacion.descuento && descuento) {
                        descuento.value = cotizacion.descuento;
                    }
                    if (cotizacion.fecha_vencimiento && fechaVencimiento) {
                        fechaVencimiento.value = cotizacion.fecha_vencimiento;
                    }
                    if (cotizacion.urgente && urgente) {
                        urgente.value = cotizacion.urgente;
                    }
                    if (cotizacion.observaciones && observaciones) {
                        observaciones.value = cotizacion.observaciones;
                    }
                    
                    // Limpiar unidades por defecto
                    const unidadesContainer = document.getElementById('unidadesVehiculoContainer');
                    if (unidadesContainer) {
                        unidadesContainer.innerHTML = '';
                    }
                    
                    // Cargar unidades existentes
                    if (cotizacion.unidades && cotizacion.unidades.length > 0) {
                        // Obtener solo unidades Ãºnicas (evitar duplicados de lote)
                        const unidadesUnicas = [];
                        const loteDetectado = cotizacion.unidades.some(u => u.esLote);
                        
                        if (loteDetectado) {
                            // Si hay lote, solo tomar la primera unidad
                            unidadesUnicas.push(cotizacion.unidades[0]);
                        } else {
                            // Si no hay lote, tomar todas las unidades
                            unidadesUnicas.push(...cotizacion.unidades);
                        }
                        
                        console.log('Cargando unidades Ãºnicas:', unidadesUnicas);
                        
                        unidadesUnicas.forEach((unidad, index) => {
                            setTimeout(() => {
                                agregarUnidadVehiculo();
                                const unidadDiv = document.querySelector('.unidad-vehiculo-item:last-child');
                                
                                if (unidadDiv) {
                                    console.log(`Cargando datos de unidad ${index + 1}:`, unidad);
                                    
                                    // Llenar datos de la unidad con validaciones
                                    const marca = unidadDiv.querySelector('[name^="vehiculo_marca_"]');
                                    const tipo = unidadDiv.querySelector('[name^="vehiculo_tipo_"]');
                                    const modelo = unidadDiv.querySelector('[name^="vehiculo_modelo_"]');
                                    const anio = unidadDiv.querySelector('[name^="vehiculo_año_"]');
                                    const combustible = unidadDiv.querySelector('[name^="vehiculo_combustible_"]');
                                    const voltaje = unidadDiv.querySelector('[name^="vehiculo_voltaje_"]');
                                    
                                    if (marca) marca.value = unidad.marca || '';
                                    if (tipo) tipo.value = unidad.tipo_unidad || unidad.tipo || '';
                                    if (modelo) modelo.value = unidad.modelo || '';
                                    if (anio) anio.value = unidad.anio || unidad.año || '';
                                    if (combustible) combustible.value = unidad.combustible || '';
                                    if (voltaje) voltaje.value = unidad.voltaje || '';
                                    
                                    // Cargar soluciones de esta unidad
                                    if (unidad.soluciones && unidad.soluciones.length > 0) {
                                        const unidadId = index + 1;
                                        const solucionesContainer = unidadDiv.querySelector('.soluciones-unidad-container-' + unidadId);
                                        
                                        console.log(`Cargando ${unidad.soluciones.length} soluciones para unidad ${unidadId}`);
                                        
                                        if (solucionesContainer) {
                                            solucionesContainer.innerHTML = '';
                                            
                                            unidad.soluciones.forEach((solucion, solIndex) => {
                                                setTimeout(() => {
                                                    console.log(`Agregando soluciÃ³n ${solIndex + 1}:`, solucion);
                                                    agregarSolucionAUnidadWizard(null, unidadId);
                                                    
                                                    const solucionDiv = solucionesContainer.querySelector('.solucion-item:last-child');
                                                    if (solucionDiv) {
                                                        const tipoSelect = solucionDiv.querySelector('.solucion-tipo');
                                                        if (tipoSelect) {
                                                            tipoSelect.value = solucion.tipo_solucion || solucion.tipo || '';
                                                            
                                                            // Disparar evento para cargar configuraciones
                                                            mostrarConfiguracionesSolucionWizard(tipoSelect);
                                                            
                                                            // Cargar configuraciones despuÃ©s de un delay
                                                            setTimeout(() => {
                                                                if (solucion.configuraciones) {
                                                                    console.log('Cargando configuraciones:', solucion.configuraciones);
                                                                    Object.keys(solucion.configuraciones).forEach(configKey => {
                                                                        const configValue = solucion.configuraciones[configKey];
                                                                        
                                                                        // Buscar el elemento por nombre que contenga la clave
                                                                        const elementos = solucionDiv.querySelectorAll(`[name*="${configKey}"]`);
                                                                        
                                                                        elementos.forEach(elemento => {
                                                                            if (elemento.type === 'checkbox' && configValue === true) {
                                                                                elemento.checked = true;
                                                                                console.log(`Marcando checkbox: ${configKey}`);
                                                                                
                                                                                // Disparar evento onchange si existe
                                                                                if (elemento.onchange) {
                                                                                    elemento.onchange();
                                                                                }
                                                                            } else if (elemento.type === 'radio' && configValue === elemento.value) {
                                                                                elemento.checked = true;
                                                                                console.log(`Marcando radio: ${configKey} = ${configValue}`);
                                                                                
                                                                                // Disparar evento onchange si existe
                                                                                if (elemento.onchange) {
                                                                                    elemento.onchange();
                                                                                }
                                                                            } else if (elemento.tagName === 'SELECT' && configValue) {
                                                                                elemento.value = configValue;
                                                                                console.log(`Estableciendo select: ${configKey} = ${configValue}`);
                                                                            } else if (elemento.type === 'number' && configValue) {
                                                                                elemento.value = configValue;
                                                                                console.log(`Estableciendo nÃºmero: ${configKey} = ${configValue}`);
                                                                            } else if (elemento.tagName === 'TEXTAREA' && configValue) {
                                                                                elemento.value = configValue;
                                                                                console.log(`Estableciendo textarea: ${configKey} = ${configValue}`);
                                                                            }
                                                                        });
                                                                    });
                                                                }
                                                            }, 500);
                                                        }
                                                    }
                                                }, solIndex * 300);
                                            });
                                        }
                                    }
                                }
                            }, index * 800);
                        });
                        
                        // Si hay cantidad de lote, establecerla
                        if (cotizacion.cantidadLote) {
                            setTimeout(() => {
                                const cantidadLoteInput = document.getElementById('cantidadUnidadesLote');
                                if (cantidadLoteInput) {
                                    cantidadLoteInput.value = cotizacion.cantidadLote;
                                }
                            }, 1000);
                        }
                        
                        // Si hay tipo de venta, establecerlo
                        if (cotizacion.tipoVenta) {
                            setTimeout(() => {
                                const tipoVentaSelect = document.getElementById('tipoVenta');
                                if (tipoVentaSelect) {
                                    tipoVentaSelect.value = cotizacion.tipoVenta;
                                }
                            }, 1000);
                        }
                    }
                    
                    // Cargar insumos, servicios y accesorios
                    setTimeout(() => {
                        if (cotizacion.insumos && cotizacion.insumos.length > 0) {
                            cotizacion.insumos.forEach(insumo => {
                                const checkbox = document.querySelector(`[id*="insumo_${insumo.replace(/\s+/g, '_').replace(/\\"/g, '').replace(/\\//g, '_')}"]`);
                                if (checkbox) checkbox.checked = true;
                            });
                        }
                        
                        if (cotizacion.servicios && cotizacion.servicios.length > 0) {
                            cotizacion.servicios.forEach(servicio => {
                                const checkbox = document.querySelector(`[id*="servicio_${servicio.replace(/\s+/g, '_').replace(/-/g, '_')}"]`);
                                if (checkbox) checkbox.checked = true;
                            });
                        }
                        
                        if (cotizacion.accesorios && cotizacion.accesorios.length > 0) {
                            cotizacion.accesorios.forEach(accesorio => {
                                const checkbox = document.querySelector(`[id*="accesorio_${accesorio.replace(/\s+/g, '_')}"]`);
                                if (checkbox) checkbox.checked = true;
                            });
                        }
                    }, 2000);
                    
                    // Actualizar tÃ­tulo (wizard header)
                    const header = document.querySelector('.wizard-header h2') || document.querySelector('h2');
                    if (header) header.textContent = 'Editar CotizaciÃ³n - ' + (cotizacion.folio || 'Wizard');
                    
                    mostrarAlerta('Datos cargados para ediciÃ³n', 'success');
                    
                } catch (error) {
                    console.error('Error cargando datos de ediciÃ³n:', error);
                    mostrarAlerta('Error al cargar los datos para editar', 'danger');
                }
            }
        }

        // Sistema de debugging para diagnÃ³stico de cÃ¡lculos
        function mostrarDebugCalculos() {
            console.log('=== INICIO DEBUG DE CÃLCULOS ===');
            
            // Obtener datos actuales (sin guardar - para evitar sobrescribir estado)
            const vehiculos = cotizacionData.vehiculos || [];
            
            console.log('1. DATOS DE ENTRADA:');
            console.log('VehÃ­culos configurados:', vehiculos.length);
            vehiculos.forEach((vehiculo, index) => {
                console.log(`  Unidad ${index + 1}:`, {
                    tipo: vehiculo.tipo,
                    soluciones: vehiculo.soluciones?.map(s => s.tipo_solucion) || []
                });
            });
            
            console.log('2. PROCESAMIENTO PASO A PASO:');
            let todosLosInsumos = {};
            let debugInfo = {
                equiposAutomaticos: {},
                insumosPorSolucion: {},
                accesoriosTelemetria: {},
                consolidacion: {}
            };
            
            // Debug equipos automÃ¡ticos
            const equiposAutomaticos = generarEquiposAutomaticos(vehiculos);
            debugInfo.equiposAutomaticos = equiposAutomaticos;
            console.log('2.1 Equipos automÃ¡ticos generados:', equiposAutomaticos);
            
            // Debug insumos por soluciÃ³n
            vehiculos.forEach((vehiculo, unidadIndex) => {
                const tipoUnidad = vehiculo.tipo || 'Tracto';
                console.log(`2.2 Procesando Unidad ${unidadIndex + 1} (${tipoUnidad}):`);
                
                if (vehiculo.soluciones && vehiculo.soluciones.length > 0) {
                    vehiculo.soluciones.forEach((solucion, solIndex) => {
                        const tipoSolucion = solucion.tipo_solucion;
                        const insumosSugeridos = obtenerInsumosSugeridos(tipoUnidad, tipoSolucion);
                        
                        const clave = `U${unidadIndex + 1}_S${solIndex + 1}_${tipoSolucion}`;
                        debugInfo.insumosPorSolucion[clave] = {
                            tipoUnidad,
                            tipoSolucion,
                            insumos: insumosSugeridos,
                            cantidad: insumosSugeridos.length
                        };
                        
                        console.log(`    SoluciÃ³n ${solIndex + 1} (${tipoSolucion}):`, insumosSugeridos.length, 'insumos');
                        insumosSugeridos.forEach(insumo => {
                            console.log(`      - ${insumo.nombre}: ${insumo.cantidad}`);
                        });
                        
                        // Consolidar en todosLosInsumos
                        insumosSugeridos.forEach(insumo => {
                            const key = insumo.nombre;
                            if (todosLosInsumos[key]) {
                                const cantidadAnterior = parseFloat(todosLosInsumos[key].cantidad) || 0;
                                const cantidadNueva = parseFloat(insumo.cantidad) || 0;
                                
                                if (!isNaN(cantidadAnterior) && !isNaN(cantidadNueva)) {
                                    todosLosInsumos[key].cantidad = cantidadAnterior + cantidadNueva;
                                } else {
                                    // Si no se pueden convertir a nÃºmeros, mantener como string
                                    todosLosInsumos[key].cantidad = `${todosLosInsumos[key].cantidad} + ${insumo.cantidad}`;
                                }
                                todosLosInsumos[key].unidades.push(`Unidad ${unidadIndex + 1} (${tipoSolucion})`);
                                console.log(`      âœ“ SUMA: ${key} = ${cantidadAnterior} + ${cantidadNueva} = ${todosLosInsumos[key].cantidad}`);
                            } else {
                                todosLosInsumos[key] = {
                                    nombre: insumo.nombre,
                                    cantidad: insumo.cantidad,
                                    unidades: [`Unidad ${unidadIndex + 1} (${tipoSolucion})`],
                                    sugerido: true,
                                    categoria: obtenerCategoriaInsumo(insumo.nombre)
                                };
                                console.log(`      âœ“ NUEVO: ${key} = ${insumo.cantidad}`);
                            }
                        });
                    });
                }
            });
            
            console.log('3. RESULTADO FINAL CONSOLIDADO:');
            Object.values(todosLosInsumos).forEach(insumo => {
                console.log(`  ${insumo.nombre}: ${insumo.cantidad} (${insumo.unidades.length} fuentes)`);
            });
            
            console.log('4. COMPARACIÃ“N POR CATEGORÃAS:');
            const insumosPorCategoria = {
                equipos: [],
                accesorios: [],
                insumos: []
            };
            
            Object.values(todosLosInsumos).forEach(insumo => {
                const categoria = insumo.categoria || 'insumos';
                insumosPorCategoria[categoria].push(insumo);
            });
            
            console.log('  Equipos:', insumosPorCategoria.equipos.length);
            console.log('  Accesorios:', insumosPorCategoria.accesorios.length);
            console.log('  Materia Prima:', insumosPorCategoria.insumos.length);
            
            console.log('=== FIN DEBUG DE CÃLCULOS ===');
            
            // Mostrar modal con resumen
            mostrarModalDebug(debugInfo, todosLosInsumos);
        }
        
        function mostrarModalDebug(debugInfo, todosLosInsumos) {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">ðŸ› Debug de CÃ¡lculos de Insumos</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                            <p><strong>Revisar en la consola del navegador (F12 â†’ Console) para ver detalles completos.</strong></p>
                            
                            <h6>Resumen de Problemas Potenciales:</h6>
                            <div class="alert alert-info">
                                <ul class="mb-0">
                                    <li><strong>Duplicaciones:</strong> Busca elementos que aparezcan mÃºltiples veces</li>
                                    <li><strong>Cantidades incorrectas:</strong> Verifica sumas en la consola</li>
                                    <li><strong>CategorizaciÃ³n:</strong> Revisa si los elementos estÃ¡n en la categorÃ­a correcta</li>
                                </ul>
                            </div>
                            
                            <h6>Insumos Consolidados (${Object.keys(todosLosInsumos).length} total):</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Insumo</th>
                                            <th>Cantidad</th>
                                            <th>CategorÃ­a</th>
                                            <th>Fuentes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${Object.values(todosLosInsumos).map(insumo => `
                                            <tr>
                                                <td>${insumo.nombre}</td>
                                                <td><span class="badge" style="background-color: #fb930c;">${insumo.cantidad}</span></td>
                                                <td><span class="badge bg-secondary">${insumo.categoria}</span></td>
                                                <td><small>${insumo.unidades.join(', ')}</small></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();
            
            modal.addEventListener('hidden.bs.modal', () => {
                document.body.removeChild(modal);
            });
        }

        // InicializaciÃ³n
        document.addEventListener('DOMContentLoaded', async function() {
            await cargarPreciosCache();
            cargarInsumos();
            cargarServicios();
            cargarAccesorios();
            cargarProgreso();
            
            // Actualizar selects con tipos globales
            actualizarTodosLosSelects();
            
            // Suscribirse a cambios en tiempo real de precios
            if (modoCentralizado && window.dataService && window.dataService.subscribePreciosElementos) {
                console.log('ðŸ”„ SuscribiÃ©ndose a cambios de precios en tiempo real...');
                window.dataService.subscribePreciosElementos((payload) => {
                    console.log('ðŸ’² Cambio en precios detectado:', payload);
                    // Recargar precios cuando hay cambios
                    cargarPreciosCache().then(() => {
                        console.log('âœ… Precios actualizados en tiempo real');
                        // Recalcular total si estamos en una cotizaciÃ³n
                        if (typeof calcularTotalCotizacion === 'function') {
                            const unidades = document.getElementById('unidades')?.value || 1;
                            const cotizacionData = obtenerDatosCotizacion();
                            if (cotizacionData) {
                                calcularTotalCotizacion(unidades, cotizacionData);
                            }
                        }
                    });
                });
            }
            
            // Generar fecha de vencimiento automÃ¡tica (15 dÃ­as desde hoy) - ACTUALIZADO
            const fechaVencimiento = new Date();
            fechaVencimiento.setDate(fechaVencimiento.getDate() + 15);
            document.getElementById('fecha_vencimiento').value = fechaVencimiento.toISOString().split('T')[0];
            
            // Verificar si estamos en modo ediciÃ³n
            const urlParams = new URLSearchParams(window.location.search);
            const editarId = urlParams.get('editar');
            
            if (!editarId) {
                // Solo agregar unidad por defecto si NO hay borrador con unidades
                const progreso = localStorage.getItem('cotizacion_progreso');
                let tieneUnidades = false;
                try {
                    if (progreso) {
                        const tmp = JSON.parse(progreso);
                        tieneUnidades = Array.isArray(tmp?.vehiculos) && tmp.vehiculos.length > 0;
                    }
                } catch (_) { /* ignorar */ }
                if (!tieneUnidades) {
                    agregarUnidadVehiculo();
                }
            }
            
            // Establecer fecha con mÃºltiples intentos
            setTimeout(establecerFechaVencimiento, 300);
            setTimeout(establecerFechaVencimiento, 800);
            setTimeout(establecerFechaVencimiento, 1500);
            
            // Cargar datos de ediciÃ³n si aplica
            setTimeout(cargarDatosEdicion, 1000);
        });

        // NavegaciÃ³n del wizard (funciones movidas al inicio del script)

        function mostrarPaso(step) {
            console.log(`ðŸ”„ DEBUG: Mostrando paso ${step}...`);
            // Ocultar todos los pasos
            document.querySelectorAll('.step-content').forEach(el => {
                el.classList.remove('active');
            });
            
            // Mostrar paso actual
            document.getElementById(`step${step}`).classList.add('active');
            
            // Actualizar indicadores
            document.querySelectorAll('.step').forEach((el, index) => {
                el.classList.remove('active', 'completed', 'inactive');
                if (index + 1 < step) {
                    el.classList.add('completed');
                } else if (index + 1 === step) {
                    el.classList.add('active');
                } else {
                    el.classList.add('inactive');
                }
            });
            
            // Actualizar botones
            document.getElementById('prevBtn').disabled = step === 1;
            const nextBtn = document.getElementById('nextBtn');
            if (step === 4) {
                nextBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Crear CotizaciÃ³n';
                nextBtn.onclick = crearCotizacionFinal;
            } else {
                nextBtn.innerHTML = 'Siguiente<i class="bi bi-arrow-right ms-1"></i>';
                nextBtn.onclick = nextStep;
            }
            
            // Establecer fecha cuando se muestra el paso 1
            if (step === 1) {
                setTimeout(establecerFechaVencimiento, 100);
            }
            
            // Cargar insumos cuando se muestra el paso 3
            if (step === 3) {
                console.log('ðŸ”„ DEBUG: Mostrando paso 3, actualizando tabla de insumos...');
                
                // LOG CRÃTICO: Ver el estado ANTES del setTimeout
                console.log(`ðŸš¨ PRE-TIMEOUT: cotizacionData.vehiculos[0].soluciones[0].configuraciones:`, cotizacionData.vehiculos[0]?.soluciones[0]?.configuraciones);
                console.log(`ðŸš¨ PRE-TIMEOUT: modulo_insider especÃ­fico:`, cotizacionData.vehiculos[0]?.soluciones[0]?.configuraciones?.modulo_insider);
                console.log(`ðŸš¨ PRE-TIMEOUT: Object.keys:`, Object.keys(cotizacionData.vehiculos[0]?.soluciones[0]?.configuraciones || {}));
                
                setTimeout(() => {
                    // LOG CRÃTICO: Ver el estado DESPUÃ‰S del setTimeout pero ANTES de las funciones de carga
                    console.log(`ðŸš¨ POST-TIMEOUT ANTES CARGAS: cotizacionData.vehiculos[0].soluciones[0].configuraciones:`, cotizacionData.vehiculos[0]?.soluciones[0]?.configuraciones);
                    console.log(`ðŸš¨ POST-TIMEOUT ANTES CARGAS: modulo_insider especÃ­fico:`, cotizacionData.vehiculos[0]?.soluciones[0]?.configuraciones?.modulo_insider);
                    
                    cargarInsumos();
                    cargarServicios();
                    cargarAccesorios();
                    
                    // LOG CRÃTICO: Ver el estado DESPUÃ‰S de las funciones de carga
                    console.log(`ðŸš¨ POST-CARGAS: cotizacionData.vehiculos[0].soluciones[0].configuraciones:`, cotizacionData.vehiculos[0]?.soluciones[0]?.configuraciones);
                    console.log(`ðŸš¨ POST-CARGAS: modulo_insider especÃ­fico:`, cotizacionData.vehiculos[0]?.soluciones[0]?.configuraciones?.modulo_insider);
                    
                    // Actualizar la tabla de insumos sugeridos
                    console.log('ðŸ”„ DEBUG: Llamando a generarInsumosSugeridos() desde paso 3...');
                    console.log(`ðŸš¨ CRÃTICO ANTES DE GENERAR: cotizacionData.vehiculos[0].soluciones[0].configuraciones:`, cotizacionData.vehiculos[0]?.soluciones[0]?.configuraciones);
                    console.log(`ðŸš¨ CRÃTICO ANTES DE GENERAR: modulo_insider especÃ­fico:`, cotizacionData.vehiculos[0]?.soluciones[0]?.configuraciones?.modulo_insider);
                    generarInsumosSugeridos();
                }, 100);
            }
            
            document.getElementById('currentStep').textContent = step;
        }

        function actualizarProgreso() {
            const progress = (currentStepNumber / 4) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
        }

        function validarPasoActual() {
            switch(currentStepNumber) {
                case 1:
                    return document.getElementById('cliente_nombre').value.trim() !== '';
                case 2:
                    return document.querySelectorAll('.unidad-vehiculo-item').length > 0;
                default:
                    return true;
            }
        }

        function guardarPasoActual() {
            // Guardar datos del paso actual
            switch(currentStepNumber) {
                case 1:
                    cotizacionData.cliente = {
                        nombre: document.getElementById('cliente_nombre').value,
                        empresa: document.getElementById('cliente_empresa').value,
                        tipo: document.getElementById('tipo_cliente').value,
                        descuento: document.getElementById('descuento').value,
                        fecha_vencimiento: document.getElementById('fecha_vencimiento').value,
                        urgente: document.getElementById('urgente').value,
                        dias_seguimiento: document.getElementById('dias_seguimiento').value || '7',
                        observaciones: document.getElementById('observaciones').value
                    };
                    break;
                case 2:
                    // ðŸš¨ CRÃTICO: Preservar configuraciones existentes antes de sobrescribir
                    const vehiculosExistentes = cotizacionData.vehiculos || [];
                    console.log(`ðŸš¨ PRESERVANDO CONFIGURACIONES EXISTENTES:`, vehiculosExistentes);
                    
                    cotizacionData.vehiculos = [];
                    
                    // Obtener cantidad de lote si estÃ¡ especificada
                    const cantidadLote = document.getElementById('cantidadUnidadesLote')?.value;
                    cotizacionData.cantidadLote = cantidadLote ? parseInt(cantidadLote) : null;
                    
                    // Obtener tipo de venta
                    const tipoVenta = document.getElementById('tipoVenta')?.value;
                    cotizacionData.tipoVenta = tipoVenta || 'instalacion';
                    
                    document.querySelectorAll('.unidad-vehiculo-item').forEach((item, index) => {
                        const vehiculo = {
                            marca: item.querySelector('[name^="vehiculo_marca_"]').value,
                            tipo: item.querySelector('[name^="vehiculo_tipo_"]').value,
                            combustible: item.querySelector('[name^="vehiculo_combustible_"]').value,
                            voltaje: item.querySelector('[name^="vehiculo_voltaje_"]').value,
                            modelo: item.querySelector('[name^="vehiculo_modelo_"]').value,
                            año: item.querySelector('[name^="vehiculo_año_"]').value,
                            soluciones: [],
                            cantidadLote: index === 0 ? cotizacionData.cantidadLote : null // Solo la primera unidad lleva la cantidad de lote
                        };
                        
                        // Obtener soluciones para esta unidad
                        const unidadId = index + 1; // El ID de la unidad basado en el Ã­ndice
                        const solucionesContainer = document.querySelector(`.soluciones-unidad-container-${unidadId}`);
                        if (solucionesContainer) {
                            const solucionesItems = solucionesContainer.querySelectorAll('.solucion-item');
                            solucionesItems.forEach((solucionItem, solucionIndex) => {
                                const tipoSelect = solucionItem.querySelector('.solucion-tipo');
                                if (tipoSelect && tipoSelect.value) {
                                    // ðŸš¨ CRÃTICO: Preservar configuraciones existentes de esta soluciÃ³n
                                    const configuracionesExistentes = vehiculosExistentes[index]?.soluciones[solucionIndex]?.configuraciones || {};
                                    console.log(`ðŸš¨ PRESERVANDO configuraciones unidad ${index} soluciÃ³n ${solucionIndex}:`, configuracionesExistentes);
                                    
                                    const solucion = {
                                        tipo_solucion: tipoSelect.value,
                                        configuraciones: { ...configuracionesExistentes } // ðŸš¨ Comenzar con configuraciones existentes
                                    };
                                    
                                    // Obtener todas las configuraciones
                                    const configuracionesContainer = solucionItem.querySelector('.configuraciones-solucion');
                                    if (configuracionesContainer) {
                                        // Checkboxes marcados
                                        const checkboxes = configuracionesContainer.querySelectorAll('input[type="checkbox"]:checked');
                                        checkboxes.forEach(checkbox => {
                                            const configName = checkbox.name.replace(`${tipoSelect.name.replace('_tipo', '')}_`, '');
                                            solucion.configuraciones[configName] = true;
                                        });
                                        
                                        // Radio buttons seleccionados
                                        const radios = configuracionesContainer.querySelectorAll('input[type="radio"]:checked');
                                        radios.forEach(radio => {
                                            const configName = radio.name.replace(`${tipoSelect.name.replace('_tipo', '')}_`, '');
                                            solucion.configuraciones[configName] = radio.value;
                                        });
                                        
                                        // Selects con valores
                                        const selects = configuracionesContainer.querySelectorAll('select');
                                        selects.forEach(select => {
                                            if (select.value) {
                                                const configName = select.name.replace(`${tipoSelect.name.replace('_tipo', '')}_`, '');
                                                solucion.configuraciones[configName] = select.value;
                                            }
                                        });
                                        
                                        // Inputs numÃ©ricos con valores
                                        const numberInputs = configuracionesContainer.querySelectorAll('input[type="number"]');
                                        numberInputs.forEach(input => {
                                            if (input.value) {
                                                const configName = input.name.replace(`${tipoSelect.name.replace('_tipo', '')}_`, '');
                                                solucion.configuraciones[configName] = input.value;
                                            }
                                        });
                                        
                                        // Textareas con contenido
                                        const textareas = configuracionesContainer.querySelectorAll('textarea');
                                        textareas.forEach(textarea => {
                                            if (textarea.value.trim()) {
                                                const configName = textarea.name.replace(`${tipoSelect.name.replace('_tipo', '')}_`, '');
                                                solucion.configuraciones[configName] = textarea.value.trim();
                                            }
                                        });
                                    }
                                    
                                    // ðŸš¨ LOG CRÃTICO: Verificar que modulo_insider se preservÃ³
                                    console.log(`ðŸš¨ CONFIGURACIONES FINALES unidad ${index} soluciÃ³n ${solucionIndex}:`, solucion.configuraciones);
                                    console.log(`ðŸš¨ modulo_insider preservado:`, solucion.configuraciones.modulo_insider);
                                    
                                    vehiculo.soluciones.push(solucion);
                                }
                            });
                        }
                        
                        cotizacionData.vehiculos.push(vehiculo);
                    });
                    break;
                case 3:
                    cotizacionData.insumos = [];
                    cotizacionData.insumosSugeridos = [];
                    cotizacionData.servicios = [];
                    cotizacionData.accesorios = [];
                    cotizacionData.accesoriosSugeridos = [];
                    
                    // Guardar insumos sugeridos seleccionados
                    document.querySelectorAll('[name^="insumo_sugerido_"]:checked').forEach(checkbox => {
                        // Buscar la cantidad en la tabla de insumos sugeridos
                        const row = checkbox.closest('tr');
                        // Buscar especÃ­ficamente el badge de cantidad (no el de telemetrÃ­a)
                        const cantidadBadge = row.querySelector('td:nth-child(3) .badge');
                        const cantidadText = cantidadBadge ? cantidadBadge.textContent.trim() : '1';
                        
                        // Usar parseFloat para manejar decimales correctamente
                        const cantidad = parseFloat(cantidadText) || 1;
                        
                        cotizacionData.insumosSugeridos.push({
                            nombre: checkbox.value,
                            cantidad: cantidad,
                            sugerido: true
                        });
                        
                        console.log(`ðŸ’¾ Guardando insumo: ${checkbox.value} = ${cantidad} (texto: "${cantidadText}")`);
                    });
                    
                    // Guardar insumos adicionales
                    cotizacionData.insumos = [...insumosAdicionalesSeleccionados];
                    
                    serviciosMaestros.forEach(servicio => {
                        const checkbox = document.getElementById(`servicio_${servicio.replace(/\s+/g, '_')}`);
                        if (checkbox && checkbox.checked) {
                            cotizacionData.servicios.push(servicio);
                        }
                    });
                    
                    accesoriosMaestros.forEach(accesorio => {
                        const checkbox = document.getElementById(`accesorio_${accesorio.replace(/\s+/g, '_')}`);
                        if (checkbox && checkbox.checked) {
                            cotizacionData.accesorios.push(accesorio);
                        }
                    });
                    
                    // Guardar accesorios sugeridos
                    const accesoriosSugeridosCheckboxes = document.querySelectorAll('.accesorio-sugerido-checkbox:checked');
                    accesoriosSugeridosCheckboxes.forEach(checkbox => {
                        const row = checkbox.closest('tr');
                        // Buscar especÃ­ficamente el badge de cantidad (no el de telemetrÃ­a)
                        const cantidadBadge = row.querySelector('td:nth-child(3) .badge');
                        const cantidadText = cantidadBadge ? cantidadBadge.textContent.trim() : '1';
                        
                        // Usar parseFloat para manejar decimales correctamente
                        const cantidad = parseFloat(cantidadText) || 1;
                        
                        cotizacionData.accesoriosSugeridos.push({
                            nombre: checkbox.value,
                            cantidad: cantidad,
                            sugerido: true
                        });
                        
                        console.log(`ðŸ’¾ Guardando accesorio: ${checkbox.value} = ${cantidad} (texto: "${cantidadText}")`);
                    });
                    break;
            }
            
            // Auto-guardar
            localStorage.setItem('cotizacion_progreso', JSON.stringify(cotizacionData));
            mostrarAutoGuardado();
        }

        function cargarProgreso() {
            const progreso = localStorage.getItem('cotizacion_progreso');
            if (!progreso) return;
            try {
                cotizacionData = JSON.parse(progreso);
            } catch (_) { return; }

            // Paso 1: Cliente
            if (cotizacionData.cliente) {
                const c = cotizacionData.cliente;
                const el = (id) => document.getElementById(id);
                if (el('cliente_nombre')) el('cliente_nombre').value = c.nombre || '';
                if (el('cliente_empresa')) el('cliente_empresa').value = c.empresa || '';
                if (el('tipo_cliente')) el('tipo_cliente').value = c.tipo || '';
                actualizarDescuento();
                if (el('descuento') && c.descuento !== undefined && c.descuento !== null) el('descuento').value = c.descuento;
                if (el('fecha_vencimiento')) el('fecha_vencimiento').value = c.fecha_vencimiento || '';
                if (el('urgente')) el('urgente').value = c.urgente || 'baja';
                if (el('dias_seguimiento')) el('dias_seguimiento').value = c.dias_seguimiento || '7';
                if (el('observaciones')) el('observaciones').value = c.observaciones || '';
            }

            // Paso 2: Tipo de venta y Unidades/Soluciones
            const setTipoVenta = () => {
                const tv = document.getElementById('tipoVenta');
                if (tv && cotizacionData.tipoVenta) tv.value = cotizacionData.tipoVenta;
            };
            setTipoVenta();

            const contUnidades = document.getElementById('unidadesVehiculoContainer');
            if (contUnidades && Array.isArray(cotizacionData.vehiculos) && cotizacionData.vehiculos.length > 0) {
                contUnidades.innerHTML = '';
                unidadVehiculoCounter = 1;
                cotizacionData.vehiculos.forEach((vehiculo, idx) => {
                    agregarUnidadVehiculo();
                    const unidad = contUnidades.lastElementChild;
                    // Set bÃ¡sicos
                    const setByNameLike = (prefix, value) => {
                        const input = unidad.querySelector(`[name^="${prefix}"]`);
                        if (input && value !== undefined && value !== null) input.value = value;
                    };
                    setByNameLike('vehiculo_marca_', vehiculo.marca || '');
                    setByNameLike('vehiculo_tipo_', vehiculo.tipo || vehiculo.tipo_unidad || '');
                    setByNameLike('vehiculo_modelo_', vehiculo.modelo || '');
                    setByNameLike('vehiculo_año_', vehiculo.año || vehiculo.anio || '');
                    setByNameLike('vehiculo_combustible_', vehiculo.combustible || '');
                    setByNameLike('vehiculo_voltaje_', vehiculo.voltaje || '');

                    // Soluciones de la unidad
                    const unidadId = idx + 1;
                    if (Array.isArray(vehiculo.soluciones)) {
                        const containerSol = unidad.querySelector(`.soluciones-unidad-container-${unidadId}`);
                        vehiculo.soluciones.forEach((sol) => {
                            agregarSolucionAUnidadWizard(null, unidadId);
                            const allSol = (containerSol || unidad).querySelectorAll('.solucion-item');
                            const nueva = allSol[allSol.length - 1];
                            const sel = nueva.querySelector('.solucion-tipo');
                            if (sel) {
                                sel.value = sol.tipo_solucion || sol.tipo || '';
                                mostrarConfiguracionesSolucionWizard(sel);
                                // Aplicar configuraciones
                                const cfg = sol.configuraciones || {};
                                Object.keys(cfg).forEach((k) => {
                                    const val = cfg[k];
                                    // Buscar input/select por sufijo de nombre
                                    const candidate = nueva.querySelector(`[name$="_${k}"]`);
                                    if (!candidate) return;
                                    if (candidate.type === 'checkbox') {
                                        candidate.checked = !!val;
                                    } else if (candidate.type === 'radio') {
                                        const radio = nueva.querySelector(`[name$="_${k}"][value="${val}"]`);
                                        if (radio) radio.checked = true;
                                    } else {
                                        candidate.value = val;
                                    }
                                });
                            }
                        });
                    }
                });
                // Cantidad de lote
                const cant = document.getElementById('cantidadUnidadesLote');
                if (cant && cotizacionData.cantidadLote) cant.value = cotizacionData.cantidadLote;
            }
        }

        function mostrarAutoGuardado() {
            const indicator = document.getElementById('autoSaveIndicator');
            indicator.classList.add('show');
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);
        }

        async function guardarBorradorSupabase() {
            // Generar/recuperar ID de borrador consistente
            let draftId = localStorage.getItem('cotizacion_progreso_id');
            if (!draftId) {
                draftId = `DRAFT-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
                localStorage.setItem('cotizacion_progreso_id', draftId);
            }

            // Asegurar que vehiculos y soluciones estÃ©n sincronizados desde el DOM
            try {
                sincronizarVehiculosYSolucionesDesdeDOM();
            } catch (_) {}

            // Construir objeto de cotizaciÃ³n (borrador)
            const draft = construirBorradorDesdeDatos(cotizacionData, draftId);
            // Upsert en Supabase
            await window.dataService.upsertCotizacion(draft);
        }

        function construirBorradorDesdeDatos(data, draftId) {
            const cliente = data.cliente || {};
            // Mapear vehiculos a "unidades" bÃ¡sicas del borrador
            const unidades = Array.isArray(data.vehiculos) ? data.vehiculos.map(v => ({
                marca: v.marca || '',
                tipo_unidad: v.tipo || v.tipo_unidad || '',
                modelo: v.modelo || '',
                anio: v.año || v.anio || '',
                combustible: v.combustible || '',
                voltaje: v.voltaje || '',
                soluciones: Array.isArray(v.soluciones) ? v.soluciones : []
            })) : [];

            // Intentar calcular total si hay precios en cache; si falla, 0
            let total = 0;
            try { total = calcularTotalCotizacion(unidades, data) || 0; } catch (_) { total = 0; }

            const draft = {
                id: draftId,
                estado: 'borrador',
                fecha_cotizacion: new Date().toISOString().split('T')[0],
                cliente_nombre: cliente.nombre || '',
                empresa: cliente.empresa || '',
                tipo_cliente: cliente.tipo || '',
                descuento: cliente.descuento || 0,
                fecha_vencimiento: cliente.fecha_vencimiento || '',
                urgente: cliente.urgente || 'baja',
                dias_seguimiento: cliente.dias_seguimiento || '7',
                observaciones: cliente.observaciones || '',
                tipoVenta: data.tipoVenta || 'instalacion',
                cantidadLote: data.cantidadLote || null,
                unidades,
                soluciones: data.soluciones || [],
                insumos: data.insumos || [],
                servicios: data.servicios || [],
                accesorios: data.accesorios || [],
                insumosSugeridos: data.insumosSugeridos || [],
                accesoriosSugeridos: data.accesoriosSugeridos || [],
                equiposAutomaticos: data.equiposAutomaticos || {},
                equipos: data.equipos || {},
                // Campos de progreso de ventas
                fecha_envio: null,
                fecha_seguimiento: null,
                fecha_aceptacion: null,
                fecha_rechazo: null,
                fecha_instalacion: null,
                fecha_facturacion: null,
                observaciones_rechazo: null,
                facturada: false,
                total: Number(total) || 0
            };
            return draft;
        }

        // Fuerza una recolecciÃ³n de unidades y soluciones desde el DOM (independiente del paso activo)
        function sincronizarVehiculosYSolucionesDesdeDOM() {
            const cantidadLoteInput = document.getElementById('cantidadUnidadesLote');
            const tipoVentaSelect = document.getElementById('tipoVenta');
            const cantidadLote = cantidadLoteInput && cantidadLoteInput.value ? parseInt(cantidadLoteInput.value) : null;
            const tipoVenta = tipoVentaSelect && tipoVentaSelect.value ? tipoVentaSelect.value : (cotizacionData.tipoVenta || 'instalacion');
            cotizacionData.cantidadLote = cantidadLote;
            cotizacionData.tipoVenta = tipoVenta;

            const nuevasUnidades = [];
            const items = document.querySelectorAll('.unidad-vehiculo-item');
            items.forEach((item, index) => {
                const vehiculo = {
                    marca: item.querySelector('[name^="vehiculo_marca_"]').value,
                    tipo: item.querySelector('[name^="vehiculo_tipo_"]').value,
                    combustible: item.querySelector('[name^="vehiculo_combustible_"]').value,
                    voltaje: item.querySelector('[name^="vehiculo_voltaje_"]').value,
                    modelo: item.querySelector('[name^="vehiculo_modelo_"]').value,
                    año: item.querySelector('[name^="vehiculo_año_"]').value,
                    soluciones: [],
                    cantidadLote: index === 0 ? cotizacionData.cantidadLote : null
                };
                const unidadId = index + 1;
                const solucionesContainer = document.querySelector(`.soluciones-unidad-container-${unidadId}`);
                if (solucionesContainer) {
                    const solucionesItems = solucionesContainer.querySelectorAll('.solucion-item');
                    solucionesItems.forEach(solucionItem => {
                        const tipoSelect = solucionItem.querySelector('.solucion-tipo');
                        if (tipoSelect && tipoSelect.value) {
                            const solucion = { tipo_solucion: tipoSelect.value, configuraciones: {} };
                            const configuracionesContainer = solucionItem.querySelector('.configuraciones-solucion');
                            if (configuracionesContainer) {
                                const checkboxes = configuracionesContainer.querySelectorAll('input[type="checkbox"]:checked');
                                checkboxes.forEach(checkbox => {
                                    const configName = checkbox.name.replace(`${tipoSelect.name.replace('_tipo', '')}_`, '');
                                    solucion.configuraciones[configName] = true;
                                });
                                const radios = configuracionesContainer.querySelectorAll('input[type="radio"]:checked');
                                radios.forEach(radio => {
                                    const configName = radio.name.replace(`${tipoSelect.name.replace('_tipo', '')}_`, '');
                                    solucion.configuraciones[configName] = radio.value;
                                });
                                const selects = configuracionesContainer.querySelectorAll('select');
                                selects.forEach(select => {
                                    if (select.value) {
                                        const configName = select.name.replace(`${tipoSelect.name.replace('_tipo', '')}_`, '');
                                        solucion.configuraciones[configName] = select.value;
                                    }
                                });
                                const numberInputs = configuracionesContainer.querySelectorAll('input[type="number"]');
                                numberInputs.forEach(input => {
                                    if (input.value) {
                                        const configName = input.name.replace(`${tipoSelect.name.replace('_tipo', '')}_`, '');
                                        solucion.configuraciones[configName] = input.value;
                                    }
                                });
                                const textareas = configuracionesContainer.querySelectorAll('textarea');
                                textareas.forEach(textarea => {
                                    if (textarea.value.trim()) {
                                        const configName = textarea.name.replace(`${tipoSelect.name.replace('_tipo', '')}_`, '');
                                        solucion.configuraciones[configName] = textarea.value.trim();
                                    }
                                });
                            }
                            vehiculo.soluciones.push(solucion);
                        }
                    });
                }
                nuevasUnidades.push(vehiculo);
            });
            cotizacionData.vehiculos = nuevasUnidades;
        }

        // FunciÃ³n actualizarDescuento movida al inicio del script

        function agregarUnidadVehiculo() {
            const container = document.getElementById('unidadesVehiculoContainer');
            const unidadDiv = document.createElement('div');
            unidadDiv.className = 'unidad-vehiculo-item';
            unidadDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0" style="color: #fb930c;">Unidad #${unidadVehiculoCounter}</h6>
                    <div>
                        ${unidadVehiculoCounter > 1 ? `
                            <button type="button" class="btn btn-outline-info btn-sm me-2" onclick="copiarUnidadAnteriorWizard(this)">
                                <i class="bi bi-copy"></i> Copiar Anterior
                            </button>
                        ` : ''}
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="eliminarUnidadVehiculo(this)">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-3">
                        <label class="form-label fw-bold" for="vehiculo_tipo_${unidadVehiculoCounter}">Tipo de Unidad</label>
                        <select class="form-select" id="vehiculo_tipo_${unidadVehiculoCounter}" name="vehiculo_tipo_${unidadVehiculoCounter}">
                            <option value="">Seleccionar tipo</option>
                            <option value="1.5 ton">1.5 ton</option>
                            <option value="2.5 ton">2.5 ton</option>
                            <option value="3.5 ton">3.5 ton</option>
                            <option value="4.5 ton">4.5 ton</option>
                            <option value="Autobus pasajeros">Autobus pasajeros</option>
                            <option value="Motocicleta">Motocicleta</option>
                            <option value="RabÃ³n">RabÃ³n</option>
                            <option value="Sedan">Sedan</option>
                            <option value="Sedan lujo">Sedan lujo</option>
                            <option value="SUV">SUV</option>
                            <option value="Torton">Torton</option>
                            <option value="Tracto">Tracto</option>
                            <option value="Tracto Cabina sobre motor">Tracto Cabina sobre motor</option>
                            <option value="Van pasajeros">Van pasajeros</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-bold" for="vehiculo_marca_${unidadVehiculoCounter}">Marca del VehÃ­culo</label>
                        <select class="form-select" id="vehiculo_marca_${unidadVehiculoCounter}" name="vehiculo_marca_${unidadVehiculoCounter}">
                            <option value="">Seleccionar marca</option>
                            <option value="DAF">DAF</option>
                            <option value="Ford">Ford</option>
                            <option value="Foton">Foton</option>
                            <option value="Freightliner">Freightliner</option>
                            <option value="Hino">Hino</option>
                            <option value="International">International</option>
                            <option value="Isuzu">Isuzu</option>
                            <option value="Kenworth">Kenworth</option>
                            <option value="MACK">MACK</option>
                            <option value="MAN">MAN</option>
                            <option value="Mercedes">Mercedes</option>
                            <option value="Nissan">Nissan</option>
                            <option value="otro">Otro</option>
                            <option value="Scania">Scania</option>
                            <option value="Shacman">Shacman</option>
                            <option value="Volvo">Volvo</option>
                            <option value="VW">VW</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label fw-bold" for="vehiculo_combustible_${unidadVehiculoCounter}">Combustible</label>
                        <select class="form-select" id="vehiculo_combustible_${unidadVehiculoCounter}" name="vehiculo_combustible_${unidadVehiculoCounter}">
                            <option value="">Seleccionar</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Electrico">ElÃ©ctrico</option>
                            <option value="Gas LP">Gas LP</option>
                            <option value="Gasolina">Gasolina</option>
                            <option value="Hibrido">HÃ­brido</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label fw-bold" for="vehiculo_voltaje_${unidadVehiculoCounter}">Voltaje</label>
                        <select class="form-select" id="vehiculo_voltaje_${unidadVehiculoCounter}" name="vehiculo_voltaje_${unidadVehiculoCounter}">
                            <option value="">Voltaje</option>
                            <option value="12v">12v</option>
                            <option value="24v">24v</option>
                            <option value="36v">36v</option>
                        </select>
                    </div>
                    <div class="col-md-1">
                        <label class="form-label fw-bold" for="vehiculo_modelo_${unidadVehiculoCounter}">Modelo</label>
                        <input type="text" class="form-control" id="vehiculo_modelo_${unidadVehiculoCounter}" name="vehiculo_modelo_${unidadVehiculoCounter}" placeholder="Modelo">
                    </div>
                    <div class="col-md-1">
                        <label class="form-label fw-bold" for="vehiculo_año_${unidadVehiculoCounter}">AÃ±o</label>
                        <input type="number" class="form-control" id="vehiculo_año_${unidadVehiculoCounter}" name="vehiculo_año_${unidadVehiculoCounter}" min="1990" max="2025" placeholder="AÃ±o">
                    </div>
                </div>
                
                <!-- SecciÃ³n de soluciones para esta unidad -->
                <div class="mt-4 border-top pt-3">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="text-success mb-0">ðŸ”§ Soluciones para esta unidad</h6>
                        <div>
                            ${unidadVehiculoCounter > 1 ? `
                                <button type="button" class="btn btn-sm btn-outline-info me-2" onclick="copiarSolucionesDeUnidadAnterior(${unidadVehiculoCounter})">
                                    <i class="bi bi-copy"></i> Copiar de Unidad Anterior
                                </button>
                            ` : ''}
                            <button type="button" class="btn btn-sm btn-success" onclick="agregarSolucionAUnidadWizard(this, ${unidadVehiculoCounter})">
                                <i class="bi bi-plus"></i> Agregar SoluciÃ³n
                            </button>
                        </div>
                    </div>
                    <div class="soluciones-unidad-container-${unidadVehiculoCounter}">
                        <p class="text-muted">No hay soluciones agregadas. Haz clic en "Agregar SoluciÃ³n" para comenzar.</p>
                    </div>
                </div>
            `;
            container.appendChild(unidadDiv);
            unidadVehiculoCounter++;
            
            // Actualizar selects con tipos globales
            setTimeout(() => {
                actualizarTodosLosSelects();
            }, 100);
        }

        function eliminarUnidadVehiculo(button) {
            button.closest('.unidad-vehiculo-item').remove();
        }



        function toggleSolution(solutionId) {
            const checkbox = document.getElementById(`sol_${solutionId}`);
            const card = checkbox.closest('.solution-card');
            
            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                card.classList.add('selected');
                if (!selectedSolutions.includes(solutionId)) {
                    selectedSolutions.push(solutionId);
                }
            } else {
                card.classList.remove('selected');
                selectedSolutions = selectedSolutions.filter(id => id !== solutionId);
            }
            
            actualizarConfiguraciones();
        }

        function actualizarConfiguraciones() {
            const container = document.getElementById('configuracionContainer');
            container.innerHTML = '';
            
            if (selectedSolutions.length === 0) {
                container.innerHTML = `
                    <p class="text-muted text-center py-5">
                        Selecciona un tipo de soluciÃ³n en el paso anterior para ver las opciones de configuraciÃ³n.
                    </p>
                `;
                return;
            }
            
            selectedSolutions.forEach(solutionId => {
                const solucion = solucionesMaestras.find(s => s.id === solutionId);
                if (solucion && solucion.configuraciones) {
                    const configDiv = document.createElement('div');
                    configDiv.className = 'config-section active mb-4';
                    configDiv.innerHTML = `
                        <h5 class="mb-3" style="color: #fb930c;">${solucion.nombre}</h5>
                        <div class="row">
                            ${solucion.configuraciones.map(config => `
                                <div class="col-md-4 mb-2">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="config_${solutionId}_${config}">
                                        <label class="form-check-label" for="config_${solutionId}_${config}">
                                            ${config.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </label>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    container.appendChild(configDiv);
                }
            });
        }

        function cargarInsumos() {
            const selectInsumo = document.getElementById('selectInsumoAdicional');
            if (!selectInsumo) {
                console.error('Select selectInsumoAdicional no encontrado');
                return;
            }
            
            // Limpiar opciones existentes (excepto la primera)
            selectInsumo.innerHTML = '<option value="">Seleccionar insumo adicional...</option>';
            
            // Ordenar insumos alfabÃ©ticamente y llenar el dropdown
            const insumosOrdenados = [...insumosMaestros].sort();
            insumosOrdenados.forEach(insumo => {
                const option = document.createElement('option');
                option.value = insumo;
                option.textContent = insumo;
                selectInsumo.appendChild(option);
            });
            
            // Inicializar visualizaciÃ³n vacÃ­a
            actualizarVisualizacionInsumosAdicionales();
        }

        function cargarServicios() {
            const container = document.getElementById('serviciosContainer');
            if (!container) {
                console.error('Container serviciosContainer no encontrado');
                return;
            }
            
            container.innerHTML = '';
            
            serviciosMaestros.forEach(servicio => {
                const item = document.createElement('div');
                item.className = 'form-check mb-2';
                item.innerHTML = `
                    <input class="form-check-input" type="checkbox" id="servicio_${servicio.replace(/\s+/g, '_').replace(/-/g, '_')}">
                    <label class="form-check-label" for="servicio_${servicio.replace(/\s+/g, '_').replace(/-/g, '_')}">
                        ${servicio}
                    </label>
                `;
                container.appendChild(item);
            });
        }

        function cargarAccesorios() {
            const container = document.getElementById('accesoriosContainer');
            if (!container) {
                console.error('Container accesoriosContainer no encontrado');
                return;
            }
            
            container.innerHTML = '';
            
            accesoriosMaestros.forEach(accesorio => {
                const item = document.createElement('div');
                item.className = 'form-check mb-2';
                item.innerHTML = `
                    <input class="form-check-input" type="checkbox" id="accesorio_${accesorio.replace(/\s+/g, '_')}">
                    <label class="form-check-label" for="accesorio_${accesorio.replace(/\s+/g, '_')}">
                        ${accesorio}
                    </label>
                `;
                container.appendChild(item);
            });
        }

        function generarResumen() {
            const container = document.getElementById('resumenContainer');
            const tempData = JSON.parse(localStorage.getItem('cotizacion_temp')) || {};
            container.innerHTML = '';

            // Cliente
            if (tempData.cliente_nombre || cotizacionData.cliente) {
                const clienteDiv = document.createElement('div');
                clienteDiv.className = 'resumen-item';
                clienteDiv.innerHTML = `
                    <h5 style="color: #fb930c;"><i class="bi bi-person-badge me-2"></i>Cliente</h5>
                    <p><strong>Nombre:</strong> ${tempData.cliente_nombre || cotizacionData.cliente?.nombre || 'No especificado'}</p>
                    <p><strong>Empresa:</strong> ${tempData.empresa || cotizacionData.cliente?.empresa || 'N/A'}</p>
                    <p><strong>Tipo:</strong> ${tempData.tipo_cliente || cotizacionData.cliente?.tipo || 'No especificado'} (${tempData.descuento || cotizacionData.cliente?.descuento || 0}% descuento)</p>
                    ${tempData.observaciones ? `<p><strong>Observaciones:</strong> ${tempData.observaciones}</p>` : ''}
                `;
                container.appendChild(clienteDiv);
            }

            // VehÃ­culos/Unidades
            const vehiculos = tempData.unidades || cotizacionData.vehiculos || [];
            if (vehiculos.length > 0) {
                // Calcular total de unidades considerando lotes
                let totalUnidades = 0;
                const cantidadLote = cotizacionData.cantidadLote || tempData.cantidadLote;
                
                vehiculos.forEach((vehiculo, index) => {
                    if (index === 0 && cantidadLote && cantidadLote > 1) {
                        totalUnidades += cantidadLote;
                    } else if (!vehiculo.esLote) {
                        totalUnidades += 1;
                    } else if (index === 0) {
                        totalUnidades += 1;
                    }
                });
                
                const vehiculosDiv = document.createElement('div');
                vehiculosDiv.className = 'resumen-item';
                
                // Detectar si es lote con unidades idÃ©nticas
                const esLoteIdentico = cantidadLote && cantidadLote > 1;
                
                if (esLoteIdentico) {
                    // Mostrar formato compacto para lotes
                    const unidadModelo = vehiculos[0];
                    vehiculosDiv.innerHTML = `
                        <h5 style="color: #fb930c;"><i class="bi bi-truck me-2"></i>CotizaciÃ³n en Lote</h5>
                        <div class="alert alert-success">
                            <div class="row">
                                <div class="col-md-8">
                                    <h6 class="mb-2"><i class="bi bi-layers me-1"></i>Cantidad: ${cantidadLote} unidades idÃ©nticas</h6>
                                    <p class="mb-1"><strong>Modelo:</strong> ${unidadModelo.marca || 'Sin marca'} ${unidadModelo.tipo_unidad || unidadModelo.tipo || 'Sin tipo'} ${unidadModelo.modelo || ''} ${unidadModelo.anio || unidadModelo.año || ''}</p>
                                    <p class="mb-1"><strong>Especificaciones:</strong> ${unidadModelo.combustible || 'Sin combustible'} - ${unidadModelo.voltaje || 'Sin voltaje'}</p>
                                    <p class="mb-0"><strong>Tipo de Venta:</strong> 
                                        <span class="badge ${cotizacionData.tipoVenta === 'instalacion' ? 'bg-success' : 'bg-warning'}">
                                            ${cotizacionData.tipoVenta === 'instalacion' ? 'InstalaciÃ³n por nuestro personal' : 'Solo venta de equipos'}
                                        </span>
                                    </p>
                                </div>
                                <div class="col-md-4 text-end">
                                    <span class="badge fs-6" style="background-color: #fb930c;">${cantidadLote}x</span>
                                </div>
                            </div>
                            ${unidadModelo.soluciones && unidadModelo.soluciones.length > 0 ? `
                                <hr class="my-2">
                                <div class="mt-2">
                                    <strong class="text-success"><i class="bi bi-gear me-1"></i>Soluciones por unidad:</strong>
                                    <div class="mt-2">
                                        ${unidadModelo.soluciones.map(sol => `
                                            <div class="mb-2 p-2 bg-white rounded border-start border-success border-3">
                                                <span class="badge bg-secondary me-2">${sol.tipo_solucion || 'Sin especificar'}</span>
                                                ${sol.configuraciones && Object.keys(sol.configuraciones).length > 0 ? `
                                                    <div class="ms-3 mt-1">
                                                        <small class="text-muted">
                                                            <strong>Configuraciones:</strong><br>
                                                            ${Object.keys(sol.configuraciones).filter(k => sol.configuraciones[k]).map(k => {
                                                                const value = sol.configuraciones[k];
                                                                const formattedKey = k.replace(/_/g, ' ')
                                                                    .replace(/\b\w/g, l => l.toUpperCase())
                                                                    .replace('Sensor Vpc', 'Sensor VPC')
                                                                    .replace(' Vpc', ' VPC');
                                                                
                                                                if (typeof value === 'boolean' && value) {
                                                                    return `â€¢ ${formattedKey}`;
                                                                } else if (typeof value === 'string' && value !== 'true') {
                                                                    return `â€¢ ${formattedKey}: ${value}`;
                                                                } else if (typeof value === 'number') {
                                                                    return `â€¢ ${formattedKey}: ${value}`;
                                                                }
                                                                return null;
                                                            }).filter(item => item !== null).join('<br>')}
                                                        </small>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `;
                } else {
                    // Mostrar formato detallado para unidades individuales
                    vehiculosDiv.innerHTML = `
                        <h5 style="color: #fb930c;"><i class="bi bi-truck me-2"></i>Unidades (${totalUnidades})</h5>
                        ${vehiculos.map((vehiculo, index) => `
                            <div class="mb-3 border rounded p-2">
                                <strong>Unidad ${index + 1}:</strong> ${vehiculo.marca || 'Sin marca'} ${vehiculo.tipo_unidad || vehiculo.tipo || 'Sin tipo'} ${vehiculo.modelo || ''} ${vehiculo.anio || vehiculo.año || ''} - ${vehiculo.combustible || 'Sin combustible'} ${vehiculo.voltaje || ''}
                                ${vehiculo.soluciones && vehiculo.soluciones.length > 0 ? `
                                    <div class="mt-2">
                                        <small class="text-muted"><strong>Soluciones:</strong></small>
                                        ${vehiculo.soluciones.map(sol => `
                                            <div class="mb-2">
                                                <span class="badge bg-secondary me-2">${sol.tipo_solucion || 'Sin especificar'}</span>
                                                ${sol.configuraciones && Object.keys(sol.configuraciones).length > 0 ? `
                                                    <div class="ms-3 mt-1">
                                                        <small class="text-muted">
                                                            <strong>Configuraciones:</strong><br>
                                                            ${Object.keys(sol.configuraciones).filter(k => sol.configuraciones[k]).map(k => {
                                                                const value = sol.configuraciones[k];
                                                                const formattedKey = k.replace(/_/g, ' ')
                                                                    .replace(/\b\w/g, l => l.toUpperCase())
                                                                    .replace('Sensor Vpc', 'Sensor VPC')
                                                                    .replace(' Vpc', ' VPC');
                                                                
                                                                if (typeof value === 'boolean' && value) {
                                                                    return `â€¢ ${formattedKey}`;
                                                                } else if (typeof value === 'string' && value !== 'true') {
                                                                    return `â€¢ ${formattedKey}: ${value}`;
                                                                } else if (typeof value === 'number') {
                                                                    return `â€¢ ${formattedKey}: ${value}`;
                                                                }
                                                                return null;
                                                            }).filter(item => item !== null).join('<br>')}
                                                        </small>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    `;
                }
                
                container.appendChild(vehiculosDiv);
            }

            // Soluciones globales (si las hay)
            const solucionesGlobales = tempData.soluciones || cotizacionData.soluciones || [];
            if (solucionesGlobales.length > 0 && !tempData.unidades) {
                const solucionesDiv = document.createElement('div');
                solucionesDiv.className = 'resumen-item';
                const solucionesNombres = solucionesGlobales.map(id => {
                    const solucion = solucionesMaestras.find(s => s.id === id);
                    return solucion ? solucion.nombre : id;
                }).join(', ');
                solucionesDiv.innerHTML = `
                    <h5 style="color: #fb930c;"><i class="bi bi-gear me-2"></i>Soluciones</h5>
                    <p>${solucionesNombres}</p>
                `;
                container.appendChild(solucionesDiv);
            }

            // Equipos y Accesorios AutomÃ¡ticos (recalcular desde las soluciones)
            const vehiculosParaEquipos = tempData.unidades || cotizacionData.vehiculos || [];
            const equiposAutomaticos = generarEquiposAutomaticos(vehiculosParaEquipos);
            const cantidadLoteEquipos = cotizacionData.cantidadLote || 1;

            // Separar por categorÃ­as
            const equiposReales = Object.values(equiposAutomaticos).filter(equipo => equipo.categoria === 'equipos');
            const accesoriosReales = Object.values(equiposAutomaticos).filter(equipo => equipo.categoria === 'accesorios');
            const insumosReales = Object.values(equiposAutomaticos).filter(equipo => equipo.categoria === 'insumos');

            // Mostrar Equipos AutomÃ¡ticos
            if (equiposReales.length > 0) {
                const equiposDiv = document.createElement('div');
                equiposDiv.className = 'resumen-item';
                
                let htmlEquipos = `<h5 style="color: #fb930c;"><i class="bi bi-cpu me-2"></i>Equipos AutomÃ¡ticos</h5>`;
                
                if (cantidadLoteEquipos > 1) {
                    htmlEquipos += `<div class="alert alert-info mb-3">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>Cantidades ajustadas para ${cantidadLoteEquipos} unidades en lote</strong>
                    </div>`;
                }
                
                htmlEquipos += `
                    <div class="table-responsive">
                        <table class="table table-sm table-striped">
                            <thead>
                                <tr>
                                    <th>Equipo</th>
                                    <th>Cantidad Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${equiposReales.map(equipo => {
                                    const cantidadTotal = equipo.cantidad * cantidadLoteEquipos;
                                    
                                    return `
                                        <tr>
                                            <td><span class="badge" style="background-color: #fb930c;">${equipo.nombre}</span></td>
                                            <td><strong>${cantidadTotal}</strong></td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                
                equiposDiv.innerHTML = htmlEquipos;
                container.appendChild(equiposDiv);
            }

            // Mostrar Accesorios AutomÃ¡ticos
            if (accesoriosReales.length > 0) {
                const accesoriosDiv = document.createElement('div');
                accesoriosDiv.className = 'resumen-item';
                
                let htmlAccesorios = `<h5 class="text-success"><i class="bi bi-gear me-2"></i>Accesorios AutomÃ¡ticos</h5>`;
                
                if (cantidadLoteEquipos > 1) {
                    htmlAccesorios += `<div class="alert alert-info mb-3">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>Cantidades ajustadas para ${cantidadLoteEquipos} unidades en lote</strong>
                    </div>`;
                }
                
                htmlAccesorios += `
                    <div class="table-responsive">
                        <table class="table table-sm table-striped">
                            <thead>
                                <tr>
                                    <th>Accesorio</th>
                                    <th>Cantidad Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${accesoriosReales.map(accesorio => {
                                    const cantidadTotal = accesorio.cantidad * cantidadLoteEquipos;
                                    
                                    return `
                                        <tr>
                                            <td><span class="badge bg-success">${accesorio.nombre}</span></td>
                                            <td><strong>${cantidadTotal}</strong></td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                
                accesoriosDiv.innerHTML = htmlAccesorios;
                container.appendChild(accesoriosDiv);
            }

            // Mostrar Insumos AutomÃ¡ticos (Materia Prima)
            if (insumosReales.length > 0) {
                const insumosDiv = document.createElement('div');
                insumosDiv.className = 'resumen-item';
                
                let htmlInsumos = `<h5 class="text-warning"><i class="bi bi-hammer me-2"></i>Insumos AutomÃ¡ticos (Materia Prima)</h5>`;
                
                if (cantidadLoteEquipos > 1) {
                    htmlInsumos += `<div class="alert alert-info mb-3">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>Cantidades ajustadas para ${cantidadLoteEquipos} unidades en lote</strong>
                    </div>`;
                }
                
                htmlInsumos += `
                    <div class="table-responsive">
                        <table class="table table-sm table-striped">
                            <thead>
                                <tr>
                                    <th>Insumo</th>
                                    <th>Cantidad Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${insumosReales.map(insumo => {
                                    const cantidadTotal = insumo.cantidad * cantidadLoteEquipos;
                                    
                                    return `
                                        <tr>
                                            <td><span class="badge bg-warning text-dark">${insumo.nombre}</span></td>
                                            <td><strong>${cantidadTotal}</strong></td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                
                insumosDiv.innerHTML = htmlInsumos;
                container.appendChild(insumosDiv);
            }

            // Insumos Sugeridos y Adicionales (con multiplicaciÃ³n por lotes)
            const insumosSugeridos = cotizacionData.insumosSugeridos || [];
            const insumosAdicionales = cotizacionData.insumos || [];
            const cantidadLoteInsumos = cotizacionData.cantidadLote || 1;
            
            if (insumosSugeridos.length > 0 || insumosAdicionales.length > 0) {
                const insumosDiv = document.createElement('div');
                insumosDiv.className = 'resumen-item';
                
                let totalInsumos = 0;
                let html = `<h5 style="color: #fb930c;"><i class="bi bi-box me-2"></i>Insumos</h5>`;
                
                if (cantidadLoteInsumos > 1) {
                    html += `<div class="alert alert-info mb-3">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>Cantidades multiplicadas por ${cantidadLoteInsumos} unidades en lote</strong>
                    </div>`;
                }
                
                if (insumosSugeridos.length > 0) {
                    totalInsumos += insumosSugeridos.length;
                    html += `
                        <h6 class="text-success mt-3">
                            <i class="bi bi-lightbulb me-1"></i>Sugeridos AutomÃ¡ticamente (${insumosSugeridos.length} tipos)
                        </h6>
                        <div class="table-responsive">
                            <table class="table table-sm table-striped">
                                <thead>
                                    <tr>
                                        <th>Insumo</th>
                                        <th>Cantidad Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${insumosSugeridos.map(insumo => {
                                        // Usar la cantidad ya calculada y guardada
                                        const cantidadTotal = insumo.cantidad || 0;
                                        
                                        return `
                                            <tr>
                                                <td><span class="badge bg-success">${insumo.nombre}</span></td>
                                                <td><strong>${cantidadTotal}</strong></td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }
                
                if (insumosAdicionales.length > 0) {
                    totalInsumos += insumosAdicionales.length;
                    html += `
                        <h6 class="text-info mt-3">
                            <i class="bi bi-plus-circle me-1"></i>Adicionales (${insumosAdicionales.length} tipos)
                        </h6>
                        <div class="table-responsive">
                            <table class="table table-sm table-striped">
                                <thead>
                                    <tr>
                                        <th>Insumo</th>
                                        <th>Cantidad Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${insumosAdicionales.map(insumo => {
                                        const cantidadTotal = (insumo.cantidad || 1) * cantidadLoteInsumos;
                                        return `
                                            <tr>
                                                <td><span class="badge bg-info">${insumo.nombre}</span></td>
                                                <td><strong>${cantidadTotal}</strong></td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }
                
                html += `<div class="alert alert-secondary mt-3">
                    <strong><i class="bi bi-calculator me-2"></i>Total de tipos de insumos: ${totalInsumos}</strong>
                </div>`;
                
                insumosDiv.innerHTML = html;
                container.appendChild(insumosDiv);
            }

            // Servicios de Datos Sugeridos
            const serviciosSugeridos = cotizacionData.serviciosSugeridos || [];
            if (serviciosSugeridos.length > 0) {
                const serviciosDiv = document.createElement('div');
                serviciosDiv.className = 'resumen-item';
                
                // Agrupar servicios por nombre y periodicidad
                const serviciosAgrupados = {};
                serviciosSugeridos.forEach(servicio => {
                    const key = `${servicio.nombre}_${servicio.periodicidad}`;
                    if (!serviciosAgrupados[key]) {
                        serviciosAgrupados[key] = {
                            nombre: servicio.nombre,
                            periodicidad: servicio.periodicidad,
                            cantidad: 0,
                            unidades: []
                        };
                    }
                    serviciosAgrupados[key].cantidad += servicio.cantidad;
                    serviciosAgrupados[key].unidades.push(servicio.unidad);
                });
                
                const serviciosUnicos = Object.values(serviciosAgrupados);
                
                serviciosDiv.innerHTML = `
                    <h5 style="color: #fb930c;"><i class="bi bi-cloud me-2"></i>Servicios de Datos Sugeridos (${serviciosUnicos.length})</h5>
                    <div class="alert alert-info mb-3">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>Servicios detectados automÃ¡ticamente segÃºn las soluciones seleccionadas</strong>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm table-striped">
                            <thead>
                                <tr>
                                    <th>Servicio</th>
                                    <th>Periodicidad</th>
                                    <th>Cantidad</th>
                                    <th>Aplicado en</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${serviciosUnicos.map(servicio => `
                                    <tr>
                                        <td><span class="badge bg-primary">${servicio.nombre}</span></td>
                                        <td>
                                            <span class="badge ${servicio.periodicidad === 'anual' ? 'bg-danger' : 'bg-info'}">
                                                ${servicio.periodicidad}
                                            </span>
                                        </td>
                                        <td><strong>${servicio.cantidad}</strong></td>
                                        <td>
                                            <small class="text-muted">
                                                Unidades: ${servicio.unidades.join(', ')}
                                            </small>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                container.appendChild(serviciosDiv);
            }

            // Accesorios
            const accesorios = cotizacionData.accesorios || [];
            if (accesorios.length > 0) {
                const accesoriosDiv = document.createElement('div');
                accesoriosDiv.className = 'resumen-item';
                accesoriosDiv.innerHTML = `
                    <h5 style="color: #fb930c;"><i class="bi bi-plus-square me-2"></i>Accesorios (${accesorios.length})</h5>
                    <div class="row">
                        ${accesorios.map(accesorio => `
                            <div class="col-md-6 mb-1">
                                <span class="badge bg-info me-1">${accesorio}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
                container.appendChild(accesoriosDiv);
            }

            // Dashboard de totales eliminado por solicitud del usuario
        }

        // FunciÃ³n guardarBorrador movida al inicio del script

        async function crearCotizacionFinal() {
            // Recopilar todos los datos finales
            guardarPasoActual();
            
            // Verificar si estamos en modo ediciÃ³n
            const urlParams = new URLSearchParams(window.location.search);
            const editarId = urlParams.get('editar');
            const datosEdicion = localStorage.getItem('cotizacion_editar');
            
            // Procesar unidades considerando cantidad de lote
            let unidadesFinales = [];
            
            cotizacionData.vehiculos.forEach((vehiculo, index) => {
                const unidadBase = {
                    marca: vehiculo.marca,
                    tipo_unidad: vehiculo.tipo,
                    modelo: vehiculo.modelo,
                    anio: vehiculo.año,
                    combustible: vehiculo.combustible,
                    voltaje: vehiculo.voltaje,
                    soluciones: vehiculo.soluciones || []
                };
                
                // Si es la primera unidad y tiene cantidad de lote, multiplicar
                if (index === 0 && vehiculo.cantidadLote && vehiculo.cantidadLote > 1) {
                    for (let i = 0; i < vehiculo.cantidadLote; i++) {
                        unidadesFinales.push({
                            ...unidadBase,
                            numeroUnidad: i + 1,
                            esLote: true
                        });
                    }
                } else {
                    unidadesFinales.push(unidadBase);
                }
            });
            
            let cotizacionFinal;
            
            if (editarId && datosEdicion) {
                // Modo ediciÃ³n: actualizar cotizaciÃ³n existente
                const cotizacionOriginal = JSON.parse(datosEdicion);
                cotizacionFinal = {
                    ...cotizacionOriginal, // Mantener ID, folio y fecha original
                    cliente_nombre: cotizacionData.cliente.nombre,
                    empresa: cotizacionData.cliente.empresa,
                    tipo_cliente: cotizacionData.cliente.tipo,
                    descuento: cotizacionData.cliente.descuento,
                    fecha_vencimiento: cotizacionData.cliente.fecha_vencimiento,
                    urgente: cotizacionData.cliente.urgente,
                    tipoVenta: cotizacionData.tipoVenta || cotizacionOriginal.tipoVenta || 'instalacion',
                    observaciones: cotizacionData.cliente.observaciones,
                    unidades: unidadesFinales,
                    cantidadLote: cotizacionData.cantidadLote,
                    // Mantener soluciones globales por compatibilidad
                    soluciones: cotizacionData.soluciones || [],
                    configuraciones: cotizacionData.configuraciones || {},
                    insumos: cotizacionData.insumos || [],
                    servicios: cotizacionData.servicios || [],
                    accesorios: cotizacionData.accesorios || [],
                    // Datos generados automÃ¡ticamente
                    insumosSugeridos: cotizacionData.insumosSugeridos || [],
                    accesoriosSugeridos: cotizacionData.accesoriosSugeridos || [],
                    equiposAutomaticos: cotizacionData.equiposAutomaticos || {},
                    fecha_modificacion: new Date().toISOString().split("T")[0]
                };
                
                // Si es un draft (id empieza con DRAFT o no tiene folio), convertir a cotizaciÃ³n con folio nuevo
                if (!cotizacionFinal.folio || String(cotizacionFinal.id || '').startsWith('DRAFT-')) {
                    cotizacionFinal.folio = `COT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
                    // opcional: remover prefijo draft del id para permitir estados operativos
                    cotizacionFinal.id = undefined;
                }

                // Guardar actualizaciÃ³n en Supabase o localStorage
                try {
                    if (modoCentralizado) {
                        // Si venimos de un draft, eliminar el draft antiguo por id o folio
                        const draftId = localStorage.getItem('cotizacion_progreso_id');
                        let deleteKey = draftId;
                        if (!deleteKey) {
                            if (editarId && String(editarId).startsWith('DRAFT-')) deleteKey = editarId;
                            else if (cotizacionOriginal && cotizacionOriginal.id && String(cotizacionOriginal.id).startsWith('DRAFT-')) deleteKey = cotizacionOriginal.id;
                        }
                        await window.dataService.upsertCotizacion(cotizacionFinal);
                        if (deleteKey) {
                            try { await window.dataService.deleteCotizacionByIdOrFolio(deleteKey); } catch (_) {}
                        }
                    } else {
                        let cotizacionesExistentes = JSON.parse(localStorage.getItem('cotizaciones_guardadas') || '[]');
                        const index = cotizacionesExistentes.findIndex(c => c.id == editarId);
                        if (index !== -1) {
                            cotizacionesExistentes[index] = cotizacionFinal;
                        } else {
                            cotizacionesExistentes.push(cotizacionFinal);
                        }
                        localStorage.setItem('cotizaciones_guardadas', JSON.stringify(cotizacionesExistentes));
                    }
                } catch (e) {
                    console.error('âŒ Error actualizando cotizaciÃ³n en Supabase:', e);
                }
                
                // Limpiar datos de ediciÃ³n
                localStorage.removeItem('cotizacion_editar');
                
                alert('Â¡CotizaciÃ³n actualizada exitosamente!');
            } else {
                // Modo creaciÃ³n: nueva cotizaciÃ³n
                cotizacionFinal = {
                    id: undefined,
                    folio: `COT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
                    cliente_nombre: cotizacionData.cliente.nombre,
                    empresa: cotizacionData.cliente.empresa,
                    tipo_cliente: cotizacionData.cliente.tipo,
                    descuento: cotizacionData.cliente.descuento,
                    fecha_vencimiento: cotizacionData.cliente.fecha_vencimiento,
                    urgente: cotizacionData.cliente.urgente,
                    tipoVenta: cotizacionData.tipoVenta || 'instalacion',
                    observaciones: cotizacionData.cliente.observaciones,
                    estado: "borrador",
                    fecha_cotizacion: new Date().toISOString().split("T")[0],
                    total: calcularTotalCotizacion(unidadesFinales, cotizacionData),
                    unidades: unidadesFinales,
                    cantidadLote: cotizacionData.cantidadLote,
                    // Mantener soluciones globales por compatibilidad
                    soluciones: cotizacionData.soluciones || [],
                    configuraciones: cotizacionData.configuraciones || {},
                    insumos: cotizacionData.insumos || [],
                    servicios: cotizacionData.servicios || [],
                    accesorios: cotizacionData.accesorios || [],
                    // Datos generados automÃ¡ticamente
                    insumosSugeridos: cotizacionData.insumosSugeridos || [],
                    accesoriosSugeridos: cotizacionData.accesoriosSugeridos || [],
                    equiposAutomaticos: cotizacionData.equiposAutomaticos || {},
                    equipos: cotizacionData.equipos || {},
                    // Campos de progreso de ventas
                    dias_seguimiento: cotizacionData.cliente?.dias_seguimiento || '7',
                    fecha_envio: null,
                    fecha_seguimiento: null,
                    fecha_aceptacion: null,
                    fecha_rechazo: null,
                    fecha_instalacion: null,
                    fecha_facturacion: null,
                    observaciones_rechazo: null,
                    facturada: false
                };
                
                console.log('ðŸ” DEBUG COTIZACION FINAL - equiposAutomaticos:', cotizacionData.equiposAutomaticos);
                console.log('ðŸ” DEBUG COTIZACION FINAL - equipos:', cotizacionData.equipos);
                console.log('ðŸ” DEBUG COTIZACION FINAL - cotizacionFinal completa:', cotizacionFinal);
                
                // Guardar en Supabase o localStorage
                try {
                    if (modoCentralizado) {
                        // Insertar primero
                        await window.dataService.upsertCotizacion(cotizacionFinal);
                        // Eliminar draft si existÃ­a
                        const draftId = localStorage.getItem('cotizacion_progreso_id');
                        const deleteKey = draftId;
                        if (deleteKey) {
                            try { await window.dataService.deleteCotizacionByIdOrFolio(deleteKey); } catch (_) {}
                        }
                    } else {
                        let cotizacionesExistentes = JSON.parse(localStorage.getItem('cotizaciones_guardadas') || '[]');
                        cotizacionesExistentes.push(cotizacionFinal);
                        localStorage.setItem('cotizaciones_guardadas', JSON.stringify(cotizacionesExistentes));
                    }
                } catch (e) {
                    console.error('âŒ Error creando cotizaciÃ³n en Supabase:', e);
                }
                
                alert('Â¡CotizaciÃ³n creada exitosamente!');
            }
            
            // Limpiar progreso y draftId
            localStorage.removeItem('cotizacion_progreso');
            localStorage.removeItem('cotizacion_progreso_id');
            
            // Redirigir a la lista
            window.location.href = 'cotizaciones-completo.html';
        }
        // ===== NUEVAS FUNCIONES PARA SOLUCIONES POR UNIDAD =====
        
        function copiarSolucionesDeUnidadAnterior(unidadActualId) {
            // Buscar la unidad anterior
            const unidadAnteriorId = unidadActualId - 1;
            const containerAnterior = document.querySelector(`.soluciones-unidad-container-${unidadAnteriorId}`);
            const containerActual = document.querySelector(`.soluciones-unidad-container-${unidadActualId}`);
            
            if (!containerAnterior || !containerActual) {
                mostrarAlerta('No se puede copiar: unidad anterior no encontrada', 'danger');
                return;
            }
            
            const solucionesAnteriores = containerAnterior.querySelectorAll('.solucion-item');
            if (solucionesAnteriores.length === 0) {
                mostrarAlerta('La unidad anterior no tiene soluciones para copiar', 'warning');
                return;
            }
            
            // Limpiar soluciones actuales
            containerActual.innerHTML = '';
            
            // Copiar cada soluciÃ³n de la unidad anterior
            solucionesAnteriores.forEach((solucionAnterior, index) => {
                // Crear nueva soluciÃ³n
                agregarSolucionAUnidadWizard(null, unidadActualId);
                
                // Obtener la nueva soluciÃ³n creada
                const nuevasSoluciones = containerActual.querySelectorAll('.solucion-item');
                const nuevaSolucion = nuevasSoluciones[nuevasSoluciones.length - 1];
                
                // Copiar tipo de soluciÃ³n
                const tipoAnterior = solucionAnterior.querySelector('.solucion-tipo');
                const tipoNuevo = nuevaSolucion.querySelector('.solucion-tipo');
                if (tipoAnterior && tipoNuevo) {
                    tipoNuevo.value = tipoAnterior.value;
                    
                    // Disparar el evento change para mostrar configuraciones
                    mostrarConfiguracionesSolucionWizard(tipoNuevo);
                    
                    // Copiar configuraciones despuÃ©s de un pequeÃ±o delay
                    setTimeout(() => {
                        const checkboxesAnteriores = solucionAnterior.querySelectorAll('input[type="checkbox"]:checked');
                        checkboxesAnteriores.forEach(checkbox => {
                            const nombre = checkbox.name.split('_').slice(-1)[0];
                            const checkboxNuevo = nuevaSolucion.querySelector(`input[name$="_${nombre}"]`);
                            if (checkboxNuevo) {
                                checkboxNuevo.checked = true;
                            }
                        });
                    }, 200);
                }
            });
            
            mostrarAlerta(`${solucionesAnteriores.length} soluciones copiadas de la unidad anterior`, 'success');
        }

        function copiarUnidadAnteriorWizard(button) {
            const unidadActual = button.closest('.unidad-vehiculo-item');
            const todasLasUnidades = document.querySelectorAll('.unidad-vehiculo-item');
            const indiceActual = Array.from(todasLasUnidades).indexOf(unidadActual);
            
            if (indiceActual > 0) {
                const unidadAnterior = todasLasUnidades[indiceActual - 1];
                
                // Obtener el nÃºmero de la unidad actual
                const numeroUnidadActual = unidadActual.querySelector('h6').textContent.replace('Unidad #', '');
                
                // Copiar valores de campos bÃ¡sicos
                const campos = ['marca', 'tipo', 'combustible', 'voltaje'];
                campos.forEach(campo => {
                    const selectAnterior = unidadAnterior.querySelector(`select[name*="vehiculo_${campo}"]`);
                    const selectActual = unidadActual.querySelector(`select[name*="vehiculo_${campo}"]`);
                    if (selectAnterior && selectActual) {
                        selectActual.value = selectAnterior.value;
                    }
                });
                
                // Copiar modelo y año
                const modeloAnterior = unidadAnterior.querySelector('input[name*="vehiculo_modelo"]');
                const modeloActual = unidadActual.querySelector('input[name*="vehiculo_modelo"]');
                if (modeloAnterior && modeloActual) {
                    modeloActual.value = modeloAnterior.value;
                }
                
                const anioAnterior = unidadAnterior.querySelector('input[name*="vehiculo_anio"]');
                const anioActual = unidadActual.querySelector('input[name*="vehiculo_anio"]');
                if (anioAnterior && anioActual) {
                    anioActual.value = anioAnterior.value;
                }
                
                mostrarAlerta('Datos copiados de la unidad anterior', 'success');
            }
        }
        
        function copiarUnidadAnterior(button) {
            const unidadActual = button.closest('.unidad-vehiculo-item');
            const todasLasUnidades = document.querySelectorAll('.unidad-vehiculo-item');
            const indiceActual = Array.from(todasLasUnidades).indexOf(unidadActual);
            
            if (indiceActual > 0) {
                const unidadAnterior = todasLasUnidades[indiceActual - 1];
                
                // Copiar valores de campos bÃ¡sicos
                const campos = ['marca', 'tipo', 'combustible', 'voltaje'];
                campos.forEach(campo => {
                    const selectAnterior = unidadAnterior.querySelector(`select[name*="vehiculo_${campo}"]`);
                    const selectActual = unidadActual.querySelector(`select[name*="vehiculo_${campo}"]`);
                    if (selectAnterior && selectActual) {
                        selectActual.value = selectAnterior.value;
                    }
                });
                
                // Copiar modelo
                const modeloAnterior = unidadAnterior.querySelector('input[name*="vehiculo_modelo"]');
                const modeloActual = unidadActual.querySelector('input[name*="vehiculo_modelo"]');
                if (modeloAnterior && modeloActual) {
                    modeloActual.value = modeloAnterior.value;
                }
                
                mostrarAlerta('Datos copiados de la unidad anterior', 'success');
            }
        }
        
        function agregarSolucionAUnidadWizard(button, unidadId) {
            const container = document.querySelector(`.soluciones-unidad-container-${unidadId}`);
            if (!container) return;
            
            // Si es la primera soluciÃ³n, limpiar el mensaje
            if (container.querySelector('.text-muted')) {
                container.innerHTML = '';
            }
            
            const solucionIndex = container.children.length + 1;
            const solucionId = `wizard_unidad_${unidadId}_solucion_${solucionIndex}`;
            
            const solucionDiv = document.createElement('div');
            solucionDiv.className = 'solucion-item border rounded p-3 mb-3 bg-light';
            solucionDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="text-info mb-0">SoluciÃ³n ${solucionIndex}</h6>
                    <div>

                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarSolucionWizard(this)">Eliminar</button>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="${solucionId}_tipo">Tipo de SoluciÃ³n</label>
                        <select class="form-select solucion-tipo" id="${solucionId}_tipo" name="${solucionId}_tipo" onchange="mostrarConfiguracionesSolucionWizard(this)">
                            <option value="">Seleccionar soluciÃ³n</option>
                            <option value="Alarma parlante estandar">Alarma parlante estandar</option>
                            <option value="Alarma parlante programable">Alarma parlante programable</option>
                            <option value="Dashcam">Dashcam</option>
                            <option value="Encadenamiento seÃ±ales">Encadenamiento seÃ±ales</option>
                            <option value="Insider">Insider</option>
                            <option value="Led de giro">Led de giro</option>
                            <option value="Limitador de velocidad">Limitador de velocidad</option>
                            <option value="MDVR 4 Ch">MDVR 4 Ch</option>
                            <option value="MDVR 8 Ch">MDVR 8 Ch</option>
                            <option value="Modulo sensor cinturon">Modulo sensor cinturon</option>
                            <option value="Rastreo avanzado">Rastreo avanzado</option>
                            <option value="Rastreo basico">Rastreo basico</option>
                            <option value="Rastreo satelital">Rastreo satelital</option>
                            <option value="Sensor VPC">Sensor VPC</option>
                            <option value="Sideview">Sideview</option>
                            <option value="VPC">VPC</option>
                        </select>
                    </div>
                    <div class="col-md-8">
                        <div class="configuraciones-solucion">
                            <p class="text-muted">Selecciona un tipo de soluciÃ³n para ver las configuraciones disponibles.</p>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(solucionDiv);
            
            // Actualizar selects con tipos globales
            setTimeout(() => {
                actualizarTodosLosSelects();
            }, 100);
        }
        
        function copiarSolucionAnteriorWizard(button) {
            const solucionActual = button.closest('.solucion-item');
            const container = solucionActual.parentElement;
            const soluciones = container.querySelectorAll('.solucion-item');
            const indiceActual = Array.from(soluciones).indexOf(solucionActual);
            
            if (indiceActual > 0) {
                const solucionAnterior = soluciones[indiceActual - 1];
                
                // Copiar tipo de soluciÃ³n
                const tipoAnterior = solucionAnterior.querySelector('.solucion-tipo');
                const tipoActual = solucionActual.querySelector('.solucion-tipo');
                if (tipoAnterior && tipoActual) {
                    tipoActual.value = tipoAnterior.value;
                    mostrarConfiguracionesSolucionWizard(tipoActual);
                }
                
                // Copiar configuraciones
                setTimeout(() => {
                    const checkboxesAnteriores = solucionAnterior.querySelectorAll('input[type="checkbox"]:checked');
                    checkboxesAnteriores.forEach(checkbox => {
                        const nombre = checkbox.name.split('_').slice(-1)[0];
                        const checkboxActual = solucionActual.querySelector(`input[name$="_${nombre}"]`);
                        if (checkboxActual) {
                            checkboxActual.checked = true;
                        }
                    });
                }, 100);
                
                mostrarAlerta('ConfiguraciÃ³n copiada de la soluciÃ³n anterior', 'success');
            }
        }
        
        function mostrarConfiguracionesSolucionWizard(select, container = null) {
            // DEPURAR: Detectar llamadas inesperadas
            console.log(`ðŸš¨ LLAMADA A mostrarConfiguracionesSolucionWizard:`, select.value);
            console.trace('ðŸš¨ STACK TRACE mostrarConfiguracionesSolucionWizard');
            
            // Si no se proporciona un contenedor, buscar en el DOM
            if (!container) {
                const solucionItem = select.closest('.solucion-item');
                if (!solucionItem) {
                    console.error('âŒ DEBUG: No se encontrÃ³ .solucion-item para el select');
                    return '';
                }
                container = solucionItem.querySelector('.configuraciones-solucion');
            }
            
            const tipoSolucion = select.value;
            const solucionId = select.name.replace('_tipo', '');
            
            // Extraer Ã­ndices del solucionId (formato: wizard_unidad_${unidadId}_solucion_${solucionIndex})
            const match = solucionId.match(/wizard_unidad_(\d+)_solucion_(\d+)/);
            const unidadIndex = match ? parseInt(match[1]) - 1 : 0; // Convertir a Ã­ndice base 0
            const solucionIndex = match ? parseInt(match[2]) - 1 : 0; // Convertir a Ã­ndice base 0
            
            console.log(`ðŸ”§ DEBUG: Configurando soluciÃ³n - Unidad: ${unidadIndex + 1}, SoluciÃ³n: ${solucionIndex + 1}`);
            
            if (!tipoSolucion) {
                if (container) {
                    container.innerHTML = '<p class="text-muted">Selecciona un tipo de soluciÃ³n para ver las configuraciones disponibles.</p>';
                }
                return '<p class="text-muted">Selecciona un tipo de soluciÃ³n para ver las configuraciones disponibles.</p>';
            }
            
            let configuracionesHtml = '';
            
            switch (tipoSolucion) {
                case 'VPC':
                    configuracionesHtml = `
                        <div class="row">
                            <div class="col-md-4">
                                <h6 style="color: #fb930c;">CÃ¡maras</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_camara_izquierda" id="${solucionId}_camara_izquierda">
                                    <label class="form-check-label" for="${solucionId}_camara_izquierda">CÃ¡mara Izquierda</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_camara_derecha" id="${solucionId}_camara_derecha">
                                    <label class="form-check-label" for="${solucionId}_camara_derecha">CÃ¡mara Derecha</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_camara_reversa" id="${solucionId}_camara_reversa">
                                    <label class="form-check-label" for="${solucionId}_camara_reversa">CÃ¡mara de Reversa</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_camara_frontal" id="${solucionId}_camara_frontal">
                                    <label class="form-check-label" for="${solucionId}_camara_frontal">CÃ¡mara Frontal</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <h6 style="color: #fb930c;">Funciones</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_grabacion" id="${solucionId}_grabacion">
                                    <label class="form-check-label" for="${solucionId}_grabacion">GrabaciÃ³n</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_hosting" id="${solucionId}_hosting">
                                    <label class="form-check-label" for="${solucionId}_hosting">Hosting</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <h6 style="color: #fb930c;">Compatibles</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_sensor_vpc" id="${solucionId}_sensor_vpc" onchange="toggleSensorVpcOptions('${solucionId}')">
                                    <label class="form-check-label" for="${solucionId}_sensor_vpc">Sensor VPC</label>
                                </div>
                                <div id="${solucionId}_sensor_vpc_options" class="ms-3 mt-2" style="display: none;">
                                    <div class="row">
                                        <div class="col-6">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="${solucionId}_sensor_derecha" id="${solucionId}_sensor_derecha">
                                                <label class="form-check-label" for="${solucionId}_sensor_derecha">Derecha</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="${solucionId}_sensor_izquierda" id="${solucionId}_sensor_izquierda">
                                                <label class="form-check-label" for="${solucionId}_sensor_izquierda">Izquierda</label>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <label class="form-label">Cantidad por lado</label>
                                            <input type="number" class="form-control form-control-sm" name="${solucionId}_sensor_cantidad" min="1" max="10" placeholder="Ej: 2">
                                        </div>
                                    </div>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_alarma_parlante_estandar" id="${solucionId}_alarma_parlante_estandar" onchange="toggleAlarmaOptions('${solucionId}')">
                                    <label class="form-check-label" for="${solucionId}_alarma_parlante_estandar">Alarma parlante estÃ¡ndar</label>
                                </div>
                                <div id="${solucionId}_alarma_options" class="ms-3 mt-2" style="display: none;">
                                    <div class="row">
                                        <div class="col-6">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="${solucionId}_alarma_derecha" id="${solucionId}_alarma_derecha">
                                                <label class="form-check-label" for="${solucionId}_alarma_derecha">Derecha</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="${solucionId}_alarma_izquierda" id="${solucionId}_alarma_izquierda">
                                                <label class="form-check-label" for="${solucionId}_alarma_izquierda">Izquierda</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="${solucionId}_alarma_reversa" id="${solucionId}_alarma_reversa">
                                                <label class="form-check-label" for="${solucionId}_alarma_reversa">Reversa</label>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <label class="form-label">Cantidad</label>
                                            <input type="number" class="form-control form-control-sm" name="${solucionId}_alarma_cantidad" min="1" max="10" placeholder="Ej: 1">
                                        </div>
                                    </div>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_led_giro" id="${solucionId}_led_giro" onchange="toggleLedOptions('${solucionId}')">
                                    <label class="form-check-label" for="${solucionId}_led_giro">Led de giro</label>
                                </div>
                                <div id="${solucionId}_led_options" class="ms-3 mt-2" style="display: none;">
                                    <div class="row">
                                        <div class="col-6">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="${solucionId}_led_derecha" id="${solucionId}_led_derecha">
                                                <label class="form-check-label" for="${solucionId}_led_derecha">Derecha</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="${solucionId}_led_izquierda" id="${solucionId}_led_izquierda">
                                                <label class="form-check-label" for="${solucionId}_led_izquierda">Izquierda</label>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <label class="form-label">Cantidad por lado</label>
                                            <input type="number" class="form-control form-control-sm" name="${solucionId}_led_cantidad" min="1" max="20" placeholder="Ej: 4">
                                        </div>
                                    </div>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_encadenamiento" id="${solucionId}_encadenamiento" onchange="toggleEncadenamientoOptions('${solucionId}')">
                                    <label class="form-check-label" for="${solucionId}_encadenamiento">Encadenamiento seÃ±ales</label>
                                </div>
                                <div id="${solucionId}_encadenamiento_options" class="ms-3 mt-2" style="display: none;">
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="${solucionId}_tipo_encadenamiento" id="${solucionId}_encadenamiento_sencillo" value="sencillo">
                                        <label class="form-check-label" for="${solucionId}_encadenamiento_sencillo">Sencillo</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="${solucionId}_tipo_encadenamiento" id="${solucionId}_encadenamiento_full" value="full">
                                        <label class="form-check-label" for="${solucionId}_encadenamiento_full">Full</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'Sensor VPC':
                    configuracionesHtml = `
                        <div class="row">
                            <div class="col-6">
                                <h6 style="color: #fb930c;">PosiciÃ³n</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_derecha" id="${solucionId}_derecha">
                                    <label class="form-check-label" for="${solucionId}_derecha">Derecha</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_izquierda" id="${solucionId}_izquierda">
                                    <label class="form-check-label" for="${solucionId}_izquierda">Izquierda</label>
                                </div>
                            </div>
                            <div class="col-6">
                                <label class="form-label">Cantidad por lado</label>
                                <input type="number" class="form-control" name="${solucionId}_cantidad" min="1" max="10" placeholder="Ej: 2">
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'Led de giro':
                    configuracionesHtml = `
                        <div class="row">
                            <div class="col-6">
                                <h6 style="color: #fb930c;">PosiciÃ³n</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_derecha" id="${solucionId}_derecha">
                                    <label class="form-check-label" for="${solucionId}_derecha">Derecha</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_izquierda" id="${solucionId}_izquierda">
                                    <label class="form-check-label" for="${solucionId}_izquierda">Izquierda</label>
                                </div>
                            </div>
                            <div class="col-6">
                                <label class="form-label">Cantidad por lado</label>
                                <input type="number" class="form-control" name="${solucionId}_cantidad" min="1" max="20" placeholder="Ej: 4">
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'Alarma parlante estandar':
                case 'Alarma parlante programable':
                    configuracionesHtml = `
                        <div class="row">
                            <div class="col-6">
                                <h6 style="color: #fb930c;">PosiciÃ³n</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_derecha" id="${solucionId}_derecha">
                                    <label class="form-check-label" for="${solucionId}_derecha">Derecha</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_izquierda" id="${solucionId}_izquierda">
                                    <label class="form-check-label" for="${solucionId}_izquierda">Izquierda</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_reversa" id="${solucionId}_reversa">
                                    <label class="form-check-label" for="${solucionId}_reversa">Reversa</label>
                                </div>
                            </div>
                            <div class="col-6">
                                <label class="form-label">Cantidad</label>
                                <input type="number" class="form-control" name="${solucionId}_cantidad" min="1" max="10" placeholder="Ej: 1">
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'Encadenamiento seÃ±ales':
                    configuracionesHtml = `
                        <div class="row">
                            <div class="col-md-6">
                                <h6 style="color: #fb930c;">Tipo de Encadenamiento</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="${solucionId}_tipo" id="${solucionId}_sencillo" value="sencillo">
                                    <label class="form-check-label" for="${solucionId}_sencillo">Sencillo</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="${solucionId}_tipo" id="${solucionId}_full" value="full">
                                    <label class="form-check-label" for="${solucionId}_full">Full</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 style="color: #fb930c;">Funciones</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_grabacion" id="${solucionId}_grabacion">
                                    <label class="form-check-label" for="${solucionId}_grabacion">GrabaciÃ³n</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_hosting" id="${solucionId}_hosting">
                                    <label class="form-check-label" for="${solucionId}_hosting">Hosting</label>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'MDVR 4 Ch':
                case 'MDVR 8 Ch':
                    const canales = tipoSolucion.includes('4') ? 4 : 8;
                    configuracionesHtml = `
                        <div class="mb-3">
                            <label class="form-label"><strong>Canales (${canales})</strong></label>
                            <div class="row">
                    `;
                    
                    for(let i = 1; i <= canales; i++) {
                        configuracionesHtml += `
                            <div class="col-md-6 mb-2">
                                <label class="form-label">Canal ${i}</label>
                                <select class="form-select form-select-sm" name="${solucionId}_canal_${i}">
                                    <option value="">Sin cÃ¡mara</option>
                                    <option value="radar">CÃ¡mara radar</option>
                                    <option value="microfono">CÃ¡mara con micrÃ³fono</option>
                                    <option value="reversa">CÃ¡mara de reversa</option>
                                    <option value="digital">CÃ¡mara Digital (IP)</option>
                                    <option value="exterior_mini">CÃ¡mara exterior mini</option>
                                    <option value="lateral_derecha">CÃ¡mara lateral derecha de VPC</option>
                                    <option value="lateral_izquierda">CÃ¡mara lateral izquierda de VPC</option>
                                </select>
                            </div>
                        `;
                    }
                    
                    configuracionesHtml += `
                            </div>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="${solucionId}_canal_ip_extra" id="${solucionId}_canal_ip_extra" onchange="toggleCanalIPExtra('${solucionId}')">
                            <label class="form-check-label" for="${solucionId}_canal_ip_extra">Canal extra para cÃ¡mara IP</label>
                        </div>
                        <div id="${solucionId}_canal_ip_container" class="mt-2" style="display: none;">
                            <select class="form-select" name="${solucionId}_canal_ip_tipo" disabled>
                                <option value="digital" selected>CÃ¡mara Digital (IP)</option>
                            </select>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-12">
                                <h6 style="color: #fb930c;">Hosting</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_hosting" id="${solucionId}_hosting">
                                    <label class="form-check-label" for="${solucionId}_hosting">Hosting</label>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'Sideview':
                    configuracionesHtml = `
                        <div class="row">
                            <div class="col-md-4">
                                <h6 style="color: #fb930c;">PosiciÃ³n</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_izquierdo" id="${solucionId}_izquierdo">
                                    <label class="form-check-label" for="${solucionId}_izquierdo">Izquierdo</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_derecho" id="${solucionId}_derecho">
                                    <label class="form-check-label" for="${solucionId}_derecho">Derecho</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <h6 style="color: #fb930c;">Funciones</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_grabacion" id="${solucionId}_grabacion">
                                    <label class="form-check-label" for="${solucionId}_grabacion">GrabaciÃ³n</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <h6 style="color: #fb930c;">Servicios</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_hosting" id="${solucionId}_hosting">
                                    <label class="form-check-label" for="${solucionId}_hosting">Hosting</label>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'Dashcam':
                    configuracionesHtml = `
                        <div class="row">
                            <div class="col-md-4">
                                <h6 style="color: #fb930c;">Inteligencia Artificial</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_ia" id="${solucionId}_ia">
                                    <label class="form-check-label" for="${solucionId}_ia">Con IA</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <h6 style="color: #fb930c;">TransmisiÃ³n</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_hosting" id="${solucionId}_hosting">
                                    <label class="form-check-label" for="${solucionId}_hosting">Hosting</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Memoria</label>
                                <select class="form-select" name="${solucionId}_memoria">
                                    <option value="">Seleccionar</option>
                                    <option value="128">128 GB</option>
                                    <option value="256">256 GB</option>
                                    <option value="512">512 GB</option>
                                </select>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'Rastreo basico':
                    configuracionesHtml = `
                        <div class="row">
                            <div class="col-md-4">
                                <h6 style="color: #fb930c;">Funciones</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_sos" id="${solucionId}_sos">
                                    <label class="form-check-label" for="${solucionId}_sos">SOS</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_bloqueo" id="${solucionId}_bloqueo">
                                    <label class="form-check-label" for="${solucionId}_bloqueo">Bloqueo</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <h6 style="color: #fb930c;">Resistencia</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_ip67" id="${solucionId}_ip67">
                                    <label class="form-check-label" for="${solucionId}_ip67">IP67 (a prueba de agua)</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <h6 style="color: #fb930c;">Hosting</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_hosting" id="${solucionId}_hosting">
                                    <label class="form-check-label" for="${solucionId}_hosting">Hosting</label>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'Rastreo avanzado':
                    configuracionesHtml = `
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h6 style="color: #fb930c;">SOS</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_sos_simple" id="${solucionId}_sos_simple" onchange="manejarCambioConfiguracion('${solucionId}', 'sos_simple', ${unidadIndex}, ${solucionIndex})">
                                    <label class="form-check-label" for="${solucionId}_sos_simple">SOS simple</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_sos_llamada" id="${solucionId}_sos_llamada" onchange="manejarCambioConfiguracion('${solucionId}', 'sos_llamada', ${unidadIndex}, ${solucionIndex})">
                                    <label class="form-check-label" for="${solucionId}_sos_llamada">SOS llamada</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_sos_bloqueo" id="${solucionId}_sos_bloqueo" onchange="manejarCambioConfiguracion('${solucionId}', 'sos_bloqueo', ${unidadIndex}, ${solucionIndex})">
                                    <label class="form-check-label" for="${solucionId}_sos_bloqueo">SOS Bloqueo</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 style="color: #fb930c;">Bloqueo</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_bloqueo_normal" id="${solucionId}_bloqueo_normal" onchange="manejarCambioConfiguracion('${solucionId}', 'bloqueo_normal', ${unidadIndex}, ${solucionIndex})">
                                    <label class="form-check-label" for="${solucionId}_bloqueo_normal">Bloqueo normal</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_bloqueo_gradual" id="${solucionId}_bloqueo_gradual" onchange="manejarCambioConfiguracion('${solucionId}', 'bloqueo_gradual', ${unidadIndex}, ${solucionIndex})">
                                    <label class="form-check-label" for="${solucionId}_bloqueo_gradual">Bloqueo gradual</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_bloqueo_cortacorriente" id="${solucionId}_bloqueo_cortacorriente" onchange="manejarCambioConfiguracion('${solucionId}', 'bloqueo_cortacorriente', ${unidadIndex}, ${solucionIndex})">
                                    <label class="form-check-label" for="${solucionId}_bloqueo_cortacorriente">Bloqueo cortacorriente</label>
                                </div>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h6 style="color: #fb930c;">Sensores de Puertas</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="${solucionId}_sensores_puertas" id="${solucionId}_sensores_juntos" value="juntos" onchange="manejarCambioConfiguracion('${solucionId}', 'sensores_puertas', ${unidadIndex}, ${solucionIndex})">
                                    <label class="form-check-label" for="${solucionId}_sensores_juntos">Sensores juntos</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="${solucionId}_sensores_puertas" id="${solucionId}_sensores_independientes" value="independientes" onchange="manejarCambioConfiguracion('${solucionId}', 'sensores_puertas', ${unidadIndex}, ${solucionIndex})">
                                    <label class="form-check-label" for="${solucionId}_sensores_independientes">Sensores independientes</label>
                                </div>
                                <div class="form-check mt-2">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_bloqueo_apertura" id="${solucionId}_bloqueo_apertura" onchange="manejarCambioConfiguracion('${solucionId}', 'bloqueo_apertura', ${unidadIndex}, ${solucionIndex})">
                                    <label class="form-check-label" for="${solucionId}_bloqueo_apertura">Bloqueo con apertura de puertas</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 style="color: #fb930c;">Audio en Cabina</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="${solucionId}_audio_cabina" id="${solucionId}_audio_bidireccional" value="bidireccional" onchange="manejarCambioConfiguracion('${solucionId}', 'audio_bidireccional', ${unidadIndex}, ${solucionIndex})">
                                    <label class="form-check-label" for="${solucionId}_audio_bidireccional">Audio bidireccional</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="${solucionId}_audio_cabina" id="${solucionId}_audio_espia" value="espia" onchange="manejarCambioConfiguracion('${solucionId}', 'audio_espia', ${unidadIndex}, ${solucionIndex})">
                                    <label class="form-check-label" for="${solucionId}_audio_espia">Audio espÃ­a</label>
                                </div>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h6 style="color: #fb930c;">DetecciÃ³n de Jammer</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="${solucionId}_jammer" id="${solucionId}_jammer_alerta" value="alerta" onchange="manejarCambioConfiguracion('${solucionId}', 'deteccion_jammer', ${unidadIndex}, ${solucionIndex}); toggleJammerTime('${solucionId}')">
                                    <label class="form-check-label" for="${solucionId}_jammer_alerta">Alerta</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="${solucionId}_jammer" id="${solucionId}_jammer_alerta_bloqueo" value="alerta_bloqueo" onchange="manejarCambioConfiguracion('${solucionId}', 'deteccion_jammer', ${unidadIndex}, ${solucionIndex}); toggleJammerTime('${solucionId}')">
                                    <label class="form-check-label" for="${solucionId}_jammer_alerta_bloqueo">Alerta y bloqueo</label>
                                </div>
                                <div id="${solucionId}_jammer_time_container" class="mt-2" style="display: none;">
                                    <label class="form-label">Tiempo de detecciÃ³n</label>
                                    <select class="form-select" name="${solucionId}_jammer_tiempo">
                                        <option value="">Seleccionar</option>
                                        <option value="3">3 minutos</option>
                                        <option value="5">5 minutos</option>
                                        <option value="7">7 minutos</option>
                                        <option value="10">10 minutos</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 style="color: #fb930c;">MÃ³dulo Insider</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="${solucionId}_modulo_insider" onchange="manejarCambioConfiguracion('${solucionId}', 'modulo_insider', ${unidadIndex}, ${solucionIndex})">
                                    <label class="form-check-label" for="${solucionId}_modulo_insider">
                                        <strong>MÃ³dulo Insider</strong> - Resuelve conflictos de capacidades GPS
                                    </label>
                                </div>
                                <small class="text-muted">Proporciona entradas y salidas adicionales cuando se exceden las capacidades del GPS GV310LAU</small>
                            </div>
                            <div class="col-md-6">
                                <h6 style="color: #fb930c;">Habilitado en Cabina</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="${solucionId}_teclado" id="${solucionId}_teclado_sencillo" value="sencillo" onchange="manejarCambioConfiguracion('${solucionId}', 'teclado_sencillo', ${unidadIndex}, ${solucionIndex})">
                                    <label class="form-check-label" for="${solucionId}_teclado_sencillo">Teclado sencillo</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="${solucionId}_teclado" id="${solucionId}_teclado_dinamico" value="dinamico" onchange="manejarCambioConfiguracion('${solucionId}', 'teclado_dinamico', ${unidadIndex}, ${solucionIndex})">
                                    <label class="form-check-label" for="${solucionId}_teclado_dinamico">Teclado dinÃ¡mico</label>
                                </div>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Cantidad de Botones de PÃ¡nico</label>
                                <input type="number" class="form-control" name="${solucionId}_cantidad_botones" id="${solucionId}_cantidad_botones" min="1" max="10" value="1">
                                <div class="form-text">NÃºmero de botones de pÃ¡nico por unidad (por defecto: 1)</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Funcionalidad adicional</label>
                                <textarea class="form-control" name="${solucionId}_funcionalidad_adicional" rows="2" placeholder="Describe cualquier funcionalidad adicional requerida..."></textarea>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-12">
                                <h6 style="color: #fb930c;">Hosting</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_hosting" id="${solucionId}_hosting" onchange="toggleHostingPeriodicity('${solucionId}'); manejarCambioConfiguracion('${solucionId}', 'hosting', ${unidadIndex}, ${solucionIndex})">
                                    <label class="form-check-label" for="${solucionId}_hosting">Hosting</label>
                                </div>
                                <div id="${solucionId}_hosting_periodicity" style="display: none; margin-top: 10px;">
                                    <label class="form-label" style="font-size: 0.9em;">Periodicidad:</label>
                                    <select class="form-select form-select-sm" name="${solucionId}_hosting_periodo" id="${solucionId}_hosting_periodo" onchange="guardarHostingPeriodo('${solucionId}', ${unidadIndex}, ${solucionIndex})">
                                        <option value="mensual">Mensual</option>
                                        <option value="semestral">Semestral</option>
                                        <option value="anual">Anual</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'Rastreo satelital':
                    configuracionesHtml = `
                        <div class="row">
                            <div class="col-md-6">
                                <h6 style="color: #fb930c;">Funciones</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_sos" id="${solucionId}_sos">
                                    <label class="form-check-label" for="${solucionId}_sos">SOS</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 style="color: #fb930c;">Hosting</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_hosting" id="${solucionId}_hosting">
                                    <label class="form-check-label" for="${solucionId}_hosting">Hosting (Anual)</label>
                                </div>
                                <input type="hidden" name="${solucionId}_hosting_periodo" value="anual">
                                <small class="text-muted">Rastreo satelital requiere hosting anual</small>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'Insider':
                    configuracionesHtml = `
                        <div class="mb-3">
                            <label class="form-label">DescripciÃ³n de funcionalidad SmartHulk</label>
                            <textarea class="form-control" name="${solucionId}_descripcion" rows="3" placeholder="Describe las funcionalidades especÃ­ficas del SmartHulk que se requieren..."></textarea>
                            <div class="form-text">El Insider (SmartHulk) tiene mÃºltiples funcionalidades. Especifica cuÃ¡les se necesitan.</div>
                        </div>
                    `;
                    break;
                    
                case 'Limitador de velocidad':
                    configuracionesHtml = `
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="${solucionId}_incluir" id="${solucionId}_incluir" checked>
                            <label class="form-check-label" for="${solucionId}_incluir">Incluir Limitador de velocidad</label>
                        </div>
                    `;
                    break;
                    
                case 'Modulo sensor cinturon':
                    configuracionesHtml = `
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="${solucionId}_incluir" id="${solucionId}_incluir" checked>
                            <label class="form-check-label" for="${solucionId}_incluir">Incluir MÃ³dulo sensor cinturÃ³n</label>
                        </div>
                    `;
                    break;
                    
                default:
                    configuracionesHtml = `
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="${solucionId}_incluir" id="${solucionId}_incluir">
                            <label class="form-check-label" for="${solucionId}_incluir">Incluir ${tipoSolucion}</label>
                        </div>
                    `;
            }
            
            if (container) {
                container.innerHTML = configuracionesHtml;
            }
            return configuracionesHtml;
        }
        
        function eliminarSolucionWizard(button) {
            const solucionItem = button.closest('.solucion-item');
            const container = solucionItem.parentElement;
            solucionItem.remove();
            
            // Si no quedan soluciones, mostrar mensaje
            if (container.children.length === 0) {
                container.innerHTML = '<p class="text-muted">No hay soluciones agregadas. Haz clic en "Agregar SoluciÃ³n" para comenzar.</p>';
            } else {
                // Renumerar soluciones
                const soluciones = container.querySelectorAll('.solucion-item');
                soluciones.forEach((solucion, index) => {
                    const titulo = solucion.querySelector('h6');
                    titulo.textContent = `SoluciÃ³n ${index + 1}`;
                });
            }
        }
        
        function agregarSolucionAUnidad(button) {
            const unidadItem = button.closest('.unidad-vehiculo-item');
            const container = unidadItem.querySelector('.soluciones-unidad-container');
            const unidadId = unidadItem.querySelector('h6').textContent.replace('Unidad #', '');
            
            if (!container) return;
            
            // Si es la primera soluciÃ³n, limpiar el mensaje
            if (container.querySelector('.text-muted')) {
                container.innerHTML = '';
            }
            
            const solucionIndex = container.children.length + 1;
            const solucionId = `unidad_${unidadId}_solucion_${solucionIndex}`;
            
            const solucionDiv = document.createElement('div');
            solucionDiv.className = 'solucion-item border rounded p-3 mb-3';
            solucionDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="text-info mb-0">SoluciÃ³n ${solucionIndex}</h6>
                    <div>
                        ${solucionIndex > 1 ? '<button type="button" class="btn btn-sm btn-outline-secondary me-2" onclick="copiarSolucionAnterior(this)">Copiar Anterior</button>' : ''}
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarSolucion(this)">Eliminar</button>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Tipo de SoluciÃ³n</label>
                        <select class="form-select solucion-tipo" name="${solucionId}_tipo" onchange="mostrarConfiguracionesSolucion(this)">
                            <option value="">Seleccionar soluciÃ³n</option>
                            <option value="Rastreo">Rastreo</option>
                            <option value="VPC">VPC</option>
                            <option value="TelemetrÃ­a">TelemetrÃ­a</option>
                            <option value="Control de Combustible">Control de Combustible</option>
                            <option value="Videovigilancia">Videovigilancia</option>
                            <option value="Control de Temperatura">Control de Temperatura</option>
                            <option value="BotÃ³n de PÃ¡nico">BotÃ³n de PÃ¡nico</option>
                            <option value="Bloqueo de Motor">Bloqueo de Motor</option>
                        </select>
                    </div>
                    <div class="col-md-8">
                        <div class="configuraciones-solucion">
                            <p class="text-muted">Selecciona un tipo de soluciÃ³n para ver las configuraciones disponibles.</p>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(solucionDiv);
        }
        
        function copiarSolucionAnterior(button) {
            const solucionActual = button.closest('.solucion-item');
            const container = solucionActual.parentElement;
            const soluciones = container.querySelectorAll('.solucion-item');
            const indiceActual = Array.from(soluciones).indexOf(solucionActual);
            
            if (indiceActual > 0) {
                const solucionAnterior = soluciones[indiceActual - 1];
                
                // Copiar tipo de soluciÃ³n
                const tipoAnterior = solucionAnterior.querySelector('.solucion-tipo');
                const tipoActual = solucionActual.querySelector('.solucion-tipo');
                if (tipoAnterior && tipoActual) {
                    tipoActual.value = tipoAnterior.value;
                    mostrarConfiguracionesSolucion(tipoActual);
                }
                
                // Copiar configuraciones
                setTimeout(() => {
                    const checkboxesAnteriores = solucionAnterior.querySelectorAll('input[type="checkbox"]:checked');
                    checkboxesAnteriores.forEach(checkbox => {
                        const nombre = checkbox.name.split('_').slice(-1)[0]; // Obtener el Ãºltimo segmento del name
                        const checkboxActual = solucionActual.querySelector(`input[name$="_${nombre}"]`);
                        if (checkboxActual) {
                            checkboxActual.checked = true;
                        }
                    });
                }, 100);
                
                mostrarAlerta('ConfiguraciÃ³n copiada de la soluciÃ³n anterior', 'success');
            }
        }
        
        function mostrarConfiguracionesSolucion(select) {
            const solucionItem = select.closest('.solucion-item');
            const container = solucionItem.querySelector('.configuraciones-solucion');
            const tipoSolucion = select.value;
            const solucionId = select.name.replace('_tipo', '');
            
            if (!tipoSolucion) {
                container.innerHTML = '<p class="text-muted">Selecciona un tipo de soluciÃ³n para ver las configuraciones disponibles.</p>';
                return;
            }
            
            let configuracionesHtml = '';
            
            switch (tipoSolucion) {
                case 'VPC':
                    configuracionesHtml = `
                        <div class="row">
                            <div class="col-md-4">
                                <h6 style="color: #fb930c;">CÃ¡maras</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_camara_izquierda" id="${solucionId}_camara_izquierda">
                                    <label class="form-check-label" for="${solucionId}_camara_izquierda">CÃ¡mara Izquierda</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_camara_derecha" id="${solucionId}_camara_derecha">
                                    <label class="form-check-label" for="${solucionId}_camara_derecha">CÃ¡mara Derecha</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_camara_reversa" id="${solucionId}_camara_reversa">
                                    <label class="form-check-label" for="${solucionId}_camara_reversa">CÃ¡mara de Reversa</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_camara_frontal" id="${solucionId}_camara_frontal">
                                    <label class="form-check-label" for="${solucionId}_camara_frontal">CÃ¡mara Frontal</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <h6 style="color: #fb930c;">Funciones</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_grabacion" id="${solucionId}_grabacion">
                                    <label class="form-check-label" for="${solucionId}_grabacion">GrabaciÃ³n</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_hosting" id="${solucionId}_hosting">
                                    <label class="form-check-label" for="${solucionId}_hosting">Hosting</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <h6 style="color: #fb930c;">Compatibles</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_sensor_vpc" id="${solucionId}_sensor_vpc">
                                    <label class="form-check-label" for="${solucionId}_sensor_vpc">Sensor VPC</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_alarma_parlante_estandar" id="${solucionId}_alarma_parlante_estandar">
                                    <label class="form-check-label" for="${solucionId}_alarma_parlante_estandar">Alarma parlante estÃ¡ndar</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_led_giro" id="${solucionId}_led_giro">
                                    <label class="form-check-label" for="${solucionId}_led_giro">Led de giro</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_encadenamiento" id="${solucionId}_encadenamiento" onchange="toggleEncadenamientoOptions('${solucionId}')">
                                    <label class="form-check-label" for="${solucionId}_encadenamiento">Encadenamiento seÃ±ales</label>
                                </div>
                                <div id="${solucionId}_encadenamiento_options" class="ms-3 mt-2" style="display: none;">
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="${solucionId}_tipo_encadenamiento" id="${solucionId}_encadenamiento_sencillo" value="sencillo">
                                        <label class="form-check-label" for="${solucionId}_encadenamiento_sencillo">Sencillo</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="${solucionId}_tipo_encadenamiento" id="${solucionId}_encadenamiento_full" value="full">
                                        <label class="form-check-label" for="${solucionId}_encadenamiento_full">Full</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'Rastreo':
                    configuracionesHtml = `
                        <div class="row">
                            <div class="col-md-6">
                                <h6 style="color: #fb930c;">Funciones TelemetrÃ­a</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_sos_simple" id="${solucionId}_sos_simple">
                                    <label class="form-check-label" for="${solucionId}_sos_simple">SOS Simple</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_sos_llamada" id="${solucionId}_sos_llamada">
                                    <label class="form-check-label" for="${solucionId}_sos_llamada">SOS Llamada</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_bloqueo_normal" id="${solucionId}_bloqueo_normal">
                                    <label class="form-check-label" for="${solucionId}_bloqueo_normal">Bloqueo Normal</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_bloqueo_cc" id="${solucionId}_bloqueo_cc">
                                    <label class="form-check-label" for="${solucionId}_bloqueo_cc">Bloqueo CC</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 style="color: #fb930c;">Sensores y Audio</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_sensores_juntos" id="${solucionId}_sensores_juntos">
                                    <label class="form-check-label" for="${solucionId}_sensores_juntos">Sensores Juntos</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_sensores_independientes" id="${solucionId}_sensores_independientes">
                                    <label class="form-check-label" for="${solucionId}_sensores_independientes">Sensores Independientes</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_audio_bidireccional" id="${solucionId}_audio_bidireccional">
                                    <label class="form-check-label" for="${solucionId}_audio_bidireccional">Audio Bidireccional</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${solucionId}_audio_espia" id="${solucionId}_audio_espia">
                                    <label class="form-check-label" for="${solucionId}_audio_espia">Audio EspÃ­a</label>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                default:
                    configuracionesHtml = `
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="${solucionId}_activado" id="${solucionId}_activado" checked>
                            <label class="form-check-label" for="${solucionId}_activado">Activar ${tipoSolucion}</label>
                        </div>
                    `;
            }
            
            if (container) {
                container.innerHTML = configuracionesHtml;
            }
            return configuracionesHtml;
        }
        
        function eliminarSolucion(button) {
            const solucionItem = button.closest('.solucion-item');
            const container = solucionItem.parentElement;
            solucionItem.remove();
            
            // Si no quedan soluciones, mostrar mensaje
            if (container.children.length === 0) {
                container.innerHTML = '<p class="text-muted">No hay soluciones agregadas. Haz clic en "Agregar SoluciÃ³n" para comenzar.</p>';
            } else {
                // Renumerar soluciones
                const soluciones = container.querySelectorAll('.solucion-item');
                soluciones.forEach((solucion, index) => {
                    const titulo = solucion.querySelector('h6');
                    titulo.textContent = `SoluciÃ³n ${index + 1}`;
                });
            }
        }
        
        // ===== FUNCIÃ“N PARA COTIZACIÃ“N EN LOTE =====
        
        function mostrarModalCotizacionLote() {
            const modalHtml = `
                <div class="modal fade" id="modalCotizacionLote" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-warning text-dark">
                                <h5 class="modal-title">
                                    <i class="bi bi-stack me-2"></i>CotizaciÃ³n en Lote
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label class="form-label fw-bold">Cantidad de Unidades</label>
                                    <input type="number" class="form-control" id="cantidadLote" min="2" max="1000" placeholder="Ej: 10, 20, 50, 100">
                                    <div class="form-text">Especifica cuÃ¡ntas unidades idÃ©nticas deseas cotizar</div>
                                </div>
                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle me-2"></i>
                                    <strong>Nota:</strong> Se crearÃ¡ una cotizaciÃ³n con la cantidad especificada de unidades idÃ©nticas. 
                                    PodrÃ¡s configurar los detalles de la unidad modelo en el siguiente paso.
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-warning" onclick="iniciarCotizacionLote()">
                                    <i class="bi bi-arrow-right me-1"></i>Continuar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remover modal existente
            const modalExistente = document.getElementById("modalCotizacionLote");
            if (modalExistente) {
                modalExistente.remove();
            }
            
            // Agregar nuevo modal
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById("modalCotizacionLote"));
            modal.show();
        }
        
        function iniciarCotizacionLote() {
            const cantidad = parseInt(document.getElementById('cantidadLote').value);
            
            if (!cantidad || cantidad < 2) {
                mostrarAlerta('Por favor ingresa una cantidad vÃ¡lida (mÃ­nimo 2)', 'danger');
                return;
            }
            
            if (cantidad > 1000) {
                mostrarAlerta('La cantidad mÃ¡xima es 1000 unidades', 'danger');
                return;
            }
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById("modalCotizacionLote"));
            modal.hide();
            
            // Limpiar datos temporales y marcar como lote
            localStorage.removeItem('cotizacion_temp');
            localStorage.setItem('cotizacion_lote_cantidad', cantidad.toString());
            
            // Ir al wizard
            window.location.href = 'cotizaciones-wizard-corregido.html';
        }



    </script>
