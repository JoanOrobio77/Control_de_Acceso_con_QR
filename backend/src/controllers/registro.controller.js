const { Registro_Acceso, Personas, Areas } = require('../models');
const { Op } = require('sequelize');

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
 * POST /api/registro/entrada
 * Registrar entrada de una persona
 */
const registrarEntrada = async (req, res) => {
  try {
    const { id_persona, numero_documento, id_area } = req.body;

    // Buscar persona
    let persona = null;
    if (id_persona) {
      persona = await Personas.findByPk(id_persona);
    } else if (numero_documento) {
      persona = await Personas.findOne({ where: { numero_documento } });
    }

    if (!persona) {
      return res.status(404).json({
        error: 'Persona no encontrada',
        message: 'No se encontró una persona con los datos proporcionados',
      });
    }

    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toTimeString().split(' ')[0];

    // Obtener área
    let area;
    if (id_area) {
      area = await Areas.findByPk(id_area);
    }
    if (!area) {
      area = await getDefaultArea();
    }

    if (!area) {
      return res.status(500).json({
        error: 'No se encontró un área disponible',
      });
    }

    // Crear registro de entrada
    const registro = await Registro_Acceso.create({
      id_persona: persona.id_persona,
      id_area: area.id_area,
      fecha,
      hora_entrada: hora,
      hora_salida: null,
      tipo_acceso: 'ENTRADA',
    });

    res.status(201).json({
      success: true,
      message: 'Entrada registrada exitosamente',
      registro: {
        id_registro: registro.id_registro,
        id_persona: registro.id_persona,
        fecha: registro.fecha,
        hora_entrada: registro.hora_entrada,
        tipo_acceso: registro.tipo_acceso,
      },
      persona: {
        id_persona: persona.id_persona,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        numero_documento: persona.numero_documento,
      },
    });
  } catch (error) {
    console.error('Error en registrarEntrada:', error);
    res.status(500).json({
      error: 'Error al registrar entrada',
      details: error.message,
    });
  }
};

/**
 * POST /api/registro/salida
 * Registrar salida de una persona
 */
const registrarSalida = async (req, res) => {
  try {
    const { id_persona, numero_documento, id_area } = req.body;

    // Buscar persona
    let persona = null;
    if (id_persona) {
      persona = await Personas.findByPk(id_persona);
    } else if (numero_documento) {
      persona = await Personas.findOne({ where: { numero_documento } });
    }

    if (!persona) {
      return res.status(404).json({
        error: 'Persona no encontrada',
        message: 'No se encontró una persona con los datos proporcionados',
      });
    }

    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toTimeString().split(' ')[0];

    // Buscar último registro de entrada sin salida
    const ultimoRegistro = await Registro_Acceso.findOne({
      where: {
        id_persona: persona.id_persona,
        tipo_acceso: 'ENTRADA',
        hora_salida: null,
      },
      order: [['id_registro', 'DESC']],
    });

    let registro;

    if (ultimoRegistro) {
      // Actualizar registro existente con hora de salida
      await ultimoRegistro.update({
        hora_salida: hora,
        tipo_acceso: 'SALIDA',
      });
      registro = ultimoRegistro;
    } else {
      // Crear nuevo registro de salida sin entrada previa
      // Obtener área
      let area;
      if (id_area) {
        area = await Areas.findByPk(id_area);
      }
      if (!area) {
        area = await getDefaultArea();
      }

      if (!area) {
        return res.status(500).json({
          error: 'No se encontró un área disponible',
        });
      }

      registro = await Registro_Acceso.create({
        id_persona: persona.id_persona,
        id_area: area.id_area,
        fecha,
        hora_entrada: null,
        hora_salida: hora,
        tipo_acceso: 'SALIDA',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Salida registrada exitosamente',
      registro: {
        id_registro: registro.id_registro,
        id_persona: registro.id_persona,
        fecha: registro.fecha,
        hora_entrada: registro.hora_entrada,
        hora_salida: registro.hora_salida,
        tipo_acceso: registro.tipo_acceso,
      },
      persona: {
        id_persona: persona.id_persona,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        numero_documento: persona.numero_documento,
      },
    });
  } catch (error) {
    console.error('Error en registrarSalida:', error);
    res.status(500).json({
      error: 'Error al registrar salida',
      details: error.message,
    });
  }
};

/**
 * GET /api/registro/persona/:id
 * Obtener historial de registros por persona (id_persona)
 */
const historialPorUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const persona = await Personas.findByPk(id);
    if (!persona) {
      return res.status(404).json({
        error: 'Persona no encontrada',
      });
    }

    const registros = await Registro_Acceso.findAll({
      where: { id_persona: id },
      include: [
        {
          model: Areas,
          as: 'area',
          attributes: ['id_area', 'descripcion'],
        },
      ],
      order: [['fecha', 'DESC'], ['hora_entrada', 'DESC']],
    });

    res.json({
      success: true,
      persona: {
        id_persona: persona.id_persona,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        numero_documento: persona.numero_documento,
        nombre_completo: `${persona.nombres} ${persona.apellidos}`,
      },
      total: registros.length,
      registros: registros.map((reg) => ({
        id_registro: reg.id_registro,
        fecha: reg.fecha,
        hora_entrada: reg.hora_entrada,
        hora_salida: reg.hora_salida,
        tipo_acceso: reg.tipo_acceso,
        area: reg.area ? {
          id_area: reg.area.id_area,
          descripcion: reg.area.descripcion,
        } : null,
      })),
    });
  } catch (error) {
    console.error('Error en historialPorUsuario:', error);
    res.status(500).json({
      error: 'Error al obtener historial',
      details: error.message,
    });
  }
};

/**
 * GET /api/registro/fecha/:fecha
 * Obtener registros por fecha (formato: YYYY-MM-DD)
 */
const historialPorFecha = async (req, res) => {
  try {
    const { fecha } = req.params;

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({
        error: 'Formato de fecha inválido. Use YYYY-MM-DD',
      });
    }

    const registros = await Registro_Acceso.findAll({
      where: { fecha },
      include: [
        {
          model: Personas,
          as: 'persona',
          attributes: ['id_persona', 'nombres', 'apellidos', 'numero_documento', 'tipo_documento'],
        },
        {
          model: Areas,
          as: 'area',
          attributes: ['id_area', 'descripcion'],
        },
      ],
      order: [['hora_entrada', 'DESC']],
    });

    res.json({
      success: true,
      fecha,
      total: registros.length,
      registros: registros.map((reg) => ({
        id_registro: reg.id_registro,
        fecha: reg.fecha,
        hora_entrada: reg.hora_entrada,
        hora_salida: reg.hora_salida,
        tipo_acceso: reg.tipo_acceso,
        persona: reg.persona ? {
          id_persona: reg.persona.id_persona,
          nombres: reg.persona.nombres,
          apellidos: reg.persona.apellidos,
          nombre_completo: `${reg.persona.nombres} ${reg.persona.apellidos}`,
          numero_documento: reg.persona.numero_documento,
          tipo_documento: reg.persona.tipo_documento,
        } : null,
        area: reg.area ? {
          id_area: reg.area.id_area,
          descripcion: reg.area.descripcion,
        } : null,
      })),
    });
  } catch (error) {
    console.error('Error en historialPorFecha:', error);
    res.status(500).json({
      error: 'Error al obtener registros por fecha',
      details: error.message,
    });
  }
};

/**
 * GET /api/registro
 * Obtener todos los registros con paginación
 */
const getAllRegistros = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      fechaDesde,
      fechaHasta,
      id_area,
      tipo_acceso,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Filtros opcionales
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha[Op.gte] = fechaDesde;
      if (fechaHasta) where.fecha[Op.lte] = fechaHasta;
    }

    if (id_area) {
      where.id_area = id_area;
    }

    if (tipo_acceso) {
      where.tipo_acceso = tipo_acceso;
    }

    const { count, rows } = await Registro_Acceso.findAndCountAll({
      where,
      include: [
        {
          model: Personas,
          as: 'persona',
          attributes: ['id_persona', 'nombres', 'apellidos', 'numero_documento', 'tipo_documento'],
        },
        {
          model: Areas,
          as: 'area',
          attributes: ['id_area', 'descripcion'],
        },
      ],
      order: [['fecha', 'DESC'], ['hora_entrada', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
      registros: rows.map((reg) => ({
        id_registro: reg.id_registro,
        fecha: reg.fecha,
        hora_entrada: reg.hora_entrada,
        hora_salida: reg.hora_salida,
        tipo_acceso: reg.tipo_acceso,
        persona: reg.persona ? {
          id_persona: reg.persona.id_persona,
          nombres: reg.persona.nombres,
          apellidos: reg.persona.apellidos,
          nombre_completo: `${reg.persona.nombres} ${reg.persona.apellidos}`,
          numero_documento: reg.persona.numero_documento,
          tipo_documento: reg.persona.tipo_documento,
        } : null,
        area: reg.area ? {
          id_area: reg.area.id_area,
          descripcion: reg.area.descripcion,
        } : null,
      })),
    });
  } catch (error) {
    console.error('Error en getAllRegistros:', error);
    res.status(500).json({
      error: 'Error al obtener registros',
      details: error.message,
    });
  }
};

module.exports = {
  registrarEntrada,
  registrarSalida,
  historialPorUsuario,
  historialPorFecha,
  getAllRegistros,
};
