const prisma = require('../lib/prisma');
const { obtenerRolUsuario, puedeFinalizarMantencion } = require('../servicios/permisosServicio');

const datosEquipo = { inventario: { select: { id: true, producto: true, marca: true } } };

const esTextoValido = (valor) => typeof valor === 'string' && valor.trim() !== '';
const esFechaValida = (valor) => valor && !isNaN(new Date(valor).getTime());

const agregarAtraso = (mantencion) => ({
  ...mantencion,
  atrasada: mantencion.estado === 'en mantención' && new Date() > new Date(mantencion.fechaRetornoEstimada)
});

const validarDatos = (datos) => {
  const errores = [];

  if (!esTextoValido(datos.falla)) errores.push('Debes describir la falla reportada.');
  if (!esTextoValido(datos.aprobadoPor)) errores.push('Debes indicar quién aprobó el gasto.');
  if (!esFechaValida(datos.fechaEnvio)) errores.push('La fecha de envío no es válida.');
  if (!esFechaValida(datos.fechaRetornoEstimada)) errores.push('La fecha de retorno estimada no es válida.');

  if (new Date(datos.fechaRetornoEstimada) < new Date(datos.fechaEnvio)) {
    errores.push('La fecha de retorno no puede ser anterior a la fecha de envío.');
  }

  const costo = Number(datos.costoReparacion);
  if (datos.costoReparacion === '' || isNaN(costo) || costo < 0) {
    errores.push('El costo de reparación debe ser un número mayor o igual a 0.');
  }

  return errores;
};

// GET /api/mantenciones
const obtenerMantenciones = async (req, res) => {
  try {
    const mantenciones = await prisma.mantencion.findMany({
      include: datosEquipo,
      orderBy: { fechaRetornoEstimada: 'asc' }
    });
    res.json(mantenciones.map(agregarAtraso));
  } catch (error) {
    console.error('Error al obtener mantenciones:', error);
    res.status(500).json({ mensaje: 'No se pudieron cargar las mantenciones' });
  }
};

// GET /api/mantenciones/:id
const obtenerMantencion = async (req, res) => {
  try {
    const mantencion = await prisma.mantencion.findUnique({
      where: { id: Number(req.params.id) },
      include: datosEquipo
    });

    if (!mantencion) {
      return res.status(404).json({ mensaje: 'La mantención no existe.' });
    }

    res.json(agregarAtraso(mantencion));
  } catch (error) {
    console.error('Error al obtener la mantención:', error);
    res.status(500).json({ mensaje: 'No se pudo cargar la mantención' });
  }
};

// POST /api/mantenciones (RF9)
const registrarMantencion = async (req, res) => {
  try {
    const inventarioId = Number(req.body.inventarioId);
    const cantidad = Number(req.body.cantidad);

    const errores = validarDatos(req.body);
    if (!inventarioId) errores.push('Debes seleccionar un equipo.');
    if (!Number.isInteger(cantidad) || cantidad <= 0) errores.push('La cantidad debe ser un entero mayor a 0.');

    if (errores.length > 0) {
      return res.status(400).json({ mensaje: errores.join(' ') });
    }

    const equipo = await prisma.inventario.findUnique({ where: { id: inventarioId } });

    if (!equipo) {
      return res.status(404).json({ mensaje: 'El equipo no existe en el inventario.' });
    }
    if (cantidad > equipo.disponible) {
      return res.status(400).json({
        mensaje: `Solo hay ${equipo.disponible} unidad(es) disponible(s) de "${equipo.producto}".`
      });
    }

    await prisma.inventario.update({
      where: { id: inventarioId },
      data: {
        disponible: equipo.disponible - cantidad,
        mantencion: equipo.mantencion + cantidad
      }
    });

    const nuevaMantencion = await prisma.mantencion.create({
      data: {
        inventarioId,
        cantidad,
        falla: req.body.falla.trim(),
        taller: req.body.taller || null,
        fechaEnvio: new Date(req.body.fechaEnvio),
        fechaRetornoEstimada: new Date(req.body.fechaRetornoEstimada),
        costoReparacion: Number(req.body.costoReparacion),
        aprobadoPor: req.body.aprobadoPor.trim()
      },
      include: datosEquipo
    });

    res.status(201).json(agregarAtraso(nuevaMantencion));
  } catch (error) {
    console.error('Error al registrar la mantención:', error);
    res.status(500).json({ mensaje: 'No se pudo registrar la mantención' });
  }
};

// PUT /api/mantenciones/:id
const actualizarMantencion = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const mantencion = await prisma.mantencion.findUnique({ where: { id } });

    if (!mantencion) {
      return res.status(404).json({ mensaje: 'La mantención no existe.' });
    }
    if (mantencion.estado !== 'en mantención') {
      return res.status(400).json({ mensaje: 'Solo se pueden editar equipos que siguen en mantención.' });
    }

    const errores = validarDatos(req.body);
    if (errores.length > 0) {
      return res.status(400).json({ mensaje: errores.join(' ') });
    }

    const mantencionEditada = await prisma.mantencion.update({
      where: { id },
      data: {
        falla: req.body.falla.trim(),
        taller: req.body.taller || null,
        fechaEnvio: new Date(req.body.fechaEnvio),
        fechaRetornoEstimada: new Date(req.body.fechaRetornoEstimada),
        costoReparacion: Number(req.body.costoReparacion),
        aprobadoPor: req.body.aprobadoPor.trim()
      },
      include: datosEquipo
    });

    res.json(agregarAtraso(mantencionEditada));
  } catch (error) {
    console.error('Error al editar la mantención:', error);
    res.status(500).json({ mensaje: 'No se pudo editar la mantención' });
  }
};

// PATCH /api/mantenciones/:id/finalizar (RF9 - Alta de equipo)
const finalizarMantencion = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const usuario = await obtenerRolUsuario(req.usuario.rut);
    if (!puedeFinalizarMantencion(usuario)) {
      return res.status(403).json({
        mensaje: 'Solo el Gerente General o el Jefe de Operaciones pueden marcar un equipo como disponible.'
      });
    }

    const mantencion = await prisma.mantencion.findUnique({ where: { id } });

    if (!mantencion) {
      return res.status(404).json({ mensaje: 'La mantención no existe.' });
    }
    if (mantencion.estado !== 'en mantención') {
      return res.status(400).json({ mensaje: 'Esta mantención ya fue finalizada.' });
    }

    const equipo = await prisma.inventario.findUnique({ where: { id: mantencion.inventarioId } });

    await prisma.inventario.update({
      where: { id: equipo.id },
      data: {
        mantencion: Math.max(0, equipo.mantencion - mantencion.cantidad),
        disponible: equipo.disponible + mantencion.cantidad
      }
    });

    const mantencionFinalizada = await prisma.mantencion.update({
      where: { id },
      data: {
        estado: 'finalizada',
        fechaRetornoReal: new Date(),
        finalizadoPor: usuario.nombre
      },
      include: datosEquipo
    });

    res.json(agregarAtraso(mantencionFinalizada));
  } catch (error) {
    console.error('Error al finalizar la mantención:', error);
    res.status(500).json({ mensaje: 'No se pudo finalizar la mantención' });
  }
};

module.exports = {
  obtenerMantenciones,
  obtenerMantencion,
  registrarMantencion,
  actualizarMantencion,
  finalizarMantencion
};