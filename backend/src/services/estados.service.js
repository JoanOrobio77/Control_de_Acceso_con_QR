const { Estados } = require('../models');

const sanitizeTipo = (tipo) => {
  if (!tipo) return null;
  const normalized = tipo.toString().trim().toLowerCase();
  return ['aprendiz', 'instructor', 'funcionario', 'visitante'].includes(normalized)
    ? normalized
    : null;
};

const obtenerEstados = async (tipo_aplica) => {
  const where = {};
  const tipoSanitizado = sanitizeTipo(tipo_aplica);

  if (tipoSanitizado) {
    where.tipo_aplica = tipoSanitizado;
  }

  return Estados.findAll({
    where,
    order: [['nombre_estado', 'ASC']],
    attributes: ['id_estado', 'nombre_estado', 'tipo_aplica'],
  });
};

module.exports = {
  obtenerEstados,
};


