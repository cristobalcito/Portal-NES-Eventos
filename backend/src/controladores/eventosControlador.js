const prisma = require('../lib/prisma');
const reglasEventos = require('../servicios/reglasEventosServicio');

const MS_POR_DIA = 1000 * 60 * 60 * 24;

// Da formato a un evento para el frontend (agrega "id" como alias de idPE)
const formatearEvento = (evento) => ({
  ...evento,
  id: evento.idPE
});

// Valida que un texto venga con contenido
const esTextoValido = (valor) => typeof valor === 'string' && valor.trim().length > 0;

// Valida que una fecha se pueda interpretar
const esFechaValida = (valor) => valor && !Number.isNaN(new Date(valor).getTime());

// Compara solo el día (sin la hora) de dos fechas
const mismoDia = (fechaA, fechaB) =>
  new Date(fechaA).toISOString().slice(0, 10) === new Date(fechaB).toISOString().slice(0, 10);

// Días que faltan para una fecha (negativo si ya pasó)
const calcularDiasRestantes = (fecha) => Math.ceil((new Date(fecha) - new Date()) / MS_POR_DIA);

// Valida los datos que vienen del formulario y los deja listos para Prisma.
// Se usa tanto para crear como para editar.
const validarDatosEvento = (body) => {
  const { descripcion, lugar, fecha, numPersonas, personal, costoTotal, horario } = body;
  const errores = [];

  if (!esTextoValido(descripcion)) errores.push('La descripción es obligatoria.');
  if (!esTextoValido(lugar)) errores.push('El lugar es obligatorio.');
  if (!esFechaValida(fecha)) errores.push('La fecha no es válida.');

  const personas = Number(numPersonas);
  if (!Number.isInteger(personas) || personas <= 0) {
    errores.push('El número de personas debe ser un entero mayor a 0.');
  }

  const costo = Number(costoTotal);
  if (costoTotal === '' || costoTotal === null || Number.isNaN(costo) || costo < 0) {
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

  if (errores.length > 0) return { errores };

  return {
    errores,
    datos: {
      descripcion: descripcion.trim(),
      lugar: lugar.trim(),
      fecha: new Date(fecha),
      numPersonas: personas,
      personal: esTextoValido(personal) ? personal.trim() : 'No asignado',
      costoTotal: costo
    },
    datosHorario
  };
};

// Lee y valida el id que viene en la URL
const obtenerId = (req) => {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// GET /api/eventos -> lista todos los eventos ordenados por fecha
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

// POST /api/eventos -> crea un nuevo evento y opcionalmente su horario
const crearEvento = async (req, res) => {
  try {
    const { errores, datos, datosHorario } = validarDatosEvento(req.body);
    if (errores.length > 0) {
      return res.status(400).json({ mensaje: errores.join(' '), errores });
    }

    const nuevoEvento = await prisma.planEspecifico.create({
      data: {
        ...datos,
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

// PUT /api/eventos/:id -> edita un evento aplicando las reglas de negocio
// de cambio de fecha y de cantidad de invitados
const actualizarEvento = async (req, res) => {
  try {
    const id = obtenerId(req);
    if (!id) return res.status(400).json({ mensaje: 'El id del evento no es válido.' });

    const eventoActual = await prisma.planEspecifico.findUnique({
      where: { idPE: id },
      include: { horario: true }
    });
    if (!eventoActual) return res.status(404).json({ mensaje: 'El evento no existe.' });

    const { errores, datos, datosHorario } = validarDatosEvento(req.body);
    if (errores.length > 0) {
      return res.status(400).json({ mensaje: errores.join(' '), errores });
    }

    const diasRestantes = calcularDiasRestantes(eventoActual.fecha);
    const avisos = [];

    // Regla de cambio de fecha
    if (!mismoDia(eventoActual.fecha, datos.fecha)) {
      const regla = reglasEventos.calcularCambioFecha(diasRestantes);
      if (!regla.permitido) return res.status(400).json({ mensaje: regla.mensaje });
      if (regla.recargo > 0) {
        datos.costoTotal = Math.round(datos.costoTotal * (1 + regla.recargo));
      }
      avisos.push(regla.mensaje);
    }

    // Regla de cambio de invitados
    if (eventoActual.numPersonas !== datos.numPersonas) {
      const regla = reglasEventos.calcularCambioInvitados(
        diasRestantes,
        eventoActual.numPersonas,
        datos.numPersonas
      );
      if (!regla.permitido) return res.status(400).json({ mensaje: regla.mensaje });
      avisos.push(regla.mensaje);
    }

    // Horario: se crea/actualiza si viene, y se elimina si se dejó vacío
    let cambioHorario;
    if (datosHorario) {
      cambioHorario = { upsert: { create: datosHorario, update: datosHorario } };
    } else if (eventoActual.horario) {
      cambioHorario = { delete: true };
    }

    const eventoEditado = await prisma.planEspecifico.update({
      where: { idPE: id },
      data: {
        ...datos,
        ...(cambioHorario && { horario: cambioHorario })
      },
      include: { horario: true }
    });

    res.status(200).json({ evento: formatearEvento(eventoEditado), avisos });
  } catch (error) {
    console.error("Error al editar el evento:", error);
    res.status(500).json({ mensaje: "No se pudo editar el evento" });
  }
};

// DELETE /api/eventos/:id -> elimina un evento (su horario se borra en cascada)
const eliminarEvento = async (req, res) => {
  try {
    const id = obtenerId(req);
    if (!id) return res.status(400).json({ mensaje: 'El id del evento no es válido.' });

    await prisma.planEspecifico.delete({ where: { idPE: id } });
    res.status(200).json({ mensaje: 'Evento eliminado correctamente.' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ mensaje: 'El evento no existe.' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({
        mensaje: 'No se puede eliminar: el evento tiene equipos arrendados asociados. Elimínalos primero.'
      });
    }
    console.error("Error al eliminar el evento:", error);
    res.status(500).json({ mensaje: "No se pudo eliminar el evento" });
  }
};

// POST /api/eventos/importar -> crea varios eventos a la vez (desde un archivo CSV)
// Recibe { eventos: [...] }, donde cada evento trae el número de "fila" del archivo.
// Guarda los eventos válidos y devuelve la lista de filas que tenían errores.
const importarEventos = async (req, res) => {
  try {
    const eventos = req.body.eventos;

    // 1. Revisar que venga una lista con eventos (máximo 200 por archivo)
    if (!Array.isArray(eventos) || eventos.length === 0) {
      return res.status(400).json({ mensaje: 'No se recibieron eventos para importar.' });
    }
    if (eventos.length > 200) {
      return res.status(400).json({ mensaje: 'Puedes importar como máximo 200 eventos por archivo.' });
    }

    const creados = [];
    const conErrores = [];

    // 2. Validar y guardar cada evento por separado
    for (const evento of eventos) {
      const { errores, datos, datosHorario } = validarDatosEvento(evento);

      if (errores.length > 0) {
        conErrores.push({ fila: evento.fila, mensaje: errores.join(' ') });
        continue;
      }

      const nuevoEvento = await prisma.planEspecifico.create({
        data: {
          ...datos,
          ...(datosHorario && { horario: { create: datosHorario } })
        },
        include: { horario: true }
      });
      creados.push(formatearEvento(nuevoEvento));
    }

    // 3. Responder cuántos se crearon y cuáles fallaron
    res.status(201).json({ creados, errores: conErrores });
  } catch (error) {
    console.error("Error al importar eventos:", error);
    res.status(500).json({ mensaje: "No se pudieron importar los eventos" });
  }
};

module.exports = { obtenerEventos, crearEvento, actualizarEvento, eliminarEvento, importarEventos };
