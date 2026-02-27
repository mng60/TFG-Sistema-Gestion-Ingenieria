const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Función para crear configuración de multer por tipo
const createMulterConfig = (uploadPath) => {
  // Crear carpeta si no existe
  const uploadsDir = path.join(__dirname, '../../uploads', uploadPath);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configuración de almacenamiento
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
    }
  });

  // Filtro de archivos permitidos
  const fileFilter = (req, file, cb) => {
    const allowedExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx',
      '.jpg', '.jpeg', '.png', '.gif', '.webp',
      '.dwg', '.dxf', '.zip', '.rar', '.txt', '.drawio',
      '.mp3', '.wav', '.ogg', '.m4a', '.webm', '.mp4' 
    ];

    const originalname = file.originalname.toLowerCase();
    let ext = '';

    const partes = originalname.split('.');
    if (partes.length > 1) {
      ext = '.' + partes[partes.length - 1];
      if (partes.length > 2 && allowedExtensions.includes('.' + partes[partes.length - 2])) {
        ext = '.' + partes[partes.length - 2];
      }
    }

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${ext}`));
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024
    }
  });
};

// Exportar configuraciones específicas
module.exports = {
  uploadDocumentos: createMulterConfig('documentos'),
  uploadChat: createMulterConfig('chat')
};