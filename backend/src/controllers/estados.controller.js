const estadosService = require('../services/estados.service');

const VALID_TYPES = ['aprendiz', 'instructor', 'funcionario', 'visitante'];

const listarTodos = async (req, res) => {
  try {
    const estados = await estadosService.obtenerEstados();
    res.json({
      success: true,
      total: estados.length,
      estados,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estados', details: error.message });
  }
};

const listarPorTipo = async (req, res) => {
  try {
    const { tipo_aplica } = req.params;
    const tipo = tipo_aplica ? tipo_aplica.toString().trim().toLowerCase() : null;

    if (!tipo || !VALID_TYPES.includes(tipo)) {
      return res.status(400).json({ error: 'tipo_aplica inválido' });
    }

    const estados = await estadosService.obtenerEstados(tipo);
    res.json({
      success: true,
      tipo_aplica: tipo,
      total: estados.length,
      estados,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estados', details: error.message });
  }
};

module.exports = {
  listarTodos,
  listarPorTipo,
};


