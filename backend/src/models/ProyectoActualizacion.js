const { pool } = require('../config/database');

// Crear tabla si no existe
pool.query(`
  CREATE TABLE IF NOT EXISTS proyecto_actualizaciones (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    empleado_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    realizado TEXT,
    pendiente TEXT,
    sugiere_cambio_fecha BOOLEAN DEFAULT FALSE,
    fecha_sugerida DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creando tabla proyecto_actualizaciones:', err.message));

class ProyectoActualizacion {
  static async getByProyecto(proyectoId) {
    const result = await pool.query(
      `SELECT pa.*, u.nombre as empleado_nombre, u.foto_url as empleado_foto
       FROM proyecto_actualizaciones pa
       JOIN users u ON pa.empleado_id = u.id
       WHERE pa.proyecto_id = $1
       ORDER BY pa.created_at DESC`,
      [proyectoId]
    );
    return result.rows;
  }

  static async create({ proyecto_id, empleado_id, realizado, pendiente, sugiere_cambio_fecha, fecha_sugerida }) {
    const result = await pool.query(
      `INSERT INTO proyecto_actualizaciones (proyecto_id, empleado_id, realizado, pendiente, sugiere_cambio_fecha, fecha_sugerida)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [proyecto_id, empleado_id, realizado, pendiente, sugiere_cambio_fecha || false, fecha_sugerida || null]
    );
    return result.rows[0];
  }

  static async delete(id, empleadoId, isAdmin) {
    let query, params;
    if (isAdmin) {
      query = 'DELETE FROM proyecto_actualizaciones WHERE id = $1 RETURNING *';
      params = [id];
    } else {
      query = 'DELETE FROM proyecto_actualizaciones WHERE id = $1 AND empleado_id = $2 RETURNING *';
      params = [id, empleadoId];
    }
    const result = await pool.query(query, params);
    return result.rows[0];
  }
}

module.exports = ProyectoActualizacion;