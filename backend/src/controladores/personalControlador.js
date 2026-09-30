const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

<<<<<<< Updated upstream
const obtenerPersonal = async (req, res) => {
  try {
    // COMENTAMOS LA LLAMADA A LA BASE DE DATOS HASTA TENER EL .ENV
    /*
    const Personal = await prisma.planEspecifico.findMany({
      include: { horario: true }
    });
    */

    // LISTA DE PRUEBA CON TELÉFONOS INCLUIDOS
=======
// 1. Función para obtener la lista de personal
const obtenerPersonal = async (req, res) => {
  try {
    // Datos de prueba temporales mientras se conecta Prisma
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        idPE: 2,
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    console.error("Error al obtener los Personal:", error);
    res.status(500).json({ mensaje: "Error al conectarse a la base de datos" });
  }
};

module.exports = { obtenerPersonal };
=======
    console.error("Error al obtener el personal:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 2. Función para registrar nuevo personal
const crearPersonal = async (req, res) => {
  try {
    const { nombre, rut, rol, fechaNacimiento, estado, telefono } = req.body;

    const nuevoRegistro = {
      nombre,
      Rut: rut,
      Rol: rol,
      fechaNacimiento,
      Estado: estado || 'Disponible',
      telefono
    };

    res.status(201).json(nuevoRegistro);

  } catch (error) {
    console.error("Error al crear personal:", error);
    res.status(500).json({ error: "Error al guardar el personal" });
  }
};

// 3. Exportar ambas funciones al final
module.exports = {
  obtenerPersonal,
  crearPersonal
};

>>>>>>> Stashed changes
