const express = require('express');
const router = express.Router();
const { obtenerPersonal, crearPersonal } = require('../controladores/personalControlador');

router.get('/', obtenerPersonal);
router.post('/', crearPersonal);

module.exports = router;