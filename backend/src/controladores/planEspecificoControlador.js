const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/planes-especificos
exports.obtenerPlanesEspecificos = async (req, res, next) => {
  try {
    const planes = await prisma.planEspecifico.findMany({
      include: {
        horario: true,
        planBase: true
      },
      orderBy: {
        fecha: 'asc'
      }
    });

    res.status(200).json(planes);
  } catch (error) {
    next(error);
  }
};