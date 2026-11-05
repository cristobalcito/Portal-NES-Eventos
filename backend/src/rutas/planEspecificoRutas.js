const express = require('express');
const router = express.Router();
const {
  crearPlanEspecifico,
  modificarPlanEspecifico,
  eliminarPlanEspecifico
} = require('../controladores/planEspecificoControlador');

// ==============================================================================
// RUTAS DE PLANES ESPECÍFICOS / EVENTOS
// Permite la gestión por parte de Gerente General y Encargado Comercial (RBAC)
// ==============================================================================

// POST /api/planes-especificos (o /api/eventos según el alias en server.js)
// Crea un nuevo plan específico reservando inventario y aplicando regla de 14 días
router.post('/', crearPlanEspecifico);

// PUT /api/planes-especificos/:idPE
// Modifica un plan (aplica recargo del 5% entre 7 y 13 días, bloquea a menos de 7 días)
router.put('/:idPE', modificarPlanEspecifico);

// DELETE /api/planes-especificos/:idPE
// Cancela/elimina un plan (reembolso del 50% si es a menos de 7 días)
router.delete('/:idPE', eliminarPlanEspecifico);

module.exports = router;