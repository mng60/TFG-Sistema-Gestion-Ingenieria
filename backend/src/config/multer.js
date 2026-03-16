const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configurar Cloudinary si hay credenciales
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Filtro de archivos permitidos (compartido)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.dwg', '.dxf', '.zip', '.rar', '.txt', '.drawio',
    '.mp3', '.wav', '.ogg', '.m4a', '.webm', '.mp4'
  ];
  const originalname = file.originalname.toLowerCase();
  const partes = originalname.split('.');
  let ext = partes.length > 1 ? '.' + partes[partes.length - 1] : '';
  if (partes.length > 2 && allowedExtensions.includes('.' + partes[partes.length - 2])) {
    ext = '.' + partes[partes.length - 2];
  }
  allowedExtensions.includes(ext) ? cb(null, true) : cb(new Error(`Tipo de archivo no permitido: ${ext}`));
};

const avatarFileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  allowed.includes(ext) ? cb(null, true) : cb(new Error('Solo se permiten imágenes'));
};

// Crear storage según entorno
const createStorage = (folder) => {
  if (useCloudinary) {
    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder: `tfg/${folder}`,
        resource_type: 'auto',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx',
          'xls', 'xlsx', 'dwg', 'dxf', 'zip', 'rar', 'txt', 'mp3', 'wav', 'ogg', 'm4a', 'webm', 'mp4'],
      },
    });
  }
  // Almacenamiento local (desarrollo)
  const uploadsDir = path.join(__dirname, '../../uploads', folder);
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
    }
  });
};

const createAvatarStorage = () => {
  if (useCloudinary) {
    return new CloudinaryStorage({
      cloudinary,
      params: (req) => ({
        folder: 'tfg/avatares',
        resource_type: 'image',
        public_id: `avatar-${req.user.id}-${Date.now()}`,
      }),
    });
  }
  const uploadsDir = path.join(__dirname, '../../uploads/avatares');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
    }
  });
};

module.exports = {
  uploadDocumentos: multer({ storage: createStorage('documentos'), fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }),
  uploadChat: multer({ storage: createStorage('chat'), fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }),
  uploadAvatares: multer({ storage: createAvatarStorage(), fileFilter: avatarFileFilter, limits: { fileSize: 5 * 1024 * 1024 } }),
};
