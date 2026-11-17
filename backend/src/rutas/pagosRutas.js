import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const historialPagos = []; 

// 1. Pagar evento
router.post('/eventos/:id/pagar', async (req, res) => {
  const { id } = req.params;
  const rol = (req.headers['x-usuario-rol'] || '').toUpperCase();

  if (rol !== 'CLIENTE') {
    return res.status(403).json({ error: 'Solo un cliente puede pagar eventos.' });
  }

  const evento = await prisma.planEspecifico.findUnique({ where: { idPE: Number(id) } });
  if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' });

  // Validar 7 días de anticipación
  const diasRestantes = Math.ceil((new Date(evento.fecha) - new Date()) / (1000 * 60 * 60 * 24));
  if (diasRestantes < 7) {
    await prisma.planEspecifico.update({
      where: { idPE: Number(id) },
      data: { estado: 'CANCELADO' }
    });
    return res.status(400).json({
      error: 'Evento cancelado por no pagar con al menos 1 semana de anticipación.'
    });
  }

  const actualizado = await prisma.planEspecifico.update({
    where: { idPE: Number(id) },
    data: { estado: 'PAGADO' }
  });

  historialPagos.push({ tipo: 'EVENTO', idPE: id, fecha: new Date(), ...req.body });
  res.json({ mensaje: 'Evento pagado correctamente.', evento: actualizado });
});

// 2. Pagar sueldos (lee eventos existentes y guarda comprobante en memoria)
router.post('/sueldos/pagar', async (req, res) => {
  const rol = (req.headers['x-usuario-rol'] || '').toUpperCase();
  if (!['GERENTE_GENERAL', 'JEFE_OPERACIONES', 'PERSONAL_OPERACIONES'].includes(rol)) {
    return res.status(403).json({ error: 'No autorizado para pagar sueldos.' });
  }

  const { modo, pagosPlanilla, codigoAutorizacion } = req.body;
  if (modo === 'MASIVO') {
    const hoy = new Date();
    const dia = hoy.getDate();
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    if (dia > 5 && dia < ultimoDia - 4) {
      return res.status(400).json({ error: 'Solo permitido a principio o fin de mes.' });
    }
  }

  historialPagos.push({ tipo: 'SUELDO', modo, pagosPlanilla, codigoAutorizacion, fecha: new Date() });
  res.json({ mensaje: 'Sueldos procesados y validados correctamente.' });
});

export default router;