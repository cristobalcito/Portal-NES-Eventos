const MANTENCION_ACTIVA = 'en mantención';

const estaAtrasada = (mantencion, ahora = new Date()) =>
  mantencion.estado === MANTENCION_ACTIVA && ahora > new Date(mantencion.fechaRetornoEstimada);

module.exports = { MANTENCION_ACTIVA, estaAtrasada };
