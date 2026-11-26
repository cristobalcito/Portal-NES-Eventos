const prisma = require('../lib/prisma');
const { calcularBloqueOperativo, detectarCrucesDelDia, extraerFechaClave } = require('./agendaOperativaServicio');
const { MANTENCION_ACTIVA, estaAtrasada } = require('./estadoMantencion');

const CRUCE_AGENDA = 'CRUCE_AGENDA';
const STOCK_BAJO = 'STOCK_BAJO';
const MANTENCION_PENDIENTE = 'MANTENCION_PENDIENTE';
const formatoFecha = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  dateStyle: 'short'
});

const detectarCruces = async (tx) => {
  const eventos = await tx.planEspecifico.findMany({
    select: { idPE: true, fecha: true, descripcion: true, horario: true, personal: true },
    orderBy: { idPE: 'asc' }
  });

  const porDia = new Map();
  for (const evento of eventos) {
    const dia = extraerFechaClave(evento.fecha);
    if (!dia) continue;
    if (!porDia.has(dia)) porDia.set(dia, []);
    porDia.get(dia).push({ ...evento, bloque: calcularBloqueOperativo(evento) });
  }

  const incidencias = [];
  for (const eventosDelDia of porDia.values()) {
    for (const { a, b, personalRepetido } of detectarCrucesDelDia(eventosDelDia)) {
      let contenido = `Se cruzan «${a.descripcion}» (#${a.idPE}, ${a.bloque.textoBloqueo}) y ` +
        `«${b.descripcion}» (#${b.idPE}, ${b.bloque.textoBloqueo}) el ${extraerFechaClave(a.fecha)}.`;
      if (personalRepetido.length) contenido += ` Personal repetido: ${personalRepetido.join(', ')}.`;
      incidencias.push({ claveIncidencia: `${a.idPE}:${b.idPE}`, razon: 'Cruce de agenda', contenido });
    }
  }
  return incidencias;
};

const detectarStockBajo = async (tx) => {
  const equipos = await tx.inventario.findMany({
    where: { disponible: { lte: 2 } },
    select: { id: true, producto: true, marca: true, disponible: true }
  });

  return equipos.map(({ id, producto, marca, disponible }) => ({
    claveIncidencia: String(id),
    razon: 'Stock bajo',
    contenido: `${producto}${marca ? ` (${marca})` : ''} (#${id}) tiene ${disponible} ` +
      `${disponible === 1 ? 'unidad disponible' : 'unidades disponibles'}.`
  }));
};

const detectarMantenciones = async (tx, ahora) => {
  const mantenciones = await tx.mantencion.findMany({
    where: { estado: MANTENCION_ACTIVA },
    include: { inventario: { select: { producto: true, marca: true } } }
  });

  return mantenciones.map((mantencion) => {
    const { id, inventario: { producto, marca }, fechaRetornoEstimada } = mantencion;
    const atrasada = estaAtrasada(mantencion, ahora);
    return {
      claveIncidencia: String(id),
      razon: atrasada ? 'Mantención atrasada' : 'Mantención pendiente',
      contenido: `${producto}${marca ? ` (${marca})` : ''} sigue en mantención (#${id}). ` +
        `Retorno estimado: ${formatoFecha.format(fechaRetornoEstimada)}.`
    };
  });
};

const detectores = {
  [CRUCE_AGENDA]: detectarCruces,
  [STOCK_BAJO]: detectarStockBajo,
  [MANTENCION_PENDIENTE]: detectarMantenciones
};
const TIPOS_OPERATIVOS = Object.keys(detectores);

const sincronizarIncidencias = async (tx, tipo, detectadas, ahora) => {
  const existentes = await tx.alerta.findMany({
    where: { tipo, resueltaEn: null, claveIncidencia: { not: null } },
    select: { idAL: true, claveIncidencia: true, razon: true, contenido: true }
  });
  const activas = new Map(existentes.map((alerta) => [alerta.claveIncidencia, alerta]));
  const nuevas = [];

  for (const incidencia of detectadas) {
    const anterior = activas.get(incidencia.claveIncidencia);
    if (!anterior) {
      nuevas.push({ tipo, ...incidencia });
      continue;
    }
    activas.delete(incidencia.claveIncidencia);
    if (anterior.razon !== incidencia.razon || anterior.contenido !== incidencia.contenido) {
      await tx.alerta.updateMany({
        where: { idAL: anterior.idAL },
        data: { razon: incidencia.razon, contenido: incidencia.contenido }
      });
    }
  }

  if (nuevas.length) await tx.alerta.createMany({ data: nuevas, skipDuplicates: true });
  if (activas.size) {
    await tx.alerta.updateMany({
      where: { idAL: { in: [...activas.values()].map((alerta) => alerta.idAL) } },
      data: { resueltaEn: ahora }
    });
  }
};

const actualizarAlertasOperativas = async (tipos = TIPOS_OPERATIVOS) => {
  await prisma.$transaction(async (tx) => {
    // Serializa las revisiones entre procesos antes de leer el estado actual.
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(26112105)`;
    const ahora = new Date();
    for (const tipo of tipos) {
      const incidencias = await detectores[tipo](tx, ahora);
      await sincronizarIncidencias(tx, tipo, incidencias, ahora);
    }
  }, { isolationLevel: 'ReadCommitted' });
};

const actualizarAlertasTrasGuardar = async (...tipos) => {
  try {
    await actualizarAlertasOperativas(tipos);
  } catch (error) {
    // El guardado ya se completó. La campana reintentará la revisión al consultar.
    console.error('Error al actualizar avisos operativos:', error);
  }
};

module.exports = {
  CRUCE_AGENDA,
  STOCK_BAJO,
  MANTENCION_PENDIENTE,
  TIPOS_OPERATIVOS,
  actualizarAlertasOperativas,
  actualizarAlertasTrasGuardar
};
