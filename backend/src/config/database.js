// backend/src/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

// Configuración del pool de conexiones
// Soporta DATABASE_URL (Neon/Railway) o variables individuales (desarrollo local)
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

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