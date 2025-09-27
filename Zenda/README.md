# Sistema de Trazabilidad - Soluciones Tecnológicas

Sistema web completo para gestionar la trazabilidad, registro y control de cada proceso involucrado con la venta, despacho, configuración e instalación de soluciones tecnológicas.

## 🚀 Características Principales

- **Gestión de Clientes**: Registro completo de clientes y empresas
- **Gestión de Proyectos**: Seguimiento del ciclo de vida completo
- **Control de Ventas**: Registro y seguimiento de transacciones
- **Seguimiento de Despachos**: Trazabilidad de envíos y entregas
- **Configuraciones**: Control de parámetros y especificaciones técnicas
- **Instalaciones**: Seguimiento de implementación en campo
- **Dashboard en Tiempo Real**: Métricas y estadísticas actualizadas
- **Sistema de Usuarios**: Roles y permisos diferenciados
- **Auditoría Completa**: Historial de todos los cambios

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** con Express.js
- **PostgreSQL** como base de datos
- **JWT** para autenticación
- **Multer** para manejo de archivos

### Frontend
- **React.js** con hooks
- **React Bootstrap** para la interfaz
- **Axios** para comunicación con API
- **React Router** para navegación
- **Chart.js** para gráficos y estadísticas

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- PostgreSQL (versión 12 o superior)
- npm o yarn

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd sistema-trazabilidad
```

### 2. Instalar dependencias del backend
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp env.example .env
```
Editar el archivo `.env` con tus credenciales:
```env
PORT=5000
NODE_ENV=development
DB_USER=tu_usuario
DB_HOST=localhost
DB_NAME=sistema_trazabilidad
DB_PASSWORD=tu_password
DB_PORT=5432
JWT_SECRET=tu_secret_super_seguro
```

### 4. Configurar la base de datos
```bash
# Crear base de datos en PostgreSQL
createdb sistema_trazabilidad

# Las tablas se crearán automáticamente al iniciar el servidor
```

### 5. Instalar dependencias del frontend
```bash
cd client
npm install
cd ..
```

### 6. Iniciar el sistema

#### Opción A: Desarrollo (dos terminales)
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
npm run client
```

#### Opción B: Producción
```bash
npm run build
npm start
```

## 🌐 Acceso al Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Test**: http://localhost:5000/api/test

## 📊 Estructura de la Base de Datos

### Tablas Principales
- **usuarios**: Gestión de usuarios del sistema
- **clientes**: Información de clientes y empresas
- **proyectos**: Proyectos y su estado
- **ventas**: Registro de transacciones comerciales
- **despachos**: Seguimiento de envíos
- **configuraciones**: Parámetros técnicos
- **instalaciones**: Implementación en campo
- **auditoria**: Historial de cambios

## 🔐 Autenticación y Seguridad

- Sistema de login con JWT
- Encriptación de contraseñas con bcrypt
- Middleware de autenticación para rutas protegidas
- Validación de datos en frontend y backend

## 📱 Funcionalidades por Módulo

### Dashboard
- Resumen de estadísticas
- Proyectos recientes
- Acciones rápidas
- Gráficos de rendimiento

### Clientes
- CRUD completo de clientes
- Búsqueda avanzada
- Historial de proyectos
- Información de contacto

### Proyectos
- Creación y seguimiento
- Cambios de estado
- Asignación de responsables
- Presupuestos y fechas

### Ventas
- Registro de transacciones
- Productos y servicios
- Seguimiento de pagos
- Reportes de ventas

### Despachos
- Seguimiento de envíos
- Transportistas
- Números de seguimiento
- Confirmación de entrega

### Configuraciones
- Parámetros técnicos
- Especificaciones
- Historial de cambios
- Documentación adjunta

### Instalaciones
- Seguimiento de implementación
- Fotos antes/después
- Firma del cliente
- Reportes de instalación

## 🚀 Despliegue

### Heroku
```bash
heroku create tu-app
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

### Vercel (Frontend)
```bash
npm run build
vercel --prod
```

### Railway
```bash
railway login
railway init
railway up
```

## 📝 API Endpoints

### Clientes
- `GET /api/clientes` - Listar todos los clientes
- `POST /api/clientes` - Crear nuevo cliente
- `GET /api/clientes/:id` - Obtener cliente por ID
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente

### Proyectos
- `GET /api/proyectos` - Listar todos los proyectos
- `POST /api/proyectos` - Crear nuevo proyecto
- `GET /api/proyectos/:id` - Obtener proyecto por ID
- `PUT /api/proyectos/:id` - Actualizar proyecto
- `PUT /api/proyectos/:id/estado` - Cambiar estado

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@tuempresa.com
- Teléfono: +XX XXX XXX XXXX

## 🔄 Actualizaciones

### Versión 1.0.0
- Sistema base completo
- Módulos principales implementados
- Dashboard funcional
- API REST completa

### Próximas Funcionalidades
- Notificaciones por email
- Reportes avanzados
- Integración con sistemas externos
- App móvil
- API para terceros

---

**Desarrollado con ❤️ para optimizar la gestión de soluciones tecnológicas**
