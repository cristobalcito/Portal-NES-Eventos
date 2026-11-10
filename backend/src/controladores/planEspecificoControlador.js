const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {
  evaluarAjusteAsistentes,
  evaluarReprogramacionFecha
} = require('../utilidades/reglasEvento');

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
    res.status(200).json(planes);
  } catch (error) {
    next(error);
  }
};

// 2. Crear plan especifico
const crearPlanEspecifico = async (req, res, next) => {
  try {
    // Tu logica existente para crear
  } catch (error) {
    next(error);
  }
};

// 3. Modificar plan especifico
const modificarPlanEspecifico = async (req, res, next) => {
  try {
    // Tu logica existente para modificar
  } catch (error) {
    next(error);
  }
};

// 4. Eliminar plan especifico
const eliminarPlanEspecifico = async (req, res, next) => {
  try {
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