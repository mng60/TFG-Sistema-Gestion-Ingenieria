const Cliente = require('../models/Cliente');

// Obtener todos los clientes
const getAllClientes = async (req, res) => {
  try {
    const { activo, search } = req.query;
    
    const filters = {};
    if (activo !== undefined) {
      filters.activo = activo === 'true';
    }
    if (search) {
      filters.search = search;
    }
    
    const clientes = await Cliente.findAll(filters);
    
    res.json({
      success: true,
      count: clientes.length,
      clientes
    });
  } catch (error) {
    console.error('Error en getAllClientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clientes',
      error: error.message
    });
  }
};

// Obtener un cliente por ID
const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findById(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      cliente
    });
  } catch (error) {
    console.error('Error en getClienteById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cliente',
      error: error.message
    });
  }
};

// Crear nuevo cliente
const createCliente = async (req, res) => {
  try {
    const clienteData = req.body;

    // Verificar si el CIF ya existe
    const existingCliente = await Cliente.findByCIF(clienteData.cif);
    if (existingCliente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un cliente con ese CIF'
      });
    }

    const nuevoCliente = await Cliente.create(clienteData);

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      cliente: nuevoCliente
    });
  } catch (error) {
    console.error('Error en createCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cliente',
      error: error.message
    });
  }
};

// Actualizar cliente
const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const clienteData = req.body;

    // Verificar que el cliente existe
    const clienteExistente = await Cliente.findById(id);
    if (!clienteExistente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Si se está cambiando el CIF, verificar que no exista otro con ese CIF
    if (clienteData.cif && clienteData.cif !== clienteExistente.cif) {
      const clienteConCIF = await Cliente.findByCIF(clienteData.cif);
      if (clienteConCIF) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro cliente con ese CIF'
        });
      }
    }

    const clienteActualizado = await Cliente.update(id, clienteData);

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      cliente: clienteActualizado
    });
  } catch (error) {
    console.error('Error en updateCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cliente',
      error: error.message
    });
  }
};

// Desactivar cliente (soft delete)
const deactivateCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.deactivate(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Cliente desactivado exitosamente',
      cliente
    });
  } catch (error) {
    console.error('Error en deactivateCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar cliente',
      error: error.message
    });
  }
};

// Eliminar cliente permanentemente
const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.delete(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    // Error de clave foránea (tiene proyectos asociados)
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el cliente porque tiene proyectos asociados. Desactívalo en su lugar.'
      });
    }

    console.error('Error en deleteCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cliente',
      error: error.message
    });
  }
};

// Obtener proyectos de un cliente
const getClienteProyectos = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el cliente existe
    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    const proyectos = await Cliente.getProyectos(id);

    res.json({
      success: true,
      cliente: {
        id: cliente.id,
        nombre_empresa: cliente.nombre_empresa
      },
      count: proyectos.length,
      proyectos
    });
  } catch (error) {
    console.error('Error en getClienteProyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proyectos del cliente',
      error: error.message
    });
  }
};

module.exports = {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deactivateCliente,
  deleteCliente,
  getClienteProyectos
};