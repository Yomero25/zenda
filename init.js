const { pool, testConnection, createTables } = require('./config/database');
const bcrypt = require('bcryptjs');

async function inicializarSistema() {
  console.log('🚀 Inicializando Sistema de Trazabilidad...\n');

  try {
    // 1. Probar conexión a la base de datos
    console.log('📡 Probando conexión a la base de datos...');
    await testConnection();

    // 2. Crear tablas
    console.log('\n🗄️ Creando/verificando tablas...');
    await createTables();

    // 3. Crear usuario administrador por defecto
    console.log('\n👤 Creando usuario administrador...');
    await crearUsuarioAdmin();

    // 4. Crear datos de ejemplo
    console.log('\n📝 Creando datos de ejemplo...');
    await crearDatosEjemplo();

    console.log('\n✅ Sistema inicializado correctamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Inicia el servidor: npm run dev');
    console.log('2. En otra terminal, inicia el cliente: npm run client');
    console.log('3. Accede a http://localhost:3000');
    console.log('4. Inicia sesión con: admin@empresa.com / admin123');

  } catch (error) {
    console.error('\n❌ Error durante la inicialización:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function crearUsuarioAdmin() {
  try {
    // Verificar si ya existe un usuario admin
    const checkResult = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      ['admin@empresa.com']
    );

    if (checkResult.rows.length > 0) {
      console.log('   Usuario administrador ya existe');
      return;
    }

    // Crear hash de la contraseña
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Insertar usuario administrador
    await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol)
       VALUES ($1, $2, $3, $4)`,
      ['Administrador', 'admin@empresa.com', passwordHash, 'admin']
    );

    console.log('   Usuario administrador creado: admin@empresa.com / admin123');
  } catch (error) {
    console.error('   Error creando usuario admin:', error.message);
  }
}

async function crearDatosEjemplo() {
  try {
    // Crear cliente de ejemplo
    const clienteResult = await pool.query(
      `INSERT INTO clientes (nombre, email, telefono, empresa, contacto_principal)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ['Cliente Ejemplo', 'cliente@ejemplo.com', '+1234567890', 'Empresa Ejemplo S.A.', 'Juan Pérez']
    );

    const clienteId = clienteResult.rows[0].id;

    // Crear proyecto de ejemplo
    const proyectoResult = await pool.query(
      `INSERT INTO proyectos (cliente_id, nombre, descripcion, estado, presupuesto)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [clienteId, 'Proyecto Demo', 'Proyecto de demostración del sistema', 'nuevo', 50000.00]
    );

    const proyectoId = proyectoResult.rows[0].id;

    // Crear venta de ejemplo
    await pool.query(
      `INSERT INTO ventas (proyecto_id, cliente_id, productos, valor_total, estado)
       VALUES ($1, $2, $3, $4, $5)`,
      [proyectoId, clienteId, 'MDVR 4 Ch, Sideview, Dashcam', 50000.00, 'pendiente']
    );

    console.log('   Datos de ejemplo creados: 1 cliente, 1 proyecto, 1 venta');

  } catch (error) {
    console.error('   Error creando datos de ejemplo:', error.message);
  }
}

// Ejecutar inicialización
inicializarSistema();
