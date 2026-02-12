const { verifyToken } = require('../utils/jwt');

const authMiddleware = (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }

    // Extraer el token (formato: "Bearer TOKEN")
    const token = authHeader.split(' ')[1];

    // Verificar token
    const decoded = verifyToken(token);

    // Añadir información del usuario a la request
    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      error: error.message
    });
  }
};

module.exports = authMiddleware;