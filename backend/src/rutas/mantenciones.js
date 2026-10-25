const express = require('express');
const router = express.Router();
const { autenticarToken } = require('../middlewares/auth');
const {
  obtenerMantenciones,
  obtenerMantencion,
  registrarMantencion,
  actualizarMantencion,
  finalizarMantencion
} = require('../controladores/mantencionesControlador');

router.get('/', obtenerMantenciones);
router.get('/:id', obtenerMantencion);
router.post('/', registrarMantencion);
router.put('/:id', actualizarMantencion);
router.patch('/:id/finalizar', autenticarToken, finalizarMantencion);

module.exports = router;
