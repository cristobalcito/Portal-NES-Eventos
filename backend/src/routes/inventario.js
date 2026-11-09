const express = require('express');
const router = express.Router();
const { obtenerInventario, crearProducto } = require('../controllers/inventario.controlador.js');

router.get('/', obtenerInventario);
router.post('/', crearProducto);

module.exports = router;