// backend/src/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

// Configuración del pool de conexiones
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20, // Número máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // Tiempo antes de cerrar conexión inactiva
  connectionTimeoutMillis: 2000, // Tiempo de espera para conectar
});

// Evento cuando se conecta
pool.on('connect', () => {
  console.log('✅ Conexión establecida con PostgreSQL');
});

// Evento de error
pool.on('error', (err) => {
  console.error('❌ Error inesperado en PostgreSQL:', err);
  process.exit(-1);
});

// Función para probar la conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('🔍 Test de conexión exitoso:', result.rows[0]);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
    return false;
  }
};

module.exports = { pool, testConnection };