
const prisma = require('../lib/prisma');

const TIPO_ALERTA = 'RECORDATORIO_LOGISTICO';

// Obtiene la fecha actual de Chile, sin considerar la hora.
const obtenerHoy = () => {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const obtener = (tipo) =>
    partes.find((parte) => parte.type === tipo).value;

  return new Date(Date.UTC(
    Number(obtener('year')),
    Number(obtener('month')) - 1,
    Number(obtener('day'))
  ));
};

// Genera recordatorios logísticos tres días antes del evento.
const generarAlertasLogisticas = async () => {
  const fechaObjetivo = obtenerHoy();
  fechaObjetivo.setUTCDate(fechaObjetivo.getUTCDate() + 3);

  const fechaSiguiente = new Date(fechaObjetivo);
  fechaSiguiente.setUTCDate(fechaSiguiente.getUTCDate() + 1);

  // Buscar eventos programados para dentro de tres días.
  const eventos = await prisma.planEspecifico.findMany({
    where: {
      fecha: {
        gte: fechaObjetivo,
        lt: fechaSiguiente
      }
    }
  });

  for (const evento of eventos) {
    const contenido =
      `Faltan 3 días para el evento "${evento.descripcion}". ` +
      `Revisar personal, transporte, equipamiento y montaje ` +
      `en ${evento.lugar}.`;

    // Crear la alerta solo si aún no existe para ese evento.
    await prisma.alerta.upsert({
      where: {
        planEspecificoId_tipo: {
          planEspecificoId: evento.idPE,
          tipo: TIPO_ALERTA
        }
      },
      update: {
        contenido
      },
      create: {
        razon: 'Recordatorio logístico',
        contenido,
        tipo: TIPO_ALERTA,
        planEspecificoId: evento.idPE
      }
    });
  }

  return eventos.length;
};

module.exports = {
  generarAlertasLogisticas
};
