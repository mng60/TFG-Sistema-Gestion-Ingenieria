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
          u.nombre as responsable_nombre
        FROM proyectos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        LEFT JOIN users u ON p.responsable_id = u.id
      `;
      
      const conditions = [];
      const values = [];
      
      // Filtro por estado
      if (filters.estado) {
        conditions.push(`p.estado = $${conditions.length + 1}`);
        values.push(filters.estado);
      }
      
      // Filtro por prioridad
      if (filters.prioridad) {
        conditions.push(`p.prioridad = $${conditions.length + 1}`);
        values.push(filters.prioridad);
      }
      
      // Filtro por cliente
      if (filters.cliente_id) {
        conditions.push(`p.cliente_id = $${conditions.length + 1}`);
        values.push(filters.cliente_id);
      }
      
      // Filtro por responsable
      if (filters.responsable_id) {
        conditions.push(`p.responsable_id = $${conditions.length + 1}`);
        values.push(filters.responsable_id);
      }
      
      // Búsqueda por nombre
      if (filters.search) {
        conditions.push(`p.nombre ILIKE $${conditions.length + 1}`);
        values.push(`%${filters.search}%`);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
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

  // Asignar empleado a proyecto
  static async asignarEmpleado(proyectoId, userId, rolProyecto) {
    try {
      const query = `
        INSERT INTO proyecto_empleados (proyecto_id, user_id, rol_proyecto)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      const result = await pool.query(query, [proyectoId, userId, rolProyecto]);
      return result.rows[0];
    } catch (error) {
      // Error de duplicado (empleado ya asignado)
      if (error.code === '23505') {
        throw new Error('El empleado ya está asignado a este proyecto');
      }
      throw error;
    }
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
          u.rol as empleado_rol
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

  // Obtener estadísticas del proyecto
  static async getEstadisticas() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
          COUNT(CASE WHEN estado = 'en_progreso' THEN 1 END) as en_progreso,
          COUNT(CASE WHEN estado = 'pausado' THEN 1 END) as pausados,
          COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completados,
          COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as cancelados,
          SUM(presupuesto_estimado) as presupuesto_total_estimado,
          SUM(presupuesto_real) as presupuesto_total_real
        FROM proyectos
      `;
      
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Proyecto;