const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
const { normalizarRut } = require('../servicios/rutServicio');

// Carpeta donde se guardan los documentos de garantía
const CARPETA_GARANTIAS = path.join(__dirname, '..', '..', 'uploads', 'garantias');

// Datos del proveedor y del evento que se incluyen junto a cada equipo
const datosRelacionados = {
  proveedor: true,
  evento: { select: { idPE: true, descripcion: true, fecha: true } }
};

const esTextoValido = (valor) => typeof valor === 'string' && valor.trim() !== '';
const esFechaValida = (valor) => valor && !isNaN(new Date(valor).getTime());

// Borra un archivo de garantía (por ejemplo, si el formulario tenía errores)
const borrarArchivo = (nombreArchivo) => {
  if (nombreArchivo) {
    fs.unlink(path.join(CARPETA_GARANTIAS, nombreArchivo), () => {});
  }
};

// Indica cómo va el plazo de devolución: devuelto, atrasado, por vencer (menos de 24 h) o vigente
const calcularEstadoPlazo = (equipo) => {
  if (equipo.estado === 'devuelto') return 'devuelto';

  const horasRestantes = (new Date(equipo.fechaDevolucion) - new Date()) / (1000 * 60 * 60);
  if (horasRestantes < 0) return 'atrasado';
  if (horasRestantes <= 24) return 'por vencer';
  return 'vigente';
};

const agregarEstadoPlazo = (equipo) => ({ ...equipo, estadoPlazo: calcularEstadoPlazo(equipo) });

// GET /api/equipos-arrendados -> lista los equipos arrendados
const obtenerEquiposArrendados = async (req, res) => {
  try {
    const equipos = await prisma.equipoArrendado.findMany({
      include: datosRelacionados,
      orderBy: { fechaDevolucion: 'asc' }
    });
    res.json(equipos.map(agregarEstadoPlazo));
  } catch (error) {
    console.error('Error al obtener equipos arrendados:', error);
    res.status(500).json({ mensaje: 'No se pudieron cargar los equipos arrendados' });
  }
};

// POST /api/equipos-arrendados -> registra un equipo arrendado (RU-4)
// Los datos llegan como formulario con archivo: el texto en req.body y la garantía en req.file
const registrarEquipoArrendado = async (req, res) => {
  const datos = req.body;
  const archivo = req.file;

  try {
    // 1. Validar los datos del formulario
    const errores = [];
    const rutProveedor = normalizarRut(datos.proveedorRut);
    const cantidad = Number(datos.cantidad);
    const costo = Number(datos.costo);
    const eventoId = Number(datos.eventoId);

    if (!esTextoValido(datos.proveedorNombre)) errores.push('El nombre del proveedor es obligatorio.');
    if (!rutProveedor) errores.push('El RUT del proveedor no es válido.');
    if (!esTextoValido(datos.proveedorContacto)) errores.push('El contacto del proveedor es obligatorio.');
    if (!esTextoValido(datos.nombreEquipo)) errores.push('El nombre del equipo es obligatorio.');
    if (!esTextoValido(datos.codigoEquipo)) errores.push('El ID del equipo es obligatorio.');
    if (!Number.isInteger(cantidad) || cantidad <= 0) errores.push('La cantidad debe ser un entero mayor a 0.');
    if (datos.costo === '' || isNaN(costo) || costo < 0) errores.push('El costo debe ser un número mayor o igual a 0.');
    if (!esFechaValida(datos.fechaRetiro)) errores.push('La fecha de retiro no es válida.');
    if (!esFechaValida(datos.fechaDevolucion)) errores.push('La fecha de devolución no es válida.');
    if (new Date(datos.fechaDevolucion) < new Date(datos.fechaRetiro)) {
      errores.push('La fecha de devolución no puede ser anterior a la de retiro.');
    }
    if (!esTextoValido(datos.receptorBodega)) errores.push('Debes indicar quién recibe el equipo en bodega.');
    if (!archivo) errores.push('Debes adjuntar el documento de garantía.');
    if (!eventoId) errores.push('Debes vincular el equipo a un evento programado.');

    if (errores.length > 0) {
      borrarArchivo(archivo && archivo.filename);
      return res.status(400).json({ mensaje: errores.join(' ') });
    }

    // 2. El evento debe existir y no haber pasado
    const evento = await prisma.planEspecifico.findUnique({ where: { idPE: eventoId } });
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (!evento || new Date(evento.fecha) < hoy) {
      borrarArchivo(archivo.filename);
      return res.status(400).json({ mensaje: 'El evento seleccionado no existe o ya se realizó.' });
    }

    // 3. Guardar el proveedor (si ya existe, se actualizan sus datos)
    await prisma.proveedor.upsert({
      where: { rut: rutProveedor },
      create: { rut: rutProveedor, nombre: datos.proveedorNombre.trim(), contacto: datos.proveedorContacto.trim() },
      update: { nombre: datos.proveedorNombre.trim(), contacto: datos.proveedorContacto.trim() }
    });

    // 4. Guardar el equipo arrendado vinculado al proveedor y al evento
    const nuevoEquipo = await prisma.equipoArrendado.create({
      data: {
        nombreEquipo: datos.nombreEquipo.trim(),
        codigoEquipo: datos.codigoEquipo.trim(),
        cantidad,
        costo,
        fechaRetiro: new Date(datos.fechaRetiro),
        fechaDevolucion: new Date(datos.fechaDevolucion),
        receptorBodega: datos.receptorBodega.trim(),
        garantiaArchivo: archivo.filename,
        garantiaNombre: archivo.originalname,
        proveedorRut: rutProveedor,
        eventoId
      },
      include: datosRelacionados
    });

    // 5. Sumar el costo del arriendo al presupuesto del evento
    await prisma.planEspecifico.update({
      where: { idPE: eventoId },
      data: { costoTotal: evento.costoTotal + costo }
    });

    res.status(201).json(agregarEstadoPlazo(nuevoEquipo));
  } catch (error) {
    borrarArchivo(archivo && archivo.filename);
    console.error('Error al registrar equipo arrendado:', error);
    res.status(500).json({ mensaje: 'No se pudo registrar el equipo arrendado' });
  }
};

// PATCH /api/equipos-arrendados/:id/devolver -> marca el equipo como devuelto al proveedor
const marcarDevuelto = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const equipo = await prisma.equipoArrendado.findUnique({ where: { id } });

    if (!equipo) {
      return res.status(404).json({ mensaje: 'El equipo arrendado no existe.' });
    }
    if (equipo.estado === 'devuelto') {
      return res.status(400).json({ mensaje: 'Este equipo ya fue devuelto.' });
    }

    const equipoDevuelto = await prisma.equipoArrendado.update({
      where: { id },
      data: { estado: 'devuelto', fechaDevolucionReal: new Date() },
      include: datosRelacionados
    });

    res.json(agregarEstadoPlazo(equipoDevuelto));
  } catch (error) {
    console.error('Error al marcar devolución:', error);
    res.status(500).json({ mensaje: 'No se pudo marcar como devuelto' });
  }
};

// DELETE /api/equipos-arrendados/:id -> elimina el registro y descuenta su costo del evento
const eliminarEquipoArrendado = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const equipo = await prisma.equipoArrendado.findUnique({ where: { id } });

    if (!equipo) {
      return res.status(404).json({ mensaje: 'El equipo arrendado no existe.' });
    }

    // 1. Descontar el costo del presupuesto del evento
    const evento = await prisma.planEspecifico.findUnique({ where: { idPE: equipo.eventoId } });
    await prisma.planEspecifico.update({
      where: { idPE: equipo.eventoId },
      data: { costoTotal: evento.costoTotal - equipo.costo }
    });

    // 2. Borrar el registro y su archivo de garantía
    await prisma.equipoArrendado.delete({ where: { id } });
    borrarArchivo(equipo.garantiaArchivo);

    res.json({ mensaje: 'Registro eliminado y costo descontado del evento.' });
  } catch (error) {
    console.error('Error al eliminar equipo arrendado:', error);
    res.status(500).json({ mensaje: 'No se pudo eliminar el registro' });
  }
};

// GET /api/equipos-arrendados/:id/garantia -> descarga el documento de garantía
const descargarGarantia = async (req, res) => {
  try {
    const equipo = await prisma.equipoArrendado.findUnique({ where: { id: Number(req.params.id) } });

    if (!equipo) {
      return res.status(404).json({ mensaje: 'El equipo arrendado no existe.' });
    }

    const rutaArchivo = path.join(CARPETA_GARANTIAS, equipo.garantiaArchivo);
    if (!fs.existsSync(rutaArchivo)) {
      return res.status(404).json({ mensaje: 'El archivo de garantía no se encuentra.' });
    }

    res.download(rutaArchivo, equipo.garantiaNombre);
  } catch (error) {
    console.error('Error al descargar garantía:', error);
    res.status(500).json({ mensaje: 'No se pudo descargar la garantía' });
  }
};

module.exports = {
  CARPETA_GARANTIAS,
  obtenerEquiposArrendados,
  registrarEquipoArrendado,
  marcarDevuelto,
  eliminarEquipoArrendado,
  descargarGarantia
};
