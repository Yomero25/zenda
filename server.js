const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/proyectos', require('./routes/proyectos'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/cotizaciones', require('./routes/cotizaciones'));
app.use('/api/despachos', require('./routes/despachos'));
app.use('/api/configuraciones', require('./routes/configuraciones'));
app.use('/api/instalaciones', require('./routes/instalaciones'));
app.use('/api/usuarios', require('./routes/usuarios'));

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'API del Sistema de Trazabilidad funcionando correctamente' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'desarrollo'}`);
});
