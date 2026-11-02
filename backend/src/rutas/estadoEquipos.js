const express = require('express');
const router = express.Router();
const { autenticarToken } = require('../middlewares/auth');
const { obtenerEstadoEquipos } = require('../controladores/estadoEquiposControlador');

// Solo usuarios con sesión iniciada (se verifica el token)
router.get('/', autenticarToken, obtenerEstadoEquipos);

module.exports = router;
