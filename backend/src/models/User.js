const { pool } = require('../config/database');

class User {
  // Crear un nuevo usuario
  static async create(userData) {
    const { nombre, email, password, rol, telefono } = userData;
    
    try {
      const query = `
        INSERT INTO users (nombre, email, password, rol, telefono)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, nombre, email, rol, telefono, created_at
      `;
      
      const values = [nombre, email, password, rol || 'empleado', telefono];
      const result = await pool.query(query, values);
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuario por ID
  static async findById(id) {
    try {
      const query = 'SELECT id, nombre, email, rol, telefono, created_at FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los usuarios
  static async findAll() {
    try {
      const query = 'SELECT id, nombre, email, rol, telefono, created_at FROM users ORDER BY created_at DESC';
      const result = await pool.query(query);
      
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar usuario
  static async update(id, userData) {
    const { nombre, email, telefono, rol } = userData;
    
    try {
      const query = `
        UPDATE users 
        SET nombre = $1, email = $2, telefono = $3, rol = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, nombre, email, rol, telefono, updated_at
      `;
      
      const values = [nombre, email, telefono, rol, id];
      const result = await pool.query(query, values);
      
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar usuario
  static async delete(id) {
    try {
      const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar contraseña
  static async updatePassword(id, newPassword) {
    try {
      const query = `
        UPDATE users 
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id
      `;
      
      const result = await pool.query(query, [newPassword, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;