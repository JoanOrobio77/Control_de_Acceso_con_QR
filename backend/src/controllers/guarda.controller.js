const { Personas, Areas, Registro_Acceso, Roles, Estados, Estudiante, Ficha } = require('../models');

/**
 * Obtener área por defecto
 */
const getDefaultArea = async () => {
  let area = await Areas.findOne({ where: { descripcion: 'Entrada Principal' } });
  if (!area) {
    area = await Areas.findOne({ where: { descripcion: 'General' } });
  }
  if (!area) {
    area = await Areas.findOne();
  }
  return area;
};

/**
 * Buscar persona en ambas tablas (Personas y Estudiantes)
 * Si el estudiante no existe en Personas, lo crea automáticamente
 */
const buscarEnTodasLasTablas = async (numero_documento) => {
  // Primero buscar en Personas
  let persona = await Personas.findOne({
    where: { numero_documento },
    include: [
      { model: Roles, as: 'rol', attributes: ['id_rol', 'nombre_rol'] },
      { model: Estados, as: 'estado', attributes: ['id_estado', 'nombre_estado'] },
    ],
  });

  if (persona) {
    return {
      tipo: 'persona',
      id_persona: persona.id_persona,
      nombres: persona.nombres,
      apellidos: persona.apellidos,
      nombre_completo: `${persona.nombres} ${persona.apellidos}`,
      numero_documento: persona.numero_documento,
      tipo_documento: persona.tipo_documento,
      telefono: persona.telefono,
      correo: persona.correo,
      foto: persona.foto,
      rol: persona.rol ? persona.rol.nombre_rol : 'Sin rol',
      estado: persona.estado ? persona.estado.nombre_estado : 'Sin estado',
    };
  }

  // Si no está en Personas, buscar en Estudiantes (Aprendices)
  const estudiante = await Estudiante.findOne({
    where: { numero_documento },
    include: [
      { model: Roles, as: 'rol', attributes: ['id_rol', 'nombre_rol'] },
      { model: Estados, as: 'estado', attributes: ['id_estado', 'nombre_estado'] },
      { model: Ficha, as: 'ficha', attributes: ['id_ficha', 'numero_ficha', 'programa_formacion'] },
    ],
  });

  if (estudiante) {
    // Crear entrada en Personas para que pueda registrar acceso
    // Buscar el rol "aprendiz"
    let rolAprendiz = await Roles.findOne({ where: { nombre_rol: 'aprendiz' } });
    if (!rolAprendiz) {
      rolAprendiz = await Roles.create({ nombre_rol: 'aprendiz' });
    }

    // Crear la persona
    persona = await Personas.create({
      tipo_documento: estudiante.tipo_documento,
      numero_documento: estudiante.numero_documento,
      nombres: estudiante.nombres,
      apellidos: estudiante.apellidos,
      telefono: estudiante.telefono,
      correo: estudiante.correo,
      rh: estudiante.rh,
      foto: estudiante.foto,
      id_rol: rolAprendiz.id_rol,
      id_estado: estudiante.id_estado,
    });

    return {
      tipo: 'estudiante',
      id_persona: persona.id_persona,
      id_estudiante: estudiante.id_estudiante,
      nombres: estudiante.nombres,
      apellidos: estudiante.apellidos,
      nombre_completo: `${estudiante.nombres} ${estudiante.apellidos}`,
      numero_documento: estudiante.numero_documento,
      tipo_documento: estudiante.tipo_documento,
      telefono: estudiante.telefono,
      correo: estudiante.correo,
      foto: estudiante.foto,
      rol: 'aprendiz',
      estado: estudiante.estado ? estudiante.estado.nombre_estado : 'Sin estado',
      ficha: estudiante.ficha ? {
        numero: estudiante.ficha.numero_ficha,
        programa: estudiante.ficha.programa_formacion,
      } : null,
    };
  }

  return null;
};

/**
 * POST /api/guarda/buscar-persona
 * Buscar persona por número de documento (sin registrar acceso)
 */
exports.buscarPersona = async (req, res) => {
  try {
    const { numero_documento } = req.body;

    if (!numero_documento) {
      return res.status(400).json({ error: 'El número de documento es obligatorio.' });
    }

    const persona = await buscarEnTodasLasTablas(numero_documento);

    if (!persona) {
      return res.status(404).json({ 
        error: 'Persona no encontrada.',
        encontrada: false,
      });
    }

    res.json({
      success: true,
      encontrada: true,
      persona,
    });
  } catch (error) {
    console.error('Error buscar persona:', error);
    res.status(500).json({ error: 'Error interno al buscar persona.' });
  }
};

/**
 * POST /api/guarda/registro-automatico
 * Registrar entrada o salida automáticamente según el último registro
 * Si el último fue ENTRADA, registra SALIDA y viceversa
 */
exports.registroAutomatico = async (req, res) => {
  try {
    const { numero_documento, id_area } = req.body;

    if (!numero_documento) {
      return res.status(400).json({ error: 'El número de documento es obligatorio.' });
    }

    // Buscar persona en todas las tablas (Personas y Estudiantes)
    const persona = await buscarEnTodasLasTablas(numero_documento);

    if (!persona) {
      return res.status(404).json({ error: 'Persona no encontrada.' });
    }

    // Obtener el último registro de esta persona
    const ultimoRegistro = await Registro_Acceso.findOne({
      where: { id_persona: persona.id_persona },
      order: [['id_registro', 'DESC']],
    });

    // Determinar el tipo de acceso: si el último fue ENTRADA, ahora es SALIDA y viceversa
    let tipoAcceso = 'ENTRADA';
    if (ultimoRegistro && ultimoRegistro.tipo_acceso === 'ENTRADA') {
      tipoAcceso = 'SALIDA';
    }

    // Obtener área
    let area;
    if (id_area) {
      area = await Areas.findByPk(id_area);
    }
    if (!area) {
      area = await getDefaultArea();
    }
    if (!area) {
      return res.status(500).json({ error: 'No hay áreas configuradas en el sistema.' });
    }

    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0];

    const registro = await Registro_Acceso.create({
      id_persona: persona.id_persona,
      id_area: area.id_area,
      tipo_acceso: tipoAcceso,
      fecha: fecha,
      hora_entrada: tipoAcceso === 'ENTRADA' ? hora : null,
      hora_salida: tipoAcceso === 'SALIDA' ? hora : null,
    });

    res.json({
      success: true,
      message: `${tipoAcceso === 'ENTRADA' ? 'Entrada' : 'Salida'} registrada correctamente.`,
      tipo_acceso: tipoAcceso,
      registro: {
        id_registro: registro.id_registro,
        fecha: registro.fecha,
        hora_entrada: registro.hora_entrada,
        hora_salida: registro.hora_salida,
        tipo_acceso: registro.tipo_acceso,
      },
      persona: {
        id_persona: persona.id_persona,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        nombre_completo: persona.nombre_completo,
        numero_documento: persona.numero_documento,
        tipo_documento: persona.tipo_documento,
        rol: persona.rol,
        estado: persona.estado,
        ficha: persona.ficha || null,
      },
      area: {
        id_area: area.id_area,
        descripcion: area.descripcion,
      },
    });
  } catch (error) {
    console.error('Error registro automático:', error);
    res.status(500).json({ error: 'Error interno al registrar acceso.' });
  }
};

/**
 * POST /api/guarda/ingreso-manual
 * Registrar acceso por ingreso manual (solo cédula)
 * Busca en Personas y Estudiantes (crea en Personas si es estudiante)
 */
exports.ingresoManual = async (req, res) => {
  try {
    const { numero_documento, id_area, tipo_acceso } = req.body;

    if (!numero_documento) {
      return res.status(400).json({ error: 'El número de documento es obligatorio.' });
    }

    // Buscar persona en todas las tablas (Personas y Estudiantes)
    const persona = await buscarEnTodasLasTablas(numero_documento);

    if (!persona) {
      return res.status(404).json({ error: 'Persona no encontrada.' });
    }

    // Obtener área (usar la proporcionada o la por defecto)
    let area;
    if (id_area) {
      area = await Areas.findByPk(id_area);
    }
    if (!area) {
      area = await getDefaultArea();
    }
    if (!area) {
      return res.status(500).json({ error: 'No hay áreas configuradas en el sistema.' });
    }

    const tipoAccesoNormalizado = (tipo_acceso || 'ENTRADA').toUpperCase();
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0];

    const registro = await Registro_Acceso.create({
      id_persona: persona.id_persona,
      id_area: area.id_area,
      tipo_acceso: tipoAccesoNormalizado,
      fecha: fecha,
      hora_entrada: tipoAccesoNormalizado === 'ENTRADA' ? hora : null,
      hora_salida: tipoAccesoNormalizado === 'SALIDA' ? hora : null,
    });

    res.json({
      success: true,
      message: `${tipoAccesoNormalizado === 'ENTRADA' ? 'Entrada' : 'Salida'} registrada correctamente.`,
      registro: {
        id_registro: registro.id_registro,
        fecha: registro.fecha,
        hora_entrada: registro.hora_entrada,
        hora_salida: registro.hora_salida,
        tipo_acceso: registro.tipo_acceso,
      },
      persona: {
        id_persona: persona.id_persona,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        nombre_completo: persona.nombre_completo,
        numero_documento: persona.numero_documento,
        tipo_documento: persona.tipo_documento,
        rol: persona.rol,
        estado: persona.estado,
        ficha: persona.ficha || null,
      },
      area: {
        id_area: area.id_area,
        descripcion: area.descripcion,
      },
    });
  } catch (error) {
    console.error('Error ingreso manual:', error);
    res.status(500).json({ error: 'Error interno al registrar acceso.' });
  }
};



/**
 * POST /api/guarda/ingreso-qr
 * Registrar acceso desde QR (persona ya viene identificada)
 * Busca en Personas y Estudiantes (crea en Personas si es estudiante)
 */
exports.ingresoQR = async (req, res) => {
  try {
    const { id_persona, numero_documento, id_area, tipo_acceso } = req.body;

    if (!id_persona && !numero_documento) {
      return res.status(400).json({ error: 'Debe proporcionar id_persona o numero_documento.' });
    }

    // Buscar persona en todas las tablas
    let persona = null;
    if (id_persona) {
      // Si viene id_persona, buscar directamente
      const personaDB = await Personas.findByPk(id_persona, {
        include: [
          { model: Roles, as: 'rol', attributes: ['id_rol', 'nombre_rol'] },
          { model: Estados, as: 'estado', attributes: ['id_estado', 'nombre_estado'] },
        ],
      });
      if (personaDB) {
        persona = {
          tipo: 'persona',
          id_persona: personaDB.id_persona,
          nombres: personaDB.nombres,
          apellidos: personaDB.apellidos,
          nombre_completo: `${personaDB.nombres} ${personaDB.apellidos}`,
          numero_documento: personaDB.numero_documento,
          tipo_documento: personaDB.tipo_documento,
          rol: personaDB.rol ? personaDB.rol.nombre_rol : 'Sin rol',
          estado: personaDB.estado ? personaDB.estado.nombre_estado : 'Sin estado',
        };
      }
    } else if (numero_documento) {
      // Si viene numero_documento, buscar en todas las tablas (incluyendo Estudiantes)
      persona = await buscarEnTodasLasTablas(numero_documento);
    }

    if (!persona) {
      return res.status(404).json({ error: 'Persona no encontrada.' });
    }

    // Obtener área (usar la proporcionada o la por defecto)
    let area;
    if (id_area) {
      area = await Areas.findByPk(id_area);
    }
    if (!area) {
      area = await getDefaultArea();
    }
    if (!area) {
      return res.status(500).json({ error: 'No hay áreas configuradas en el sistema.' });
    }

    const tipoAccesoNormalizado = (tipo_acceso || 'ENTRADA').toUpperCase();
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0];

    const registro = await Registro_Acceso.create({
      id_persona: persona.id_persona,
      id_area: area.id_area,
      tipo_acceso: tipoAccesoNormalizado,
      fecha: fecha,
      hora_entrada: tipoAccesoNormalizado === 'ENTRADA' ? hora : null,
      hora_salida: tipoAccesoNormalizado === 'SALIDA' ? hora : null,
    });

    res.json({
      success: true,
      message: `${tipoAccesoNormalizado === 'ENTRADA' ? 'Entrada' : 'Salida'} registrada correctamente.`,
      registro: {
        id_registro: registro.id_registro,
        fecha: registro.fecha,
        hora_entrada: registro.hora_entrada,
        hora_salida: registro.hora_salida,
        tipo_acceso: registro.tipo_acceso,
      },
      persona: {
        id_persona: persona.id_persona,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        nombre_completo: persona.nombre_completo,
        numero_documento: persona.numero_documento,
        tipo_documento: persona.tipo_documento,
        rol: persona.rol,
        estado: persona.estado,
        ficha: persona.ficha || null,
      },
      area: {
        id_area: area.id_area,
        descripcion: area.descripcion,
      },
    });
  } catch (error) {
    console.error('Error ingreso QR:', error);
    res.status(500).json({ error: 'Error interno al registrar acceso.' });
  }
};

/**
 * POST /api/guarda/registrar-visitante
 * Registrar un nuevo visitante y opcionalmente registrar su entrada
 */
exports.registrarVisitante = async (req, res) => {
  try {
    const {
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      telefono,
      correo,
      registrar_entrada = true,
      id_area,
    } = req.body;

    if (!tipo_documento || !numero_documento || !nombres || !apellidos) {
      return res.status(400).json({
        error: 'Los campos tipo_documento, numero_documento, nombres y apellidos son obligatorios.',
      });
    }

    // Verificar si ya existe
    const existente = await Personas.findOne({ where: { numero_documento } });
    if (existente) {
      return res.status(409).json({
        error: 'Ya existe una persona con ese número de documento.',
        persona_existente: {
          id_persona: existente.id_persona,
          nombres: existente.nombres,
          apellidos: existente.apellidos,
        },
      });
    }

    // Buscar rol visitante
    const rolVisitante = await Roles.findOne({ where: { nombre_rol: 'visitante' } });
    if (!rolVisitante) {
      return res.status(500).json({ error: 'El rol "visitante" no está configurado en el sistema.' });
    }

    // Crear la persona
    const nuevaPersona = await Personas.create({
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      telefono: telefono || null,
      correo: correo || null,
      id_rol: rolVisitante.id_rol,
      id_estado: null,
    });

    let registro = null;
    let area = null;

    // Si se solicita registrar entrada automáticamente
    if (registrar_entrada) {
      if (id_area) {
        area = await Areas.findByPk(id_area);
      }
      if (!area) {
        area = await getDefaultArea();
      }

      if (area) {
        const ahora = new Date();
        const fecha = ahora.toISOString().split('T')[0];
        const hora = ahora.toTimeString().split(' ')[0];

        registro = await Registro_Acceso.create({
          id_persona: nuevaPersona.id_persona,
          id_area: area.id_area,
          tipo_acceso: 'ENTRADA',
          fecha: fecha,
          hora_entrada: hora,
          hora_salida: null,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Visitante registrado correctamente.',
      persona: {
        id_persona: nuevaPersona.id_persona,
        nombres: nuevaPersona.nombres,
        apellidos: nuevaPersona.apellidos,
        nombre_completo: `${nuevaPersona.nombres} ${nuevaPersona.apellidos}`,
        numero_documento: nuevaPersona.numero_documento,
        tipo_documento: nuevaPersona.tipo_documento,
        telefono: nuevaPersona.telefono,
        correo: nuevaPersona.correo,
        rol: 'visitante',
      },
      registro: registro ? {
        id_registro: registro.id_registro,
        fecha: registro.fecha,
        hora_entrada: registro.hora_entrada,
        tipo_acceso: registro.tipo_acceso,
      } : null,
      area: area ? {
        id_area: area.id_area,
        descripcion: area.descripcion,
      } : null,
    });
  } catch (error) {
    console.error('Error registrar visitante:', error);
    res.status(500).json({ error: 'Error interno al registrar visitante.' });
  }
};

/**
 * GET /api/guarda/areas
 * Obtener lista de áreas disponibles
 */
exports.getAreas = async (req, res) => {
  try {
    const areas = await Areas.findAll({
      attributes: ['id_area', 'descripcion'],
      order: [['descripcion', 'ASC']],
    });

    res.json({
      success: true,
      areas,
    });
  } catch (error) {
    console.error('Error obtener áreas:', error);
    res.status(500).json({ error: 'Error interno al obtener áreas.' });
  }
};

/**
 * GET /api/guarda/registros-hoy
 * Obtener registros de acceso del día actual
 */
exports.getRegistrosHoy = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    const registros = await Registro_Acceso.findAll({
      where: { fecha: hoy },
      include: [
        {
          model: Personas,
          as: 'persona',
          attributes: ['id_persona', 'nombres', 'apellidos', 'numero_documento', 'tipo_documento'],
          include: [
            { model: Roles, as: 'rol', attributes: ['nombre_rol'] },
          ],
        },
        {
          model: Areas,
          as: 'area',
          attributes: ['id_area', 'descripcion'],
        },
      ],
      order: [['hora_entrada', 'DESC'], ['hora_salida', 'DESC']],
      limit: 50,
    });

    res.json({
      success: true,
      fecha: hoy,
      total: registros.length,
      registros: registros.map((reg) => ({
        id_registro: reg.id_registro,
        fecha: reg.fecha,
        hora_entrada: reg.hora_entrada,
        hora_salida: reg.hora_salida,
        tipo_acceso: reg.tipo_acceso,
        persona: reg.persona ? {
          id_persona: reg.persona.id_persona,
          nombre_completo: `${reg.persona.nombres} ${reg.persona.apellidos}`,
          numero_documento: reg.persona.numero_documento,
          tipo_documento: reg.persona.tipo_documento,
          rol: reg.persona.rol ? reg.persona.rol.nombre_rol : 'Sin rol',
        } : null,
        area: reg.area ? reg.area.descripcion : null,
      })),
    });
  } catch (error) {
    console.error('Error obtener registros hoy:', error);
    res.status(500).json({ error: 'Error interno al obtener registros.' });
  }
};

