const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const obtenerPlanesBase = async (req, res) => {
  try {
    const planesBase = await prisma.planBase.findMany({
      take: 3,
      orderBy: { idPL: 'asc' },
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
    console.error("error al obtener los planes", error);
    return res.status(500).json({
      exito: false,
      mensaje: "error interno del servidor al obtener los planes"
    });
  }
};

const modificarPlanBase = async (req, res) => {
  try {
    const { idPL } = req.params;
    const { costoBase, descripcion } = req.body;

    const planId = parseInt(idPL, 10);
    const planExiste = await prisma.planBase.findUnique({
      where: { idPL: planId }
    });
    
    if (!planExiste) {
      return res.status(404).json({
        exito: false,
        mensaje: "plan a modificar no existe"
      });
    }

    const planActualizado = await prisma.planBase.update({
      where: { idPL: planId },
      data: {
        costoBase: costoBase !== undefined ? parseFloat(costoBase) : planExiste.costoBase,
        descripcion: descripcion || planExiste.descripcion
      }
    });

    return res.status(200).json({
      exito: true,
      mensaje: "plan modificado exitosamente",
      datos: planActualizado
    });
  } catch (error) {
    console.error("error al modificar Plan base:", error);
    return res.status(500).json({
      exito: false,
      mensaje: "error interno del servidor al modificar el plan base"
    });
  }
};

module.exports = {
  obtenerPlanesBase,
  modificarPlanBase
};