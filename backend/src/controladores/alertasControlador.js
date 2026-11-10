
const prisma = require('../lib/prisma');

// GET /api/alertas
const obtenerAlertas = async (req, res) => {
  try {
    const alertas = await prisma.alerta.findMany({
      where: {
        tipo: 'RECORDATORIO_LOGISTICO',
        planEspecificoId: { not: null }
      },
      select: {
        idAL: true,
        razon: true,
        contenido: true,
        tipo: true,
        leida: true,
        creadaEn: true,
        planEspecificoId: true,
        planEspecifico: {
          select: {
            idPE: true,
            descripcion: true,
            fecha: true,
            lugar: true
          }
        }
      },
      orderBy: {
        creadaEn: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      total: alertas.length,
      datos: alertas
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
        tipo: 'RECORDATORIO_LOGISTICO',
        planEspecificoId: { not: null }
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
