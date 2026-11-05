const express = require('express');
const router = express.Router();
const { obtenerPlanesBase, modificarPlanBase } = require('../controladores/catalogoControlador');

// GET /api/catalogo/planes-base
router.get('/planes-base', obtenerPlanesBase);

// PUT /api/catalogo/plan-base/:idPL
router.put('/plan-base/:idPL', modificarPlanBase);

module.exports = router;