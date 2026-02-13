const Presupuesto = require('../models/Presupuesto');
const Proyecto = require('../models/Proyecto');

// Obtener todos los presupuestos
const getAllPresupuestos = async (req, res) => {
  try {
    const { estado, proyecto_id, aceptado } = req.query;
    
    const filters = {};
    if (estado) filters.estado = estado;
    if (proyecto_id) filters.proyecto_id = proyecto_id;
    if (aceptado !== undefined) filters.aceptado = aceptado === 'true';
    
    const presupuestos = await Presupuesto.findAll(filters);
    
    res.json({
      success: true,
      count: presupuestos.length,
      presupuestos
    });
  } catch (error) {
    console.error('Error en getAllPresupuestos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener presupuestos',
      error: error.message
    });
  }
};

// Obtener un presupuesto por ID
const getPresupuestoById = async (req, res) => {
  try {
    const { id } = req.params;
    const presupuesto = await Presupuesto.findById(id);

    if (!presupuesto) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    res.json({
      success: true,
      presupuesto
    });
  } catch (error) {
    console.error('Error en getPresupuestoById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener presupuesto',
      error: error.message
    });
  }
};

// Obtener presupuestos de un proyecto
const getPresupuestosByProyecto = async (req, res) => {
  try {
    const { proyectoId } = req.params;

    // Verificar que el proyecto existe
    const proyecto = await Proyecto.findById(proyectoId);
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const presupuestos = await Presupuesto.findByProyecto(proyectoId);

    res.json({
      success: true,
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre
      },
      count: presupuestos.length,
      presupuestos
    });
  } catch (error) {
    console.error('Error en getPresupuestosByProyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener presupuestos del proyecto',
      error: error.message
    });
  }
};

// Crear nuevo presupuesto
const createPresupuesto = async (req, res) => {
  try {
    const presupuestoData = req.body;

    // Verificar que el proyecto existe
    const proyecto = await Proyecto.findById(presupuestoData.proyecto_id);
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar que el número de presupuesto no existe
    if (presupuestoData.numero_presupuesto) {
      const existente = await Presupuesto.findByNumero(presupuestoData.numero_presupuesto);
      if (existente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un presupuesto con ese número'
        });
      }
    }

    // Añadir el ID del usuario que crea el presupuesto
    presupuestoData.creado_por = req.user.id;

    const nuevoPresupuesto = await Presupuesto.create(presupuestoData);

    res.status(201).json({
      success: true,
      message: 'Presupuesto creado exitosamente',
      presupuesto: nuevoPresupuesto
    });
  } catch (error) {
    console.error('Error en createPresupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear presupuesto',
      error: error.message
    });
  }
};

// Actualizar presupuesto
const updatePresupuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const presupuestoData = req.body;

    // Verificar que el presupuesto existe
    const presupuestoExistente = await Presupuesto.findById(id);
    if (!presupuestoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    // No permitir editar presupuestos aceptados
    if (presupuestoExistente.aceptado) {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar un presupuesto ya aceptado'
      });
    }

    // Verificar número de presupuesto único si se está cambiando
    if (presupuestoData.numero_presupuesto && 
        presupuestoData.numero_presupuesto !== presupuestoExistente.numero_presupuesto) {
      const existente = await Presupuesto.findByNumero(presupuestoData.numero_presupuesto);
      if (existente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un presupuesto con ese número'
        });
      }
    }

    const presupuestoActualizado = await Presupuesto.update(id, presupuestoData);

    res.json({
      success: true,
      message: 'Presupuesto actualizado exitosamente',
      presupuesto: presupuestoActualizado
    });
  } catch (error) {
    console.error('Error en updatePresupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar presupuesto',
      error: error.message
    });
  }
};

// Aceptar presupuesto
const aceptarPresupuesto = async (req, res) => {
  try {
    const { id } = req.params;

    const presupuestoExistente = await Presupuesto.findById(id);
    if (!presupuestoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    if (presupuestoExistente.aceptado) {
      return res.status(400).json({
        success: false,
        message: 'El presupuesto ya está aceptado'
      });
    }

    const presupuestoAceptado = await Presupuesto.aceptar(id);

    res.json({
      success: true,
      message: 'Presupuesto aceptado exitosamente',
      presupuesto: presupuestoAceptado
    });
  } catch (error) {
    console.error('Error en aceptarPresupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aceptar presupuesto',
      error: error.message
    });
  }
};

// Rechazar presupuesto
const rechazarPresupuesto = async (req, res) => {
  try {
    const { id } = req.params;

    const presupuestoExistente = await Presupuesto.findById(id);
    if (!presupuestoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    const presupuestoRechazado = await Presupuesto.rechazar(id);

    res.json({
      success: true,
      message: 'Presupuesto rechazado',
      presupuesto: presupuestoRechazado
    });
  } catch (error) {
    console.error('Error en rechazarPresupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar presupuesto',
      error: error.message
    });
  }
};

// Eliminar presupuesto
const deletePresupuesto = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el presupuesto existe
    const presupuestoExistente = await Presupuesto.findById(id);
    if (!presupuestoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    // No permitir eliminar presupuestos aceptados
    if (presupuestoExistente.aceptado) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un presupuesto aceptado'
      });
    }

    await Presupuesto.delete(id);

    res.json({
      success: true,
      message: 'Presupuesto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en deletePresupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar presupuesto',
      error: error.message
    });
  }
};

module.exports = {
  getAllPresupuestos,
  getPresupuestoById,
  getPresupuestosByProyecto,
  createPresupuesto,
  updatePresupuesto,
  aceptarPresupuesto,
  rechazarPresupuesto,
  deletePresupuesto
};