const express = require('express');
const { body } = require('express-validator');
const {
  getAllDocumentos,
  getDocumentoById,
  getDocumentosByProyecto,
  uploadDocumento,
  downloadDocumento,
  downloadDocumentoFile,
  streamDocumento,
  updateDocumento,
  deleteDocumento,
  getAccesoEmpleados,
  setAccesoEmpleados
} = require('../controllers/documento.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/role.middleware');
const { uploadDocumentos } = require('../config/multer');

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

// Stream de archivo local — protegido con JWT de descarga, no requiere Bearer token
router.get('/:id/stream', streamDocumento);

// Todas las demás rutas requieren autenticación
router.use(authMiddleware);

router.get('/', getAllDocumentos);
router.get('/proyecto/:proyectoId', getDocumentosByProyecto);
router.get('/:id/file', downloadDocumentoFile);
router.get('/:id', getDocumentoById);
router.get('/:id/download', downloadDocumento);

router.post('/upload', checkRole('admin'), (req, res, next) => {
  uploadDocumentos.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error al procesar el archivo'
      });
    }
    next();
  });
}, uploadDocumento);

router.get('/:id/acceso-empleados', checkRole('admin'), getAccesoEmpleados);
router.put('/:id/acceso-empleados', checkRole('admin'), setAccesoEmpleados);
router.put('/:id', checkRole('admin'), documentoUpdateValidation, updateDocumento);
router.delete('/:id', checkRole('admin'), deleteDocumento);

module.exports = router;
