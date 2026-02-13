const Proyecto = require('../models/Proyecto');
const Cliente = require('../models/Cliente');
const User = require('../models/User');

// Obtener todos los proyectos
const getAllProyectos = async (req, res) => {
  try {
    const { estado, prioridad, cliente_id, responsable_id, search } = req.query;
    
    const filters = {};
    if (estado) filters.estado = estado;
    if (prioridad) filters.prioridad = prioridad;
    if (cliente_id) filters.cliente_id = cliente_id;
    if (responsable_id) filters.responsable_id = responsable_id;
    if (search) filters.search = search;
    
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
      estadisticas
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