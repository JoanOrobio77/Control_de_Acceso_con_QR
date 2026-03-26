const XLSX = require("xlsx");

const { Ficha, Estudiante, Roles, Estados, Personas } = require("../models");



module.exports = {

  

  // Subir archivo y leer datos

  async cargarExcel(req, res) {

    try {

      if (!req.file) {

        return res.status(400).json({ error: "Debe subir un archivo Excel" });

      }



      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

      const hoja = workbook.Sheets[workbook.SheetNames[0]];

      const registros = XLSX.utils.sheet_to_json(hoja);



      if (registros.length === 0) {

        return res.status(400).json({ error: "El archivo está vacío" });

      }



      return res.json({

        preview: registros,

        total: registros.length

      });



    } catch (error) {

      console.error("Error leyendo Excel:", error);

      res.status(500).json({ error: "Error procesando archivo" });

    }

  },



  // Guardar ficha + aprendices en bloque

  async guardarMasivo(req, res) {

    try {

      const { ficha, aprendices } = req.body;



      if (!ficha || !aprendices) {

        return res.status(400).json({ error: "Datos incompletos" });

      }



      // Buscar si ya existe una ficha con el mismo número
      let fichaFinal;
      let fichaExistente = false;
      
      const fichaEncontrada = await Ficha.findOne({ 
        where: { numero_ficha: ficha.numero_ficha } 
      });

      if (fichaEncontrada) {
        // Usar la ficha existente
        fichaFinal = fichaEncontrada;
        fichaExistente = true;
      } else {
        // Crear nueva ficha
        fichaFinal = await Ficha.create(ficha);
      }



      // Insertar aprendices y asociarlos a la ficha nueva

      const rolAprendiz = await Roles.findOne({ where: { nombre_rol: 'aprendiz' } });

      if (!rolAprendiz) {
        return res.status(400).json({ error: "El rol 'aprendiz' no existe" });
      }

      const estadosAprendiz = await Estados.findAll({
        where: { tipo_aplica: 'aprendiz' },
        order: [['nombre_estado', 'ASC']],
      });

      if (estadosAprendiz.length === 0) {
        return res.status(400).json({ error: 'No existen estados configurados para aprendices' });
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
        return res.status(400).json({ error: 'El estado por defecto para aprendices no es válido' });
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

      // Verificar duplicados dentro del archivo
      const documentosEnArchivo = new Map();
      const duplicadosEnArchivo = [];
      
      aprendices.forEach((a, index) => {
        const documento = String(a.numero_documento || a.identificacion || '').trim();
        if (documento) {
          if (documentosEnArchivo.has(documento)) {
            duplicadosEnArchivo.push({
              documento,
              fila: index + 2, // +2 porque Excel empieza en 1 y tiene encabezado
              nombre: `${a.nombres || a.nombre || ''} ${a.apellidos || a.apellido || ''}`.trim()
            });
          } else {
            documentosEnArchivo.set(documento, index + 2);
          }
        }
      });

      if (duplicadosEnArchivo.length > 0) {
        const detalles = duplicadosEnArchivo.map(d => 
          `Documento ${d.documento} (${d.nombre}) en fila ${d.fila}`
        ).join(', ');
        return res.status(400).json({ 
          error: `Hay documentos duplicados en el archivo: ${detalles}` 
        });
      }

      // Verificar si ya existen en la base de datos
      const documentosArray = Array.from(documentosEnArchivo.keys());
      const existentes = await Estudiante.findAll({
        where: { numero_documento: documentosArray },
        attributes: ['numero_documento', 'nombres', 'apellidos']
      });

      if (existentes.length > 0) {
        const detalles = existentes.map(e => 
          `${e.numero_documento} (${e.nombres} ${e.apellidos})`
        ).join(', ');
        return res.status(400).json({ 
          error: `Los siguientes documentos ya están registrados: ${detalles}` 
        });
      }

      const aprendicesConFicha = aprendices.map((a) => {
        const documento = String(a.numero_documento || a.identificacion || '').trim();
        const nombres = a.nombres || a.nombre;
        const apellidos = a.apellidos || a.apellido || 'N/A';

        if (!documento || !nombres || !apellidos) {
          throw new Error('Cada aprendiz debe incluir numero_documento, nombres y apellidos');
        }

        const estadoId = obtenerEstadoId(a);

        if (!estadoId) {
          throw new Error('Cada aprendiz debe incluir un estado válido');
        }

        return {
          tipo_documento: a.tipo_documento || 'CC',
          numero_documento: documento,
          nombres,
          apellidos,
          telefono: a.telefono || null,
          correo: a.correo || null,
          rh: a.rh || null,
          foto: a.foto || null,
          id_ficha: fichaFinal.id_ficha,
          id_rol: rolAprendiz.id_rol,
          id_estado: estadoId,
        };
      });

      await Estudiante.bulkCreate(aprendicesConFicha);



      return res.json({

        mensaje: fichaExistente 
          ? `Importación completada. Se agregaron ${aprendices.length} aprendices a la ficha existente ${fichaFinal.numero_ficha}`
          : "Importación completada",

        ficha: fichaFinal,
        fichaExistente: fichaExistente,

        totalAprendices: aprendices.length

      });



    } catch (error) {

      console.error("Error guardando importación:", error);

      res.status(500).json({ error: "No se pudo completar la importación" });

    }

  },

  // Guardar instructores en bloque
  async guardarInstructoresMasivo(req, res) {
    try {
      const { instructores } = req.body;

      if (!instructores || !Array.isArray(instructores) || instructores.length === 0) {
        return res.status(400).json({ error: "Debe proporcionar al menos un instructor" });
      }

      // Obtener rol instructor
      const rolInstructor = await Roles.findOne({ where: { nombre_rol: 'instructor' } });
      if (!rolInstructor) {
        return res.status(400).json({ error: "El rol 'instructor' no existe" });
      }

      // Obtener estados para instructor
      const estadosInstructor = await Estados.findAll({
        where: { tipo_aplica: 'instructor' },
        order: [['nombre_estado', 'ASC']],
      });

      if (estadosInstructor.length === 0) {
        return res.status(400).json({ error: 'No existen estados configurados para instructores' });
      }

      const estadosPorNombre = new Map(
        estadosInstructor.map((estado) => [estado.nombre_estado.trim().toLowerCase(), estado.id_estado])
      );

      const estadoDefaultRequest = req.body.id_estado_default ?? null;
      let estadoPorDefectoId =
        estadoDefaultRequest !== null && estadoDefaultRequest !== undefined
          ? Number(estadoDefaultRequest)
          : estadosInstructor[0].id_estado;

      if (
        estadoDefaultRequest !== null &&
        !estadosInstructor.some((estado) => estado.id_estado === estadoPorDefectoId)
      ) {
        return res.status(400).json({ error: 'El estado por defecto para instructores no es válido' });
      }

      const obtenerEstadoId = (registro) => {
        const candidatos = [
          registro.id_estado,
          registro.estado_id,
          registro.estadoId,
        ].map((valor) => (valor !== undefined && valor !== null ? Number(valor) : null));

        for (const candidato of candidatos) {
          if (candidato && estadosInstructor.some((estado) => estado.id_estado === candidato)) {
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

      // Verificar duplicados dentro del archivo
      const documentosEnArchivo = new Map();
      const duplicadosEnArchivo = [];
      
      instructores.forEach((i, index) => {
        const documento = String(i.numero_documento || i.identificacion || '').trim();
        if (documento) {
          if (documentosEnArchivo.has(documento)) {
            duplicadosEnArchivo.push({
              documento,
              fila: index + 2,
              nombre: `${i.nombres || i.nombre || ''} ${i.apellidos || i.apellido || ''}`.trim()
            });
          } else {
            documentosEnArchivo.set(documento, index + 2);
          }
        }
      });

      if (duplicadosEnArchivo.length > 0) {
        const detalles = duplicadosEnArchivo.map(d => 
          `Documento ${d.documento} (${d.nombre}) en fila ${d.fila}`
        ).join(', ');
        return res.status(400).json({ 
          error: `Hay documentos duplicados en el archivo: ${detalles}` 
        });
      }

      // Verificar si ya existen en la base de datos
      const documentosArray = Array.from(documentosEnArchivo.keys());
      const existentes = await Personas.findAll({
        where: { numero_documento: documentosArray },
        attributes: ['numero_documento', 'nombres', 'apellidos']
      });

      if (existentes.length > 0) {
        const detalles = existentes.map(e => 
          `${e.numero_documento} (${e.nombres} ${e.apellidos})`
        ).join(', ');
        return res.status(400).json({ 
          error: `Los siguientes documentos ya están registrados: ${detalles}` 
        });
      }

      const instructoresParaInsertar = instructores.map((i) => {
        const documento = String(i.numero_documento || i.identificacion || '').trim();
        const nombres = i.nombres || i.nombre;
        const apellidos = i.apellidos || i.apellido || 'N/A';

        if (!documento || !nombres || !apellidos) {
          throw new Error('Cada instructor debe incluir numero_documento, nombres y apellidos');
        }

        const estadoId = obtenerEstadoId(i);

        return {
          tipo_documento: i.tipo_documento || 'CC',
          numero_documento: documento,
          nombres,
          apellidos,
          telefono: i.telefono || null,
          correo: i.correo || null,
          rh: i.rh || null,
          foto: i.foto || null,
          id_rol: rolInstructor.id_rol,
          id_estado: estadoId,
        };
      });

      await Personas.bulkCreate(instructoresParaInsertar);

      return res.json({
        mensaje: "Importación de instructores completada",
        totalInstructores: instructores.length
      });

    } catch (error) {
      console.error("Error guardando instructores:", error);
      res.status(500).json({ error: error.message || "No se pudo completar la importación de instructores" });
    }
  }

};

