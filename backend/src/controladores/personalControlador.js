const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const obtenerPersonal = async (req, res) => {
  try {
    const personal = await prisma.usuario.findMany({
      select: {
        idU: true,
        nombre: true,
        rut: true,
        correo: true,
        rol: true
      }
    });

    const personalFormateado = personal.map((p) => ({
      ...p,
      id: p.idU
    }));

    res.status(200).json(personalFormateado);
  } catch (error) {
    console.error("Error al obtener el personal:", error);
    res.status(500).json({ mensaje: "Error al consultar el personal" });
  }
};

module.exports = { obtenerPersonal };