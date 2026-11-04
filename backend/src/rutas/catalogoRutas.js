const express = require('express');
const router = express.Router();
const { obtenerPlanesBase,modificarPlanBase } = require('../controladores/catalogoControlador');


router.get('/planes-base', obtenerPlanesBase);
router.put('/modificar-plan-base', modificarPlanBase);

module.exports = router;