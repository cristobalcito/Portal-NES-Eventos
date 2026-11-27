var express = require('express');
var router = express.Router();
var { 
  obtenerUsuarios, 
  crearUsuario, 
  modificarUsuario, 
  eliminarUsuario 
} = require('../controladores/usuarioControlador');
var { verificarGerenteGeneral } = require('../middlewares/verificarGerenteGeneral');
var { autenticarToken, autorizarRoles } = require('../middlewares/auth');

var permitirGestionUsuarios = autorizarRoles('GERENTE_GENERAL');

// Todas las rutas quedan protegidas exclusivamente para el GERENTE_GENERAL
router.get('/', autenticarToken, permitirGestionUsuarios, obtenerUsuarios);
router.post('/', autenticarToken, permitirGestionUsuarios, crearUsuario);
router.put('/:rut', autenticarToken, permitirGestionUsuarios, modificarUsuario);
router.delete('/:rut', autenticarToken, permitirGestionUsuarios, eliminarUsuario);

module.exports = router;