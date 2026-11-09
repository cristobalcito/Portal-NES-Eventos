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

// Exportamos las funciones al estilo CommonJS
module.exports = {
  obtenerInventario,
  crearProducto
};