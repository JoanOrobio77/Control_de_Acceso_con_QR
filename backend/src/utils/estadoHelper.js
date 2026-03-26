const ROLE_TO_TIPO_MAP = new Map([
  ['aprendiz', 'aprendiz'],
  ['instructor', 'instructor'],
  ['funcionario', 'funcionario'],
  ['visitante', 'visitante'],
  ['administrador', 'funcionario'],
  ['admin', 'funcionario'],
  ['guardia', 'funcionario'],
  ['seguridad', 'funcionario'],
]);

const normalize = (value) => (value ? value.toString().trim().toLowerCase() : null);

const inferTipoEstadoDesdeRol = (nombreRol) => {
  const normalized = normalize(nombreRol);
  if (!normalized) {
    return null;
  }

  if (ROLE_TO_TIPO_MAP.has(normalized)) {
    return ROLE_TO_TIPO_MAP.get(normalized);
  }

  if (normalized.includes('instructor')) {
    return 'instructor';
  }

  if (normalized.includes('funcionario') || normalized.includes('funcionaria')) {
    return 'funcionario';
  }

  if (normalized.includes('aprend')) {
    return 'aprendiz';
  }

  if (normalized.includes('visit')) {
    return 'visitante';
  }

  return null;
};

const estadoEsObligatorioParaRol = (nombreRol) => {
  const tipo = inferTipoEstadoDesdeRol(nombreRol);
  if (!tipo) {
    return false;
  }

  return tipo !== 'visitante';
};

const estadoCompatibleConRol = (estadoRecord, nombreRol) => {
  if (!estadoRecord) {
    return false;
  }

  const tipoEsperado = inferTipoEstadoDesdeRol(nombreRol);
  if (!tipoEsperado) {
    return true;
  }

  return estadoRecord.tipo_aplica === tipoEsperado;
};

module.exports = {
  inferTipoEstadoDesdeRol,
  estadoEsObligatorioParaRol,
  estadoCompatibleConRol,
};


