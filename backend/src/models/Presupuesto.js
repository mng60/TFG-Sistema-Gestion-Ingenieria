const { pool } = require('../config/database');

class Presupuesto {
  // Crear un nuevo presupuesto
  static async create(presupuestoData) {
    const {
      proyecto_id,
      numero_presupuesto,
      version,
      fecha_emision,
      fecha_validez,
      estado,
      subtotal,
      iva,
      observaciones,
      creado_por
    } = presupuestoData;
    
    try {
      // Calcular total automáticamente
      const total = subtotal * (1 + (iva / 100));
      
      const query = `
        INSERT INTO presupuestos (
          proyecto_id, numero_presupuesto, version, fecha_emision,
          fecha_validez, estado, subtotal, iva, total,
          observaciones, creado_por
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        proyecto_id,
        numero_presupuesto,
        version || 1,
        fecha_emision || new Date(),
        fecha_validez,
        estado || 'borrador',
        subtotal,
        iva || 21.00,
        total,
        observaciones,
        creado_por
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Buscar presupuesto por ID
  static async findById(id) {
    try {
      const query = `
        SELECT 
          p.*,
          pr.nombre as proyecto_nombre,
          pr.cliente_id,
          c.nombre_empresa as cliente_nombre,
          u.nombre as creado_por_nombre
        FROM presupuestos p
        LEFT JOIN proyectos pr ON p.proyecto_id = pr.id
        LEFT JOIN clientes c ON pr.cliente_id = c.id
        LEFT JOIN users u ON p.creado_por = u.id
        WHERE p.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Buscar presupuesto por número
  static async findByNumero(numero_presupuesto) {
    try {
      const query = 'SELECT * FROM presupuestos WHERE numero_presupuesto = $1';
      const result = await pool.query(query, [numero_presupuesto]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los presupuestos con filtros
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          p.*,
          pr.nombre as proyecto_nombre,
          c.nombre_empresa as cliente_nombre,
          u.nombre as creado_por_nombre
        FROM presupuestos p
        LEFT JOIN proyectos pr ON p.proyecto_id = pr.id
        LEFT JOIN clientes c ON pr.cliente_id = c.id
        LEFT JOIN users u ON p.creado_por = u.id
      `;
      
      const conditions = [];
      const values = [];
      
      // Filtro por estado
      if (filters.estado) {
        conditions.push(`p.estado = $${conditions.length + 1}`);
        values.push(filters.estado);
      }
      
      // Filtro por proyecto
      if (filters.proyecto_id) {
        conditions.push(`p.proyecto_id = $${conditions.length + 1}`);
        values.push(filters.proyecto_id);
      }
      
      // Filtro por aceptado
      if (filters.aceptado !== undefined) {
        conditions.push(`p.aceptado = $${conditions.length + 1}`);
        values.push(filters.aceptado);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY p.fecha_emision DESC';
      
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar presupuesto
  static async update(id, presupuestoData) {
    const {
      numero_presupuesto,
      version,
      fecha_emision,
      fecha_validez,
      estado,
      subtotal,
      iva,
      observaciones
    } = presupuestoData;
    
    try {
      // Calcular total automáticamente
      const total = subtotal * (1 + (iva / 100));
      
      const query = `
        UPDATE presupuestos 
        SET numero_presupuesto = $1, version = $2, fecha_emision = $3,
            fecha_validez = $4, estado = $5, subtotal = $6, iva = $7,
            total = $8, observaciones = $9, updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        RETURNING *
      `;
      
      const values = [
        numero_presupuesto,
        version,
        fecha_emision,
        fecha_validez,
        estado,
        subtotal,
        iva,
        total,
        observaciones,
        id
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Aceptar presupuesto
  static async aceptar(id) {
    try {
      const query = `
        UPDATE presupuestos 
        SET aceptado = true, 
            fecha_aceptacion = CURRENT_TIMESTAMP,
            estado = 'aceptado',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Rechazar presupuesto
  static async rechazar(id) {
    try {
      const query = `
        UPDATE presupuestos 
        SET estado = 'rechazado',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar presupuesto
  static async delete(id) {
    try {
      const query = 'DELETE FROM presupuestos WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener presupuestos de un proyecto
  static async findByProyecto(proyectoId) {
    try {
      const query = `
        SELECT 
          p.*,
          u.nombre as creado_por_nombre
        FROM presupuestos p
        LEFT JOIN users u ON p.creado_por = u.id
        WHERE p.proyecto_id = $1
        ORDER BY p.version DESC, p.fecha_emision DESC
      `;
      
      const result = await pool.query(query, [proyectoId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Presupuesto;