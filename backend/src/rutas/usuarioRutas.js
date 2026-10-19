var express = require('express');
var router = express.Router();
var { 
  obtenerUsuarios, 
  crearUsuario, 
  modificarUsuario, 
  eliminarUsuario 
} = require('../controladores/usuarioControlador');
var { verificarGerenteGeneral } = require('../middlewares/verificarGerenteGeneral');

// Todas las rutas quedan protegidas exclusivamente para el GERENTE_GENERAL
router.get('/', verificarGerenteGeneral, obtenerUsuarios);
router.post('/', verificarGerenteGeneral, crearUsuario);
router.put('/:rut', verificarGerenteGeneral, modificarUsuario);
router.delete('/:rut', verificarGerenteGeneral, eliminarUsuario);

module.exports = router;