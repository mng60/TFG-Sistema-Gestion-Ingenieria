const { pool } = require('../config/database');

class Mensaje {
  // Crear nuevo mensaje
  static async create(data) {
    const {
      conversacion_id,
      user_id,
      tipo_usuario,
      mensaje,
      tipo_mensaje = 'texto',
      archivo_url = null,
      archivo_nombre = null,
      archivo_tipo = null
    } = data;

    try {
      const query = `
        INSERT INTO mensajes (
          conversacion_id, user_id, tipo_usuario, mensaje, 
          tipo_mensaje, archivo_url, archivo_nombre, archivo_tipo
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        conversacion_id,
        user_id,
        tipo_usuario,
        mensaje,
        tipo_mensaje,
        archivo_url,
        archivo_nombre,
        archivo_tipo
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener mensajes de una conversación
  static async getByConversacion(conversacionId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          m.*,
          CASE 
            WHEN m.tipo_usuario = 'empleado' THEN u.nombre
            WHEN m.tipo_usuario = 'cliente' THEN cl.nombre_empresa
          END as remitente_nombre,
          CASE 
            WHEN m.tipo_usuario = 'empleado' THEN u.email
            WHEN m.tipo_usuario = 'cliente' THEN cl.email
          END as remitente_email
        FROM mensajes m
        LEFT JOIN users u ON m.user_id = u.id AND m.tipo_usuario = 'empleado'
        LEFT JOIN clientes cl ON m.user_id = cl.id AND m.tipo_usuario = 'cliente'
        WHERE m.conversacion_id = $1 
          AND m.is_deleted = false
        ORDER BY m.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [conversacionId, limit, offset]);
      return result.rows.reverse(); // Invertir para mostrar del más antiguo al más reciente
    } catch (error) {
      throw error;
    }
  }

  // Marcar mensaje como eliminado (soft delete)
  static async softDelete(id, userId, tipoUsuario) {
    try {
      const query = `
        UPDATE mensajes
        SET is_deleted = true
        WHERE id = $1 AND user_id = $2 AND tipo_usuario = $3
        RETURNING *
      `;

      const result = await pool.query(query, [id, userId, tipoUsuario]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener último mensaje de una conversación
  static async getLastMessage(conversacionId) {
    try {
      const query = `
        SELECT 
          m.*,
          CASE 
            WHEN m.tipo_usuario = 'empleado' THEN u.nombre
            WHEN m.tipo_usuario = 'cliente' THEN cl.nombre_empresa
          END as remitente_nombre
        FROM mensajes m
        LEFT JOIN users u ON m.user_id = u.id AND m.tipo_usuario = 'empleado'
        LEFT JOIN clientes cl ON m.user_id = cl.id AND m.tipo_usuario = 'cliente'
        WHERE m.conversacion_id = $1 
          AND m.is_deleted = false
        ORDER BY m.created_at DESC
        LIMIT 1
      `;

      const result = await pool.query(query, [conversacionId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Contar mensajes no leídos
  static async countUnread(conversacionId, userId, tipoUsuario) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM mensajes m
        LEFT JOIN conversacion_participantes cp 
          ON cp.conversacion_id = m.conversacion_id 
          AND cp.user_id = $2 
          AND cp.tipo_usuario = $3
        WHERE m.conversacion_id = $1 
          AND m.created_at > COALESCE(cp.last_read, '1970-01-01')
          AND NOT (m.user_id = $2 AND m.tipo_usuario = $3)
          AND m.is_deleted = false
      `;

      const result = await pool.query(query, [conversacionId, userId, tipoUsuario]);
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Mensaje;