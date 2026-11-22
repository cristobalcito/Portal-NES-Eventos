
const prisma = require('../lib/prisma');
const { generarAlertasLogisticas } = require('../servicios/alertasServicio');
const { TIPOS_OPERATIVOS, actualizarAlertasOperativas } = require('../servicios/alertasOperativasServicio');

const TIPO_LOGISTICO = 'RECORDATORIO_LOGISTICO';
const camposAlerta = {
  idAL: true,
  razon: true,
  contenido: true,
  tipo: true,
  leida: true,
  creadaEn: true
};

const listarRecordatoriosLogisticos = async () => {
  const eventosVigentes = await generarAlertasLogisticas();
  return prisma.alerta.findMany({
    where: { tipo: TIPO_LOGISTICO, planEspecificoId: { in: eventosVigentes } },
    select: {
      ...camposAlerta,
      planEspecificoId: true,
      planEspecifico: { select: { idPE: true, descripcion: true, fecha: true, lugar: true } }
    }
  });
};

const listarAlertasOperativas = async () => {
  try {
    await actualizarAlertasOperativas();
    const datos = await prisma.alerta.findMany({
      where: { tipo: { in: TIPOS_OPERATIVOS } },
      select: { ...camposAlerta, claveIncidencia: true, resueltaEn: true }
    });
    return { datos };
  } catch (error) {
    console.error('Error al consultar avisos operativos:', error);
    return { datos: [], aviso: 'No se pudieron actualizar los avisos operativos.' };
  }
};

// GET /api/alertas
const obtenerAlertas = async (req, res) => {
  res.set('Cache-Control', 'no-store');

  try {
    const [recordatorios, operativas] = await Promise.all([
      listarRecordatoriosLogisticos(),
      listarAlertasOperativas()
    ]);
    const alertas = [...recordatorios, ...operativas.datos].sort((a, b) =>
      Number(Boolean(a.resueltaEn)) - Number(Boolean(b.resueltaEn)) ||
      b.creadaEn - a.creadaEn || b.idAL - a.idAL
    );

    return res.status(200).json({
      success: true,
      total: alertas.length,
      datos: alertas,
      aviso: operativas.aviso
    });
  } catch (error) {
    console.error('Error al obtener alertas:', error);

    return res.status(500).json({
      success: false,
      mensaje: 'No se pudieron obtener las alertas.'
    });
  }
};

// PATCH /api/alertas/:id/leida
const marcarAlertaLeida = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'El ID de la alerta no es válido.'
      });
    }

    const resultado = await prisma.alerta.updateMany({
      where: {
        idAL: id,
        OR: [
          { tipo: TIPO_LOGISTICO, planEspecificoId: { not: null } },
          { tipo: { in: TIPOS_OPERATIVOS } }
        ]
      },
      data: {
        leida: true
      }
    });

    if (resultado.count === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'No se encontró la alerta.'
      });
    }

    return res.status(200).json({
      success: true,
      mensaje: 'Alerta marcada como leída.'
    });
  } catch (error) {
    console.error('Error al actualizar alerta:', error);

    return res.status(500).json({
      success: false,
      mensaje: 'No se pudo actualizar la alerta.'
    });
  }
};

module.exports = {
  obtenerAlertas,
  marcarAlertaLeida
};
