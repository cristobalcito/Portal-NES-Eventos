const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/personal
const obtenerPersonal = async (req, res) => {
  try {
    const personal = await prisma.personalEventual.findMany({
      include: {
        usuario: {
          select: { nombre: true, email: true }
        }
      }
    });

    const respuestaFormateada = personal.map(p => ({
      rut: p.rut,
      nombre: p.usuario?.nombre || 'Sin Nombre',
      rol: p.rol,
      estado: p.disponibilidad,
      Estado: p.disponibilidad,
      telefono: p.fono,
      fechaNacimiento: 'No registrada'
    }));

    res.status(200).json(respuestaFormateada);
  } catch (error) {
    console.error("Error al obtener el personal:", error);
    res.status(500).json({ error: "Error interno al consultar la base de datos" });
  }
};

// POST /api/personal
const crearPersonal = async (req, res) => {
  try {
    const { nombre, rut, rol, telefono, estado } = req.body;

    if (!rut || !nombre) {
      return res.status(400).json({ error: "El RUT y Nombre son obligatorios" });
    }

    const nuevoRegistro = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          rut,
          nombre,
          email: `${rut.replace(/[^0-9kK]/g, '')}@nes.cl`,
          password: 'password123'
        }
      });

      const personal = await tx.personalEventual.create({
        data: {
          rut: usuario.rut,
          rol: rol || 'Garzón',
          disponibilidad: estado || 'Disponible',
          fono: telefono || '',
          experiencia: 'Sin registrar',
          evaluacionDesempeno: 'Buena',
          datosDePago: 'Pendiente',
          tallaDeRopa: 'M',
          notaFinal: 5.0
        }
      });

      return { usuario, personal };
    });

    res.status(201).json({
      rut: nuevoRegistro.usuario.rut,
      nombre: nuevoRegistro.usuario.nombre,
      rol: nuevoRegistro.personal.rol,
      estado: nuevoRegistro.personal.disponibilidad,
      telefono: nuevoRegistro.personal.fono
    });

  } catch (error) {
    console.error("Error al crear personal:", error);
    res.status(500).json({ error: "Error al guardar el personal en la base de datos" });
  }
};

module.exports = {
  obtenerPersonal,
  crearPersonal
};