const { Usuarios, Roles, Ficha, Areas, Registro_Acceso, Personas, Estudiante, sequelize, Estados } = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const XLSX = require('xlsx');

// Configuración de multer para archivos Excel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
    }
  }
});

const resolveEstadoPorTipo = async (tipo_aplica, { id_estado, nombre_estado }) => {
  if (!id_estado && !nombre_estado) {
    throw new Error(`Debe proporcionar id_estado o nombre_estado para el tipo ${tipo_aplica}`);
  }

  let estado = null;

  if (id_estado) {
    estado = await Estados.findByPk(id_estado);
  } else if (nombre_estado) {
    estado = await Estados.findOne({
      where: {
        nombre_estado,
        tipo_aplica,
      },
    });
  }

  if (!estado) {
    throw new Error('El estado especificado no existe o no aplica para este tipo');
  }

  if (estado.tipo_aplica !== tipo_aplica) {
    throw new Error('El estado seleccionado no corresponde al tipo solicitado');
  }

  return estado;
};

// Obtener actividad reciente (últimos 20 registros de acceso)
exports.getActividadReciente = async (req, res) => {
  try {
    const { documento } = req.query;
    
    // Construir opciones de búsqueda
    const includeOptions = [
      { 
        model: Personas, 
        as: 'persona', 
        attributes: ['id_persona', 'nombres', 'apellidos', 'numero_documento'],
        include: [
          { model: Roles, as: 'rol', attributes: ['nombre_rol'] }
        ],
        // Si hay documento, filtrar por él
        ...(documento ? {
          where: {
            numero_documento: {
              [Op.like]: `%${documento}%`
            }
          }
        } : {})
      },
      { 
        model: Areas, 
        as: 'area', 
        attributes: ['descripcion'] 
      }
    ];

    const registros = await Registro_Acceso.findAll({
      limit: documento ? 50 : 20, // Más resultados si está buscando
      order: [['id_registro', 'DESC']],
      include: includeOptions,
    });
    
    // Filtrar los que no tienen persona (cuando se busca por documento)
    const registrosFiltrados = documento 
      ? registros.filter(r => r.persona !== null)
      : registros;

    const actividadFormateada = registrosFiltrados.map(registro => {
      const nombreCompleto = registro.persona 
        ? `${registro.persona.nombres} ${registro.persona.apellidos}` 
        : 'Desconocido';
      
      const hora = registro.tipo_acceso === 'ENTRADA' 
        ? registro.hora_entrada 
        : registro.hora_salida;

      // Formatear fecha
      const fechaObj = new Date(registro.fecha);
      const fechaFormateada = fechaObj.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      return {
        id: registro.id_registro,
        nombre: nombreCompleto,
        tipo_acceso: registro.tipo_acceso,
        fecha: fechaFormateada,
        hora: hora || 'N/A',
        rol: registro.persona?.rol?.nombre_rol || 'Sin rol',
        area: registro.area?.descripcion || 'Sin área',
      };
    });

    res.json({ registros: actividadFormateada });
  } catch (error) {
    console.error('Error obteniendo actividad reciente:', error);
    res.status(500).json({ error: error.message });
  }
};

// 1. getDashboardData
exports.getDashboardData = async (req, res) => {
  try {
    // Obtener IDs de roles
    const rolInstructor = await Roles.findOne({ where: { nombre_rol: 'instructor' } });
    const rolFuncionario = await Roles.findOne({ where: { nombre_rol: 'funcionario' } });
    const rolVisitante = await Roles.findOne({ where: { nombre_rol: 'visitante' } });

    // Cantidades basadas en la nueva estructura
    const totalAprendices = await Estudiante.count();

    const totalInstructores = rolInstructor
      ? await Personas.count({ where: { id_rol: rolInstructor.id_rol } })
      : 0;

    const totalFuncionarios = rolFuncionario
      ? await Personas.count({ where: { id_rol: rolFuncionario.id_rol } })
      : 0;

    const totalVisitantes = rolVisitante
      ? await Personas.count({ where: { id_rol: rolVisitante.id_rol } })
      : 0;

    // Contar otras entidades
    const totalFichas = await Ficha.count();
    const totalAreas = await Areas.count();
    const totalRegistros = await Registro_Acceso.count();

    res.json({
      totalAprendices,
      totalInstructores,
      totalFuncionarios,
      totalVisitantes,
      totalFichas,
      totalAreas,
      totalRegistros
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. crearInstructor
exports.crearInstructor = async (req, res) => {
  try {
    const {
      tipo_documento = 'CC',
      numero_documento,
      identificacion,
      nombres,
      apellidos,
      nombre,
      apellido,
      telefono,
      correo,
      rh,
      foto,
      id_estado,
      nombre_estado,
    } = req.body;

    const rolInstructor = await Roles.findOne({ where: { nombre_rol: 'instructor' } });

    if (!rolInstructor) {
      return res.status(400).json({ message: "El rol 'instructor' no existe. Debes crearlo primero." });
    }

    const documento = numero_documento || identificacion;
    const nombresPersona = nombres || nombre;
    const apellidosPersona = apellidos || apellido;

    if (!documento || !nombresPersona || !apellidosPersona) {
      return res.status(400).json({ message: 'numero_documento, nombres y apellidos son requeridos' });
    }

    const existePersona = await Personas.findOne({ where: { numero_documento: documento } });
    if (existePersona) {
      return res.status(400).json({ message: 'Ya existe una persona con esta identificación' });
    }

    let estadoInstructor;
    try {
      estadoInstructor = await resolveEstadoPorTipo('instructor', { id_estado, nombre_estado });
    } catch (estadoError) {
      return res.status(400).json({ message: estadoError.message });
    }

    const nuevoInstructor = await Personas.create({
      tipo_documento,
      numero_documento: documento,
      nombres: nombresPersona,
      apellidos: apellidosPersona,
      telefono: telefono || null,
      correo: correo || null,
      rh: rh || null,
      foto: foto || null,
      id_rol: rolInstructor.id_rol,
      id_estado: estadoInstructor.id_estado,
    });

    res.status(201).json(nuevoInstructor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. crearFuncionario
exports.crearFuncionario = async (req, res) => {
  try {
    const {
      tipo_documento = 'CC',
      numero_documento,
      identificacion,
      nombres,
      apellidos,
      nombre,
      apellido,
      telefono,
      correo,
      rh,
      foto,
      id_estado,
      nombre_estado,
    } = req.body;

    const rolFuncionario = await Roles.findOne({ where: { nombre_rol: 'funcionario' } });
    
    if (!rolFuncionario) {
      return res.status(400).json({ message: "El rol 'funcionario' no existe. Debes crearlo primero." });
    }

    const documento = numero_documento || identificacion;
    const nombresPersona = nombres || nombre;
    const apellidosPersona = apellidos || apellido;

    if (!documento || !nombresPersona || !apellidosPersona) {
      return res.status(400).json({ message: 'numero_documento, nombres y apellidos son requeridos' });
    }

    const existePersona = await Personas.findOne({ where: { numero_documento: documento } });
    if (existePersona) {
      return res.status(400).json({ message: 'Ya existe una persona con esta identificación' });
    }

    let estadoFuncionario;
    try {
      estadoFuncionario = await resolveEstadoPorTipo('funcionario', { id_estado, nombre_estado });
    } catch (estadoError) {
      return res.status(400).json({ message: estadoError.message });
    }

    const nuevoFuncionario = await Personas.create({
      tipo_documento,
      numero_documento: documento,
      nombres: nombresPersona,
      apellidos: apellidosPersona,
      telefono: telefono || null,
      correo: correo || null,
      rh: rh || null,
      foto: foto || null,
      id_rol: rolFuncionario.id_rol,
      id_estado: estadoFuncionario.id_estado,
    });

    res.status(201).json(nuevoFuncionario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. crearFicha
exports.crearFicha = async (req, res) => {
  try {
    const { numero_ficha, programa_formacion, fecha_inicio, fecha_fin, ambiente, jornada, id_instructor } = req.body;

    // Validar que no exista numero_ficha repetido
    const fichaExistente = await Ficha.findOne({ where: { numero_ficha } });
    if (fichaExistente) {
      return res.status(400).json({ message: 'Ya existe una ficha con este número' });
    }

    // Validar que el instructor exista si se proporciona
    if (id_instructor) {
      const instructor = await Personas.findByPk(id_instructor);
      if (!instructor) {
        return res.status(404).json({ message: 'El instructor especificado no existe' });
      }
    }

    const nuevaFicha = await Ficha.create({
      numero_ficha,
      programa_formacion: programa_formacion || null,
      fecha_inicio,
      fecha_fin,
      ambiente: ambiente || null,
      jornada: jornada || null,
      id_instructor: id_instructor || null
    });

    // Obtener la ficha creada con el instructor
    const fichaCreada = await Ficha.findByPk(nuevaFicha.id_ficha, {
      include: [
        {
          model: Personas,
          as: 'instructor',
          attributes: ['id_persona', 'nombres', 'apellidos', 'numero_documento', 'correo'],
        },
      ],
    });

    res.status(201).json(fichaCreada);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. editarFicha
exports.editarFicha = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero_ficha, programa_formacion, fecha_inicio, fecha_fin, ambiente, jornada } = req.body;

    const ficha = await Ficha.findByPk(id);
    if (!ficha) {
      return res.status(404).json({ message: 'Ficha no encontrada' });
    }

    // Si se cambia el número de ficha, validar que no exista
    if (numero_ficha && numero_ficha !== ficha.numero_ficha) {
      const fichaExistente = await Ficha.findOne({ 
        where: { 
          numero_ficha,
          id_ficha: { [Op.ne]: id }
        } 
      });
      if (fichaExistente) {
        return res.status(400).json({ message: 'Ya existe una ficha con este número' });
      }
    }

    await ficha.update({
      numero_ficha: numero_ficha !== undefined ? numero_ficha : ficha.numero_ficha,
      programa_formacion: programa_formacion !== undefined ? programa_formacion : ficha.programa_formacion,
      fecha_inicio: fecha_inicio !== undefined ? fecha_inicio : ficha.fecha_inicio,
      fecha_fin: fecha_fin !== undefined ? fecha_fin : ficha.fecha_fin,
      ambiente: ambiente !== undefined ? ambiente : ficha.ambiente,
      jornada: jornada !== undefined ? jornada : ficha.jornada
    });

    res.json({ message: 'Ficha actualizada', ficha });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 6. eliminarFicha
exports.eliminarFicha = async (req, res) => {
  try {
    const { id } = req.params;
    const { forzar } = req.query; // ?forzar=true para eliminar con aprendices

    const ficha = await Ficha.findByPk(id);
    if (!ficha) {
      return res.status(404).json({ message: 'Ficha no encontrada' });
    }

    // Verificar si tiene estudiantes asociados
    const estudiantesAsociados = await Estudiante.count({
      where: { id_ficha: id }
    });

    if (estudiantesAsociados > 0) {
      if (forzar === 'true') {
        // Eliminar aprendices asociados primero
        await Estudiante.destroy({ where: { id_ficha: id } });
      } else {
        return res.status(400).json({ 
          message: `La ficha tiene ${estudiantesAsociados} aprendice(s) asociado(s). ¿Desea eliminarlos también?`,
          estudiantesAsociados,
          requiereConfirmacion: true
        });
      }
    }

    await ficha.destroy();
    res.json({ 
      message: estudiantesAsociados > 0 
        ? `Ficha y ${estudiantesAsociados} aprendice(s) eliminados correctamente`
        : 'Ficha eliminada correctamente'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 7. listarUsuariosPorRol
exports.listarUsuariosPorRol = async (req, res) => {
  try {
    const { rol } = req.query;

    if (!rol) {
      return res.status(400).json({ message: 'El parámetro "rol" es requerido' });
    }

    // Buscar el rol por nombre
    const rolEncontrado = await Roles.findOne({ where: { nombre_rol: rol } });
    if (!rolEncontrado) {
      return res.status(404).json({ message: `Rol '${rol}' no encontrado` });
    }

    const usuarios = await Usuarios.findAll({
      where: { id_rol: rolEncontrado.id_rol },
      include: [
        { model: Roles, as: 'rol' },
        { model: Ficha, as: 'ficha' }
      ]
    });

    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 8. importarDatosMasivos (solo estructura)
exports.importarDatosMasivos = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    // Leer archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'El archivo Excel está vacío' });
    }

    // Validar estructura esperada (ejemplo: nombre, identificacion, telefono, correo, etc.)
    const camposEsperados = ['nombre', 'identificacion', 'telefono', 'correo'];
    const primeraFila = data[0];
    const camposFaltantes = camposEsperados.filter(campo => !(campo in primeraFila));

    if (camposFaltantes.length > 0) {
      return res.status(400).json({ 
        message: `Campos faltantes en el archivo: ${camposFaltantes.join(', ')}` 
      });
    }

    // Validar filas
    const datosValidados = [];
    const errores = [];

    for (let i = 0; i < data.length; i++) {
      const fila = data[i];
      const numeroFila = i + 2; // +2 porque la fila 1 es el encabezado y empezamos desde 0

      // Validaciones básicas
      if (!fila.nombre || !fila.identificacion) {
        errores.push({
          fila: numeroFila,
          error: 'Nombre e identificación son obligatorios'
        });
        continue;
      }

      // Validar formato de identificación (solo números y letras)
      if (!/^[A-Za-z0-9]+$/.test(fila.identificacion)) {
        errores.push({
          fila: numeroFila,
          error: 'Identificación con formato inválido'
        });
        continue;
      }

      datosValidados.push({
        nombre: fila.nombre.trim(),
        identificacion: fila.identificacion.trim(),
        telefono: fila.telefono ? fila.telefono.toString().trim() : null,
        correo: fila.correo ? fila.correo.toString().trim() : null
      });
    }

    // Retornar datos validados (no guardar todavía)
    res.json({
      message: 'Datos validados correctamente',
      totalFilas: data.length,
      datosValidados,
      errores,
      tieneErrores: errores.length > 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Middleware para multer (se exporta para usar en las rutas)
exports.uploadExcel = upload.single('archivo');

// 9. guardarImportacion
exports.guardarImportacion = async (req, res) => {
  try {
    const { datosFicha, aprendices } = req.body;

    if (!datosFicha || !aprendices || aprendices.length === 0) {
      return res.status(400).json({ 
        message: 'Se requieren datosFicha y aprendices para guardar la importación' 
      });
    }

    // Validar que no exista numero_ficha repetido
    const fichaExistente = await Ficha.findOne({ 
      where: { numero_ficha: datosFicha.numero_ficha } 
    });
    if (fichaExistente) {
      return res.status(400).json({ message: 'Ya existe una ficha con este número' });
    }

    // Crear ficha nueva
    const nuevaFicha = await Ficha.create({
      numero_ficha: datosFicha.numero_ficha,
      fecha_inicio: datosFicha.fecha_inicio,
      fecha_fin: datosFicha.fecha_fin,
      ambiente: datosFicha.ambiente,
      jornada: datosFicha.jornada
    });

    // Buscar rol aprendiz
    const rolAprendiz = await Roles.findOne({ where: { nombre_rol: 'aprendiz' } });
    if (!rolAprendiz) {
      return res.status(400).json({ message: "El rol 'aprendiz' no existe. Debes crearlo primero." });
    }

    const estadosAprendiz = await Estados.findAll({
      where: { tipo_aplica: 'aprendiz' },
      order: [['nombre_estado', 'ASC']],
    });

    if (!estadosAprendiz.length) {
      return res.status(400).json({ message: 'No existen estados configurados para aprendices' });
    }

    const estadosPorNombre = new Map(
      estadosAprendiz.map((estado) => [estado.nombre_estado.trim().toLowerCase(), estado.id_estado])
    );

    const estadoDefaultRequest =
      req.body.id_estado_default ?? req.body.estado_aprendiz_id ?? req.body.estado_default ?? null;

    let estadoPorDefectoId =
      estadoDefaultRequest !== null && estadoDefaultRequest !== undefined
        ? Number(estadoDefaultRequest)
        : estadosAprendiz[0].id_estado;

    if (
      estadoDefaultRequest !== null &&
      !estadosAprendiz.some((estado) => estado.id_estado === estadoPorDefectoId)
    ) {
      return res.status(400).json({ message: 'El estado por defecto para aprendices no es válido' });
    }

    const obtenerEstadoId = (registro) => {
      const candidatos = [
        registro.id_estado,
        registro.estado_id,
        registro.estadoId,
      ].map((valor) => (valor !== undefined && valor !== null ? Number(valor) : null));

      for (const candidato of candidatos) {
        if (candidato && estadosAprendiz.some((estado) => estado.id_estado === candidato)) {
          return candidato;
        }
      }

      const nombre = registro.nombre_estado || registro.estado;
      if (nombre) {
        const encontrado = estadosPorNombre.get(nombre.toString().trim().toLowerCase());
        if (encontrado) {
          return encontrado;
        }
      }

      return estadoPorDefectoId;
    };

    const aprendicesParaInsertar = aprendices.map((aprendiz) => {
      const documento = aprendiz.numero_documento || aprendiz.identificacion;
      const nombres = aprendiz.nombres || aprendiz.nombre;
      const apellidos = aprendiz.apellidos || aprendiz.apellido || 'N/A';

      if (!documento || !nombres || !apellidos) {
        throw new Error('Cada aprendiz debe incluir numero_documento, nombres y apellidos');
      }

      return {
        tipo_documento: aprendiz.tipo_documento || 'CC',
        numero_documento: documento,
        nombres,
        apellidos,
        telefono: aprendiz.telefono || null,
        correo: aprendiz.correo || null,
        rh: aprendiz.rh || null,
        foto: aprendiz.foto || null,
        id_ficha: nuevaFicha.id_ficha,
        id_rol: rolAprendiz.id_rol,
        id_estado: obtenerEstadoId(aprendiz),
      };
    });

    const aprendicesCreados = await Estudiante.bulkCreate(aprendicesParaInsertar, {
      ignoreDuplicates: false,
      validate: true,
    });

    res.status(201).json({
      message: 'Importación guardada correctamente',
      ficha: nuevaFicha,
      aprendicesCreados: aprendicesCreados.length,
      aprendices: aprendicesCreados,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

