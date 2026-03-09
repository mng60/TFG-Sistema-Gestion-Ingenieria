const { pool } = require('../config/database');

// Crear tabla tickets si no existe
pool.query(`
  CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) DEFAULT 'olvido_password',
    tipo_usuario VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(200),
    mensaje TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente',
    resuelto_por INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resuelto_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creando tabla tickets:', err.message));

// Añadir columnas de intentos de login a users y clientes
pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0`)
  .catch(err => console.error(err.message));
pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP`)
  .catch(err => console.error(err.message));
pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0`)
  .catch(err => console.error(err.message));
pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP`)
  .catch(err => console.error(err.message));

class Ticket {
  static async create({ tipo_usuario, email, nombre, mensaje, tipo = 'olvido_password' }) {
    const result = await pool.query(
      `INSERT INTO tickets (tipo, tipo_usuario, email, nombre, mensaje)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tipo, tipo_usuario, email, nombre, mensaje]
    );
    return result.rows[0];
  }

  static async findAll({ estado } = {}) {
    let query = `
      SELECT t.*, u.nombre as resuelto_por_nombre
      FROM tickets t
      LEFT JOIN users u ON t.resuelto_por = u.id
    `;
    const values = [];
    if (estado) {
      query += ' WHERE t.estado = $1';
      values.push(estado);
    }
    query += ' ORDER BY CASE WHEN t.estado = \'pendiente\' THEN 0 ELSE 1 END, t.created_at DESC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async resolver(id, resueltoPor) {
    const result = await pool.query(
      `UPDATE tickets SET estado = 'resuelto', resuelto_por = $1, resuelto_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [resueltoPor, id]
    );
    return result.rows[0];
  }
}

module.exports = Ticket;
