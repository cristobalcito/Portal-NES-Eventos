const { Router } = require('express');
const { obtenerEstadisticasDashboard } = require('../controllers/dashboard.controller.js');

const router = Router();

router.get('/stats', obtenerEstadisticasDashboard);

module.exports = router;