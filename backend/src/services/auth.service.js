const bcrypt = require('bcrypt');
const { Usuarios, Roles } = require('../models');

const SALT_ROUNDS = 10;

/**
 * Busca o crea el rol de administrador
 * @returns {Promise<Object>} Rol de administrador
 */
const getOrCreateAdminRole = async () => {
  let adminRole = await Roles.findOne({
    where: { nombre_rol: 'administrador' },
  });

  if (!adminRole) {
    adminRole = await Roles.create({
      nombre_rol: 'administrador',
      estado: true,
    });
  }

  return adminRole;
};

/**
 * Registra un nuevo administrador
 * @param {Object} userData - Datos del usuario { tipo_usuario, correo, password }
 * @returns {Promise<Object>} Usuario creado (sin password)
 */
const registerAdmin = async (userData) => {
  const { tipo_usuario, correo, password } = userData;

  // Verificar si ya existe usuario con ese correo
  const existingUserByEmail = await Usuarios.findOne({
    where: { correo },
  });

  if (existingUserByEmail) {
    const error = new Error('Ya existe un usuario con ese correo');
    error.statusCode = 409;
    throw error;
  }

  // Hashear contraseña
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Obtener o crear rol de administrador
  const adminRole = await getOrCreateAdminRole();

  // Crear usuario
  const newUser = await Usuarios.create({
    tipo_usuario: tipo_usuario || 'administrador',
    correo,
    password: hashedPassword,
    id_rol: adminRole.id_rol,
  });

  // Retornar usuario sin password
  const userResponse = {
    id_usuario: newUser.id_usuario,
    tipo_usuario: newUser.tipo_usuario,
    correo: newUser.correo,
    id_rol: newUser.id_rol,
  };

  return userResponse;
};

/**
 * Autentica un usuario con correo y contraseña
 * @param {string} correo - Correo del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} Usuario autenticado (sin password)
 */
const login = async (correo, password) => {
  // Buscar usuario por correo
  const user = await Usuarios.findOne({
    where: { correo },
    include: [
      {
        model: Roles,
        as: 'rol',
        attributes: ['id_rol', 'nombre_rol', 'estado', 'permite_login'],
      },
    ],
  });

  if (!user) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  // Verificar que el rol esté activo
  if (user.rol && !user.rol.estado) {
    const error = new Error('Tu cuenta está desactivada');
    error.statusCode = 401;
    throw error;
  }

  // Verificar que el rol permita login
  if (user.rol && !user.rol.permite_login) {
    const error = new Error('Tu rol no tiene permisos para iniciar sesión');
    error.statusCode = 403;
    throw error;
  }

  // Comparar contraseña
  if (!user.password) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  // Retornar usuario sin password con información del rol
  const userResponse = {
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

  return userResponse;
};

module.exports = {
  registerAdmin,
  login,
  getOrCreateAdminRole,
};

