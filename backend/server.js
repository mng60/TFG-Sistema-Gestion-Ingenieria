// server.js - Archivo principal del servidor backend
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./src/config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API TFG Sistema Gestión Ingeniería Eléctrica',
    version: '1.0.0',
    status: 'running'
  });
});

// Ruta de prueba del modelo User (temporal - solo para desarrollo)
app.get('/api/test/users', async (req, res) => {
  try {
    const User = require('./src/models/User');
    const users = await User.findAll();
    res.json({ 
      success: true,
      count: users.length,
      users: users 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Rutas API (se agregarán en sprints posteriores)
// app.use('/api/auth', require('./src/routes/auth.routes'));
// app.use('/api/users', require('./src/routes/user.routes'));
// app.use('/api/projects', require('./src/routes/project.routes'));

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
const startServer = async () => {
  // Probar conexión a la base de datos
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('❌ No se pudo conectar a la base de datos. Verifica la configuración.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
    console.log(`📝 Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

module.exports = app;