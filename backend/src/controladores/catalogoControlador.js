const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Obtiene todos los planes base para mostrar en la página del catálogo
 */
const obtenerPlanesBase = async (req, res) => {
  try {
    const planesBase = await prisma.planBase.findMany({
      select: {
        idPL: true,
        costoBase: true,
        descripcion: true
      }
    });

    return res.status(200).json({
      exito: true,
      datos: planesBase
    });
  } catch (error) {
    console.error('Error al obtener los planes base:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al consultar el catálogo.'
    });
  }
};

module.exports = {
  obtenerPlanesBase
};