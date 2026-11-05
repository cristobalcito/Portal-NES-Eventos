const express = require('express');
const router = express.Router();
const {
  crearPlanEspecifico,
  modificarPlanEspecifico
} = require('../controladores/planEspecificoControlador');

// POST /api/planes-especificos -> Crear un plan específico
router.post('/', crearPlanEspecifico);

// PUT /api/planes-especificos/:idPE -> Modificar un plan específico (aplica reglas de 1-2 semanas)
router.put('/:idPE', modificarPlanEspecifico);

module.exports = router;