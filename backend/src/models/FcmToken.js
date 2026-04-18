const { pool } = require('../config/database');

const FcmToken = {
  async ensureTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fcm_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        tipo_usuario VARCHAR(20) NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user
      ON fcm_tokens(user_id, tipo_usuario)
    `);
  },

  async upsert(userId, tipoUsuario, token) {
    await pool.query(`
      INSERT INTO fcm_tokens (user_id, tipo_usuario, token, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (token) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        tipo_usuario = EXCLUDED.tipo_usuario,
        updated_at = NOW()
    `, [userId, tipoUsuario, token]);
  },

  async getByUser(userId, tipoUsuario) {
    const result = await pool.query(
      'SELECT token FROM fcm_tokens WHERE user_id = $1 AND tipo_usuario = $2',
      [userId, tipoUsuario]
    );
    return result.rows.map(r => r.token);
  },

  async removeToken(token) {
    await pool.query('DELETE FROM fcm_tokens WHERE token = $1', [token]);
  },

  async removeByUser(userId, tipoUsuario) {
    await pool.query(
      'DELETE FROM fcm_tokens WHERE user_id = $1 AND tipo_usuario = $2',
      [userId, tipoUsuario]
    );
  }
};

module.exports = FcmToken;
