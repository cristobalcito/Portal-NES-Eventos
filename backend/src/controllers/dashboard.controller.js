const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const obtenerEstadisticasDashboard = async (req, res) => {
  try {
    const totalEventos = await prisma.planEspecifico.count();

    const resumenInventario = await prisma.inventario.aggregate({
      _sum: {
        disponible: true,
      },
    });

    const recursosDisponibles = resumenInventario._sum.disponible || 0;

    res.status(200).json({
      eventosActivos: totalEventos,
      aforoPromedio: 85,
      recursosDisponibles: recursosDisponibles,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    res.status(500).json({ 
      mensaje: "Error al consultar las métricas del sistema" 
    });
  }
};

module.exports = {
  obtenerEstadisticasDashboard,
};