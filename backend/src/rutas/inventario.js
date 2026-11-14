const express = require('express');
const router = express.Router();
const { 
  obtenerInventario, 
  crearProducto, 
  verificarYReservarStock 
} = require('../controladores/inventario.controlador.js');

router.get('/', obtenerInventario);
router.post('/', crearProducto);
router.post('/reservar', verificarYReservarStock);

module.exports = router;