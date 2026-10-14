// backend/src/rutas/reglasEventosRutas.js

var express = require('express');
var router = express.Router();
var reglasControlador = require('../controladores/reglasEventosControlador');

router.post('/validar-fecha', reglasControlador.validarCambioFecha);
router.post('/validar-invitados', reglasControlador.validarCambioInvitados);

module.exports = router;