const { pool } = require('../config/database');

class Proyecto {
  // Crear un nuevo proyecto
  static async create(proyectoData) {
    const {
      nombre,
      descripcion,
      cliente_id,
      estado,
      prioridad,
      fecha_inicio,
      fecha_fin_estimada,
      presupuesto_estimado,
      responsable_id,
      ubicacion,
      notas
    } = proyectoData;
    
    try {
      const query = `
        INSERT INTO proyectos (
          nombre, descripcion, cliente_id, estado, prioridad,
          fecha_inicio, fecha_fin_estimada, presupuesto_estimado,
          responsable_id, ubicacion, notas
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        nombre,
        descripcion,
        cliente_id,
        estado || 'pendiente',
        prioridad || 'media',
        fecha_inicio,
        fecha_fin_estimada,
        presupuesto_estimado,
        responsable_id,
        ubicacion,
        notas
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Buscar proyecto por ID con información relacionada
  static async findById(id) {
    try {
      const query = `
        SELECT 
          p.*,
          c.nombre_empresa as cliente_nombre,
          c.cif as cliente_cif,
          u.nombre as responsable_nombre,
          u.email as responsable_email
        FROM proyectos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        LEFT JOIN users u ON p.responsable_id = u.id
        WHERE p.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los proyectos con filtros
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT
          p.*,
          c.nombre_empresa as cliente_nombre,
          u.nombre as responsable_nombre,
          COALESCE((
            SELECT SUM(pr.total)
            FROM presupuestos pr
            WHERE pr.proyecto_id = p.id
            AND pr.aceptado = true
          ), 0) as total_presupuestado,
          (
            SELECT COUNT(*)
            FROM presupuestos pr
            WHERE pr.proyecto_id = p.id
          ) as num_presupuestos,
          ARRAY(
            SELECT pe_arr.user_id
            FROM proyecto_empleados pe_arr
            WHERE pe_arr.proyecto_id = p.id
            AND pe_arr.activo = true
          ) as empleados_ids
        FROM proyectos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        LEFT JOIN users u ON p.responsable_id = u.id
      `;

      const conditions = [];
      const values = [];
      let paramCount = 1;

      if (filters.current_user_rol !== 'admin') {
        query = `
          SELECT DISTINCT
            p.*,
            c.nombre_empresa as cliente_nombre,
            u.nombre as responsable_nombre,
            COALESCE((
              SELECT SUM(pr.total)
              FROM presupuestos pr
              WHERE pr.proyecto_id = p.id
              AND pr.aceptado = true
            ), 0) as total_presupuestado,
            (
              SELECT COUNT(*)
              FROM presupuestos pr
              WHERE pr.proyecto_id = p.id
            ) as num_presupuestos,
            ARRAY(
              SELECT pe_arr.user_id
              FROM proyecto_empleados pe_arr
              WHERE pe_arr.proyecto_id = p.id
              AND pe_arr.activo = true
            ) as empleados_ids
          FROM proyectos p
          LEFT JOIN clientes c ON p.cliente_id = c.id
          LEFT JOIN users u ON p.responsable_id = u.id
          INNER JOIN proyecto_empleados pe ON p.id = pe.proyecto_id
          WHERE pe.user_id = $${paramCount}
          AND pe.activo = true
        `;
        values.push(filters.current_user_id);
        paramCount++;
      }

      // Filtro por estado
      if (filters.estado) {
        conditions.push(`p.estado = $${paramCount}`);
        values.push(filters.estado);
        paramCount++;
      }
      
      // Filtro por prioridad
      if (filters.prioridad) {
        conditions.push(`p.prioridad = $${paramCount}`);
        values.push(filters.prioridad);
        paramCount++;
      }
      
      // Filtro por cliente
      if (filters.cliente_id) {
        conditions.push(`p.cliente_id = $${paramCount}`);
        values.push(filters.cliente_id);
        paramCount++;
      }
      
      // Filtro por responsable
      if (filters.responsable_id) {
        conditions.push(`p.responsable_id = $${paramCount}`);
        values.push(filters.responsable_id);
        paramCount++;
      }
      
      // Búsqueda por nombre
      if (filters.search) {
        conditions.push(`p.nombre ILIKE $${paramCount}`);
        values.push(`%${filters.search}%`);
        paramCount++;
      }
      
      if (conditions.length > 0) {
        const connector = filters.current_user_rol !== 'admin' ? ' AND ' : ' WHERE ';
        query += connector + conditions.join(' AND ');
      }
      
      query += ' ORDER BY p.created_at DESC';
      
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar proyecto
  static async update(id, proyectoData) {
    const {
      nombre,
      descripcion,
      cliente_id,
      estado,
      prioridad,
      fecha_inicio,
      fecha_fin_estimada,
      fecha_fin_real,
      presupuesto_estimado,
      presupuesto_real,
      responsable_id,
      ubicacion,
      notas
    } = proyectoData;
    
    try {
      const query = `
        UPDATE proyectos 
        SET nombre = $1, descripcion = $2, cliente_id = $3, estado = $4,
            prioridad = $5, fecha_inicio = $6, fecha_fin_estimada = $7,
            fecha_fin_real = $8, presupuesto_estimado = $9, presupuesto_real = $10,
            responsable_id = $11, ubicacion = $12, notas = $13,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $14
        RETURNING *
      `;
      
      const values = [
        nombre,
        descripcion,
        cliente_id,
        estado,
        prioridad,
        fecha_inicio,
        fecha_fin_estimada,
        fecha_fin_real,
        presupuesto_estimado,
        presupuesto_real,
        responsable_id,
        ubicacion,
        notas,
        id
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar proyecto
  static async delete(id) {
    try {
      const query = 'DELETE FROM proyectos WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Asignar empleado a proyecto (upsert — permite reasignar tras desasignar)
  static async asignarEmpleado(proyectoId, userId, rolProyecto) {
    const query = `
      INSERT INTO proyecto_empleados (proyecto_id, user_id, rol_proyecto)
      VALUES ($1, $2, $3)
      ON CONFLICT (proyecto_id, user_id) DO UPDATE
        SET activo = true,
            rol_proyecto = EXCLUDED.rol_proyecto,
            fecha_asignacion = CURRENT_TIMESTAMP,
            fecha_desasignacion = NULL
      RETURNING *
    `;
    const result = await pool.query(query, [proyectoId, userId, rolProyecto]);
    return result.rows[0];
  }

  // Desasignar empleado de proyecto
  static async desasignarEmpleado(proyectoId, userId) {
    try {
      const query = `
        UPDATE proyecto_empleados
        SET activo = false, fecha_desasignacion = CURRENT_TIMESTAMP
        WHERE proyecto_id = $1 AND user_id = $2 AND activo = true
        RETURNING *
      `;
      
      const result = await pool.query(query, [proyectoId, userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener empleados asignados al proyecto
  static async getEmpleados(proyectoId) {
    try {
      const query = `
        SELECT
          pe.*,
          u.nombre as empleado_nombre,
          u.email as empleado_email,
          u.telefono as empleado_telefono,
          u.rol as empleado_rol,
          u.foto_url
        FROM proyecto_empleados pe
        JOIN users u ON pe.user_id = u.id
        WHERE pe.proyecto_id = $1 AND pe.activo = true
        ORDER BY pe.fecha_asignacion DESC
      `;
      
      const result = await pool.query(query, [proyectoId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas generales (sin filtro de rol)
  static async getEstadisticas() {
    try {
      const queryProyectos = `
        SELECT
          COUNT(*) as total_proyectos,
          COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendiente,
          COUNT(CASE WHEN estado = 'en_progreso' THEN 1 END) as en_progreso,
          COUNT(CASE WHEN estado = 'pausado' THEN 1 END) as pausado,
          COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completado,
          COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as cancelado
        FROM proyectos
      `;

      const queryPresupuestos = `
        SELECT
          COALESCE(SUM(subtotal), 0) as total_sin_iva,
          COALESCE(SUM(total), 0) as total_con_iva
        FROM presupuestos
        WHERE aceptado = true
      `;

      const [resProyectos, resPresupuestos] = await Promise.all([
        pool.query(queryProyectos),
        pool.query(queryPresupuestos)
      ]);

      const p = resProyectos.rows[0];
      const s = resPresupuestos.rows[0];

      return {
        total_proyectos: parseInt(p.total_proyectos) || 0,
        por_estado: {
          pendiente: parseInt(p.pendiente) || 0,
          en_progreso: parseInt(p.en_progreso) || 0,
          pausado: parseInt(p.pausado) || 0,
          completado: parseInt(p.completado) || 0,
          cancelado: parseInt(p.cancelado) || 0
        },
        presupuesto_total_estimado: parseFloat(s.total_sin_iva) || 0,
        presupuesto_real_total: parseFloat(s.total_con_iva) || 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener datos del dashboard filtrados por rol
  static async getDashboardData(userId, rol) {
    try {
      const isAdmin = rol === 'admin';

      const queryProyectos = isAdmin
        ? `SELECT COUNT(*) as total,
            COUNT(CASE WHEN estado = 'en_progreso' THEN 1 END) as en_progreso,
            COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completado,
            COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendiente
           FROM proyectos`
        : `SELECT COUNT(*) as total,
            COUNT(CASE WHEN p.estado = 'en_progreso' THEN 1 END) as en_progreso,
            COUNT(CASE WHEN p.estado = 'completado' THEN 1 END) as completado,
            COUNT(CASE WHEN p.estado = 'pendiente' THEN 1 END) as pendiente
           FROM proyectos p
           JOIN proyecto_empleados pe ON pe.proyecto_id = p.id AND pe.user_id = $1 AND pe.activo = true`;

      const queryRecientes = isAdmin
        ? `SELECT p.id, p.nombre, p.estado, p.prioridad,
            c.nombre_empresa as cliente_nombre,
            GREATEST(
              p.updated_at,
              COALESCE((SELECT MAX(a.created_at) FROM proyecto_actualizaciones a WHERE a.proyecto_id = p.id), p.updated_at),
              COALESCE((SELECT MAX(pr.updated_at) FROM presupuestos pr WHERE pr.proyecto_id = p.id), p.updated_at),
              COALESCE((SELECT MAX(d.created_at) FROM documentos d WHERE d.proyecto_id = p.id), p.updated_at)
            ) as ultima_actividad
           FROM proyectos p
           LEFT JOIN clientes c ON c.id = p.cliente_id
           ORDER BY ultima_actividad DESC LIMIT 5`
        : `SELECT p.id, p.nombre, p.estado, p.prioridad,
            c.nombre_empresa as cliente_nombre,
            GREATEST(
              p.updated_at,
              COALESCE((SELECT MAX(a.created_at) FROM proyecto_actualizaciones a WHERE a.proyecto_id = p.id), p.updated_at),
              COALESCE((SELECT MAX(pr.updated_at) FROM presupuestos pr WHERE pr.proyecto_id = p.id), p.updated_at),
              COALESCE((SELECT MAX(d.created_at) FROM documentos d WHERE d.proyecto_id = p.id), p.updated_at)
            ) as ultima_actividad
           FROM proyectos p
           JOIN proyecto_empleados pe ON pe.proyecto_id = p.id AND pe.user_id = $1 AND pe.activo = true
           LEFT JOIN clientes c ON c.id = p.cliente_id
           ORDER BY ultima_actividad DESC LIMIT 5`;

      const queryUltimosPresupuestos = `
        SELECT p.id, p.numero_presupuesto, p.estado, p.total,
          COALESCE(p.updated_at, p.created_at, p.fecha_emision::timestamp) as fecha_referencia,
          pr.id as proyecto_id,
          pr.nombre as proyecto_nombre,
          c.nombre_empresa as cliente_nombre
        FROM presupuestos p
        LEFT JOIN proyectos pr ON pr.id = p.proyecto_id
        LEFT JOIN clientes c ON c.id = pr.cliente_id
        ORDER BY fecha_referencia DESC
        LIMIT 5
      `;

      const queryUltimosTickets = `
        SELECT t.id, t.tipo, t.estado, t.email, t.nombre, t.created_at,
          t.empresa, pr.id as proyecto_id, pr.nombre as proyecto_nombre
        FROM tickets t
        LEFT JOIN proyectos pr ON pr.id = t.proyecto_id
        ORDER BY t.created_at DESC
        LIMIT 5
      `;

      const queryMensajes = `
        SELECT COALESCE(SUM(sub.cnt), 0)::int AS mensajes_no_leidos
        FROM (
          SELECT c.id,
            (
              SELECT COUNT(*)
              FROM mensajes m
              WHERE m.conversacion_id = c.id
                AND m.is_deleted = false
                AND NOT (m.user_id = $1 AND m.tipo_usuario = 'empleado')
                AND m.created_at > COALESCE(cp.last_read, '1970-01-01'::timestamp)
            ) AS cnt
          FROM conversaciones c
          INNER JOIN conversacion_participantes cp
            ON cp.conversacion_id = c.id
           AND cp.user_id = $1
           AND cp.tipo_usuario = 'empleado'
          WHERE c.deletion_scheduled_at IS NULL
             OR c.deletion_scheduled_at > CURRENT_TIMESTAMP
        ) sub
      `;

      const promises = isAdmin
        ? [
            pool.query(queryProyectos),
            pool.query(queryRecientes),
            pool.query(`SELECT COALESCE(SUM(subtotal), 0) as sin_iva, COALESCE(SUM(total), 0) as con_iva FROM presupuestos WHERE aceptado = true`),
            pool.query(`SELECT COUNT(*) as pendientes FROM tickets WHERE estado = 'pendiente'`),
            pool.query(queryUltimosPresupuestos),
            pool.query(queryUltimosTickets)
          ]
        : [
            pool.query(queryProyectos, [userId]),
            pool.query(queryRecientes, [userId]),
            pool.query(queryMensajes, [userId])
          ];

      const results = await Promise.all(promises);
      const [resP, resR] = results;

      const p = resP.rows[0];
      const result = {
        total_proyectos: parseInt(p.total) || 0,
        por_estado: {
          en_progreso: parseInt(p.en_progreso) || 0,
          completado: parseInt(p.completado) || 0,
          pendiente: parseInt(p.pendiente) || 0
        },
        proyectos_recientes: resR.rows
      };

      if (isAdmin) {
        const s = results[2].rows[0];
        result.presupuesto_total_estimado = parseFloat(s.sin_iva) || 0;
        result.presupuesto_real_total = parseFloat(s.con_iva) || 0;
        result.tickets_pendientes = parseInt(results[3].rows[0].pendientes) || 0;
        result.ultimos_presupuestos = results[4].rows;
        result.ultimos_tickets = results[5].rows;
      } else {
        result.mensajes_no_leidos = parseInt(results[2].rows[0].mensajes_no_leidos) || 0;
      }

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Proyecto;
