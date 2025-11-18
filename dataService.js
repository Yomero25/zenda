// dataService.js - Capa de acceso a datos (Supabase) con fallback
// Requiere el script CDN de Supabase antes de cargar este archivo.

(function () {
  const SUPABASE_URL = 'https://lsmhcpsvjcbduqovbatj.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbWhjcHN2amNiZHVxb3ZiYXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTM4MzgsImV4cCI6MjA3MjU4OTgzOH0.I7dEer-R2ZaiMvU-Hmve6Ms0wk82U1e7C67e8fYWIEw';
  // Service key no se usa en el frontend por seguridad - solo se usa el anon key
  const SUPABASE_SERVICE_KEY = null;

  /** @type {import('@supabase/supabase-js').SupabaseClient | null} */
  let client = null;
  /** @type {import('@supabase/supabase-js').SupabaseClient | null} */
  let serviceClient = null;
  
  try {
    if (window && window.supabase && typeof window.supabase.createClient === 'function') {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      // Crear serviceClient solo cuando sea necesario para evitar múltiples instancias
      console.log('✅ Supabase inicializado');
    } else {
      console.warn('⚠️ Supabase CDN no encontrado; se usará fallback de localStorage');
    }
  } catch (e) {
    console.warn('⚠️ No fue posible inicializar Supabase; fallback localStorage.', e);
  }

  // Función para obtener serviceClient solo cuando sea necesario
  function getServiceClient() {
    if (!serviceClient && window && window.supabase && typeof window.supabase.createClient === 'function') {
      serviceClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }
    return serviceClient;
  }

  // =====================
  // Autenticación y Roles
  // Roles esperados: admin, ventas, despacho, instalaciones, almacen, precios
  async function authSignIn(email, password) {
    if (!client) throw new Error('Supabase no disponible');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user || null;
  }

  async function authSignOut() {
    if (!client) return;
    await client.auth.signOut();
  }

  async function getCurrentUser() {
    if (!client) return null;
    const { data } = await client.auth.getUser();
    return data && data.user ? data.user : null;
  }

  // Obtiene rol desde tabla 'perfiles' (esquema por columnas)
  async function getUserRole() {
    if (!client) return null;
    const user = await getCurrentUser();
    const email = (user && user.email ? user.email : '').toLowerCase();
    const uid = user && user.id ? user.id : null;

    // Preferir búsqueda por user_id cuando existe sesión válida
    if (uid) {
      try {
        const r = await client.from('perfiles').select('rol').eq('user_id', uid).limit(1).maybeSingle();
        if (!r.error && r.data && r.data.rol) return r.data.rol;
      } catch (_) {}
    }

    // Fallback por email (cuando user_id aún es NULL en perfiles)
    if (email) {
      try {
        const r2 = await client.from('perfiles').select('rol').eq('email', email).limit(1).maybeSingle();
        if (!r2.error && r2.data && r2.data.rol) return r2.data.rol;
      } catch (_) {}
    }

    // Fallback heurístico por nombre de correo (modo demo)
    try {
      if (email.includes('despacho')) return 'despacho';
      if (email.includes('instalacion')) return 'instalaciones';
      if (email.includes('almacen')) return 'almacen';
      if (email.includes('precio')) return 'precios';
      if (email.includes('venta')) return 'ventas';
    } catch (_) {}
    return null;
  }

  // Perfiles (admin)
  async function fetchPerfiles() {
    if (!client) return [];
    // Intento columnas
    try {
      const r = await client.from('perfiles').select('id, user_id, email, rol, data').order('id');
      if (!r.error) return r.data || [];
    } catch (_) {}
    // Intento jsonb
    try {
      const r = await client.from('perfiles').select('id, data');
      if (!r.error) return (r.data || []).map(row => ({ id: row.id, ...(row.data || {}) }));
    } catch (_) {}
    return [];
  }

  async function upsertPerfil(perfil) {
    if (!client) return false;
    const record = Object.assign({}, perfil);
    if (record.email) record.email = String(record.email).toLowerCase();
    // Buscar existente por user_id o email
    let existing = null;
    try {
      if (record.user_id) {
        const r = await client.from('perfiles').select('id').eq('user_id', record.user_id).limit(1).maybeSingle();
        if (!r.error && r.data) existing = r.data;
      }
    } catch (_) {}
    if (!existing && record.email) {
      try {
        const r = await client.from('perfiles').select('id').eq('email', record.email).limit(1).maybeSingle();
        if (!r.error && r.data) existing = r.data;
      } catch (_) {}
      if (!existing) {
        try {
          const r = await client.from('perfiles').select('id').eq('data->>email', record.email).limit(1).maybeSingle();
          if (!r.error && r.data) existing = r.data;
        } catch (_) {}
      }
    }
    // Intento columnas primero
    try {
      const payload = {
        user_id: record.user_id ?? null,
        email: record.email ?? null,
        rol: record.rol ?? null,
      };
      if (existing) {
        const { error } = await client.from('perfiles').update(payload).eq('id', existing.id);
        if (error) throw error;
        return true;
      } else {
        const { error } = await client.from('perfiles').insert(payload);
        if (error) throw error;
        return true;
      }
    } catch (_) {}
    // Fallback jsonb
    try {
      const data = { email: record.email || null, user_id: record.user_id || null, rol: record.rol || null };
      if (existing && existing.id) {
        const { error } = await client.from('perfiles').update({ data }).eq('id', existing.id);
        if (error) throw error;
        return true;
      } else {
        const { error } = await client.from('perfiles').insert({ data });
        if (error) throw error;
        return true;
      }
    } catch (e) {
      console.error('❌ upsertPerfil:', e);
      return false;
    }
  }

  async function deletePerfilByEmailOrUserId(key) {
    if (!client) return false;
    const value = String(key).toLowerCase();
    try {
      const byEmail = await client.from('perfiles').select('id').eq('email', value).limit(1).maybeSingle();
      if (!byEmail.error && byEmail.data) {
        const { error } = await client.from('perfiles').delete().eq('id', byEmail.data.id);
        if (error) throw error;
        return true;
      }
    } catch (_) {}
    try {
      const byJson = await client.from('perfiles').select('id').eq('data->>email', value).limit(1).maybeSingle();
      if (!byJson.error && byJson.data) {
        const { error } = await client.from('perfiles').delete().eq('id', byJson.data.id);
        if (error) throw error;
        return true;
      }
    } catch (_) {}
    try {
      const { error } = await client.from('perfiles').delete().eq('user_id', key);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('❌ deletePerfil:', e);
      return false;
    }
  }

  async function fetchSolicitudesDespacho() {
    if (!client) return null; // Fallback activado en capa superior
    const { data, error } = await client
      .from('solicitudes_despacho')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('❌ Supabase fetchSolicitudesDespacho:', error);
      return null;
    }
    // Adaptar a la estructura existente: usar row.data si existe
    return (data || []).map((row) => {
      if (row && row.data && typeof row.data === 'object') {
        return Object.assign({}, row.data, { _row_id: row.id });
      }
      // Si no hay data, retornamos el row "tal cual"
      return Object.assign({}, row, { _row_id: row.id });
    });
  }

  async function getRowByDataId(table, sid) {
    if (!client) return null;
    const { data, error } = await client
      .from(table)
      .select('id, data')
      .eq('data->>id', sid)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('❌ Supabase getRowByDataId:', error);
      return null;
    }
    return data;
  }

  async function getRowByDataField(table, field, value) {
    if (!client) return null;
    try {
      const { data, error } = await client
        .from(table)
        .select('id, data')
        .eq(`data->>${field}`, value)
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return data;
    } catch (_) {
      return null;
    }
  }

  async function patchJsonData(table, sid, patch) {
    if (!client) return false;
    const row = await getRowByDataId(table, sid);
    if (!row) return false;
    const newData = Object.assign({}, row.data || {}, patch || {});
    const { error } = await client.from(table).update({ data: newData }).eq('id', row.id);
    if (error) {
      console.error('❌ Supabase patchJsonData:', error);
      return false;
    }
    return true;
  }

  async function patchSolicitudDespachoById(solicitudId, patch) {
    return patchJsonData('solicitudes_despacho', solicitudId, patch);
  }

  async function fetchNotificacionesInstalaciones() {
    if (!client) return null;
    const { data, error } = await client
      .from('notificaciones_instalaciones')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('❌ Supabase fetchNotificacionesInstalaciones:', error);
      return null;
    }
    return (data || []).map((row) => {
      if (row && row.data && typeof row.data === 'object') {
        return Object.assign({}, row.data, { _row_id: row.id });
      }
      return Object.assign({}, row, { _row_id: row.id });
    });
  }

  async function insertNotificacionInstalaciones(notificacion) {
    if (!client) return false;
    const payload = { data: notificacion };
    const { error } = await client.from('notificaciones_instalaciones').insert(payload);
    if (error) {
      console.error('❌ Supabase insertNotificacionInstalaciones:', error);
      return false;
    }
    return true;
  }

  async function patchNotificacionInstalacionesById(nid, patch) {
    return patchJsonData('notificaciones_instalaciones', nid, patch);
  }

  async function patchNotificacionBySolicitudId(solicitudDespachoId, patch) {
    if (!client) return false;
    const { data, error } = await client
      .from('notificaciones_instalaciones')
      .select('id, data')
      .eq('data->>solicitudDespachoId', solicitudDespachoId)
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      console.warn('⚠️ No se encontró notificación por solicitud:', error);
      return false;
    }
    const newData = Object.assign({}, data.data || {}, patch || {});
    const { error: upErr } = await client.from('notificaciones_instalaciones').update({ data: newData }).eq('id', data.id);
    if (upErr) {
      console.error('❌ Supabase patchNotificacionBySolicitudId:', upErr);
      return false;
    }
    return true;
  }

  async function findNotificacionBySolicitudId(solicitudDespachoId) {
    if (!client) return null;
    const { data, error } = await client
      .from('notificaciones_instalaciones')
      .select('id, data')
      .eq('data->>solicitudDespachoId', solicitudDespachoId)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('❌ Supabase findNotificacionBySolicitudId:', error);
      return null;
    }
    return data;
  }

  // Buscar solicitud por cotizacionId
  async function findSolicitudByCotizacionId(cotizacionId) {
    if (!client) return null;
    const key = String(cotizacionId);
    const looksNumeric = /^\d+$/.test(key);
    // Intento JSONB
    try {
      const { data, error } = await client
        .from('solicitudes_despacho')
        .select('id, data')
        .eq('data->>cotizacionId', key)
        .limit(1)
        .maybeSingle();
      if (!error && data) return data;
    } catch (_) {}
    // Intento columnas
    if (looksNumeric) {
      try {
        const found = await client
          .from('solicitudes_despacho')
          .select('id')
          .eq('cotizacion_id', Number(key))
          .limit(1)
          .maybeSingle();
        if (!found.error && found.data) return found.data;
      } catch (_) {}
    }
    return null;
  }

  // Insertar solicitud de despacho (preferir JSONB data)
  async function insertSolicitudDespacho(solicitud) {
    if (!client) return false;
    // Intento JSONB
    try {
      const { error } = await client.from('solicitudes_despacho').insert({ data: solicitud });
      if (!error) return true;
      console.warn('⚠️ insertSolicitudDespacho(data) fallback a columnas:', error);
    } catch (e) {
      console.warn('⚠️ insertSolicitudDespacho(data) excepción, intento columnas:', e);
    }
    // Intento columnas mínimas
    try {
      const payload = {
        id: solicitud.id,
        cotizacion_id: solicitud.cotizacionId,
        cliente: solicitud.cliente,
        fecha: solicitud.fecha,
        estado: solicitud.estado,
        urgencia: solicitud.urgencia,
      };
      const { error } = await client.from('solicitudes_despacho').insert(payload);
      if (error) { console.error('❌ insertSolicitudDespacho(columns):', error); return false; }
      return true;
    } catch (e2) {
      console.error('❌ insertSolicitudDespacho:', e2);
      return false;
    }
  }

  function subscribeSolicitudesDespacho(callback) {
    if (!client) return null;
    const channel = client
      .channel('realtime:solicitudes_despacho')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes_despacho' }, (payload) => {
        try {
          callback && callback(payload);
        } catch (e) {
          console.error('❌ Error en callback realtime:', e);
        }
      })
      .subscribe((status) => {
        console.log('📡 Realtime solicitudes_despacho:', status);
      });
    return channel;
  }

  function subscribeNotificacionesInstalaciones(callback) {
    if (!client) return null;
    const channel = client
      .channel('realtime:notificaciones_instalaciones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificaciones_instalaciones' }, (payload) => {
        try { callback && callback(payload); } catch (e) { console.error('❌ Error callback realtime notif:', e); }
      })
      .subscribe((status) => { console.log('📡 Realtime notificaciones_instalaciones:', status); });
    return channel;
  }

  // =====================
  // Soporte - Notificaciones
  async function fetchNotificacionesSoporte() {
    if (!client) return null;
    const { data, error } = await client
      .from('notificaciones_soporte')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('❌ Supabase fetchNotificacionesSoporte:', error);
      return null;
    }
    return (data || []).map((row) => {
      if (row && row.data && typeof row.data === 'object') {
        return Object.assign({}, row.data, { _row_id: row.id });
      }
      return Object.assign({}, row, { _row_id: row.id });
    });
  }

  async function insertNotificacionSoporte(notificacion) {
    if (!client) return false;
    const payload = { data: notificacion };
    const { error } = await client.from('notificaciones_soporte').insert(payload);
    if (error) {
      console.error('❌ Supabase insertNotificacionSoporte:', error);
      return false;
    }
    return true;
  }

  async function patchNotificacionSoporteById(nid, patch) {
    return patchJsonData('notificaciones_soporte', nid, patch);
  }

  async function findNotificacionSoporteBySolicitudId(solicitudDespachoId) {
    if (!client) return null;
    const { data, error } = await client
      .from('notificaciones_soporte')
      .select('id, data')
      .eq('data->>solicitudDespachoId', solicitudDespachoId)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('❌ Supabase findNotificacionSoporteBySolicitudId:', error);
      return null;
    }
    return data;
  }

  function subscribeNotificacionesSoporte(callback) {
    if (!client) return null;
    const channel = client
      .channel('realtime:notificaciones_soporte')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificaciones_soporte' }, (payload) => {
        try { callback && callback(payload); } catch (e) { console.error('❌ Error callback realtime soporte:', e); }
      })
      .subscribe((status) => { console.log('🛠️ Realtime notificaciones_soporte:', status); });
    return channel;
  }

  // =====================
  // Almacén de Insumos
  // Estructura: table almacen_insumos con columna data jsonb
  // data = { id: string, tipoUnidad: string, tipoSolucion: string, insumos: Record<string,string> }
  async function fetchAlmacenInsumos() {
    if (!client) return null;
    // Intento 1: esquema por columnas (tipo_unidad, tipo_solucion, insumos)
    try {
      const rCols = await client
        .from('almacen_insumos')
        .select('tipo_unidad, tipo_solucion, insumos');
      if (!rCols.error && Array.isArray(rCols.data)) {
        return (rCols.data || []).map((row) => ({
          tipoUnidad: row.tipo_unidad,
          tipoSolucion: row.tipo_solucion,
          insumos: row.insumos || {},
          _schema: 'columns',
        }));
      }
    } catch (e) { /* caer a siguiente esquema */ }

    // Intento 2: esquema "insumos" (documento único)
    try {
      const r0 = await client
        .from('almacen_insumos')
        .select('insumos')
        .limit(1)
        .maybeSingle();
      if (!r0.error && r0.data && typeof r0.data === 'object' && r0.data.insumos) {
        return [{ insumos: r0.data.insumos, _schema: 'single_doc' }];
      }
    } catch (e) { /* caer a siguiente esquema */ }

    // Intento 3: esquema jsonb "data" por filas
    try {
      let r1 = await client.from('almacen_insumos').select('id, data');
      if (!r1.error) {
        const data = r1.data || [];
        return data.map((row) => {
          if (row && row.data && typeof row.data === 'object') {
            return Object.assign({}, row.data, { _row_id: row.id, _schema: 'rows' });
          }
          return Object.assign({}, row, { _row_id: row.id, _schema: 'rows' });
        });
      }
    } catch (e) {
      console.error('❌ Supabase fetchAlmacenInsumos:', e);
    }
    return [];
  }

  async function upsertAlmacenInsumoById(id, record) {
    if (!client) return false;
    // Intento 1: esquema por columnas (tipo_unidad, tipo_solucion, insumos)
    try {
      if (record && record.tipoUnidad && record.tipoSolucion) {
        const payload = {
          tipo_unidad: record.tipoUnidad,
          tipo_solucion: record.tipoSolucion,
          insumos: record.insumos || {},
        };
        
        // Verificar si ya existe una combinación con el mismo tipo_unidad y tipo_solucion
        const { data: existing } = await client
          .from('almacen_insumos')
          .select('id')
          .eq('tipo_unidad', record.tipoUnidad)
          .eq('tipo_solucion', record.tipoSolucion)
          .limit(1)
          .maybeSingle();
        
        if (existing) {
          // Actualizar registro existente
          const { error } = await client
            .from('almacen_insumos')
            .update(payload)
            .eq('id', existing.id);
          if (error) { console.error('❌ Supabase upsertAlmacenInsumoById(update):', error); return false; }
        } else {
          // Insertar nuevo registro
          const { error } = await client
            .from('almacen_insumos')
            .insert(payload);
          if (error) { console.error('❌ Supabase upsertAlmacenInsumoById(insert):', error); return false; }
        }
        return true;
      }
    } catch (e) { 
      console.error('❌ Error en upsertAlmacenInsumoById:', e);
      return false;
    }

    // Intento 2: documento único en columna "insumos": actualizar todo el documento
    try {
      const current = await client
        .from('almacen_insumos')
        .select('insumos')
        .limit(1)
        .maybeSingle();
      const nextDoc = Object.assign({}, (current.data && current.data.insumos) || {});
      if (record && record.tipoUnidad && record.tipoSolucion) {
        if (!nextDoc[record.tipoUnidad]) nextDoc[record.tipoUnidad] = {};
        nextDoc[record.tipoUnidad][record.tipoSolucion] = record.insumos || {};
      }
      // Insertamos un nuevo snapshot del documento (evita necesidad de PK)
      const { error } = await client.from('almacen_insumos').insert({ insumos: nextDoc });
      if (error) { console.error('❌ Supabase upsertAlmacenInsumoById(single_doc/insert):', error); return false; }
      return true;
    } catch (e) { /* caer a esquema por filas */ }

    // Intento 2: esquema por filas con columna jsonb "data"
    const existing = await getRowByDataId('almacen_insumos', id);
    const data = Object.assign({}, record, { id });
    if (existing) {
      const { error } = await client.from('almacen_insumos').update({ data }).eq('id', existing.id);
      if (error) { console.error('❌ Supabase upsertAlmacenInsumoById(update):', error); return false; }
      return true;
    } else {
      const { error } = await client.from('almacen_insumos').insert({ data });
      if (error) { console.error('❌ Supabase upsertAlmacenInsumoById(insert):', error); return false; }
      return true;
    }
  }

  async function deleteAlmacenInsumoById(id) {
    if (!client) return false;
    // Intento 1: esquema por columnas
    try {
      const [tipoUnidad, tipoSolucion] = String(id).split('::');
      if (tipoUnidad && tipoSolucion) {
        const { error } = await client
          .from('almacen_insumos')
          .delete()
          .eq('tipo_unidad', tipoUnidad)
          .eq('tipo_solucion', tipoSolucion);
        if (!error) return true;
      }
    } catch (e) { /* caer a otros esquemas */ }

    // Intento 2: documento único → eliminar la combinación dentro del JSON
    try {
      const current = await client
        .from('almacen_insumos')
        .select('insumos')
        .limit(1)
        .maybeSingle();
      if (!current.error && current.data && current.data.insumos) {
        const [tipoUnidad, tipoSolucion] = String(id).split('::');
        const nextDoc = Object.assign({}, current.data.insumos || {});
        if (nextDoc[tipoUnidad]) {
          delete nextDoc[tipoUnidad][tipoSolucion];
          if (Object.keys(nextDoc[tipoUnidad]).length === 0) delete nextDoc[tipoUnidad];
          const { error } = await client.from('almacen_insumos').insert({ insumos: nextDoc });
          if (error) { console.error('❌ Supabase deleteAlmacenInsumoById(single_doc/insert):', error); return false; }
          return true;
        }
        return true;
      }
    } catch (e) { /* caer a filas */ }

    // Intento 2: esquema por filas
    const row = await getRowByDataId('almacen_insumos', id);
    if (!row) return true;
    const { error } = await client.from('almacen_insumos').delete().eq('id', row.id);
    if (error) { console.error('❌ Supabase deleteAlmacenInsumoById:', error); return false; }
    return true;
  }

  function subscribeAlmacenInsumos(callback) {
    if (!client) return null;
    const channel = client
      .channel('realtime:almacen_insumos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'almacen_insumos' }, (payload) => {
        try { callback && callback(payload); } catch (e) { console.error('❌ Error callback realtime almacen:', e); }
      })
      .subscribe((status) => { console.log('📦 Realtime almacen_insumos:', status); });
    return channel;
  }

  // Reemplaza el documento completo de "insumos" (solo para esquema single-doc)
  async function replaceAlmacenDoc(insumosDoc) {
    if (!client) return false;
    try {
      const payload = { insumos: insumosDoc || {} };
      // Si existe un documento previo, insertamos un snapshot nuevo para mantener historial;
      // si la tabla tiene PK/unique y falla, intentamos update del más reciente.
      const { error } = await client.from('almacen_insumos').insert(payload);
      if (error) { console.error('❌ Supabase replaceAlmacenDoc(insert):', error); return false; }
      return true;
    } catch (e) {
      try {
        const last = await client.from('almacen_insumos').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (!last.error && last.data && last.data.id) {
          const { error: upErr } = await client.from('almacen_insumos').update({ insumos: insumosDoc || {} }).eq('id', last.data.id);
          if (upErr) { console.error('❌ Supabase replaceAlmacenDoc(update):', upErr); return false; }
          return true;
        }
      } catch (e2) {
        console.error('❌ Supabase replaceAlmacenDoc:', e2);
      }
      return false;
    }
  }

  // =====================
  // Precios de Elementos
  // Estructura: table precios_elementos con columna data jsonb
  // data = { id: string, nombre: string, categoria: 'insumos'|'accesorios'|'equipos', precio: number, ultimaActualizacion: string }
  async function fetchPreciosElementos() {
    if (!client) return null;
    // Intento 1: esquema en columnas (evitar 400 por order si no hay timestamps)
    try {
      const r1 = await client
        .from('precios_elementos')
        .select('elemento, precio, categoria, ultima_actualizacion');
      if (!r1.error) {
        return (r1.data || []).map((row) => ({
          nombre: row.elemento,
          precio: typeof row.precio === 'number' ? row.precio : (row.precio ? Number(row.precio) : 0),
          categoria: row.categoria,
          ultimaActualizacion: row.ultima_actualizacion,
          _schema: 'columns',
        }));
      }
    } catch (e) { /* caer a esquema data */ }

    // Intento 2: esquema jsonb "data"
    try {
      const r2 = await client.from('precios_elementos').select('data');
      if (!r2.error) {
        return (r2.data || []).map((row) => row.data || row);
      }
    } catch (e) {
      console.error('❌ Supabase fetchPreciosElementos:', e);
    }
    return [];
  }

  async function upsertPrecioElementoByNombre(nombre, record) {
    if (!client) return false;
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      console.warn('⚠️ upsertPrecioElementoByNombre: nombre inválido, se omite');
      return false;
    }
    const payload = {
      elemento: String(nombre),
      precio: record && typeof record.precio !== 'undefined' ? Number(record.precio) : 0,
      categoria: (record && record.categoria) ? String(record.categoria) : 'insumos',
      ultima_actualizacion: (record && record.ultimaActualizacion) || new Date().toISOString().split('T')[0],
    };
    try {
      // Usa upsert con conflicto en "elemento" (PK o índice único)
      const { error } = await client
        .from('precios_elementos')
        .upsert(payload, { onConflict: 'elemento' });
      if (error) { console.error('❌ Supabase upsertPrecioElementoByNombre(upsert):', error); return false; }
      return true;
    } catch (e) {
      console.error('❌ Supabase upsertPrecioElementoByNombre:', e);
      return false;
    }
  }

  async function deletePrecioElementoByNombre(nombre) {
    if (!client) return false;
    console.log('🔍 Eliminando elemento por nombre:', nombre);
    
    try {
      // Eliminar directamente por elemento (que es la clave primaria)
      const { error: deleteError } = await client
        .from('precios_elementos')
        .delete()
        .eq('elemento', nombre);
      
      if (deleteError) {
        console.error('❌ Error al eliminar elemento:', deleteError);
        return false;
      }
      
      console.log('✅ Elemento eliminado correctamente de Supabase');
      return true;
      
    } catch (e) {
      console.error('❌ Error general en deletePrecioElementoByNombre:', e);
      return false;
    }
  }

  function subscribePreciosElementos(callback) {
    if (!client) return null;
    const channel = client
      .channel('realtime:precios_elementos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'precios_elementos' }, (payload) => {
        try { callback && callback(payload); } catch (e) { console.error('❌ Error callback realtime precios:', e); }
      })
      .subscribe((status) => { console.log('💲 Realtime precios_elementos:', status); });
    return channel;
  }

  // =====================
  // Cotizaciones (ventas)
  // Estructura flexible: columna por columnas (id, folio, cliente_nombre, tipo_cliente, estado, fecha_cotizacion, total, ...)
  // o columna jsonb "data" con el objeto completo
  async function fetchCotizaciones() {
    if (!client) return null;
    // Intento 1: jsonb data
    try {
      const rData = await client.from('cotizaciones').select('id, data');
      if (!rData.error && Array.isArray(rData.data)) {
        return (rData.data || []).map((row) => {
          const obj = Object.assign({}, row.data || {});
          obj._row_id = row.id;
          obj._schema = 'rows';
          return obj;
        });
      }
    } catch (e) {
      console.error('❌ Supabase fetchCotizaciones:', e);
    }
    // Intento 2: columnas habituales
    try {
      const rCols = await client
        .from('cotizaciones')
        .select('id, folio, cliente_nombre, tipo_cliente, estado, fecha_cotizacion, fecha_vencimiento, total, unidades, soluciones, cantidad_lote, urgente');
      if (!rCols.error && Array.isArray(rCols.data)) {
        return (rCols.data || []).map((row) => ({
          id: row.id,
          folio: row.folio,
          cliente_nombre: row.cliente_nombre,
          tipo_cliente: row.tipo_cliente,
          estado: row.estado,
          fecha_cotizacion: row.fecha_cotizacion,
          fecha_vencimiento: row.fecha_vencimiento,
          total: typeof row.total === 'number' ? row.total : (row.total ? Number(row.total) : 0),
          unidades: row.unidades || [],
          soluciones: row.soluciones || [],
          cantidadLote: row.cantidad_lote || row.cantidadLote,
          urgente: row.urgente,
          _schema: 'columns',
        }));
      }
    } catch (e) { /* columnas no disponibles */ }
    return [];
  }

  async function getCotizacionRowByIdOrFolio(idOrFolio) {
    if (!client) return null;
    const key = String(idOrFolio);
    const looksNumeric = /^\d+$/.test(key);
    // Intento por jsonb->id
    let row = await getRowByDataId('cotizaciones', key);
    if (row) return { kind: 'rows', row };
    // Intento por jsonb->folio si es texto
    if (!looksNumeric) {
      const byFolio = await getRowByDataField('cotizaciones', 'folio', key);
      if (byFolio) return { kind: 'rows', row: byFolio };
    }
    // Intento por columnas: id numérico
    try {
      if (looksNumeric) {
        const rId = await client.from('cotizaciones').select('id').eq('id', idOrFolio).limit(1).maybeSingle();
        if (!rId.error && rId.data) return { kind: 'columns', row: rId.data };
      }
    } catch (e) { /* siguiente */ }
    return null;
  }

  async function upsertCotizacion(cotizacion) {
    if (!client) return false;
    if (!cotizacion) return false;
    // Intento 1: jsonb data
    try {
      // Si ya existe por data->>id, actualizamos; si no, insertamos
      const key = String(cotizacion.id || cotizacion.folio || '');
      let existing = key ? await getRowByDataId('cotizaciones', key) : null;
      if (!existing && cotizacion.folio) {
        existing = await getRowByDataField('cotizaciones', 'folio', String(cotizacion.folio));
      }
      if (existing) {
        const merged = Object.assign({}, existing.data || {}, cotizacion);
        const { error } = await client.from('cotizaciones').update({ data: merged }).eq('id', existing.id);
        if (error) { console.error('❌ upsertCotizacion(rows/update):', error); return false; }
        return true;
      }
      const { error } = await client.from('cotizaciones').insert({ data: cotizacion });
      if (error) { console.error('❌ upsertCotizacion(rows/insert):', error); return false; }
      return true;
    } catch (e) {
      console.warn('⚠️ upsertCotizacion(rows) falló, intentando columnas:', e);
    }

    // Intento 2: columnas
    try {
      const payload = {
        id: cotizacion.id,
        folio: cotizacion.folio,
        cliente_nombre: cotizacion.cliente_nombre,
        tipo_cliente: cotizacion.tipo_cliente,
        estado: cotizacion.estado,
        fecha_cotizacion: cotizacion.fecha_cotizacion,
        fecha_vencimiento: cotizacion.fecha_vencimiento,
        total: typeof cotizacion.total === 'number' ? cotizacion.total : (cotizacion.total ? Number(cotizacion.total) : 0),
        unidades: cotizacion.unidades || null,
        soluciones: cotizacion.soluciones || null,
        cantidad_lote: cotizacion.cantidadLote || cotizacion.cantidad_lote || null,
        urgente: cotizacion.urgente ?? null,
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const resp = await client
        .from('cotizaciones')
        .upsert(payload, { onConflict: 'folio' });
      if (resp.error) { console.error('❌ upsertCotizacion(columns):', resp.error); return false; }
      return true;
    } catch (e2) {
      console.error('❌ upsertCotizacion:', e2);
      return false;
    }
  }

  async function patchCotizacionById(idOrFolio, patch) {
    if (!client) return false;
    const key = String(idOrFolio);
    const looksNumeric = /^\d+$/.test(key);
    // Intento 1: jsonb data (id o folio)
    let found = await getRowByDataId('cotizaciones', key);
    if (!found && !looksNumeric) found = await getRowByDataField('cotizaciones', 'folio', key);
    if (found) {
      const merged = Object.assign({}, found.data || {}, patch || {});
      const { error } = await client.from('cotizaciones').update({ data: merged }).eq('id', found.id);
      if (error) { console.error('❌ patchCotizacionById(rows):', error); return false; }
      return true;
    }
    // Intento 2: columnas (solo id numérico)
    try {
      if (looksNumeric) {
        const r = await client.from('cotizaciones').update(patch).eq('id', idOrFolio);
        if (!r.error) return true;
        console.error('❌ patchCotizacionById(columns id):', r.error);
      }
      return false;
    } catch (e) {
      console.error('❌ patchCotizacionById:', e);
      return false;
    }
  }

  async function deleteCotizacionByIdOrFolio(idOrFolio) {
    if (!client) return false;
    const key = String(idOrFolio);
    const looksNumeric = /^\d+$/.test(key);
    // Intento 1: jsonb data->>id o ->>folio
    let found = await getRowByDataId('cotizaciones', key);
    if (!found && !looksNumeric) found = await getRowByDataField('cotizaciones', 'folio', key);
    if (found) {
      const { error } = await client.from('cotizaciones').delete().eq('id', found.id);
      if (error) { console.error('❌ deleteCotizacionByIdOrFolio(rows):', error); return false; }
      return true;
    }
    // Intento 2: columnas id (solo numérico)
    try {
      if (looksNumeric) {
        const del = await client.from('cotizaciones').delete().eq('id', idOrFolio);
        if (!del.error && (del.count === null || del.count >= 0)) return true;
      }
    } catch (e) { /* siguiente */ }
    console.error('❌ deleteCotizacionByIdOrFolio: no encontrado');
    return false;
  }

  // Elimina cotización y sus dependencias en Despacho/Instalaciones
  async function deleteCotizacionCascade(idOrFolio) {
    const keys = [];
    const keyStr = String(idOrFolio || '').trim();
    if (keyStr) keys.push(keyStr);
    // Intentar obtener datos completos para tener id y folio
    try {
      const obj = await window.dataService.getCotizacionByIdOrFolio(idOrFolio);
      if (obj) {
        if (obj.id !== undefined && obj.id !== null && String(obj.id).trim() !== '') keys.push(String(obj.id));
        if (obj.folio) keys.push(String(obj.folio));
      }
    } catch (_) {}

    const uniqueKeys = Array.from(new Set(keys.filter(Boolean)));
    const despIds = new Set();
    if (client) {
      // Borrar solicitudes_despacho y recolectar ids para borrar notificaciones
      for (const k of uniqueKeys) {
        try {
          // Recolectar por JSONB
          const rSel = await client.from('solicitudes_despacho').select('id, data').eq('data->>cotizacionId', k);
          if (!rSel.error && Array.isArray(rSel.data)) {
            rSel.data.forEach(row => { if (row && row.data && row.data.id) despIds.add(String(row.data.id)); });
          }
        } catch (_) {}
        // Columnas (numéricas)
        if (/^\d+$/.test(k)) {
          try { await client.from('solicitudes_despacho').delete().eq('cotizacion_id', Number(k)); } catch(_){}
        }
        try { await client.from('solicitudes_despacho').delete().eq('data->>cotizacionId', k); } catch(_){}
        // Notificaciones por cotizacion (instalaciones y soporte)
        try { 
          const result1 = await client.from('notificaciones_instalaciones').delete().eq('data->>cotizacionId', k);
          console.log(`🗑️ Eliminadas notificaciones instalaciones para cotización ${k}:`, result1);
        } catch(e){ console.warn('Error eliminando notificaciones instalaciones:', e); }
        try { 
          // Primero verificar si existen notificaciones antes de eliminar
          const { data: notifExistentes, error: errorCheck } = await client
            .from('notificaciones_soporte')
            .select('id, data')
            .eq('data->>cotizacionId', k);
          
          console.log(`🔍 DEBUG: Notificaciones soporte existentes para cotización ${k}:`, notifExistentes);
          if (errorCheck) console.warn('Error verificando notificaciones soporte:', errorCheck);
          
          // Usar serviceClient para eliminación (tiene permisos completos)
          const clientToUse = getServiceClient() || client;
          const result2 = await clientToUse.from('notificaciones_soporte').delete().eq('data->>cotizacionId', k);
          console.log(`🗑️ Eliminadas notificaciones soporte para cotización ${k}:`, result2);
        } catch(e){ console.warn('Error eliminando notificaciones soporte:', e); }
      }
      // Notificaciones por solicitudDespachoId
      for (const despId of despIds) {
        try { 
          const result3 = await client.from('notificaciones_instalaciones').delete().eq('data->>solicitudDespachoId', despId);
          console.log(`🗑️ Eliminadas notificaciones instalaciones para solicitud ${despId}:`, result3);
        } catch(e){ console.warn('Error eliminando notificaciones instalaciones por solicitud:', e); }
        try { 
          // Usar serviceClient para eliminación (tiene permisos completos)
          const clientToUse = getServiceClient() || client;
          const result4 = await clientToUse.from('notificaciones_soporte').delete().eq('data->>solicitudDespachoId', despId);
          console.log(`🗑️ Eliminadas notificaciones soporte para solicitud ${despId}:`, result4);
        } catch(e){ console.warn('Error eliminando notificaciones soporte por solicitud:', e); }
      }
      // Eliminar la cotización
      try { await deleteCotizacionByIdOrFolio(idOrFolio); } catch(_){}
    }

    // Fallback/local: limpiar localStorage para evitar que reaparezcan
    try {
      const sRaw = localStorage.getItem('solicitudes_despacho');
      if (sRaw) {
        let arr = JSON.parse(sRaw);
        arr = Array.isArray(arr) ? arr.filter(s => !uniqueKeys.includes(String(s.cotizacionId))) : [];
        localStorage.setItem('solicitudes_despacho', JSON.stringify(arr));
      }
    } catch (_) {}
    try {
      const nRaw = localStorage.getItem('notificaciones_instalaciones');
      if (nRaw) {
        let arrN = JSON.parse(nRaw);
        const despList = Array.from(despIds);
        arrN = Array.isArray(arrN) ? arrN.filter(n => !uniqueKeys.includes(String(n.cotizacionId)) && !despList.includes(String(n.solicitudDespachoId))) : [];
        localStorage.setItem('notificaciones_instalaciones', JSON.stringify(arrN));
      }
    } catch (_) {}
    try {
      const sRaw = localStorage.getItem('notificaciones_soporte');
      if (sRaw) {
        let arrS = JSON.parse(sRaw);
        const despList = Array.from(despIds);
        arrS = Array.isArray(arrS) ? arrS.filter(n => !uniqueKeys.includes(String(n.cotizacionId)) && !despList.includes(String(n.solicitudDespachoId))) : [];
        localStorage.setItem('notificaciones_soporte', JSON.stringify(arrS));
      }
    } catch (_) {}
    return true;
  }

  function subscribeCotizaciones(callback) {
    if (!client) return null;
    const channel = client
      .channel('realtime:cotizaciones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cotizaciones' }, (payload) => {
        try { callback && callback(payload); } catch (e) { console.error('❌ Error callback realtime cotizaciones:', e); }
      })
      .subscribe((status) => { console.log('🧾 Realtime cotizaciones:', status); });
    return channel;
  }

  // Función para actualizar cotización
  async function actualizarCotizacion(idOrFolio, datos) {
    try {
      if (!client) {
        console.warn('⚠️ Supabase no disponible, actualizando localStorage');
        // Actualizar localStorage si no hay Supabase
        const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
        const index = cotizaciones.findIndex(c => String(c.id) === String(idOrFolio) || String(c.folio) === String(idOrFolio));
        if (index !== -1) {
          cotizaciones[index] = { ...cotizaciones[index], ...datos };
          localStorage.setItem('cotizaciones', JSON.stringify(cotizaciones));
        }
        return { success: true };
      }

      // Buscar la cotización por ID o folio
      const found = await getCotizacionRowByIdOrFolio(idOrFolio);
      if (!found) {
        throw new Error('Cotización no encontrada');
      }

      // Actualizar en Supabase
      if (found.kind === 'rows') {
        // Estructura JSONB
        console.log('🔍 DEBUG actualizarCotizacion:', {
          idOrFolio,
          datosEnviados: datos,
          datosExistentes: found.row.data,
          mergeResultado: { ...found.row.data, ...datos },
          facturadaExistente: found.row.data.facturada,
          facturadaEnviada: datos.facturada
        });
        
        const { data, error } = await client
          .from('cotizaciones')
          .update({ data: { ...found.row.data, ...datos } })
          .eq('id', found.row.id);
        
        if (error) throw error;
        console.log('✅ Cotización actualizada en Supabase (JSONB):', idOrFolio);
      } else {
        // Estructura por columnas
        const { data, error } = await client
          .from('cotizaciones')
          .update(datos)
          .eq('id', found.row.id);
        
        if (error) throw error;
        console.log('✅ Cotización actualizada en Supabase (columnas):', idOrFolio);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error actualizando cotización:', error);
      return { success: false, error: error.message };
    }
  }

  // Función para actualizar notificaciones de instalaciones
  async function actualizarNotificacionInstalaciones(notificacionId, datos) {
    try {
      if (!client) {
        console.warn('⚠️ Supabase no disponible, actualizando localStorage');
        // Actualizar localStorage si no hay Supabase
        const notificaciones = JSON.parse(localStorage.getItem('notificaciones_instalaciones') || '[]');
        const index = notificaciones.findIndex(n => String(n.id) === String(notificacionId));
        if (index !== -1) {
          notificaciones[index] = { ...notificaciones[index], ...datos };
          localStorage.setItem('notificaciones_instalaciones', JSON.stringify(notificaciones));
        }
        return { success: true };
      }

      // Actualizar en Supabase
      const { data, error } = await client
        .from('notificaciones_instalaciones')
        .update(datos)
        .eq('id', notificacionId);
      
      if (error) throw error;
      console.log('✅ Notificación instalaciones actualizada en Supabase:', notificacionId);

      return { success: true };
    } catch (error) {
      console.error('❌ Error actualizando notificación instalaciones:', error);
      return { success: false, error: error.message };
    }
  }

  // =====================
  // Configuración del Sistema
  async function upsertConfiguracionSistema(clave, valor) {
    if (!client) return false;
    try {
      const payload = {
        clave: clave,
        valor: valor,
        ultima_actualizacion: new Date().toISOString()
      };
      
      const { error } = await client
        .from('configuracion_sistema')
        .upsert(payload, { onConflict: 'clave' });
      
      if (error) {
        console.error('❌ Error upsertConfiguracionSistema:', error);
        return false;
      }
      
      console.log('✅ Configuración del sistema actualizada:', clave);
      return true;
    } catch (e) {
      console.error('❌ Error upsertConfiguracionSistema:', e);
      return false;
    }
  }

  async function fetchConfiguracionSistema(clave) {
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('configuracion_sistema')
        .select('valor')
        .eq('clave', clave)
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error fetchConfiguracionSistema:', error);
        return null;
      }
      
      return data ? data.valor : null;
    } catch (e) {
      console.error('❌ Error fetchConfiguracionSistema:', e);
      return null;
    }
  }

  // =====================
  // Gestión de Tipos Separados
  // =====================
  
  // Tipos de Unidad
  async function fetchTiposUnidad() {
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('tipos_unidad')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      
      if (error) {
        console.error('❌ Error fetchTiposUnidad:', error);
        return [];
      }
      
      return data || [];
    } catch (e) {
      console.error('❌ Error fetchTiposUnidad:', e);
      return [];
    }
  }

  async function upsertTipoUnidad(nombre, descripcion = '') {
    if (!client) return false;
    try {
      const { error } = await client
        .from('tipos_unidad')
        .upsert({
          nombre: nombre,
          descripcion: descripcion,
          activo: true,
          fecha_actualizacion: new Date().toISOString()
        }, { onConflict: 'nombre' });
      
      if (error) {
        console.error('❌ Error upsertTipoUnidad:', error);
        return false;
      }
      
      console.log('✅ Tipo de unidad actualizado:', nombre);
      return true;
    } catch (e) {
      console.error('❌ Error upsertTipoUnidad:', e);
      return false;
    }
  }

  async function deleteTipoUnidad(id) {
    if (!client) return false;
    try {
      const { error } = await client
        .from('tipos_unidad')
        .update({ activo: false })
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error deleteTipoUnidad:', error);
        return false;
      }
      
      console.log('✅ Tipo de unidad eliminado:', id);
      return true;
    } catch (e) {
      console.error('❌ Error deleteTipoUnidad:', e);
      return false;
    }
  }

  // Tipos de Solución
  async function fetchTiposSolucion() {
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('tipos_solucion')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      
      if (error) {
        console.error('❌ Error fetchTiposSolucion:', error);
        return [];
      }
      
      return data || [];
    } catch (e) {
      console.error('❌ Error fetchTiposSolucion:', e);
      return [];
    }
  }

  async function upsertTipoSolucion(nombre, descripcion = '', categoria = '') {
    if (!client) return false;
    try {
      const { error } = await client
        .from('tipos_solucion')
        .upsert({
          nombre: nombre,
          descripcion: descripcion,
          categoria: categoria,
          activo: true,
          fecha_actualizacion: new Date().toISOString()
        }, { onConflict: 'nombre' });
      
      if (error) {
        console.error('❌ Error upsertTipoSolucion:', error);
        return false;
      }
      
      console.log('✅ Tipo de solución actualizado:', nombre);
      return true;
    } catch (e) {
      console.error('❌ Error upsertTipoSolucion:', e);
      return false;
    }
  }

  async function deleteTipoSolucion(id) {
    if (!client) return false;
    try {
      const { error } = await client
        .from('tipos_solucion')
        .update({ activo: false })
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error deleteTipoSolucion:', error);
        return false;
      }
      
      console.log('✅ Tipo de solución eliminado:', id);
      return true;
    } catch (e) {
      console.error('❌ Error deleteTipoSolucion:', e);
      return false;
    }
  }

  // Tipos de Insumo
  async function fetchTiposInsumo() {
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('tipos_insumo')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      
      if (error) {
        console.error('❌ Error fetchTiposInsumo:', error);
        return [];
      }
      
      return data || [];
    } catch (e) {
      console.error('❌ Error fetchTiposInsumo:', e);
      return [];
    }
  }

  async function upsertTipoInsumo(nombre, descripcion = '', categoria = '', unidad_medida = '') {
    if (!client) return false;
    try {
      const { error } = await client
        .from('tipos_insumo')
        .upsert({
          nombre: nombre,
          descripcion: descripcion,
          categoria: categoria,
          unidad_medida: unidad_medida,
          activo: true,
          fecha_actualizacion: new Date().toISOString()
        }, { onConflict: 'nombre' });
      
      if (error) {
        console.error('❌ Error upsertTipoInsumo:', error);
        return false;
      }
      
      console.log('✅ Tipo de insumo actualizado:', nombre);
      return true;
    } catch (e) {
      console.error('❌ Error upsertTipoInsumo:', e);
      return false;
    }
  }

  async function deleteTipoInsumo(id) {
    if (!client) return false;
    try {
      const { error } = await client
        .from('tipos_insumo')
        .update({ activo: false })
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error deleteTipoInsumo:', error);
        return false;
      }
      
      console.log('✅ Tipo de insumo eliminado:', id);
      return true;
    } catch (e) {
      console.error('❌ Error deleteTipoInsumo:', e);
      return false;
    }
  }

  // =====================
  // Funciones de Rastreo
  // =====================
  
  async function fetchFuncionesRastreo() {
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('funciones_rastreo')
        .select('*')
        .eq('activo', true)
        .order('funcionalidad');
      
      if (error) {
        console.error('❌ Error fetchFuncionesRastreo:', error);
        return [];
      }
      
      return data || [];
    } catch (e) {
      console.error('❌ Error fetchFuncionesRastreo:', e);
      return [];
    }
  }

  async function upsertFuncionRastreo(funcionalidad, insumos = []) {
    if (!client) return false;
    try {
      const { error } = await client
        .from('funciones_rastreo')
        .upsert({
          funcionalidad: funcionalidad,
          insumos: insumos,
          activo: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'funcionalidad'
        });
      
      if (error) {
        console.error('❌ Error upsertFuncionRastreo:', error);
        return false;
      }
      
      console.log('✅ Función de rastreo actualizada:', funcionalidad);
      return true;
    } catch (e) {
      console.error('❌ Error upsertFuncionRastreo:', e);
      return false;
    }
  }

  async function deleteFuncionRastreo(funcionalidad) {
    if (!client) return false;
    try {
      const { error } = await client
        .from('funciones_rastreo')
        .update({ activo: false })
        .eq('funcionalidad', funcionalidad);
      
      if (error) {
        console.error('❌ Error deleteFuncionRastreo:', error);
        return false;
      }
      
      console.log('✅ Función de rastreo eliminada:', funcionalidad);
      return true;
    } catch (e) {
      console.error('❌ Error deleteFuncionRastreo:', e);
      return false;
    }
  }

  // =====================
  // Servicios de Datos
  // =====================

  async function fetchServiciosDatos() {
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('servicios_datos')
        .select('*')
        .eq('activo', true)
        .order('nombre, tipo_periodicidad');
      
      if (error) {
        console.error('❌ Error fetchServiciosDatos:', error);
        return [];
      }
      
      return data || [];
    } catch (e) {
      console.error('❌ Error fetchServiciosDatos:', e);
      return [];
    }
  }

  async function upsertServicioDatos(servicioData) {
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('servicios_datos')
        .upsert(servicioData, { 
          onConflict: 'nombre,tipo_periodicidad',
          ignoreDuplicates: false 
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error upsertServicioDatos:', error);
        return null;
      }
      
      return data;
    } catch (e) {
      console.error('❌ Error upsertServicioDatos:', e);
      return null;
    }
  }

  async function deleteServicioDatos(id) {
    if (!client) return false;
    try {
      const { error } = await client
        .from('servicios_datos')
        .update({ activo: false })
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error deleteServicioDatos:', error);
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('❌ Error deleteServicioDatos:', e);
      return false;
    }
  }

  // Exponer API
  window.DataService = {
    hasSupabase: () => !!client,
    // auth
    authSignIn,
    authSignOut,
    getCurrentUser,
    getUserRole,
    // perfiles (admin)
    fetchPerfiles,
    upsertPerfil,
    deletePerfilByEmailOrUserId,
    fetchSolicitudesDespacho,
    subscribeSolicitudesDespacho,
    patchSolicitudDespachoById,
    findSolicitudByCotizacionId,
    insertSolicitudDespacho,
    fetchNotificacionesInstalaciones,
    insertNotificacionInstalaciones,
    patchNotificacionInstalacionesById,
    patchNotificacionBySolicitudId,
    findNotificacionBySolicitudId,
    actualizarNotificacionInstalaciones,
    subscribeNotificacionesInstalaciones,
    // soporte
    fetchNotificacionesSoporte,
    insertNotificacionSoporte,
    patchNotificacionSoporteById,
    findNotificacionSoporteBySolicitudId,
    subscribeNotificacionesSoporte,
    // almacen
    fetchAlmacenInsumos,
    upsertAlmacenInsumoById,
    deleteAlmacenInsumoById,
    subscribeAlmacenInsumos,
    replaceAlmacenDoc,
    // precios
    fetchPreciosElementos,
    upsertPrecioElementoByNombre,
    deletePrecioElementoByNombre,
    subscribePreciosElementos,
    // cotizaciones
    fetchCotizaciones,
    upsertCotizacion,
    deleteCotizacionByIdOrFolio,
    deleteCotizacionCascade,
    patchCotizacionById,
    actualizarCotizacion,
    subscribeCotizaciones,
    // configuracion
    upsertConfiguracionSistema,
    fetchConfiguracionSistema,
    // tipos separados
    fetchTiposUnidad,
    upsertTipoUnidad,
    deleteTipoUnidad,
    fetchTiposSolucion,
    upsertTipoSolucion,
    deleteTipoSolucion,
    fetchTiposInsumo,
    upsertTipoInsumo,
    deleteTipoInsumo,
    // funciones de rastreo
    fetchFuncionesRastreo,
    upsertFuncionRastreo,
    deleteFuncionRastreo,
    // servicios de datos
    fetchServiciosDatos,
    upsertServicioDatos,
    deleteServicioDatos,
    // funciones de correo
    guardarConfiguracionCorreo: async (config) => {
      if (!client) throw new Error('Supabase no disponible');
      
      try {
        const { data, error } = await client
          .from('configuraciones_correo')
          .upsert({
            id: 'smtp_config',
            smtp_server: config.smtpServer,
            smtp_port: config.smtpPort,
            from_email: config.fromEmail,
            from_name: config.fromName,
            password: config.password,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
          
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        console.error('Error guardando configuración de correo:', error);
        throw error;
      }
    },

    obtenerConfiguracionCorreo: async () => {
      if (!client) throw new Error('Supabase no disponible');
      
      try {
        const { data, error } = await client
          .from('configuraciones_correo')
          .select('*')
          .eq('id', 'smtp_config')
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          return {
            smtpServer: data.smtp_server,
            smtpPort: data.smtp_port,
            fromEmail: data.from_email,
            fromName: data.from_name,
            password: data.password
          };
        }
        
        return null;
      } catch (error) {
        console.error('Error obteniendo configuración de correo:', error);
        throw error;
      }
    },

    guardarPlantillaCorreo: async (tipo, plantilla) => {
      if (!client) throw new Error('Supabase no disponible');
      
      try {
        const { data, error } = await client
          .from('plantillas_correo')
          .upsert({
            id: tipo,
            tipo: tipo,
            subject: plantilla.subject,
            html: plantilla.html,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
          
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        console.error('Error guardando plantilla de correo:', error);
        throw error;
      }
    },

    obtenerPlantillasCorreo: async () => {
      if (!client) throw new Error('Supabase no disponible');
      
      try {
        const { data, error } = await client
          .from('plantillas_correo')
          .select('*');
          
        if (error) throw error;
        
        const plantillas = {};
        data.forEach(item => {
          plantillas[item.tipo] = {
            subject: item.subject,
            html: item.html
          };
        });
        
        return plantillas;
      } catch (error) {
        console.error('Error obteniendo plantillas de correo:', error);
        throw error;
      }
    },

    guardarConfiguracionSeguimiento: async (config) => {
      if (!client) throw new Error('Supabase no disponible');
      
      try {
        const { data, error } = await client
          .from('configuraciones_seguimiento')
          .upsert({
            id: 'seguimiento_config',
            dias_seguimiento: config.diasSeguimiento,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
          
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        console.error('Error guardando configuración de seguimiento:', error);
        throw error;
      }
    },

    obtenerConfiguracionSeguimiento: async () => {
      if (!client) throw new Error('Supabase no disponible');
      
      try {
        const { data, error } = await client
          .from('configuraciones_seguimiento')
          .select('*')
          .eq('id', 'seguimiento_config')
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          return {
            diasSeguimiento: data.dias_seguimiento
          };
        }
        
        return null;
      } catch (error) {
        console.error('Error obteniendo configuración de seguimiento:', error);
        throw error;
      }
    },

    guardarRegistroCorreo: async (registro) => {
      if (!client) throw new Error('Supabase no disponible');
      
      try {
        const { data, error } = await client
          .from('registros_correos')
          .insert({
            cotizacion_id: registro.cotizacionId,
            numero_cotizacion: registro.numero,
            destinatarios_principales: JSON.stringify(registro.emails?.principales || []),
            destinatarios_copia: JSON.stringify(registro.emails?.copia || []),
            destinatarios_bcc: JSON.stringify(registro.emails?.bcc || []),
            tipo_envio: registro.tipoEnvio || 'cotizacion',
            cliente_email: registro.cliente?.email,
            cliente_empresa: registro.cliente?.empresa,
            total_cotizacion: registro.total,
            fecha_envio: registro.fecha_envio,
            mensaje_personalizado: registro.mensajePersonalizado,
            created_at: new Date().toISOString()
          });
          
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        console.error('Error guardando registro de correo:', error);
        throw error;
      }
    },

    obtenerRegistrosCorreos: async (filtros = {}) => {
      if (!client) throw new Error('Supabase no disponible');
      
      try {
        let query = client.from('registros_correos').select('*');
        
        if (filtros.cotizacionId) {
          query = query.eq('cotizacion_id', filtros.cotizacionId);
        }
        
        if (filtros.fechaDesde) {
          query = query.gte('fecha_envio', filtros.fechaDesde);
        }
        
        if (filtros.fechaHasta) {
          query = query.lte('fecha_envio', filtros.fechaHasta);
        }
        
        query = query.order('created_at', { ascending: false });
        
        const { data, error } = await query;
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('Error obteniendo registros de correos:', error);
        throw error;
      }
    },

    // helpers
    getCotizacionByIdOrFolio: async (idOrFolio) => {
      const found = await getCotizacionRowByIdOrFolio(idOrFolio);
      if (!found) return null;
      if (found.kind === 'rows') return found.row.data || null;
      // columnas: obtener fila completa si es necesario
      try {
        const { data, error } = await client
          .from('cotizaciones')
          .select('id, folio, cliente_nombre, tipo_cliente, estado, fecha_cotizacion, fecha_vencimiento, total, unidades, soluciones, cantidad_lote, urgente')
          .eq('id', found.row.id)
          .limit(1)
          .maybeSingle();
        if (!error && data) return data;
      } catch (_) {}
      return null;
    },
  };
})();


