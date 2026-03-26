const authService = require('../services/auth.service');
const { signToken } = require('../utils/jwt');

/**
 * Registro de administrador
 * POST /api/auth/register-admin
 */
const registerAdmin = async (req, res) => {
  try {
    const { tipo_usuario, correo, password } = req.body;

    // Registrar administrador
    const user = await authService.registerAdmin({
      tipo_usuario: tipo_usuario || 'administrador',
      correo,
      password,
    });

    res.status(201).json({
      user,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.message || 'Error al registrar administrador',
    });
  }
};

/**
 * Login de usuario
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    // Autenticar usuario
    const user = await authService.login(correo, password);

    // Generar token JWT
    const token = signToken({
      id_usuario: user.id_usuario,
      tipo_usuario: user.tipo_usuario,
      correo: user.correo,
      id_rol: user.id_rol,
    });

    res.status(200).json({
      token,
      user,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.message || 'Error al iniciar sesión',
    });
  }
};

/**
 * Registro general de usuario
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { nombre, identificacion, telefono, correo, id_ficha, id_rol, nombre_rol } = req.body;
    const { Roles } = require('../models');

    // Validaciones básicas
    if (!nombre || !identificacion) {
      return res.status(400).json({
        error: 'Nombre e identificación son requeridos',
      });
    }

    // Validar correo si se proporciona
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({
        error: 'El correo electrónico no es válido',
      });
    }

    // Obtener id_rol si se proporciona nombre_rol
    let rolId = id_rol;
    if (!rolId && nombre_rol) {
      const rol = await Roles.findOne({ where: { nombre_rol } });
      if (!rol) {
        return res.status(400).json({
          error: `El rol '${nombre_rol}' no existe`,
        });
      }
      rolId = rol.id_rol;
    }

    if (!rolId) {
      return res.status(400).json({
        error: 'Debe proporcionar id_rol o nombre_rol',
      });
    }

    // Verificar si ya existe usuario con esa identificación
    const existingUser = await Usuarios.findOne({
      where: { identificacion },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Ya existe un usuario con esa identificación',
      });
    }

    // Crear usuario
    const newUser = await Usuarios.create({
      nombre,
      identificacion,
      telefono: telefono || null,
      correo: correo || null,
      id_ficha: id_ficha || null,
      id_rol: rolId,
    });

    // Retornar usuario sin password
    const userResponse = {
      id_usuario: newUser.id_usuario,
      nombre: newUser.nombre,
      identificacion: newUser.identificacion,
      telefono: newUser.telefono,
      correo: newUser.correo,
      id_rol: newUser.id_rol,
      id_ficha: newUser.id_ficha,
    };

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: userResponse,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: error.message || 'Error al registrar usuario',
    });
  }
};

/**
 * Obtener información del usuario autenticado
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    // El usuario ya está en req.user gracias al middleware authenticate
    res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener información del usuario',
    });
  }
};

module.exports = {
  registerAdmin,
  login,
  register,
  getMe,
};

