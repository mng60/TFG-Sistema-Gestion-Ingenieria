const Documento = require('../models/Documento');
const Proyecto = require('../models/Proyecto');
const path = require('path');
const fs = require('fs');

// Obtener todos los documentos
const getAllDocumentos = async (req, res) => {
  try {
    const { tipo_documento, proyecto_id, es_publico } = req.query;
    
    const filters = {};
    if (tipo_documento) filters.tipo_documento = tipo_documento;
    if (proyecto_id) filters.proyecto_id = proyecto_id;
    if (es_publico !== undefined) filters.es_publico = es_publico === 'true';
    
    const documentos = await Documento.findAll(filters);
    
    res.json({
      success: true,
      count: documentos.length,
      documentos
    });
  } catch (error) {
    console.error('Error en getAllDocumentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos',
      error: error.message
    });
  }
};

// Obtener un documento por ID
const getDocumentoById = async (req, res) => {
  try {
    const { id } = req.params;
    const documento = await Documento.findById(id);

    if (!documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    res.json({
      success: true,
      documento
    });
  } catch (error) {
    console.error('Error en getDocumentoById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documento',
      error: error.message
    });
  }
};

// Obtener documentos de un proyecto
const getDocumentosByProyecto = async (req, res) => {
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

    const documentos = await Documento.findByProyecto(proyectoId);

    res.json({
      success: true,
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre
      },
      count: documentos.length,
      documentos
    });
  } catch (error) {
    console.error('Error en getDocumentosByProyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos del proyecto',
      error: error.message
    });
  }
};

// Subir documento
const uploadDocumento = async (req, res) => {
  try {
    // Verificar que se subió un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const { proyecto_id, tipo_documento, descripcion, version, es_publico } = req.body;

    // Verificar que el proyecto existe
    const proyecto = await Proyecto.findById(proyecto_id);
    if (!proyecto) {
      // Eliminar el archivo subido si el proyecto no existe
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Crear registro en la base de datos
    const documentoData = {
      proyecto_id,
      nombre: req.file.originalname,
      tipo_documento: tipo_documento || 'otro',
      descripcion: descripcion || '',
      ruta_archivo: req.file.path,
      tamano_bytes: req.file.size,
      extension: path.extname(req.file.originalname),
      subido_por: req.user.id,
      version: version || 1,
      es_publico: es_publico === 'true' || es_publico === true
    };

    const nuevoDocumento = await Documento.create(documentoData);

    res.status(201).json({
      success: true,
      message: 'Documento subido exitosamente',
      documento: nuevoDocumento
    });
  } catch (error) {
    // Si hay error, eliminar el archivo subido
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Error en uploadDocumento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir documento',
      error: error.message
    });
  }
};

// Descargar documento
const downloadDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const documento = await Documento.findById(id);

    if (!documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar que el archivo existe
    if (!fs.existsSync(documento.ruta_archivo)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en el servidor'
      });
    }

    // Enviar archivo
    res.download(documento.ruta_archivo, documento.nombre);
  } catch (error) {
    console.error('Error en downloadDocumento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar documento',
      error: error.message
    });
  }
};

// Actualizar documento
const updateDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const documentoData = req.body;

    const documentoExistente = await Documento.findById(id);
    if (!documentoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    const documentoActualizado = await Documento.update(id, documentoData);

    res.json({
      success: true,
      message: 'Documento actualizado exitosamente',
      documento: documentoActualizado
    });
  } catch (error) {
    console.error('Error en updateDocumento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar documento',
      error: error.message
    });
  }
};

// Eliminar documento
const deleteDocumento = async (req, res) => {
  try {
    const { id } = req.params;

    const documento = await Documento.findById(id);
    if (!documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Eliminar archivo físico
    if (fs.existsSync(documento.ruta_archivo)) {
      fs.unlinkSync(documento.ruta_archivo);
    }

    // Eliminar registro de BD
    await Documento.delete(id);

    res.json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteDocumento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar documento',
      error: error.message
    });
  }
};

module.exports = {
  getAllDocumentos,
  getDocumentoById,
  getDocumentosByProyecto,
  uploadDocumento,
  downloadDocumento,
  updateDocumento,
  deleteDocumento
};