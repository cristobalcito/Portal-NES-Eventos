const express = require('express');
const router = express.Router();
const {
  crearPlanEspecifico,
  modificarPlanEspecifico,
  eliminarPlanEspecifico,
  obtenerPlanesEspecificos 
} = require('../controladores/planEspecificoControlador');

// GET /api/planes-especificos
// Obtiene la lista completa de planes específicos / eventos para el horario compartido
router.get('/', obtenerPlanesEspecificos); 

// POST /api/planes-especificos
router.post('/', crearPlanEspecifico);

// PUT /api/planes-especificos/:idPE
router.put('/:idPE', modificarPlanEspecifico);

// DELETE /api/planes-especificos/:idPE
router.delete('/:idPE', eliminarPlanEspecifico);

module.exports = router;