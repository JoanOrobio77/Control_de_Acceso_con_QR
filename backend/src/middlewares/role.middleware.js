const { Roles } = require('../models');

/**
 * Middleware para validar roles de usuario
 * @param {string[]} allowedRoles - Array de nombres de roles permitidos
 * @returns {Function} Middleware de Express
 */
const allowRoles = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user || !req.user.id_rol) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      // Buscar el rol del usuario en la base de datos
      const userRole = await Roles.findByPk(req.user.id_rol);

      if (!userRole) {
        return res.status(403).json({
          error: 'Rol de usuario no encontrado',
        });
      }

      // Verificar que el rol esté activo
      if (!userRole.estado) {
        return res.status(403).json({
          error: 'Tu cuenta está desactivada',
        });
      }

      // Verificar si el rol del usuario está en la lista de roles permitidos
      const roleName = userRole.nombre_rol.toLowerCase();
      const allowedRolesLower = allowedRoles.map((r) => r.toLowerCase());

      if (!allowedRolesLower.includes(roleName)) {
        return res.status(403).json({
          error: 'No tienes permisos para acceder a este recurso',
        });
      }

      // Adjuntar información del rol al request
      req.user.rol = {
        id_rol: userRole.id_rol,
        nombre_rol: userRole.nombre_rol,
        estado: userRole.estado,
      };

      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Error al validar permisos',
        details: error.message,
      });
    }
  };
};

module.exports = {
  allowRoles,
};

