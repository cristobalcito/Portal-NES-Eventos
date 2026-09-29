const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const obtenerEventos = async (req, res) => {
  try {
    // COMENTAMOS LA LLAMADA A LA BASE DE DATOS HASTA TENER EL .ENV
    /*
    const eventos = await prisma.planEspecifico.findMany({
      include: { horario: true }
    });
    */

    // CREAMOS UNA LISTA DE PRUEBA (MOCK DATA)
    const eventosDePrueba = [
      {
        idPE: 1,
        descripcion: "Fiesta de Fin de Semestre",
        lugar: "Gimnasio Municipal",
        numPersonas: 300,
        personal: "Equipo de Operaciones A",
        fecha: "2026-11-15T20:00:00.000Z",
      },
      {
        idPE: 2,
        descripcion: "Matrimonio Civil",
        lugar: "Centro de Eventos",
        numPersonas: 120,
        personal: "Equipo de Operaciones B",
        fecha: "2026-12-05T15:00:00.000Z",
      }
    ];

    // Enviamos los datos inventados y evitamos el error
    res.status(200).json(eventosDePrueba);

  } catch (error) {
    console.error("Error al obtener los eventos:", error);
    res.status(500).json({ mensaje: "Error al conectarse a la base de datos" });
  }
};

module.exports = { obtenerEventos };