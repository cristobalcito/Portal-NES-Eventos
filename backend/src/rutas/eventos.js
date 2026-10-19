const express = require('express');
const router = express.Router();
const {
  obtenerEventos,
  crearEvento,
  actualizarEvento,
  eliminarEvento
} = require('../controladores/eventosControlador');

router.get('/', obtenerEventos);
router.post('/', crearEvento);
router.put('/:id', actualizarEvento);
router.delete('/:id', eliminarEvento);

module.exports = router;
