const { Personas, Roles, Estados, Ficha, Registro_Acceso } = require('../models');
const { Op } = require('sequelize');
const {
  inferTipoEstadoDesdeRol,
  estadoEsObligatorioParaRol,
} = require('../utils/estadoHelper');

const buildPersonaResponse = (persona) => ({
  id_persona: persona.id_persona,
  tipo_documento: persona.tipo_documento,
  numero_documento: persona.numero_documento,
  nombres: persona.nombres,
  apellidos: persona.apellidos,
  nombre_completo: `${persona.nombres} ${persona.apellidos}`,
  foto: persona.foto,
  telefono: persona.telefono,
  correo: persona.correo,
  rh: persona.rh,
  id_rol: persona.id_rol,
  rol: persona.rol
    ? {
        id_rol: persona.rol.id_rol,
        nombre_rol: persona.rol.nombre_rol,
      }
    : null,
  id_estado: persona.id_estado,
  estado: persona.estado
    ? {
        id_estado: persona.estado.id_estado,
        nombre_estado: persona.estado.nombre_estado,
        tipo_aplica: persona.estado.tipo_aplica,
      }
    : null,
});

/**
 * GET /api/personas
 * Obtener todas las personas con filtros opcionales
 */
const getAllPersonas = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      id_rol,
      nombre_rol,
      tipo_documento,
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = {};

    if (search) {
      where[Op.or] = [
        { nombres: { [Op.like]: `%${search}%` } },
        { apellidos: { [Op.like]: `%${search}%` } },
        { numero_documento: { [Op.like]: `%${search}%` } },
        { correo: { [Op.like]: `%${search}%` } },
      ];
    }

    // Filtrar por id_rol si se proporciona
    if (id_rol) {
      where.id_rol = id_rol;
    }
    // Si no hay id_rol pero sí nombre_rol, buscar el rol por nombre
    else if (nombre_rol) {
      const rol = await Roles.findOne({ where: { nombre_rol: nombre_rol.toLowerCase() } });
      if (rol) {
        where.id_rol = rol.id_rol;
      } else {
        // Si el rol no existe, devolver lista vacía
        return res.json({
          success: true,
          total: 0,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: 0,
          personas: [],
        });
      }
    }

    if (tipo_documento) {
      where.tipo_documento = tipo_documento;
    }

    const { count, rows } = await Personas.findAndCountAll({
      where,
      include: [
        {
          model: Roles,
          as: 'rol',
          attributes: ['id_rol', 'nombre_rol'],
        },
        {
          model: Estados,
          as: 'estado',
          attributes: ['id_estado', 'nombre_estado', 'tipo_aplica'],
        },
      ],
      order: [['nombres', 'ASC'], ['apellidos', 'ASC']],
      limit: parseInt(limit, 10),
      offset,
    });

    res.json({
      success: true,
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(count / parseInt(limit, 10)),
      personas: rows.map(buildPersonaResponse),
    });
  } catch (error) {
    console.error('Error en getAllPersonas:', error);
    res.status(500).json({
      error: 'Error al obtener personas',
      details: error.message,
    });
  }
};

/**
 * GET /api/personas/:id
 * Obtener una persona por ID
 */
const getPersonaById = async (req, res) => {
  try {
    const { id } = req.params;

    const persona = await Personas.findByPk(id, {
      include: [
        {
          model: Roles,
          as: 'rol',
          attributes: ['id_rol', 'nombre_rol'],
        },
        {
          model: Estados,
          as: 'estado',
          attributes: ['id_estado', 'nombre_estado', 'tipo_aplica'],
        },
      ],
    });

    if (!persona) {
      return res.status(404).json({
        error: 'Persona no encontrada',
      });
    }

    res.json({
      success: true,
      persona: buildPersonaResponse(persona),
    });
  } catch (error) {
    console.error('Error en getPersonaById:', error);
    res.status(500).json({
      error: 'Error al obtener persona',
      details: error.message,
    });
  }
};

/**
 * POST /api/personas
 * Crear una nueva persona
 */
const createPersona = async (req, res) => {
  try {
    const {
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      foto,
      telefono,
      correo,
      rh,
      id_rol,
      nombre_rol,
      id_estado,
      nombre_estado,
    } = req.body;

    if (!tipo_documento || !numero_documento || !nombres || !apellidos) {
      return res.status(400).json({
        error: 'Los campos tipo_documento, numero_documento, nombres y apellidos son requeridos',
      });
    }

    const existingPersona = await Personas.findOne({
      where: { numero_documento },
    });

    if (existingPersona) {
      return res.status(409).json({
        error: 'Ya existe una persona con ese número de documento',
      });
    }

    let rolId = id_rol;
    if (!rolId && nombre_rol) {
      const rol = await Roles.findOne({ where: { nombre_rol } });
      if (!rol) {
        return res.status(404).json({
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

    const rolValido = await Roles.findByPk(rolId);
    if (!rolValido) {
      return res.status(404).json({
        error: 'El rol especificado no existe',
      });
    }

    const tipoEstadoEsperado = inferTipoEstadoDesdeRol(rolValido.nombre_rol);
    const estadoEsObligatorio = estadoEsObligatorioParaRol(rolValido.nombre_rol);

    let estadoId = id_estado ?? null;
    let estadoRegistro = null;
    const nombreEstadoNormalizado = nombre_estado ? nombre_estado.trim() : null;

    if (!estadoId && nombreEstadoNormalizado) {
      estadoRegistro = await Estados.findOne({
        where: {
          nombre_estado: nombreEstadoNormalizado,
          ...(tipoEstadoEsperado ? { tipo_aplica: tipoEstadoEsperado } : {}),
        },
      });

      if (!estadoRegistro) {
        return res.status(404).json({
          error: `El estado '${nombreEstadoNormalizado}' no existe para este rol`,
        });
      }
      estadoId = estadoRegistro.id_estado;
    }

    if (estadoId) {
      if (!estadoRegistro) {
        estadoRegistro = await Estados.findByPk(estadoId);
      }

      if (!estadoRegistro) {
        return res.status(404).json({
          error: 'El estado especificado no existe',
        });
      }

      if (tipoEstadoEsperado && estadoRegistro.tipo_aplica !== tipoEstadoEsperado) {
        return res.status(400).json({
          error: `El estado seleccionado no aplica para el rol '${rolValido.nombre_rol}'`,
        });
      }
    } else if (estadoEsObligatorio) {
      return res.status(400).json({
        error: 'Debe proporcionar un id_estado válido para este rol',
      });
    }

    const nuevaPersona = await Personas.create({
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      foto: foto || null,
      telefono: telefono || null,
      correo: correo || null,
      rh: rh || null,
      id_rol: rolId,
      id_estado: estadoId,
    });

    const personaCreada = await Personas.findByPk(nuevaPersona.id_persona, {
      include: [
        {
          model: Roles,
          as: 'rol',
          attributes: ['id_rol', 'nombre_rol'],
        },
        {
          model: Estados,
          as: 'estado',
          attributes: ['id_estado', 'nombre_estado', 'tipo_aplica'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Persona creada exitosamente',
      persona: buildPersonaResponse(personaCreada),
    });
  } catch (error) {
    console.error('Error en createPersona:', error);
    res.status(500).json({
      error: 'Error al crear persona',
      details: error.message,
    });
  }
};

/**
 * PUT /api/personas/:id
 * Actualizar una persona
 */
const updatePersona = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      foto,
      telefono,
      correo,
      rh,
      id_rol,
      nombre_rol,
      id_estado,
      nombre_estado,
    } = req.body;

    const persona = await Personas.findByPk(id);

    if (!persona) {
      return res.status(404).json({
        error: 'Persona no encontrada',
      });
    }

    if (numero_documento && numero_documento !== persona.numero_documento) {
      const existingPersona = await Personas.findOne({
        where: { numero_documento },
      });

      if (existingPersona) {
        return res.status(409).json({
          error: 'Ya existe otra persona con ese número de documento',
        });
      }
    }

    let nuevoRolId = persona.id_rol;
    if (id_rol !== undefined) {
      nuevoRolId = id_rol;
    } else if (nombre_rol) {
      const rol = await Roles.findOne({ where: { nombre_rol } });
      if (!rol) {
        return res.status(404).json({
          error: `El rol '${nombre_rol}' no existe`,
        });
      }
      nuevoRolId = rol.id_rol;
    }

    const rolValido = await Roles.findByPk(nuevoRolId);
    if (!rolValido) {
      return res.status(404).json({
        error: 'El rol especificado no existe',
      });
    }

    const estadoEsObligatorio = estadoEsObligatorioParaRol(rolValido.nombre_rol);
    const tipoEstadoEsperado = inferTipoEstadoDesdeRol(rolValido.nombre_rol);

    const estadoFueEnviado = Object.prototype.hasOwnProperty.call(req.body, 'id_estado');
    let estadoId = estadoFueEnviado ? id_estado : persona.id_estado;
    let estadoRegistro = null;
    const nombreEstadoNormalizado = nombre_estado ? nombre_estado.trim() : null;

    if (nombreEstadoNormalizado) {
      estadoRegistro = await Estados.findOne({
        where: {
          nombre_estado: nombreEstadoNormalizado,
          ...(tipoEstadoEsperado ? { tipo_aplica: tipoEstadoEsperado } : {}),
        },
      });

      if (!estadoRegistro) {
        return res.status(404).json({
          error: `El estado '${nombreEstadoNormalizado}' no existe para este rol`,
        });
      }
      estadoId = estadoRegistro.id_estado;
    }

    if (estadoId) {
      if (!estadoRegistro) {
        estadoRegistro = await Estados.findByPk(estadoId);
      }

      if (!estadoRegistro) {
        return res.status(404).json({
          error: 'El estado especificado no existe',
        });
      }

      if (tipoEstadoEsperado && estadoRegistro.tipo_aplica !== tipoEstadoEsperado) {
        return res.status(400).json({
          error: `El estado seleccionado no aplica para el rol '${rolValido.nombre_rol}'`,
        });
      }
    } else if (estadoEsObligatorio) {
      return res.status(400).json({
        error: 'Debe proporcionar un id_estado válido para este rol',
      });
    }

    await persona.update({
      tipo_documento: tipo_documento !== undefined ? tipo_documento : persona.tipo_documento,
      numero_documento: numero_documento !== undefined ? numero_documento : persona.numero_documento,
      nombres: nombres !== undefined ? nombres : persona.nombres,
      apellidos: apellidos !== undefined ? apellidos : persona.apellidos,
      foto: foto !== undefined ? foto : persona.foto,
      telefono: telefono !== undefined ? telefono : persona.telefono,
      correo: correo !== undefined ? correo : persona.correo,
      rh: rh !== undefined ? rh : persona.rh,
      id_rol: nuevoRolId,
      id_estado: estadoId,
    });

    const personaActualizada = await Personas.findByPk(id, {
      include: [
        {
          model: Roles,
          as: 'rol',
          attributes: ['id_rol', 'nombre_rol'],
        },
        {
          model: Estados,
          as: 'estado',
          attributes: ['id_estado', 'nombre_estado', 'tipo_aplica'],
        },
      ],
    });

    res.json({
      success: true,
      message: 'Persona actualizada exitosamente',
      persona: buildPersonaResponse(personaActualizada),
    });
  } catch (error) {
    console.error('Error en updatePersona:', error);
    res.status(500).json({
      error: 'Error al actualizar persona',
      details: error.message,
    });
  }
};

/**
 * DELETE /api/personas/:id
 * Eliminar una persona
 */
const deletePersona = async (req, res) => {
  try {
    const { id } = req.params;
    const { forzar } = req.query;

    const persona = await Personas.findByPk(id, {
      include: [
        { model: Roles, as: 'rol', attributes: ['nombre_rol'] }
      ]
    });

    if (!persona) {
      return res.status(404).json({
        error: 'Persona no encontrada',
      });
    }

    // Verificar si tiene fichas asignadas como instructor
    const fichasAsignadas = await Ficha.count({
      where: { id_instructor: id }
    });

    if (fichasAsignadas > 0) {
      if (forzar === 'true') {
        // Desasociar las fichas del instructor
        await Ficha.update(
          { id_instructor: null },
          { where: { id_instructor: id } }
        );
      } else {
        return res.status(409).json({
          error: `No se puede eliminar. Esta persona es instructor de ${fichasAsignadas} ficha(s).`,
          fichasAsignadas,
          requiereConfirmacion: true,
        });
      }
    }

    // Verificar si tiene registros de acceso
    const registrosAcceso = await Registro_Acceso.count({
      where: { id_persona: id }
    });

    if (registrosAcceso > 0) {
      if (forzar === 'true') {
        // Eliminar registros de acceso asociados
        await Registro_Acceso.destroy({
          where: { id_persona: id }
        });
      } else {
        return res.status(409).json({
          error: `No se puede eliminar. Esta persona tiene ${registrosAcceso} registro(s) de acceso.`,
          registrosAcceso,
          requiereConfirmacion: true,
        });
      }
    }

    await persona.destroy();

    res.json({
      success: true,
      message: 'Persona eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error en deletePersona:', error);
    
    // Si hay error por foreign key constraint
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({
        error: 'No se puede eliminar la persona porque tiene registros asociados',
        details: 'Use ?forzar=true para eliminar junto con sus registros asociados',
      });
    }

    res.status(500).json({
      error: 'Error al eliminar persona',
      details: error.message,
    });
  }
};

/**
 * GET /api/personas/documento/:numero
 * Buscar persona por número de documento
 */
const getPersonaByDocumento = async (req, res) => {
  try {
    const { numero } = req.params;

    const persona = await Personas.findOne({
      where: { numero_documento: numero },
      include: [
        {
          model: Roles,
          as: 'rol',
          attributes: ['id_rol', 'nombre_rol'],
        },
        {
          model: Estados,
          as: 'estado',
          attributes: ['id_estado', 'nombre_estado', 'tipo_aplica'],
        },
      ],
    });

    if (!persona) {
      return res.status(404).json({
        error: 'Persona no encontrada',
      });
    }

    res.json({
      success: true,
      persona: buildPersonaResponse(persona),
    });
  } catch (error) {
    console.error('Error en getPersonaByDocumento:', error);
    res.status(500).json({
      error: 'Error al buscar persona',
      details: error.message,
    });
  }
};

module.exports = {
  getAllPersonas,
  getPersonaById,
  createPersona,
  updatePersona,
  deletePersona,
  getPersonaByDocumento,
};

