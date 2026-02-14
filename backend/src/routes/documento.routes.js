const express = require('express');
const { body } = require('express-validator');
const {
  getAllDocumentos,
  getDocumentoById,
  getDocumentosByProyecto,
  uploadDocumento,
  downloadDocumento,
  updateDocumento,
  deleteDocumento
} = require('../controllers/documento.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/role.middleware');
const upload = require('../config/multer');

const router = express.Router();

// Validaciones para actualizar documento
const documentoUpdateValidation = [
  body('nombre')
    .optional()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío'),
  body('tipo_documento')
    .optional()
    .isIn(['esquema', 'plano', 'contrato', 'informe', 'foto', 'certificado', 'otro'])
    .withMessage('Tipo de documento inválido'),
  body('es_publico')
    .optional()
    .isBoolean()
    .withMessage('es_publico debe ser true o false')
];

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/documentos - Obtener todos los documentos
router.get('/', getAllDocumentos);

// GET /api/documentos/proyecto/:proyectoId - Obtener documentos de un proyecto
router.get('/proyecto/:proyectoId', getDocumentosByProyecto);

// GET /api/documentos/:id - Obtener un documento por ID
router.get('/:id', getDocumentoById);

// GET /api/documentos/:id/download - Descargar documento
router.get('/:id/download', downloadDocumento);

// POST /api/documentos/upload - Subir documento (solo admin)
router.post('/upload', checkRole('admin'), upload.single('file'), uploadDocumento);

// PUT /api/documentos/:id - Actualizar documento (solo admin)
router.put('/:id', checkRole('admin'), documentoUpdateValidation, updateDocumento);

// DELETE /api/documentos/:id - Eliminar documento (solo admin)
router.delete('/:id', checkRole('admin'), deleteDocumento);

module.exports = router;