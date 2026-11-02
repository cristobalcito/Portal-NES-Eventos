const prisma = require('../lib/prisma');

// Arma un código legible a partir del id: 7 -> "EQ-007"
const crearCodigo = (id) => `EQ-${String(id).padStart(3, '0')}`;

// GET /api/estado-equipos -> catálogo de equipos con la cantidad en cada estado (RU-1)
// Requiere sesión iniciada. Los clientes no tienen acceso, solo el personal de la empresa.
const obtenerEstadoEquipos = async (req, res) => {
  try {
    // 1. Revisar que quien consulta sea personal de la empresa (no un cliente)
    const usuario = await prisma.usuario.findUnique({
      where: { rut: req.usuario.rut },
      include: { gerenteGeneral: true, personalOperaciones: true, personalEventual: true }
    });

    const esPersonal = usuario && (usuario.gerenteGeneral || usuario.personalOperaciones || usuario.personalEventual);
    if (!esPersonal) {
      return res.status(403).json({ mensaje: 'Solo el personal de la empresa puede consultar el estado de los equipos.' });
    }

    // 2. Traer los equipos del inventario junto con sus mantenciones que siguen activas
    const equipos = await prisma.inventario.findMany({
      orderBy: { producto: 'asc' },
      include: {
        mantenciones: {
          where: { estado: 'en mantención' },
          orderBy: { fechaRetornoEstimada: 'asc' }
        }
      }
    });

    // 3. Dar formato: código, cantidades y la fecha en que vuelve la próxima unidad en mantención
    const resultado = equipos.map((equipo) => ({
      id: equipo.id,
      codigo: crearCodigo(equipo.id),
      producto: equipo.producto,
      marca: equipo.marca,
      stock: equipo.stock,
      disponible: equipo.disponible,
      ocupado: equipo.ocupado,
      mantencion: equipo.mantencion,
      proximoRetorno: equipo.mantenciones.length > 0 ? equipo.mantenciones[0].fechaRetornoEstimada : null
    }));

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener el estado de los equipos:', error);
    res.status(500).json({ mensaje: 'No se pudo cargar el estado de los equipos' });
  }
};

module.exports = { obtenerEstadoEquipos };
