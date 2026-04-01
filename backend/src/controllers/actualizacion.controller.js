const ProyectoActualizacion = require('../models/ProyectoActualizacion');
const Ticket = require('../models/Ticket');

const getActualizaciones = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizaciones = await ProyectoActualizacion.getByProyecto(id);
    res.json({ success: true, actualizaciones });
  } catch (error) {
    console.error('Error en getActualizaciones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener actualizaciones', error: error.message });
  }
};

const createActualizacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { realizado, pendiente, sugiere_cambio_fecha, fecha_sugerida } = req.body;

    if (!realizado && !pendiente) {
      return res.status(400).json({ success: false, message: 'Debe indicar al menos qué se ha realizado o qué queda pendiente' });
    }

    const actualizacion = await ProyectoActualizacion.create({
      proyecto_id: id,
      empleado_id: req.user.id,
      realizado,
      pendiente,
      sugiere_cambio_fecha,
      fecha_sugerida
    });

    if (sugiere_cambio_fecha) {
      const fechaTexto = fecha_sugerida
        ? new Date(fecha_sugerida).toLocaleDateString('es-ES')
        : 'no especificada';
      const lineas = [
        `Solicitud de cambio de fecha de entrega del proyecto.`,
        ``,
        `Empleado: ${req.user.nombre}`,
        `Nueva fecha sugerida: ${fechaTexto}`
      ];
      if (realizado) lineas.push(``, `Realizado: ${realizado}`);
      if (pendiente) lineas.push(`Pendiente: ${pendiente}`);

      Ticket.create({
        tipo: 'solicitud_cambio_fecha',
        tipo_usuario: 'empleado',
        email: req.user.email,
        nombre: req.user.nombre,
        mensaje: lineas.join('\n'),
        proyecto_id: id
      }).catch((err) => console.error('Error creando ticket cambio fecha:', err.message));
    }

    res.json({ success: true, actualizacion });
  } catch (error) {
    console.error('Error en createActualizacion:', error);
    res.status(500).json({ success: false, message: 'Error al crear actualización', error: error.message });
  }
};

const deleteActualizacion = async (req, res) => {
  try {
    const { actId } = req.params;
    const isAdmin = req.user.rol === 'admin';
    const deleted = await ProyectoActualizacion.delete(actId, req.user.id, isAdmin);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Actualización no encontrada o sin permiso para eliminarla' });
    }
    res.json({ success: true, message: 'Actualización eliminada' });
  } catch (error) {
    console.error('Error en deleteActualizacion:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar actualización', error: error.message });
  }
};

module.exports = { getActualizaciones, createActualizacion, deleteActualizacion };