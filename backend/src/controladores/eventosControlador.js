const prisma = require('../lib/prisma');

// Da formato a un evento para el frontend (agrega "id" como alias de idPE)
const formatearEvento = (evento) => ({
  ...evento,
  id: evento.idPE
});

// Valida que un texto venga con contenido
const esTextoValido = (valor) => typeof valor === 'string' && valor.trim().length > 0;

// Valida que una fecha se pueda interpretar
const esFechaValida = (valor) => valor && !Number.isNaN(new Date(valor).getTime());

const obtenerEventos = async (req, res) => {
  try {
    const eventos = await prisma.planEspecifico.findMany({
      include: { horario: true },
      orderBy: { fecha: 'asc' }
    });

    res.status(200).json(eventos.map(formatearEvento));
  } catch (error) {
    console.error("Error al obtener los eventos:", error);
    res.status(500).json({ mensaje: "Error al conectarse a la base de datos" });
  }
};

// POST /api/eventos -> crea un nuevo evento (PlanEspecifico) y opcionalmente su horario
const crearEvento = async (req, res) => {
  try {
    const { descripcion, lugar, fecha, numPersonas, personal, costoTotal, horario } = req.body;
    const errores = [];

    if (!esTextoValido(descripcion)) errores.push('La descripción es obligatoria.');
    if (!esTextoValido(lugar)) errores.push('El lugar es obligatorio.');
    if (!esFechaValida(fecha)) errores.push('La fecha no es válida.');

    const personas = Number(numPersonas);
    if (!Number.isInteger(personas) || personas <= 0) {
      errores.push('El número de personas debe ser un entero mayor a 0.');
    }

    const costo = Number(costoTotal);
    if (Number.isNaN(costo) || costo < 0) {
      errores.push('El costo total debe ser un número mayor o igual a 0.');
    }

    // El horario es opcional, pero si se envía deben venir las tres horas
    let datosHorario = null;
    if (horario && (horario.horaSalida || horario.horaLlegada || horario.horaVuelta)) {
      const { horaSalida, horaLlegada, horaVuelta } = horario;
      if (!esFechaValida(horaSalida) || !esFechaValida(horaLlegada) || !esFechaValida(horaVuelta)) {
        errores.push('Si ingresas horario, debes completar hora de salida, llegada y vuelta.');
      } else {
        datosHorario = {
          horaSalida: new Date(horaSalida),
          horaLlegada: new Date(horaLlegada),
          horaVuelta: new Date(horaVuelta)
        };
      }
    }

    if (errores.length > 0) {
      return res.status(400).json({ mensaje: errores.join(' '), errores });
    }

    const nuevoEvento = await prisma.planEspecifico.create({
      data: {
        descripcion: descripcion.trim(),
        lugar: lugar.trim(),
        fecha: new Date(fecha),
        numPersonas: personas,
        personal: esTextoValido(personal) ? personal.trim() : 'No asignado',
        costoTotal: costo,
        ...(datosHorario && { horario: { create: datosHorario } })
      },
      include: { horario: true }
    });

    res.status(201).json(formatearEvento(nuevoEvento));
  } catch (error) {
    console.error("Error al crear el evento:", error);
    res.status(500).json({ mensaje: "No se pudo crear el evento" });
  }
};

module.exports = { obtenerEventos, crearEvento };
