const { pool } = require('../config/database');

class Conversacion {
  // Crear nueva conversación
  static async create(data) {
    const { tipo, nombre, proyecto_id, participantes } = data;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Crear conversación
      const queryConv = `
        INSERT INTO conversaciones (tipo, nombre, proyecto_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const resultConv = await client.query(queryConv, [tipo, nombre, proyecto_id]);
      const conversacion = resultConv.rows[0];

      // Añadir participantes
      for (const p of participantes) {
        const queryPart = `
          INSERT INTO conversacion_participantes (conversacion_id, user_id, tipo_usuario)
          VALUES ($1, $2, $3)
        `;
        await client.query(queryPart, [conversacion.id, p.user_id, p.tipo_usuario]);
      }

      await client.query('COMMIT');
      return conversacion;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Obtener conversaciones de un usuario
  static async getByUser(userId, tipoUsuario) {
    try {
      const query = `
        SELECT 
          c.*,
          (
            SELECT json_agg(
              json_build_object(
                'user_id', cp.user_id,
                'tipo_usuario', cp.tipo_usuario,
                'nombre', CASE 
                  WHEN cp.tipo_usuario = 'empleado' THEN u.nombre
                  WHEN cp.tipo_usuario = 'cliente' THEN COALESCE(cl.persona_contacto, cl.nombre_empresa)
                END
              )
            )
            FROM conversacion_participantes cp
            LEFT JOIN users u ON cp.user_id = u.id AND cp.tipo_usuario = 'empleado'
            LEFT JOIN clientes cl ON cp.user_id = cl.id AND cp.tipo_usuario = 'cliente'
            WHERE cp.conversacion_id = c.id
          ) as participantes,
          (
            SELECT COUNT(*)
            FROM mensajes m
            LEFT JOIN conversacion_participantes cp2 ON cp2.conversacion_id = m.conversacion_id 
              AND cp2.user_id = $1 AND cp2.tipo_usuario = $2
            WHERE m.conversacion_id = c.id 
              AND m.created_at > COALESCE(cp2.last_read, '1970-01-01')
              AND NOT (m.user_id = $1 AND m.tipo_usuario = $2)
          ) as mensajes_no_leidos,
          (
            SELECT json_build_object(
              'mensaje', m.mensaje,
              'tipo_mensaje', m.tipo_mensaje,
              'created_at', m.created_at,
              'user_id', m.user_id,
              'tipo_usuario', m.tipo_usuario
            )
            FROM mensajes m
            WHERE m.conversacion_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) as ultimo_mensaje
        FROM conversaciones c
        INNER JOIN conversacion_participantes cp ON cp.conversacion_id = c.id
        WHERE cp.user_id = $1 AND cp.tipo_usuario = $2
        ORDER BY c.updated_at DESC
      `;

      const result = await pool.query(query, [userId, tipoUsuario]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Verificar si existe conversación entre dos usuarios
  static async findBetweenUsers(user1Id, user1Tipo, user2Id, user2Tipo) {
    try {
      const query = `
        SELECT c.* 
        FROM conversaciones c
        WHERE c.tipo IN ('empleado_cliente', 'empleado_empleado')
          AND c.id IN (
            SELECT conversacion_id 
            FROM conversacion_participantes 
            WHERE user_id = $1 AND tipo_usuario = $2
          )
          AND c.id IN (
            SELECT conversacion_id 
            FROM conversacion_participantes 
            WHERE user_id = $3 AND tipo_usuario = $4
          )
        LIMIT 1
      `;

      const result = await pool.query(query, [user1Id, user1Tipo, user2Id, user2Tipo]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener conversación por ID con participantes
  static async findById(id) {
    try {
      const query = `
        SELECT 
          c.*,
          (
            SELECT json_agg(
              json_build_object(
                'user_id', cp.user_id,
                'tipo_usuario', cp.tipo_usuario,
                'nombre', CASE 
                  WHEN cp.tipo_usuario = 'empleado' THEN u.nombre
                  WHEN cp.tipo_usuario = 'cliente' THEN COALESCE(cl.persona_contacto, cl.nombre_empresa)
                END,
                'email', CASE 
                  WHEN cp.tipo_usuario = 'empleado' THEN u.email
                  WHEN cp.tipo_usuario = 'cliente' THEN cl.email
                END,
                'last_read', cp.last_read
              )
            )
            FROM conversacion_participantes cp
            LEFT JOIN users u ON cp.user_id = u.id AND cp.tipo_usuario = 'empleado'
            LEFT JOIN clientes cl ON cp.user_id = cl.id AND cp.tipo_usuario = 'cliente'
            WHERE cp.conversacion_id = c.id
          ) as participantes
        FROM conversaciones c
        WHERE c.id = $1
      `;

      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Marcar mensajes como leídos
  static async markAsRead(conversacionId, userId, tipoUsuario) {
    try {
      const query = `
        UPDATE conversacion_participantes
        SET last_read = CURRENT_TIMESTAMP
        WHERE conversacion_id = $1 AND user_id = $2 AND tipo_usuario = $3
      `;

      await pool.query(query, [conversacionId, userId, tipoUsuario]);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Conversacion;