
const prisma = require('../lib/prisma');

const TIPO_ALERTA = 'RECORDATORIO_LOGISTICO';
const DIAS_DE_AVISO = 3;
const MS_POR_DIA = 24 * 60 * 60 * 1000;
const formatoDiaSantiago = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

// Representa cada día de Santiago a medianoche UTC para comparar fechas calendario.
const obtenerDiaCalendario = (fecha) => {
  const partes = formatoDiaSantiago.formatToParts(fecha);
  const obtener = (tipo) =>
    partes.find((parte) => parte.type === tipo).value;

  return Date.UTC(
    Number(obtener('year')),
    Number(obtener('month')) - 1,
    Number(obtener('day'))
  );
};

const revisarEventos = async () => {
  const hoy = obtenerDiaCalendario(new Date());

  // El margen UTC cubre cambios de huso horario. El filtro exacto se hace por día de Santiago.
  const eventos = await prisma.planEspecifico.findMany({
    where: {
      fecha: {
        gte: new Date(hoy - MS_POR_DIA),
        lt: new Date(hoy + (DIAS_DE_AVISO + 2) * MS_POR_DIA)
      }
    }
  });

  const eventosVigentes = [];
  for (const evento of eventos) {
    const diasRestantes = (obtenerDiaCalendario(evento.fecha) - hoy) / MS_POR_DIA;
    if (evento.estado === 'CANCELADO' || diasRestantes < 0 || diasRestantes > DIAS_DE_AVISO) {
      continue;
    }

    const diaCercano = ['hoy', 'mañana'][diasRestantes];
    const plazo = diaCercano
      ? `El evento es ${diaCercano} ("${evento.descripcion}"). `
      : `Faltan ${diasRestantes} días para el evento "${evento.descripcion}". `;
    const contenido =
      plazo +
      `Revisar personal, transporte, equipamiento y montaje ` +
      `en ${evento.lugar}.`;
    const clave = { planEspecificoId: evento.idPE, tipo: TIPO_ALERTA };

    try {
      await prisma.alerta.upsert({
        where: { planEspecificoId_tipo: clave },
        select: { idAL: true },
        update: { contenido },
        create: {
          ...clave,
          razon: 'Recordatorio logístico',
          contenido
        }
      });
    } catch (error) {
      // El evento pudo eliminarse o el aviso pudo crearse desde otro proceso.
      if (error.code === 'P2003') continue;
      if (error.code !== 'P2002') throw error;
      const resultado = await prisma.alerta.updateMany({
        where: clave,
        data: { contenido }
      });
      if (resultado.count === 0) throw error;
    }

    eventosVigentes.push(evento.idPE);
  }

  return eventosVigentes;
};

let revisionEnCurso;
const generarAlertasLogisticas = () => {
  if (!revisionEnCurso) {
    revisionEnCurso = revisarEventos().finally(() => {
      revisionEnCurso = null;
    });
  }

  return revisionEnCurso;
};

module.exports = {
  generarAlertasLogisticas
};
