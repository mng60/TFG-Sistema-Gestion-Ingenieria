const { pool } = require('../config/database');

const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS datos_mercado (
      clave VARCHAR(50) PRIMARY KEY,
      valor JSONB NOT NULL,
      actualizado_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

const get = async (clave) => {
  const result = await pool.query(
    'SELECT valor, actualizado_at FROM datos_mercado WHERE clave = $1',
    [clave]
  );
  return result.rows[0] || null;
};

const set = async (clave, valor) => {
  await pool.query(
    `INSERT INTO datos_mercado (clave, valor, actualizado_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (clave) DO UPDATE SET valor = $2, actualizado_at = NOW()`,
    [clave, JSON.stringify(valor)]
  );
};

createTable().catch((err) => console.error('[DatoMercado] Error creando tabla:', err.message));

module.exports = { get, set };
