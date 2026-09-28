const { Router } = require('express');
const prisma = require('../lib/prisma');
const { autenticarToken } = require('../middlewares/auth');

const router = Router();

// autenticar
router.use(autenticarToken);

// crear cliente
router.post('/', async (req, res) => {
  try {
    const { rut, nombre, email, telefono } = req.body;

    if (!rut || !nombre || !email) {
      return res.status(400).json({ error: 'RUT, nombre y email son obligatorios' });
    }

    const clienteExistente = await prisma.cliente.findUnique({ where: { rut } });
    if (clienteExistente) {
      return res.status(400).json({ error: 'Ya existe un cliente registrado con este RUT' });
    }

    const nuevoCliente = await prisma.cliente.create({
      data: { rut, nombre, email, telefono },
    });

    return res.status(201).json(nuevoCliente);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return res.status(500).json({ error: 'Error al registrar el cliente' });
  }
});

// listar clientes
router.get('/', async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { nombre: 'asc' },
    });
    return res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return res.status(500).json({ error: 'Error al obtener la lista de clientes' });
  }
});

// detalle por RUT
router.get('/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    const cliente = await prisma.cliente.findUnique({
      where: { rut },
      include: {
        eventos: true,
        alertas: true,
      },
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    return res.json(cliente);
  } catch (error) {
    console.error('Error al buscar cliente:', error);
    return res.status(500).json({ error: 'Error al buscar el cliente' });
  }
});

router.put('/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    const { nombre, email, telefono } = req.body;

    const clienteActualizado = await prisma.cliente.update({
      where: { rut },
      data: { nombre, email, telefono },
    });

    return res.json(clienteActualizado);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return res.status(500).json({ error: 'Error al actualizar el cliente' });
  }
});

module.exports = router;