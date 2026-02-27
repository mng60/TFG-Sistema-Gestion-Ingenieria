// server.js - Archivo principal del servidor backend
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { testConnection } = require('./src/config/database');
const { initializeSocket } = require('./src/config/socket');
const { startCleanupJob } = require('./src/jobs/cleanupChats');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Parsear orígenes CORS (soporta varios separados por coma)
const corsAllowedList = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

// Función CORS: acepta orígenes explícitos + cualquier IP de red local (192.168.x.x, 10.x.x.x, 172.x.x.x)
const corsOriginFn = (origin, callback) => {
  if (!origin) return callback(null, true); // Peticiones sin origen (curl, Postman, mismo servidor)
  if (corsAllowedList.includes(origin)) return callback(null, true);
  // Permitir cualquier IP de red local (para móvil en WiFi)
  if (/^http:\/\/(192\.168\.\d+|10\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+)\.\d+(:\d+)?$/.test(origin)) {
    return callback(null, true);
  }
  callback(new Error('CORS: origen no permitido: ' + origin));
};

// Socket.io con variables de entorno
const io = new Server(server, {
  cors: {
    origin: corsOriginFn,
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Middlewares con CORS desde .env
app.use(cors({
  origin: corsOriginFn,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Hacer io accesible en las rutas
app.set('io', io);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API TFG Sistema Gestión Ingeniería Eléctrica',
    version: '1.0.0',
    status: 'running',
    socketIO: 'enabled',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rutas API
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/users', require('./src/routes/user.routes'));
app.use('/api/clientes', require('./src/routes/cliente.routes'));
app.use('/api/proyectos', require('./src/routes/proyecto.routes'));
app.use('/api/presupuestos', require('./src/routes/presupuesto.routes'));
app.use('/api/documentos', require('./src/routes/documento.routes'));
app.use('/api/portal', require('./src/routes/portal.routes'));
app.use('/api/chat', require('./src/routes/chat.routes')); 

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Inicializar Socket.io
initializeSocket(io);

// Iniciar servidor
const startServer = async () => {
  // Probar conexión a la base de datos
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('❌ No se pudo conectar a la base de datos. Verifica la configuración.');
    process.exit(1);
  }

  // Arrancar job de limpieza de chats expirados
  startCleanupJob();

  server.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
    console.log(`💬 Socket.io habilitado para chat en tiempo real`);
    console.log(`📝 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS habilitado para: ${process.env.FRONTEND_URL || 'localhost:3000'}`);
  });
};

startServer();

module.exports = { app, server, io };