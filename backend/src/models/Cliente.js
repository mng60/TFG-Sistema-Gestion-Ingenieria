const { pool } = require('../config/database');

class Cliente {
  // Crear un nuevo cliente
  static async create(clienteData) {
    const {
      nombre_empresa,
      cif,
      email,
      telefono,
      direccion,
      ciudad,
      codigo_postal,
      provincia,
      pais,
      persona_contacto,
      telefono_contacto,
      email_contacto,
      notas
    } = clienteData;
    
    try {
      const query = `
        INSERT INTO clientes (
          nombre_empresa, cif, email, telefono, direccion, ciudad,
          codigo_postal, provincia, pais, persona_contacto,
          telefono_contacto, email_contacto, notas
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, nombre_empresa, cif, email, telefono, ciudad,
                  persona_contacto, activo, created_at
      `;
      
      const values = [
        nombre_empresa,
        cif,
        email,
        telefono,
        direccion,
        ciudad,
        codigo_postal,
        provincia,
        pais || 'España',
        persona_contacto,
        telefono_contacto,
        email_contacto,
        notas
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Buscar cliente por CIF
  static async findByCIF(cif) {
    try {
      const query = 'SELECT * FROM clientes WHERE cif = $1';
      const result = await pool.query(query, [cif]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Buscar cliente por ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM clientes WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los clientes
  static async findAll(filters = {}) {
    try {
      let query = 'SELECT * FROM clientes';
      const conditions = [];
      const values = [];
      
      // Filtro por activo
      if (filters.activo !== undefined) {
        conditions.push(`activo = $${conditions.length + 1}`);
        values.push(filters.activo);
      }
      
      // Filtro por búsqueda (nombre o CIF)
      if (filters.search) {
        conditions.push(`(nombre_empresa ILIKE $${conditions.length + 1} OR cif ILIKE $${conditions.length + 1})`);
        values.push(`%${filters.search}%`);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY nombre_empresa ASC';
      
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar cliente
  static async update(id, clienteData) {
    const {
      nombre_empresa,
      cif,
      email,
      telefono,
      direccion,
      ciudad,
      codigo_postal,
      provincia,
      pais,
      persona_contacto,
      telefono_contacto,
      email_contacto,
      notas,
      activo
    } = clienteData;
    
    try {
      const query = `
        UPDATE clientes 
        SET nombre_empresa = $1, cif = $2, email = $3, telefono = $4,
            direccion = $5, ciudad = $6, codigo_postal = $7, provincia = $8,
            pais = $9, persona_contacto = $10, telefono_contacto = $11,
            email_contacto = $12, notas = $13, activo = $14,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $15
        RETURNING *
      `;
      
      const values = [
        nombre_empresa,
        cif,
        email,
        telefono,
        direccion,
        ciudad,
        codigo_postal,
        provincia,
        pais,
        persona_contacto,
        telefono_contacto,
        email_contacto,
        notas,
        activo !== undefined ? activo : true,
        id
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Desactivar cliente (soft delete)
  static async deactivate(id) {
    try {
      const query = `
        UPDATE clientes 
        SET activo = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, nombre_empresa, activo
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar cliente (hard delete)
  static async delete(id) {
    try {
      const query = 'DELETE FROM clientes WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener proyectos del cliente
  static async getProyectos(clienteId) {
    try {
      const query = `
        SELECT p.*, u.nombre as responsable_nombre
        FROM proyectos p
        LEFT JOIN users u ON p.responsable_id = u.id
        WHERE p.cliente_id = $1
        ORDER BY p.created_at DESC
      `;
      
      const result = await pool.query(query, [clienteId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Cliente;