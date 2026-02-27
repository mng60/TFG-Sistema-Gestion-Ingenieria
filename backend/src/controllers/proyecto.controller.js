const Proyecto = require('../models/Proyecto');
const Cliente = require('../models/Cliente');
const User = require('../models/User');
const { pool } = require('../config/database');

// Helpers para gestión automática del grupo de chat del proyecto
const crearGrupoChat = async (proyectoId, nombreProyecto, clienteId) => {
  try {
    const result = await pool.query(
      `INSERT INTO conversaciones (nombre, tipo, proyecto_id, created_at, updated_at)
       VALUES ($1, 'proyecto_grupo', $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [`Grupo: ${nombreProyecto}`, proyectoId]
    );
    const conversacionId = result.rows[0].id;

    // Añadir cliente como participante
    if (clienteId) {
      await pool.query(
        `INSERT INTO conversacion_participantes (conversacion_id, user_id, tipo_usuario, joined_at)
         VALUES ($1, $2, 'cliente', CURRENT_TIMESTAMP)
         ON CONFLICT DO NOTHING`,
        [conversacionId, clienteId]
      );
    }

    console.log(`💬 Grupo de chat creado para proyecto ${proyectoId} (conversación ${conversacionId})`);
    return conversacionId;
  } catch (error) {
    console.error('Error al crear grupo de chat del proyecto:', error.message);
  }
};

const agregarEmpleadoAGrupo = async (proyectoId, empleadoId) => {
  try {
    const conv = await pool.query(
      `SELECT id FROM conversaciones WHERE proyecto_id = $1 AND tipo = 'proyecto_grupo' LIMIT 1`,
      [proyectoId]
    );
    if (conv.rows.length === 0) return;

    await pool.query(
      `INSERT INTO conversacion_participantes (conversacion_id, user_id, tipo_usuario, joined_at)
       VALUES ($1, $2, 'empleado', CURRENT_TIMESTAMP)
       ON CONFLICT DO NOTHING`,
      [conv.rows[0].id, empleadoId]
    );
  } catch (error) {
    console.error('Error al añadir empleado al grupo de chat:', error.message);
  }
};

const quitarEmpleadoDeGrupo = async (proyectoId, empleadoId) => {
  try {
    const conv = await pool.query(
      `SELECT id FROM conversaciones WHERE proyecto_id = $1 AND tipo = 'proyecto_grupo' LIMIT 1`,
      [proyectoId]
    );
    if (conv.rows.length === 0) return;

    await pool.query(
      `DELETE FROM conversacion_participantes
       WHERE conversacion_id = $1 AND user_id = $2 AND tipo_usuario = 'empleado'`,
      [conv.rows[0].id, empleadoId]
    );
  } catch (error) {
    console.error('Error al quitar empleado del grupo de chat:', error.message);
  }
};

const programarBorradoChat = async (proyectoId) => {
  try {
    await pool.query(
      `UPDATE conversaciones
       SET deletion_scheduled_at = CURRENT_TIMESTAMP + INTERVAL '3 days'
       WHERE proyecto_id = $1 AND tipo = 'proyecto_grupo' AND deletion_scheduled_at IS NULL`,
      [proyectoId]
    );
    console.log(`🗑️ Borrado programado del chat para proyecto ${proyectoId} en 3 días`);
  } catch (error) {
    console.error('Error al programar borrado del chat:', error.message);
  }
};

// Obtener todos los proyectos
const getAllProyectos = async (req, res) => {
  try {
    const { estado, prioridad, cliente_id, responsable_id, search, empleado_id } = req.query;
    const empleadoActual = req.user; 
    
    const filters = {};
    if (estado) filters.estado = estado;
    if (prioridad) filters.prioridad = prioridad;
    if (cliente_id) filters.cliente_id = cliente_id;
    if (responsable_id) filters.responsable_id = responsable_id;
    if (search) filters.search = search;
    
    filters.current_user_id = empleadoActual.id;
    filters.current_user_rol = empleadoActual.rol;

    // Filtro por proyectos compartidos con otro empleado
    if (empleado_id) {
      filters.empleado_compartido_id = empleado_id;
    }
    
    const proyectos = await Proyecto.findAll(filters);
    
    res.json({
      success: true,
      count: proyectos.length,
      proyectos
    });
  } catch (error) {
    console.error('Error en getAllProyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proyectos',
      error: error.message
    });
  }
};

// Obtener un proyecto por ID
const getProyectoById = async (req, res) => {
  try {
    const { id } = req.params;
    const proyecto = await Proyecto.findById(id);

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    res.json({
      success: true,
      proyecto
    });
  } catch (error) {
    console.error('Error en getProyectoById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proyecto',
      error: error.message
    });
  }
};

// Crear nuevo proyecto
const createProyecto = async (req, res) => {
  try {
    const proyectoData = req.body;

    // Verificar que el cliente existe
    const cliente = await Cliente.findById(proyectoData.cliente_id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar que el responsable existe (si se proporciona)
    if (proyectoData.responsable_id) {
      const responsable = await User.findById(proyectoData.responsable_id);
      if (!responsable) {
        return res.status(404).json({
          success: false,
          message: 'Responsable no encontrado'
        });
      }
    }

    const nuevoProyecto = await Proyecto.create(proyectoData);

    // Crear automáticamente el grupo de chat del proyecto
    await crearGrupoChat(nuevoProyecto.id, nuevoProyecto.nombre, nuevoProyecto.cliente_id);

    res.status(201).json({
      success: true,
      message: 'Proyecto creado exitosamente',
      proyecto: nuevoProyecto
    });
  } catch (error) {
    console.error('Error en createProyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear proyecto',
      error: error.message
    });
  }
};

// Actualizar proyecto
const updateProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const proyectoData = req.body;

    // Verificar que el proyecto existe
    const proyectoExistente = await Proyecto.findById(id);
    if (!proyectoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar cliente si se está actualizando
    if (proyectoData.cliente_id && proyectoData.cliente_id !== proyectoExistente.cliente_id) {
      const cliente = await Cliente.findById(proyectoData.cliente_id);
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }
    }

    // Verificar responsable si se está actualizando
    if (proyectoData.responsable_id) {
      const responsable = await User.findById(proyectoData.responsable_id);
      if (!responsable) {
        return res.status(404).json({
          success: false,
          message: 'Responsable no encontrado'
        });
      }
    }

    const proyectoActualizado = await Proyecto.update(id, proyectoData);

    // Si el proyecto se marca como completado, programar borrado del chat
    if (proyectoData.estado === 'completado' && proyectoExistente.estado !== 'completado') {
      await programarBorradoChat(id);
    }

    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      proyecto: proyectoActualizado
    });
  } catch (error) {
    console.error('Error en updateProyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar proyecto',
      error: error.message
    });
  }
};

// Eliminar proyecto
const deleteProyecto = async (req, res) => {
  try {
    const { id } = req.params;

    const proyecto = await Proyecto.delete(id);

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Proyecto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteProyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar proyecto',
      error: error.message
    });
  }
};

// Asignar empleado a proyecto
const asignarEmpleado = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, rol_proyecto } = req.body;

    // Verificar que el proyecto existe
    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar que el empleado existe
    const empleado = await User.findById(user_id);
    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    const asignacion = await Proyecto.asignarEmpleado(id, user_id, rol_proyecto);

    // Añadir empleado al grupo de chat del proyecto
    await agregarEmpleadoAGrupo(id, user_id);

    res.status(201).json({
      success: true,
      message: 'Empleado asignado exitosamente',
      asignacion
    });
  } catch (error) {
    if (error.message === 'El empleado ya está asignado a este proyecto') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    console.error('Error en asignarEmpleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar empleado',
      error: error.message
    });
  }
};

// Desasignar empleado de proyecto
const desasignarEmpleado = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const desasignacion = await Proyecto.desasignarEmpleado(id, userId);

    if (!desasignacion) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada o empleado ya desasignado'
      });
    }

    // Quitar empleado del grupo de chat del proyecto
    await quitarEmpleadoDeGrupo(id, userId);

    res.json({
      success: true,
      message: 'Empleado desasignado exitosamente'
    });
  } catch (error) {
    console.error('Error en desasignarEmpleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desasignar empleado',
      error: error.message
    });
  }
};

// Obtener empleados del proyecto
const getProyectoEmpleados = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el proyecto existe
    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const empleados = await Proyecto.getEmpleados(id);

    res.json({
      success: true,
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre
      },
      count: empleados.length,
      empleados
    });
  } catch (error) {
    console.error('Error en getProyectoEmpleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener empleados del proyecto',
      error: error.message
    });
  }
};

// Obtener estadísticas generales
const getEstadisticas = async (req, res) => {
  try {
    const estadisticas = await Proyecto.getEstadisticas();

    res.json({
      success: true,
      ...estadisticas
    });
  } catch (error) {
    console.error('Error en getEstadisticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

module.exports = {
  getAllProyectos,
  getProyectoById,
  createProyecto,
  updateProyecto,
  deleteProyecto,
  asignarEmpleado,
  desasignarEmpleado,
  getProyectoEmpleados,
  getEstadisticas
};