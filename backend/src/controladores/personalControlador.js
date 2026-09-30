const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const obtenerPersonal = async (req, res) => {
  try {
    // COMENTAMOS LA LLAMADA A LA BASE DE DATOS HASTA TENER EL .ENV
    /*
    const Personal = await prisma.planEspecifico.findMany({
      include: { horario: true }
    });
    */

    // LISTA DE PRUEBA CON TELÉFONOS INCLUIDOS
    const personalDePrueba = [
      {
        nombre: "Mateo González",
        Rut: "9876.543-2",
        Rol: "Garzón",
        fechaNacimiento: "2000-02-11",
        Estado: "No disponible",
        telefono: "+56 9 8765 4321"
      },
      {
        idPE: 2,
        nombre: "Juana Pérez",
        Rut: "12.345.678-9",
        Rol: "Coordinadora de Eventos",
        fechaNacimiento: "1990-05-20",
        Estado: "Disponible",
        telefono: "+56 9 1234 5678"
      }
    ];

    res.status(200).json(personalDePrueba);

  } catch (error) {
    console.error("Error al obtener los Personal:", error);
    res.status(500).json({ mensaje: "Error al conectarse a la base de datos" });
  }
};

module.exports = { obtenerPersonal };