var express = require('express');
var router = express.Router();
var personalExternoControlador = require('../controladores/personalExternoControlador');

// Ruta para registrar un nuevo personal eventual (RF-FC-01)
router.post('/', personalExternoControlador.registrarPersonal);

// Ruta para listar todo el personal eventual registrado
router.get('/', personalExternoControlador.obtenerPersonal);

module.exports = router;