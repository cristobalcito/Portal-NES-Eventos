const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const obtenerInventario = async (req, res, next) => {
  try {
    const productos = await prisma.inventario.findMany();
    res.json(productos);
  } catch (error) {
    next(error);
  }
};

const crearProducto = async (req, res, next) => {
  try {
    const { producto, marca, stock, disponible, ocupado, mantencion } = req.body;

    const nuevoProducto = await prisma.inventario.create({
      data: {
        producto,
        marca,
        stock: Number(stock) || 0,
        disponible: Number(disponible) || 0,
        ocupado: Number(ocupado) || 0,
        mantencion: Number(mantencion) || 0,
      },
    });

    res.status(201).json(nuevoProducto);
  } catch (error) {
    next(error);
  }
};

// POST /api/inventario/reservar (RF8)
const verificarYReservarStock = async (req, res, next) => {
  try {
    const { idInventario, cantidadRequerida, idPE } = req.body;
    const cantidad = Number(cantidadRequerida);

    if (!idInventario || isNaN(cantidad) || cantidad <= 0) {
      return res.status(400).json({ error: "Debe especificar el articulo y una cantidad requerida valida" });
    }

    const item = await prisma.inventario.findUnique({
      where: { id: Number(idInventario) }
    });

    if (!item) {
      return res.status(404).json({ error: "El articulo de inventario no existe" });
    }

    const deficit = cantidad - item.disponible;

    if (deficit > 0) {
      return res.status(409).json({
        alertaDeficit: true,
        mensaje: `Stock insuficiente para ${item.producto}. Se requieren ${cantidad} unidades y solo hay ${item.disponible} disponibles (Deficit: ${deficit} unidades).`,
        deficit,
        disponibleActual: item.disponible,
        sugerencia: "Coordinar liberacion por mantencion o gestionar arriendo con terceros."
      });
    }

    const itemActualizado = await prisma.inventario.update({
      where: { id: Number(idInventario) },
      data: {
        disponible: item.disponible - cantidad,
        ocupado: item.ocupado + cantidad
      }
    });

    res.status(200).json({
      exito: true,
      mensaje: `Reserva exitosa de ${cantidad} unidad(es) de ${item.producto} para el evento ${idPE ? `#${idPE}` : 'programado'}.`,
      item: itemActualizado
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerInventario,
  crearProducto,
  verificarYReservarStock
};