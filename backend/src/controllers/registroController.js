const { Registro_Acceso, Usuarios, Areas } = require('../models');
const { verifyToken } = require('../utils/jwt');

/**
 * Decodifica el QR y obtiene el usuario
 * Puede ser un token JWT o una identificación directa
 */
const decodeQRAndFindUser = async (qr) => {
  try {
    // Intentar decodificar como JWT
    try {
      const decoded = verifyToken(qr);
      if (decoded.id_usuario) {
        const user = await Usuarios.findByPk(decoded.id_usuario, {
          attributes: ['id_usuario', 'nombre', 'identificacion', 'id_rol'],
        });
        return user;
      }
    } catch (jwtError) {
      // No es un JWT válido, intentar como identificación
    }

    // Intentar buscar por identificación directa
    const user = await Usuarios.findOne({
      where: { identificacion: qr },
      attributes: ['id_usuario', 'nombre', 'identificacion', 'id_rol'],
    });

    return user;
  } catch (error) {
    return null;
  }
};

/**
 * Obtiene o crea un área por defecto
 */
const getDefaultArea = async () => {
  let defaultArea = await Areas.findOne({ where: { descripcion: 'General' } });
  if (!defaultArea) {
    defaultArea = await Areas.findOne();
  }
  return defaultArea;
};

/**
 * Emite evento Socket.IO si está disponible
 */
const emitSocketEvent = (event, data) => {
  try {
    // Verificar si existe el módulo de socket
    const socketUtil = require('../utils/socket');
    if (socketUtil && socketUtil.io) {
      socketUtil.io.emit(event, data);
    }
  } catch (error) {
    // Socket no disponible, continuar sin emitir
  }
};

/**
 * POST /api/registro/scan
 * Registrar entrada/salida por QR
 */
const scanQR = async (req, res) => {
  try {
    const { qr, tipo = 'entrada', areaId } = req.body;

    // Decodificar QR y buscar usuario
    const user = await decodeQRAndFindUser(qr);

    if (!user) {
      return res.status(200).json({
        registered: false,
        message: 'Usuario no registrado',
        suggest: '/api/usuarios',
      });
    }

    const fecha = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD
    const hora = new Date().toTimeString().split(' ')[0]; // Hora actual en formato HH:MM:SS

    // Obtener área (usar la proporcionada o una por defecto)
    let area;
    if (areaId) {
      area = await Areas.findByPk(areaId);
    }
    if (!area) {
      area = await getDefaultArea();
    }

    if (!area) {
      return res.status(500).json({
        error: 'No se encontró un área disponible. Por favor, cree al menos un área.',
      });
    }

    let attendance;

    if (tipo === 'entrada') {
      // Crear nuevo registro de entrada
      attendance = await Registro_Acceso.create({
        id_usuario: user.id_usuario,
        id_area: area.id_area,
        fecha,
        hora_entrada: hora,
        hora_salida: null,
        tipo_acceso: 'entrada',
      });

      // Emitir evento Socket.IO
      emitSocketEvent('attendance.created', {
        userId: user.id_usuario,
        nombre: user.nombre,
        tipo: 'entrada',
        timestamp: new Date().toISOString(),
      });
    } else {
      // Buscar último registro de entrada sin salida
      const ultimoRegistro = await Registro_Acceso.findOne({
        where: {
          id_usuario: user.id_usuario,
          tipo_acceso: 'entrada',
          hora_salida: null,
        },
        order: [['id_registro', 'DESC']],
      });

      if (ultimoRegistro) {
        // Actualizar registro existente con hora de salida
        await ultimoRegistro.update({
          hora_salida: hora,
          tipo_acceso: 'salida',
        });
        attendance = ultimoRegistro;
      } else {
        // Crear nuevo registro de salida sin entrada previa
        attendance = await Registro_Acceso.create({
          id_usuario: user.id_usuario,
          id_area: area.id_area,
          fecha,
          hora_entrada: null,
          hora_salida: hora,
          tipo_acceso: 'salida',
        });
      }

      // Emitir evento Socket.IO
      emitSocketEvent('attendance.created', {
        userId: user.id_usuario,
        nombre: user.nombre,
        tipo: 'salida',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      registered: true,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        identificacion: user.identificacion,
        id_rol: user.id_rol,
      },
      attendance: {
        id_registro: attendance.id_registro,
        tipo_acceso: attendance.tipo_acceso,
        fecha: attendance.fecha,
        hora_entrada: attendance.hora_entrada,
        hora_salida: attendance.hora_salida,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error procesando el escaneo',
      details: error.message,
    });
  }
};

/**
 * POST /api/registro/manual
 * Registro manual por identificación (para guarda)
 */
const registroManual = async (req, res) => {
  try {
    const { identificacion, tipo = 'entrada', areaId, descripcion } = req.body;

    // Buscar usuario por identificación
    const user = await Usuarios.findOne({
      where: { identificacion },
      attributes: ['id_usuario', 'nombre', 'identificacion', 'id_rol'],
    });

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No se encontró un usuario con esa identificación',
        suggest: 'Registrar usuario',
      });
    }

    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toTimeString().split(' ')[0];

    // Obtener área
    let area;
    if (areaId) {
      area = await Areas.findByPk(areaId);
    }
    if (!area) {
      area = await getDefaultArea();
    }

    if (!area) {
      return res.status(500).json({
        error: 'No se encontró un área disponible',
      });
    }

    let attendance;

    if (tipo === 'entrada') {
      attendance = await Registro_Acceso.create({
        id_usuario: user.id_usuario,
        id_area: area.id_area,
        fecha,
        hora_entrada: hora,
        hora_salida: null,
        tipo_acceso: 'entrada',
      });
    } else {
      // Buscar último registro de entrada sin salida
      const ultimoRegistro = await Registro_Acceso.findOne({
        where: {
          id_usuario: user.id_usuario,
          tipo_acceso: 'entrada',
          hora_salida: null,
        },
        order: [['id_registro', 'DESC']],
      });

      if (ultimoRegistro) {
        await ultimoRegistro.update({
          hora_salida: hora,
          tipo_acceso: 'salida',
        });
        attendance = ultimoRegistro;
      } else {
        attendance = await Registro_Acceso.create({
          id_usuario: user.id_usuario,
          id_area: area.id_area,
          fecha,
          hora_entrada: null,
          hora_salida: hora,
          tipo_acceso: 'salida',
        });
      }
    }

    // Emitir evento Socket.IO
    emitSocketEvent('attendance.created', {
      userId: user.id_usuario,
      nombre: user.nombre,
      tipo,
      timestamp: new Date().toISOString(),
      descripcion: descripcion || null,
    });

    res.status(200).json({
      registered: true,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        identificacion: user.identificacion,
        id_rol: user.id_rol,
      },
      attendance: {
        id_registro: attendance.id_registro,
        tipo_acceso: attendance.tipo_acceso,
        fecha: attendance.fecha,
        hora_entrada: attendance.hora_entrada,
        hora_salida: attendance.hora_salida,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error en registro manual',
      details: error.message,
    });
  }
};

/**
 * GET /api/registro
 * Listar registros con filtros y paginación
 */
const listarRegistros = async (req, res) => {
  try {
    const {
      userId,
      fechaDesde,
      fechaHasta,
      areaId,
      tipo,
      page = 1,
      size = 20,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(size);
    const limit = parseInt(size);

    // Construir condiciones WHERE
    const { Op } = require('sequelize');
    const where = {};
    if (userId) where.id_usuario = userId;
    if (areaId) where.id_area = areaId;
    if (tipo) where.tipo_acceso = tipo;
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha[Op.gte] = fechaDesde;
      if (fechaHasta) where.fecha[Op.lte] = fechaHasta;
    }

    // Obtener registros con JOIN a Usuarios y Areas
    const { count, rows } = await Registro_Acceso.findAndCountAll({
      where,
      include: [
        {
          model: Usuarios,
          as: 'usuario',
          attributes: ['id_usuario', 'nombre', 'identificacion', 'id_rol'],
          include: [
            {
              model: require('../models/Roles'),
              as: 'rol',
              attributes: ['id_rol', 'nombre_rol'],
            },
          ],
        },
        {
          model: Areas,
          as: 'area',
          attributes: ['id_area', 'descripcion'],
        },
      ],
      order: [['id_registro', 'DESC']],
      limit,
      offset,
    });

    // Formatear respuesta
    const data = rows.map((registro) => ({
      id_registro: registro.id_registro,
      usuario: {
        id_usuario: registro.usuario.id_usuario,
        nombre: registro.usuario.nombre,
        identificacion: registro.usuario.identificacion,
        rol: registro.usuario.rol
          ? {
              id_rol: registro.usuario.rol.id_rol,
              nombre_rol: registro.usuario.rol.nombre_rol,
            }
          : null,
      },
      area: {
        id_area: registro.area.id_area,
        descripcion: registro.area.descripcion,
      },
      fecha: registro.fecha,
      hora_entrada: registro.hora_entrada,
      hora_salida: registro.hora_salida,
      tipo_acceso: registro.tipo_acceso,
    }));

    res.json({
      total: count,
      page: parseInt(page),
      size: parseInt(size),
      totalPages: Math.ceil(count / parseInt(size)),
      data,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo registros',
      details: error.message,
    });
  }
};

/**
 * GET /api/registro/last/:usuarioId
 * Obtener último estado de un usuario
 */
const obtenerUltimoEstado = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const ultimoRegistro = await Registro_Acceso.findOne({
      where: { id_usuario: usuarioId },
      include: [
        {
          model: Usuarios,
          as: 'usuario',
          attributes: ['id_usuario', 'nombre', 'identificacion'],
        },
        {
          model: Areas,
          as: 'area',
          attributes: ['id_area', 'descripcion'],
        },
      ],
      order: [['id_registro', 'DESC']],
    });

    if (!ultimoRegistro) {
      return res.json(null);
    }

    res.json({
      id_registro: ultimoRegistro.id_registro,
      usuario: {
        id_usuario: ultimoRegistro.usuario.id_usuario,
        nombre: ultimoRegistro.usuario.nombre,
        identificacion: ultimoRegistro.usuario.identificacion,
      },
      area: {
        id_area: ultimoRegistro.area.id_area,
        descripcion: ultimoRegistro.area.descripcion,
      },
      fecha: ultimoRegistro.fecha,
      hora_entrada: ultimoRegistro.hora_entrada,
      hora_salida: ultimoRegistro.hora_salida,
      tipo_acceso: ultimoRegistro.tipo_acceso,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo último estado',
      details: error.message,
    });
  }
};

module.exports = {
  scanQR,
  registroManual,
  listarRegistros,
  obtenerUltimoEstado,
};

