const express = require('express');
const router = express.Router();
const { obtenerEventos, crearEvento } = require('../controladores/eventosControlador');

router.get('/', obtenerEventos);
router.post('/', crearEvento);

module.exports = router;
