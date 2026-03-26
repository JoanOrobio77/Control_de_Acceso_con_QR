const { Ficha, Personas, Estudiante } = require('../models');

// Obtener todas las fichas
const obtenerFichas = async (req, res) => {
  try {
    const fichas = await Ficha.findAll({
      include: [
        {
          model: Personas,
          as: 'instructor',
          attributes: ['id_persona', 'nombres', 'apellidos', 'numero_documento', 'correo'],
        },
        {
          model: Estudiante,
          as: 'estudiantes',
          attributes: ['id_estudiante', 'nombres', 'apellidos', 'numero_documento'],
        },
      ],
      order: [['id_ficha', 'DESC']],
    });
    res.json(fichas);
  } catch (error) {
    console.error('Error obteniendo fichas:', error);
    res.status(500).json({ message: 'Error obteniendo fichas', error: error.message });
  }
};

// Crear una ficha
const crearFicha = async (req, res) => {
  const { numero_ficha, programa_formacion, fecha_inicio, fecha_fin, ambiente, jornada, id_instructor } = req.body;

  try {
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
      id_instructor: id_instructor || null,
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

    res.status(201).json({
      message: 'Ficha creada correctamente',
      id_ficha: fichaCreada.id_ficha,
      data: fichaCreada,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creando ficha', error: error.message });
  }
};

// Actualizar ficha
const actualizarFicha = async (req, res) => {
  const { id } = req.params;
  const { numero_ficha, programa_formacion, fecha_inicio, fecha_fin, ambiente, jornada, id_instructor } = req.body;

  try {
    const ficha = await Ficha.findByPk(id);

    if (!ficha) {
      return res.status(404).json({ message: 'Ficha no encontrada' });
    }

    // Validar que el instructor exista si se proporciona
    if (id_instructor !== undefined && id_instructor !== null) {
      const instructor = await Personas.findByPk(id_instructor);
      if (!instructor) {
        return res.status(404).json({ message: 'El instructor especificado no existe' });
      }
    }

    await ficha.update({
      numero_ficha: numero_ficha !== undefined ? numero_ficha : ficha.numero_ficha,
      programa_formacion: programa_formacion !== undefined ? programa_formacion : ficha.programa_formacion,
      fecha_inicio: fecha_inicio !== undefined ? fecha_inicio : ficha.fecha_inicio,
      fecha_fin: fecha_fin !== undefined ? fecha_fin : ficha.fecha_fin,
      ambiente: ambiente !== undefined ? ambiente : ficha.ambiente,
      jornada: jornada !== undefined ? jornada : ficha.jornada,
      id_instructor: id_instructor !== undefined ? id_instructor : ficha.id_instructor,
    });

    // Obtener la ficha actualizada con el instructor
    const fichaActualizada = await Ficha.findByPk(id, {
      include: [
        {
          model: Personas,
          as: 'instructor',
          attributes: ['id_persona', 'nombres', 'apellidos', 'numero_documento', 'correo'],
        },
      ],
    });

    res.json({ message: 'Ficha actualizada correctamente', data: fichaActualizada });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando ficha', error: error.message });
  }
};

// Eliminar ficha
const eliminarFicha = async (req, res) => {
  const { id } = req.params;

  try {
    const ficha = await Ficha.findByPk(id);

    if (!ficha) {
      return res.status(404).json({ message: 'Ficha no encontrada' });
    }

    await ficha.destroy();

    res.json({ message: 'Ficha eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando ficha', error: error.message });
  }
};

module.exports = {
  obtenerFichas,
  crearFicha,
  actualizarFicha,
  eliminarFicha,
};

