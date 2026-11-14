const express = require('express');
const router = express.Router();
const { 
  obtenerPlanesBase, 
  crearPlanBase, 
  modificarPlanBase, 
  eliminarPlanBase 
} = require('../controladores/catalogoControlador');

// GET /api/catalogo/planes-base
router.get('/planes-base', obtenerPlanesBase);

// POST /api/catalogo/plan-base
router.post('/plan-base', crearPlanBase);

// PUT /api/catalogo/plan-base/:idPL
router.put('/plan-base/:idPL', modificarPlanBase);

// DELETE /api/catalogo/plan-base/:idPL
router.delete('/plan-base/:idPL', eliminarPlanBase);

module.exports = router;