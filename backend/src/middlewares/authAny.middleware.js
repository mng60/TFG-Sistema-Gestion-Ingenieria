// Middleware que acepta tanto tokens de empleados como de clientes (portal)
// Normaliza req.user.tipo_usuario para que el chat controller funcione con ambos
const { verifyToken } = require('../utils/jwt');

const authAnyMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Normalizar tipo_usuario:
    // - Token empleado usa tipo_usuario: 'empleado'
    // - Token cliente (portal) usa tipo: 'cliente'
    const tipo_usuario = decoded.tipo_usuario || (decoded.tipo === 'cliente' ? 'cliente' : 'empleado');

    req.user = {
      ...decoded,
      tipo_usuario
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      error: error.message
    });
  }
};

module.exports = authAnyMiddleware;
