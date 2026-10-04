const express = require('express');
const router = express.Router();
const { obtenerPlanesBase } = require('../controllers/catalogoControlador');

// Ruta GET para obtener la lista del catálogo
// Endpoint final: /api/catalogo/planes-base
router.get('/planes-base', obtenerPlanesBase);

module.exports = router;