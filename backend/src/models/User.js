const { pool } = require('../config/database');

// Añadir columnas si no existen
pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500)`)
  .catch(err => console.error('Error añadiendo foto_url a users:', err.message));
pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_personal VARCHAR(255)`)
  .catch(err => console.error('Error añadiendo email_personal a users:', err.message));

class User {
  // Crear un nuevo usuario
  static async create(userData) {
    const { nombre, email, password, rol, telefono, email_personal } = userData;

    try {
      const query = `
        INSERT INTO users (nombre, email, password, rol, telefono, email_personal)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, nombre, email, rol, telefono, email_personal, created_at
      `;

      const values = [nombre, email, password, rol || 'empleado', telefono, email_personal || null];
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
      const query = 'SELECT id, nombre, email, rol, telefono, foto_url, email_personal, created_at FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);

      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar foto de perfil
  static async updateFoto(id, fotoUrl) {
    try {
      const result = await pool.query(
        'UPDATE users SET foto_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, nombre, email, rol, telefono, foto_url',
        [fotoUrl, id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar perfil propio (nombre, telefono)
  static async updatePerfil(id, data) {
    const { nombre, telefono, email_personal } = data;
    try {
      const result = await pool.query(
        'UPDATE users SET nombre = $1, telefono = $2, email_personal = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, nombre, email, rol, telefono, foto_url, email_personal',
        [nombre, telefono, email_personal || null, id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los usuarios
  static async findAll() {
    try {
      const query = 'SELECT id, nombre, email, rol, telefono, foto_url, email_personal, created_at FROM users ORDER BY created_at DESC';
      const result = await pool.query(query);
      
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar usuario
  static async update(id, userData) {
    const { nombre, email, telefono, rol, email_personal } = userData;

    try {
      const query = `
        UPDATE users
        SET nombre = $1, email = $2, telefono = $3, rol = $4, email_personal = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, nombre, email, rol, telefono, email_personal, updated_at
      `;

      const values = [nombre, email, telefono, rol, email_personal || null, id];
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