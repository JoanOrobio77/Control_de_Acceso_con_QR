const { Areas } = require('../models');

const obtenerAreas = async (req, res) => {
  try {
    const areas = await Areas.findAll();
    res.json(areas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las áreas', error: error.message });
  }
};

const crearArea = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion) {
      return res.status(400).json({ message: 'La descripción es requerida' });
    }

    const nuevaArea = await Areas.create({ descripcion });
    res.status(201).json(nuevaArea);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear área', error: error.message });
  }
};

const actualizarArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion } = req.body;

    const area = await Areas.findByPk(id);

    if (!area) {
      return res.status(404).json({ message: 'Área no encontrada' });
    }

    await area.update({ descripcion });
    res.json(area);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar área', error: error.message });
  }
};

const eliminarArea = async (req, res) => {
  try {
    const { id } = req.params;

    const area = await Areas.findByPk(id);

    if (!area) {
      return res.status(404).json({ message: 'Área no encontrada' });
    }

    await area.destroy();
    res.json({ message: 'Área eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el área', error: error.message });
  }
};

module.exports = {
  obtenerAreas,
  crearArea,
  actualizarArea,
  eliminarArea,
};

