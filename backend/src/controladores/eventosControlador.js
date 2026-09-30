const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const obtenerEventos = async (req, res) => {
  try {
    const eventos = await prisma.planEspecifico.findMany({
      include: { horario: true },
      orderBy: { fecha: 'asc' }
    });

    const eventosFormato = eventos.map((e) => ({
      ...e,
      id: e.idPE
    }));

    res.status(200).json(eventosFormato);
    
  } catch (error) {
    console.error("Error al obtener los eventos:", error);
    res.status(500).json({ mensaje: "Error al conectarse a la base de datos" });
  }
};

module.exports = { obtenerEventos };