const express = require('express');
const router = express.Router();
const { obtenerEventos } = require('../controllers/eventosControlador');

router.get('/', obtenerEventos);

module.exports = router;