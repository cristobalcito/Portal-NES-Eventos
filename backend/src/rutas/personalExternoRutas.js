var express = require('express');
var router = express.Router();
var personalExternoControlador = require('../controladores/personalExternoControlador');
var { autenticarToken, autorizarRoles } = require('../middlewares/auth');
var permitirGestionPersonal = autorizarRoles('GERENTE_GENERAL', 'PERSONAL_OPERACIONES');

// Ruta para listar todo el personal eventual registrado
router.get('/', autenticarToken, permitirGestionPersonal, personalExternoControlador.obtenerPersonal);

// Ruta para actualizar todo el personal eventual registrado
router.patch('/:rut', autenticarToken, permitirGestionPersonal, personalExternoControlador.registrarPersonal);

module.exports = router;
