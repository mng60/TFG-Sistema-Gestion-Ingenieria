const { pool } = require('../config/database');

// Crear tabla de visibilidad por empleado si no existe
pool.query(`
  CREATE TABLE IF NOT EXISTS documento_visibilidad_empleados (
    documento_id INTEGER REFERENCES documentos(id) ON DELETE CASCADE,
    user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (documento_id, user_id)
  )
`).catch(err => console.error('Error creando tabla documento_visibilidad_empleados:', err.message));

class Documento {
  // Crear un nuevo documento
  static async create(documentoData) {
    const {
      proyecto_id,
      nombre,
      tipo_documento,
      descripcion,
      ruta_archivo,
      tamano_bytes,
      extension,
      subido_por,
      version,
      es_publico
    } = documentoData;
    
    try {
      const query = `
        INSERT INTO documentos (
          proyecto_id, nombre, tipo_documento, descripcion,
          ruta_archivo, tamano_bytes, extension, subido_por,
          version, es_publico
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const values = [
        proyecto_id,
        nombre,
        tipo_documento,
        descripcion,
        ruta_archivo,
        tamano_bytes,
        extension,
        subido_por,
        version || 1,
        es_publico || false
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Buscar documento por ID
  static async findById(id) {
    try {
      const query = `
        SELECT 
          d.*,
          p.nombre as proyecto_nombre,
          p.cliente_id,
          c.nombre_empresa as cliente_nombre,
          u.nombre as subido_por_nombre
        FROM documentos d
        LEFT JOIN proyectos p ON d.proyecto_id = p.id
        LEFT JOIN clientes c ON p.cliente_id = c.id
        LEFT JOIN users u ON d.subido_por = u.id
        WHERE d.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los documentos con filtros
  // options: { userId, isAdmin } para filtrar visibilidad por empleado
  static async findAll(filters = {}, options = {}) {
    const { userId, isAdmin } = options;
    try {
      let query = `
        SELECT
          d.*,
          p.nombre as proyecto_nombre,
          u.nombre as subido_por_nombre,
          COALESCE(
            (SELECT array_agg(dve.user_id)
             FROM documento_visibilidad_empleados dve
             WHERE dve.documento_id = d.id),
            ARRAY[]::integer[]
          ) as empleados_acceso_ids
        FROM documentos d
        LEFT JOIN proyectos p ON d.proyecto_id = p.id
        LEFT JOIN users u ON d.subido_por = u.id
      `;

      const conditions = [];
      const values = [];

      if (filters.tipo_documento) {
        conditions.push(`d.tipo_documento = $${values.length + 1}`);
        values.push(filters.tipo_documento);
      }

      if (filters.proyecto_id) {
        conditions.push(`d.proyecto_id = $${values.length + 1}`);
        values.push(filters.proyecto_id);
      }

      if (filters.es_publico !== undefined) {
        conditions.push(`d.es_publico = $${values.length + 1}`);
        values.push(filters.es_publico);
      }

      // Filtro de visibilidad para empleados no-admin
      if (!isAdmin && userId) {
        const paramIdx = values.length + 1;
        conditions.push(`(
          NOT EXISTS (SELECT 1 FROM documento_visibilidad_empleados dve WHERE dve.documento_id = d.id)
          OR EXISTS (SELECT 1 FROM documento_visibilidad_empleados dve WHERE dve.documento_id = d.id AND dve.user_id = $${paramIdx})
        )`);
        values.push(userId);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY d.created_at DESC';

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Obtener empleados con acceso a un documento
  static async getAccesoEmpleados(documentoId) {
    try {
      const result = await pool.query(
        `SELECT u.id, u.nombre, u.email
         FROM documento_visibilidad_empleados dve
         JOIN users u ON dve.user_id = u.id
         WHERE dve.documento_id = $1
         ORDER BY u.nombre`,
        [documentoId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Establecer empleados con acceso a un documento (reemplaza lista completa)
  static async setAccesoEmpleados(documentoId, userIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'DELETE FROM documento_visibilidad_empleados WHERE documento_id = $1',
        [documentoId]
      );
      if (userIds && userIds.length > 0) {
        const placeholders = userIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO documento_visibilidad_empleados (documento_id, user_id) VALUES ${placeholders}`,
          [documentoId, ...userIds]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Obtener documentos de un proyecto
  static async findByProyecto(proyectoId) {
    try {
      const query = `
        SELECT 
          d.*,
          u.nombre as subido_por_nombre
        FROM documentos d
        LEFT JOIN users u ON d.subido_por = u.id
        WHERE d.proyecto_id = $1
        ORDER BY d.created_at DESC
      `;
      
      const result = await pool.query(query, [proyectoId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar documento
  static async update(id, documentoData) {
    const {
      nombre,
      tipo_documento,
      descripcion,
      version,
      es_publico
    } = documentoData;
    
    try {
      const query = `
        UPDATE documentos 
        SET nombre = $1, tipo_documento = $2, descripcion = $3,
            version = $4, es_publico = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `;
      
      const values = [
        nombre,
        tipo_documento,
        descripcion,
        version,
        es_publico,
        id
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar documento
  static async delete(id) {
    try {
      const query = 'DELETE FROM documentos WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener documentos públicos de un proyecto (para clientes)
  static async findPublicosByProyecto(proyectoId) {
    try {
      const query = `
        SELECT 
          d.*,
          u.nombre as subido_por_nombre
        FROM documentos d
        LEFT JOIN users u ON d.subido_por = u.id
        WHERE d.proyecto_id = $1 AND d.es_publico = true
        ORDER BY d.created_at DESC
      `;
      
      const result = await pool.query(query, [proyectoId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Documento;