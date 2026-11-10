
const express = require('express');
const router = express.Router();

const {
  obtenerAlertas,
  marcarAlertaLeida
} = require('../controladores/alertasControlador');

const {
  autenticarToken,
  autorizarRoles
} = require('../middlewares/auth');

const permitirGestionAlertas = autorizarRoles(
  'GERENTE_GENERAL',
  'PERSONAL_OPERACIONES'
);

// Consultar alertas logísticas
router.get(
  '/',
  autenticarToken,
  permitirGestionAlertas,
  obtenerAlertas
);

// Marcar una alerta como leída
router.patch(
  '/:id/leida',
  autenticarToken,
  permitirGestionAlertas,
  marcarAlertaLeida
);

module.exports = router;
