const express = require('express');
const router = express.Router();
const {
  obtenerEventos,
  crearEvento,
  actualizarEvento,
  actualizarAsistencia,
  eliminarEvento,
  importarEventos
} = require('../controladores/eventosControlador');

router.get('/', obtenerEventos);
router.post('/', crearEvento);
router.post('/importar', importarEventos);
router.put('/:id', actualizarEvento);
router.patch('/:id/asistencia', actualizarAsistencia);
router.delete('/:id', eliminarEvento);

module.exports = router;