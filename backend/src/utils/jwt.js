const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';

/**
 * Firma un token JWT con el payload del usuario
 * @param {Object} userPayload - Payload del usuario { id_usuario, tipo_usuario, correo, id_rol }
 * @returns {string} Token JWT firmado
 */
const signToken = (userPayload) => {
  return jwt.sign(
    {
      id_usuario: userPayload.id_usuario,
      tipo_usuario: userPayload.tipo_usuario,
      correo: userPayload.correo,
      id_rol: userPayload.id_rol,
    },
    JWT_SECRET,
    {
      expiresIn: '8h',
    }
  );
};

/**
 * Verifica y decodifica un token JWT
 * @param {string} token - Token JWT a verificar
 * @returns {Object} Payload decodificado del token
 * @throws {Error} Si el token es inválido o ha expirado
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

module.exports = {
  signToken,
  verifyToken,
};

