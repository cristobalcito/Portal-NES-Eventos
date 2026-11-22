const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { CRUCE_AGENDA, actualizarAlertasTrasGuardar } = require('../servicios/alertasOperativasServicio');
const {
  evaluarAjusteAsistentes,
  evaluarReprogramacionFecha
} = require('../utilidades/reglasEvento');

// Función auxiliar para validar el orden lógico del horario (opcional, pero si se envía debe cumplir Salida < Llegada < Vuelta)
const validarHorarioEvento = (horario) => {
  if (!horario) return null;

  const { horaSalida, horaLlegada, horaVuelta } = horario;
  if (!horaSalida || !horaLlegada || !horaVuelta) {
    return 'Si se incluye horario, debe contener hora de salida, llegada y vuelta.';
  }

  const salida = new Date(horaSalida);
  const llegada = new Date(horaLlegada);
  const vuelta = new Date(horaVuelta);

  if (isNaN(salida.getTime()) || isNaN(llegada.getTime()) || isNaN(vuelta.getTime())) {
    return 'El formato de las horas enviadas no es válido.';
  }

  if (llegada <= salida) {
    return 'La hora de llegada debe ser posterior a la hora de salida.';
  }

  if (vuelta <= llegada) {
    return 'La hora de vuelta debe ser posterior a la hora de llegada.';
  }

  return null;
};

// 1. Obtener todos los planes especificos / eventos para el Horario Compartido
const obtenerPlanesEspecificos = async (req, res, next) => {
  try {
    const planes = await prisma.planEspecifico.findMany({
      include: {
        horario: true,
        planBase: true
      },
      orderBy: {
        fecha: 'asc'
      }
    });

    let usuarioDb = null;
    if (req.usuario?.rut) {
      usuarioDb = await prisma.usuario.findUnique({
        where: { rut: req.usuario.rut }
      });
    }

    const rolUsuario = (req.usuario?.rol || req.usuario?.tipo || usuarioDb?.rol || '').toUpperCase();
    const esCliente =
      rolUsuario === 'CLIENTE' ||
      Boolean(req.usuario?.cliente) ||
      Boolean(usuarioDb?.cliente);

    if (esCliente) {
      const disponibilidad = planes.map((plan) => ({
        idPE: plan.idPE,
        fecha: plan.fecha,
        ocupado: true
      }));
      return res.status(200).json(disponibilidad);
    }

    res.status(200).json(planes);
  } catch (error) {
    next(error);
  }
};

// 2. Crear plan especifico
const crearPlanEspecifico = async (req, res, next) => {
  try {
    const errorHorario = validarHorarioEvento(req.body.horario);
    if (errorHorario) {
      return res.status(400).json({ exito: false, mensaje: errorHorario });
    }

    // Aquí va tu lógica existente para crear el plan específico en Prisma
  } catch (error) {
    next(error);
  }
};

// 3. Modificar plan especifico
const modificarPlanEspecifico = async (req, res, next) => {
  try {
    const errorHorario = validarHorarioEvento(req.body.horario);
    if (errorHorario) {
      return res.status(400).json({ exito: false, mensaje: errorHorario });
    }

    // Aquí va tu lógica existente para modificar el plan específico en Prisma
  } catch (error) {
    next(error);
  }
};

// 4. Eliminar plan especifico
const eliminarPlanEspecifico = async (req, res, next) => {
  try {
    // Aquí va tu lógica existente para eliminar
  } catch (error) {
    next(error);
  }
};

// 5. RF4: Ajustar asistentes de un plan especifico
const ajustarAsistentes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nuevosAsistentes } = req.body;

    const cantidadNueva = parseInt(nuevosAsistentes, 10);
    if (isNaN(cantidadNueva) || cantidadNueva <= 0) {
      return res.status(400).json({ mensaje: 'La cantidad de asistentes debe ser un numero entero mayor a 0.' });
    }

    const evento = await prisma.planEspecifico.findUnique({
      where: { idPE: parseInt(id, 10) }
    });

    if (!evento) {
      return res.status(404).json({ mensaje: 'El evento especificado no existe.' });
    }

    const asistentesActuales = evento.numPersonas || 0;
    const evaluacion = evaluarAjusteAsistentes(evento.fecha, asistentesActuales, cantidadNueva);

    if (!evaluacion.permitido) {
      return res.status(422).json({
        error: evaluacion.codigo,
        mensaje: evaluacion.mensaje
      });
    }

    const eventoActualizado = await prisma.planEspecifico.update({
      where: { idPE: parseInt(id, 10) },
      data: { numPersonas: cantidadNueva }
    });

    return res.status(200).json({
      mensaje: 'Aforo actualizado con exito.',
      evaluacion,
      evento: eventoActualizado
    });
  } catch (error) {
    next(error);
  }
};

// 6. RF5: Reprogramar fecha de un plan especifico
const reprogramarFecha = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nuevaFecha } = req.body;

    if (!nuevaFecha) {
      return res.status(400).json({ mensaje: 'Debe ingresar una nueva fecha valida.' });
    }

    const evento = await prisma.planEspecifico.findUnique({
      where: { idPE: parseInt(id, 10) }
    });

    if (!evento) {
      return res.status(404).json({ mensaje: 'El evento especificado no existe.' });
    }

    const evaluacion = evaluarReprogramacionFecha(evento.fecha);

    if (!evaluacion.permitido) {
      return res.status(422).json({
        error: evaluacion.codigo,
        mensaje: evaluacion.mensaje
      });
    }

    const fechaObj = new Date(nuevaFecha);
    const eventoActualizado = await prisma.planEspecifico.update({
      where: { idPE: parseInt(id, 10) },
      data: { fecha: fechaObj }
    });
    await actualizarAlertasTrasGuardar(CRUCE_AGENDA);

    return res.status(200).json({
      mensaje: evaluacion.mensaje,
      evaluacion,
      evento: eventoActualizado
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerPlanesEspecificos,
  crearPlanEspecifico,
  modificarPlanEspecifico,
  eliminarPlanEspecifico,
  ajustarAsistentes,
  reprogramarFecha
};
