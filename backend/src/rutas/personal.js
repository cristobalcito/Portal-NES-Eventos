const express = require('express');
const router = express.Router();
const {
  obtenerPersonal,
  crearPersonal,
  asignarPersonalAEvento
} = require('../controladores/personalControlador');

router.get('/', obtenerPersonal);
router.post('/', crearPersonal);
router.post('/asignar', asignarPersonalAEvento);

module.exports = router;