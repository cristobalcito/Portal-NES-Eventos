const express = require('express');
const router = express.Router();
const { autenticarToken, autorizarRoles } = require('../middlewares/auth');
const { 
  obtenerPlanesBase, 
  crearPlanBase, 
  modificarPlanBase, 
  eliminarPlanBase 
} = require('../controladores/catalogoControlador');

const protegerGestionPlanes = [
  autenticarToken,
  autorizarRoles('GERENTE_GENERAL', 'PERSONAL_OPERACIONES')
];

// GET /api/catalogo/planes-base
router.get('/planes-base', obtenerPlanesBase);

// GET /api/catalogo/planes-base/permisos
router.get('/planes-base/permisos', protegerGestionPlanes, (req, res) => {
  res.json({ exito: true, puedeGestionarPlanesBase: true });
});

// POST /api/catalogo/plan-base
router.post('/plan-base', protegerGestionPlanes, crearPlanBase);

// PUT /api/catalogo/plan-base/:idPL
router.put('/plan-base/:idPL', protegerGestionPlanes, modificarPlanBase);

// DELETE /api/catalogo/plan-base/:idPL
router.delete('/plan-base/:idPL', protegerGestionPlanes, eliminarPlanBase);

module.exports = router;
