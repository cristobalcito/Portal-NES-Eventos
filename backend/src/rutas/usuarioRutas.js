var express = require('express');
var router = express.Router();
var { obtenerUsuarios } = require('../controladores/usuarioControlador');
var { verificarGerenteGeneral } = require('../middlewares/verificarGerenteGeneral');

router.get('/', verificarGerenteGeneral, obtenerUsuarios);

module.exports = router;