const { Usuarios, Ficha, Roles, Personas, Estudiante, Registro_Acceso, Estados } = require('../models');
const { Op } = require('sequelize');



module.exports = {



  // Obtener datos del instructor

  async getPerfilInstructor(req, res) {

    try {

      const instructor = await Usuarios.findOne({

        where: { id_usuario: req.user.id_usuario },

        include: [

          { model: Roles, attributes: ['nombre_rol'] },

          { model: Ficha }

        ]

      });



      if (!instructor) {

        return res.status(404).json({ error: 'Instructor no encontrado' });

      }



      res.json(instructor);

    } catch (error) {

      console.error("Error perfil instructor:", error);

      res.status(500).json({ error: "Error obteniendo perfil" });

    }

  },



  // Obtener todas las fichas asociadas al instructor

  async getFichasPorInstructor(req, res) {

    try {

      // Buscar la persona (instructor) asociada al usuario autenticado mediante el correo
      const personaInstructor = await Personas.findOne({
        where: { correo: req.user.correo },
        attributes: ['id_persona'],
      });

      if (!personaInstructor) {
        return res.status(404).json({ error: 'No se encontró la persona asociada al instructor' });
      }

      // Buscar fichas donde el instructor es esta persona
      const fichas = await Ficha.findAll({

        where: { id_instructor: personaInstructor.id_persona },

        include: [
          {
            model: Personas,
            as: 'instructor',
            attributes: ['id_persona', 'nombres', 'apellidos', 'numero_documento', 'correo'],
          },
        ],

      });



      res.json(fichas);

    } catch (error) {

      console.error("Error fichas instructor:", error);

      res.status(500).json({ error: "Error obteniendo fichas" });

    }

  },



  // Obtener aprendices de una ficha

  async getAprendicesDeFicha(req, res) {

    try {

      const { idFicha } = req.params;

      // Buscar rol aprendiz
      const rolAprendiz = await Roles.findOne({ where: { nombre_rol: 'aprendiz' } });

      if (!rolAprendiz) {
        return res.status(404).json({ error: 'Rol aprendiz no encontrado' });
      }

      // Buscar aprendices asociados a la ficha
      const aprendices = await Estudiante.findAll({
        where: { id_ficha: idFicha, id_rol: rolAprendiz.id_rol },
        include: [
          {
            model: Roles,
            as: 'rol',
            attributes: ['id_rol', 'nombre_rol'],
          },
        ],
        attributes: ['id_estudiante', 'tipo_documento', 'numero_documento', 'nombres', 'apellidos', 'telefono', 'correo', 'rh', 'foto'],
      });



      res.json(aprendices);

    } catch (error) {

      console.error("Error aprendices ficha:", error);

      res.status(500).json({ error: "Error obteniendo aprendices" });

    }

  },

  // Obtener registros de acceso de los aprendices de una ficha
  async getRegistrosAccesoFicha(req, res) {
    try {
      const { idFicha } = req.params;
      const { fecha, limite = 50 } = req.query;

      // Obtener los aprendices de la ficha
      const aprendices = await Estudiante.findAll({
        where: { id_ficha: idFicha },
        attributes: ['numero_documento', 'nombres', 'apellidos'],
      });

      if (aprendices.length === 0) {
        return res.json({ registros: [], message: 'No hay aprendices en esta ficha' });
      }

      // Obtener los documentos de los aprendices
      const documentosAprendices = aprendices.map(a => a.numero_documento);

      // Buscar las personas que coincidan con esos documentos
      const personas = await Personas.findAll({
        where: { numero_documento: { [Op.in]: documentosAprendices } },
        attributes: ['id_persona', 'numero_documento', 'nombres', 'apellidos'],
      });

      const personasIds = personas.map(p => p.id_persona);
      const personasMap = new Map(personas.map(p => [p.id_persona, p]));

      // Construir condiciones de búsqueda
      const whereConditions = {
        id_persona: { [Op.in]: personasIds },
      };

      // Filtrar por fecha si se proporciona
      if (fecha) {
        whereConditions.fecha = fecha;
      }

      // Obtener registros de acceso
      const registros = await Registro_Acceso.findAll({
        where: whereConditions,
        order: [['fecha', 'DESC'], ['hora_entrada', 'DESC']],
        limit: parseInt(limite),
        include: [
          {
            model: Personas,
            as: 'persona',
            attributes: ['id_persona', 'nombres', 'apellidos', 'numero_documento'],
          },
        ],
      });

      // Formatear respuesta
      const registrosFormateados = registros.map(reg => ({
        id: reg.id_registro,
        nombre: reg.persona ? `${reg.persona.nombres} ${reg.persona.apellidos}` : 'Sin nombre',
        documento: reg.persona?.numero_documento || '',
        fecha: reg.fecha,
        hora_entrada: reg.hora_entrada,
        hora_salida: reg.hora_salida,
        tipo_acceso: reg.tipo_acceso,
        tipo: reg.tipo_acceso === 'ENTRADA' ? 'Entrada' : 'Salida',
        time: reg.tipo_acceso === 'ENTRADA' 
          ? `${reg.fecha} ${reg.hora_entrada || ''}` 
          : `${reg.fecha} ${reg.hora_salida || ''}`,
      }));

      res.json({ registros: registrosFormateados });

    } catch (error) {
      console.error("Error registros acceso ficha:", error);
      res.status(500).json({ error: "Error obteniendo registros de acceso" });
    }
  },

  // Obtener aprendices con su último acceso
  async getAprendicesConAcceso(req, res) {
    try {
      const { idFicha } = req.params;

      // Buscar aprendices de la ficha
      const aprendices = await Estudiante.findAll({
        where: { id_ficha: idFicha },
        include: [
          {
            model: Roles,
            as: 'rol',
            attributes: ['id_rol', 'nombre_rol'],
          },
          {
            model: Estados,
            as: 'estado',
            attributes: ['id_estado', 'nombre_estado'],
          },
        ],
        attributes: ['id_estudiante', 'tipo_documento', 'numero_documento', 'nombres', 'apellidos', 'telefono', 'correo'],
      });

      // Obtener documentos de aprendices
      const documentos = aprendices.map(a => a.numero_documento);

      // Buscar personas correspondientes
      const personas = await Personas.findAll({
        where: { numero_documento: { [Op.in]: documentos } },
        attributes: ['id_persona', 'numero_documento'],
      });

      const personaDocMap = new Map(personas.map(p => [p.numero_documento, p.id_persona]));

      // Para cada aprendiz, buscar su último registro de acceso
      const aprendicesConAcceso = await Promise.all(aprendices.map(async (aprendiz) => {
        const idPersona = personaDocMap.get(aprendiz.numero_documento);
        let ultimoAcceso = null;

        if (idPersona) {
          const ultimoRegistro = await Registro_Acceso.findOne({
            where: { id_persona: idPersona },
            order: [['fecha', 'DESC'], ['hora_entrada', 'DESC']],
            attributes: ['fecha', 'hora_entrada', 'hora_salida', 'tipo_acceso'],
          });

          if (ultimoRegistro) {
            const hora = ultimoRegistro.hora_entrada || ultimoRegistro.hora_salida || '';
            ultimoAcceso = `${ultimoRegistro.fecha} ${hora}`.trim();
          }
        }

        return {
          id_aprendiz: aprendiz.id_estudiante,
          nombres: aprendiz.nombres,
          apellidos: aprendiz.apellidos,
          numero_documento: aprendiz.numero_documento,
          estado: aprendiz.estado,
          ultimo_acceso: ultimoAcceso,
        };
      }));

      res.json(aprendicesConAcceso);

    } catch (error) {
      console.error("Error aprendices con acceso:", error);
      res.status(500).json({ error: "Error obteniendo aprendices con acceso" });
    }
  }

};

