const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const obtenerPlanesBase = async (req, res) => {
  try {
    const planesBase = await prisma.planBase.findMany({
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

const crearPlanBase = async (req, res) => {
  try {
    const { costoBase, descripcion } = req.body;

    if (!descripcion || !descripcion.trim()) {
      return res.status(400).json({
        exito: false,
        mensaje: "La descripción es obligatoria"
      });
    }

    if (costoBase === undefined || costoBase === null || String(costoBase).trim() === '') {
      return res.status(400).json({
        exito: false,
        mensaje: "El costo base es obligatorio"
      });
    }

    const costo = parseFloat(costoBase);
    if (isNaN(costo) || costo < 0) {
      return res.status(400).json({
        exito: false,
        mensaje: "El costo base debe ser un número válido mayor o igual a 0"
      });
    }

    const nuevoPlan = await prisma.planBase.create({
      data: {
        costoBase: costo,
        descripcion: descripcion.trim()
      }
    });

    return res.status(201).json({
      exito: true,
      mensaje: "Plan base creado exitosamente",
      datos: nuevoPlan
    });
  } catch (error) {
    console.error("error al crear Plan base:", error);
    return res.status(500).json({
      exito: false,
      mensaje: "error interno del servidor al crear el plan base"
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

    if (costoBase === undefined || costoBase === null || String(costoBase).trim() === '') {
      return res.status(400).json({
        exito: false,
        mensaje: "El costo base es obligatorio"
      });
    }

    const costo = parseFloat(costoBase);
    if (isNaN(costo) || costo < 0) {
      return res.status(400).json({
        exito: false,
        mensaje: "El costo base debe ser un número válido mayor o igual a 0"
      });
    }

    if (descripcion !== undefined && !descripcion.trim()) {
      return res.status(400).json({
        exito: false,
        mensaje: "La descripción no puede quedar vacía"
      });
    }

    const planActualizado = await prisma.planBase.update({
      where: { idPL: planId },
      data: {
        costoBase: costo,
        descripcion: descripcion ? descripcion.trim() : planExiste.descripcion
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

const eliminarPlanBase = async (req, res) => {
  try {
    const { idPL } = req.params;
    const planId = parseInt(idPL, 10);

    const planExiste = await prisma.planBase.findUnique({
      where: { idPL: planId }
    });

    if (!planExiste) {
      return res.status(404).json({
        exito: false,
        mensaje: "El plan base a eliminar no existe"
      });
    }

    await prisma.planBase.delete({
      where: { idPL: planId }
    });

    return res.status(200).json({
      exito: true,
      mensaje: "Plan base eliminado exitosamente"
    });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({
        exito: false,
        mensaje: "No se puede eliminar este plan porque está asociado a uno o más eventos."
      });
    }
    console.error("error al eliminar Plan base:", error);
    return res.status(500).json({
      exito: false,
      mensaje: "error interno del servidor al eliminar el plan base"
    });
  }
};

module.exports = {
  obtenerPlanesBase,
  crearPlanBase,
  modificarPlanBase,
  eliminarPlanBase
};
