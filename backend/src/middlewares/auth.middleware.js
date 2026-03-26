const { verifyToken } = require('../utils/jwt');
const { Usuarios } = require('../models');

/**
 * Middleware para autenticar usuarios mediante JWT
 * Verifica el token en la cabecera Authorization: Bearer <token>
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener token de la cabecera Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de autenticación requerido',
      });
    }

    // Extraer token
    const token = authHeader.substring(7); // Remover "Bearer "

    if (!token) {
      return res.status(401).json({
        error: 'Token de autenticación requerido',
      });
    }

    // Verificar token
    const decoded = verifyToken(token);

    // Buscar usuario en la base de datos para asegurar que aún existe
    const user = await Usuarios.findByPk(decoded.id_usuario, {
      attributes: ['id_usuario', 'tipo_usuario', 'correo', 'id_rol'],
      include: [
        {
          model: require('../models/Roles'),
          as: 'rol',
          attributes: ['id_rol', 'nombre_rol', 'estado', 'permite_login'],
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
      });
    }

    // Adjuntar información del usuario al request
    req.user = {
      id_usuario: user.id_usuario,
      tipo_usuario: user.tipo_usuario,
      correo: user.correo,
      id_rol: user.id_rol,
      rol: user.rol ? {
        id_rol: user.rol.id_rol,
        nombre_rol: user.rol.nombre_rol,
        estado: user.rol.estado,
        permite_login: user.rol.permite_login,
      } : null,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: error.message || 'Token inválido o expirado',
    });
  }
};

module.exports = {
  authenticate,
};

