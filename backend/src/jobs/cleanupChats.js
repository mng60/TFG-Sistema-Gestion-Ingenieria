// Job de limpieza: borra conversaciones de proyecto cuya fecha de eliminación ya pasó
const cron = require('node-cron');
const { pool } = require('../config/database');

const cleanupExpiredChats = async () => {
  try {
    const result = await pool.query(
      `DELETE FROM conversaciones
       WHERE deletion_scheduled_at IS NOT NULL
         AND deletion_scheduled_at <= CURRENT_TIMESTAMP
       RETURNING id, nombre`
    );

    if (result.rows.length > 0) {
      console.log(`🗑️ [CleanupChats] ${result.rows.length} conversación(es) eliminada(s):`);
      result.rows.forEach(r => console.log(`   - ${r.nombre} (id: ${r.id})`));
    }
  } catch (error) {
    console.error('❌ [CleanupChats] Error al limpiar chats expirados:', error.message);
  }
};

const startCleanupJob = () => {
  // Ejecutar todos los días a las 00:00
  cron.schedule('0 0 * * *', cleanupExpiredChats, {
    timezone: 'Europe/Madrid'
  });
  console.log('🕐 [CleanupChats] Job de limpieza de chats programado (diario 00:00)');
};

module.exports = { startCleanupJob, cleanupExpiredChats };
