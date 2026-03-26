const { Estudiante, Roles, Ficha, Estados } = require('../models');

const estadoInclude = {
  model: Estados,
  as: 'estado',
  attributes: ['id_estado', 'nombre_estado', 'tipo_aplica'],
};

const ensureEstadoAprendiz = async ({ idEstado, nombreEstado }) => {
  const nombreNormalizado = nombreEstado ? nombreEstado.toString().trim() : null;

  if (!idEstado && !nombreNormalizado) {
    throw new Error('Debe proporcionar id_estado o nombre_estado para el aprendiz');
  }

  let estado = null;

  if (idEstado) {
    estado = await Estados.findByPk(idEstado);
  } else if (nombreNormalizado) {
    estado = await Estados.findOne({
      where: {
        nombre_estado: nombreNormalizado,
        tipo_aplica: 'aprendiz',
      },
    });
  }

  if (!estado) {
    throw new Error('El estado proporcionado para el aprendiz no existe');
  }

  if (estado.tipo_aplica !== 'aprendiz') {
    throw new Error('El estado seleccionado no aplica para aprendices');
  }

  return estado;
};

const crearEstudiante = async (req, res) => {
  try {
    const {
      tipo_documento = 'CC',
      numero_documento,
      nombres,
      apellidos,
      telefono,
      correo,
      rh,
      foto,
      id_ficha,
      id_rol,
      nombre_rol,
      id_estado,
      nombre_estado,
    } = req.body;

    if (!numero_documento || !nombres || !apellidos) {
      return res.status(400).json({ error: 'numero_documento, nombres y apellidos son requeridos' });
    }

    if (!id_ficha) {
      return res.status(400).json({ error: 'id_ficha es requerido' });
    }

    const ficha = await Ficha.findByPk(id_ficha);
    if (!ficha) {
      return res.status(404).json({ error: 'La ficha especificada no existe' });
    }

    let rolId = id_rol;
    if (!rolId && nombre_rol) {
      const rol = await Roles.findOne({ where: { nombre_rol } });
      if (!rol) {
        return res.status(404).json({ error: `El rol '${nombre_rol}' no existe` });
      }
      rolId = rol.id_rol;
    }

    if (!rolId) {
      const rolAprendiz = await Roles.findOne({ where: { nombre_rol: 'aprendiz' } });
      if (!rolAprendiz) {
        return res.status(400).json({ error: "El rol 'aprendiz' no existe. Debes crearlo primero." });
      }
      rolId = rolAprendiz.id_rol;
    }

    let estado;
    try {
      estado = await ensureEstadoAprendiz({ idEstado: id_estado, nombreEstado: nombre_estado });
    } catch (estadoError) {
      return res.status(400).json({ error: estadoError.message });
    }

    const nuevo = await Estudiante.create({
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      telefono: telefono || null,
      correo: correo || null,
      rh: rh || null,
      foto: foto || null,
      id_ficha,
      id_rol: rolId,
      id_estado: estado.id_estado,
    });

    const creado = await Estudiante.findByPk(nuevo.id_estudiante, {
      include: [
        {
          model: Ficha,
          as: 'ficha',
          attributes: ['id_ficha', 'numero_ficha', 'programa_formacion'],
        },
        {
          model: Roles,
          as: 'rol',
          attributes: ['id_rol', 'nombre_rol'],
        },
        estadoInclude,
      ],
    });

    res.status(201).json({ message: 'Estudiante creado', data: creado });
  } catch (error) {
    res.status(500).json({ error: 'Error creando estudiante', details: error.message });
  }
};

const obtenerEstudiantes = async (req, res) => {
  try {
    const list = await Estudiante.findAll({
      include: [
        {
          model: Ficha,
          as: 'ficha',
          attributes: ['id_ficha', 'numero_ficha', 'programa_formacion'],
        },
        {
          model: Roles,
          as: 'rol',
          attributes: ['id_rol', 'nombre_rol'],
        },
        estadoInclude,
      ],
      order: [['nombres', 'ASC'], ['apellidos', 'ASC']],
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estudiantes', details: error.message });
  }
};

const obtenerEstudiantePorId = async (req, res) => {
  try {
    const est = await Estudiante.findByPk(req.params.id, {
      include: [
        { model: Ficha, as: 'ficha', attributes: ['id_ficha', 'numero_ficha', 'programa_formacion'] },
        { model: Roles, as: 'rol', attributes: ['id_rol', 'nombre_rol'] },
        estadoInclude,
      ],
    });
    
    if (!est) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    res.json(est);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estudiante', details: error.message });
  }
};

const actualizarEstudiante = async (req, res) => {
  try {
    const est = await Estudiante.findByPk(req.params.id);

    if (!est) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const {
      id_ficha,
      id_rol,
      nombre_rol,
      numero_documento,
      id_estado,
      nombre_estado,
    } = req.body;

    if (numero_documento && numero_documento !== est.numero_documento) {
      const existe = await Estudiante.findOne({ where: { numero_documento } });
      if (existe) {
        return res.status(409).json({ error: 'Ya existe un aprendiz con ese número de documento' });
      }
    }

    if (id_ficha !== undefined) {
      const ficha = await Ficha.findByPk(id_ficha);
      if (!ficha) {
        return res.status(404).json({ error: 'La ficha especificada no existe' });
      }
    }

    let rolId = est.id_rol;
    if (id_rol !== undefined) {
      rolId = id_rol;
    } else if (nombre_rol) {
      const rol = await Roles.findOne({ where: { nombre_rol } });
      if (!rol) {
        return res.status(404).json({ error: `El rol '${nombre_rol}' no existe` });
      }
      rolId = rol.id_rol;
    }

    if (rolId) {
      const rolValido = await Roles.findByPk(rolId);
      if (!rolValido) {
        return res.status(404).json({ error: 'El rol especificado no existe' });
      }
    }

    const estadoFueEnviado = Object.prototype.hasOwnProperty.call(req.body, 'id_estado') || !!nombre_estado;
    let estadoId = est.id_estado;

    if (estadoFueEnviado) {
      try {
        const estado = await ensureEstadoAprendiz({
          idEstado: Object.prototype.hasOwnProperty.call(req.body, 'id_estado') ? id_estado : undefined,
          nombreEstado: nombre_estado,
        });
        estadoId = estado.id_estado;
      } catch (estadoError) {
        return res.status(400).json({ error: estadoError.message });
      }
    }

    if (!estadoId) {
      return res.status(400).json({ error: 'Debe proporcionar un estado válido para el aprendiz' });
    }

    await est.update({
      tipo_documento: Object.prototype.hasOwnProperty.call(req.body, 'tipo_documento')
        ? req.body.tipo_documento
        : est.tipo_documento,
      numero_documento: numero_documento !== undefined ? numero_documento : est.numero_documento,
      nombres: Object.prototype.hasOwnProperty.call(req.body, 'nombres') ? req.body.nombres : est.nombres,
      apellidos: Object.prototype.hasOwnProperty.call(req.body, 'apellidos') ? req.body.apellidos : est.apellidos,
      telefono: Object.prototype.hasOwnProperty.call(req.body, 'telefono') ? req.body.telefono : est.telefono,
      correo: Object.prototype.hasOwnProperty.call(req.body, 'correo') ? req.body.correo : est.correo,
      rh: Object.prototype.hasOwnProperty.call(req.body, 'rh') ? req.body.rh : est.rh,
      foto: Object.prototype.hasOwnProperty.call(req.body, 'foto') ? req.body.foto : est.foto,
      id_ficha: id_ficha !== undefined ? id_ficha : est.id_ficha,
      id_rol: rolId,
      id_estado: estadoId,
    });

    const actualizado = await Estudiante.findByPk(est.id_estudiante, {
      include: [
        { model: Ficha, as: 'ficha', attributes: ['id_ficha', 'numero_ficha', 'programa_formacion'] },
        { model: Roles, as: 'rol', attributes: ['id_rol', 'nombre_rol'] },
        estadoInclude,
      ],
    });

    res.json({ message: 'Estudiante actualizado', data: actualizado });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando estudiante', details: error.message });
  }
};

const eliminarEstudiante = async (req, res) => {
  try {
    const est = await Estudiante.findByPk(req.params.id);
    
    if (!est) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    await est.destroy();
    res.json({ message: 'Estudiante eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando estudiante', details: error.message });
  }
};

module.exports = {
  crearEstudiante,
  obtenerEstudiantes,
  obtenerEstudiantePorId,
  actualizarEstudiante,
  eliminarEstudiante,
};

