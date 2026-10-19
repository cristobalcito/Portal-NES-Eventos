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


const crearPlanBase = async (req, res) => {
  try {
    const { costoBase, descripcion } = req.body;

    if (!costoBase || !descripcion) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El costo base y la descripción son campos obligatorios.'
      });
    }

    const nuevoPlan = await prisma.planBase.create({
      data: {
        costoBase: parseFloat(costoBase),
        descripcion: descripcion
      }
    });

    return res.status(201).json({
      exito: true,
      mensaje: 'Plan Base creado con éxito.',
      datos: nuevoPlan
    });
  } catch (error) {
    console.error('Error al crear Plan Base:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al crear el plan base.'
    });
  }
};

module.exports = {
  obtenerPlanesBase,
  crearPlanBase
};