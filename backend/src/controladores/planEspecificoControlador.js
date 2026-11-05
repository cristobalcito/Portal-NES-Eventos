const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Obtener todos los planes específicos / eventos para el Horario Compartido
const obtenerPlanesEspecificos = async (req, res, next) => {
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

// 2. Crear plan específico
const crearPlanEspecifico = async (req, res, next) => {
  try {
    // Tu lógica existente para crear
  } catch (error) {
    next(error);
  }
};

// 3. Modificar plan específico
const modificarPlanEspecifico = async (req, res, next) => {
  try {
    // Tu lógica existente para modificar
  } catch (error) {
    next(error);
  }
};

// 4. Eliminar plan específico
const eliminarPlanEspecifico = async (req, res, next) => {
  try {
    // Tu lógica existente para eliminar
  } catch (error) {
    next(error);
  }
};

// ⚠️ ASEGÚRATE DE EXPORTAR TODAS LAS FUNCIÓNES AQUÍ:
module.exports = {
  obtenerPlanesEspecificos,
  crearPlanEspecifico,
  modificarPlanEspecifico,
  eliminarPlanEspecifico
};