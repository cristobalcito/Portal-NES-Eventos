const express = require('express');
const router = express.Router();
const {
  obtenerEventos,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  importarEventos
} = require('../controladores/eventosControlador');

router.get('/', obtenerEventos);
router.post('/', crearEvento);
router.post('/importar', importarEventos);
router.put('/:id', actualizarEvento);
router.delete('/:id', eliminarEvento);

module.exports = router;
