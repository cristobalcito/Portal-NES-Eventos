const express = require('express');
const router = express.Router();
const {
  crearPlanEspecifico,
  modificarPlanEspecifico,
  eliminarPlanEspecifico
} = require('../controladores/planEspecificoControlador');

// POST /api/planes-especificos -> Crear
router.post('/', crearPlanEspecifico);

// PUT /api/planes-especificos/:idPE -> Modificar
router.put('/:idPE', modificarPlanEspecifico);

// DELETE /api/planes-especificos/:idPE -> Eliminar/Cancelar
router.delete('/:idPE', eliminarPlanEspecifico);

module.exports = router;