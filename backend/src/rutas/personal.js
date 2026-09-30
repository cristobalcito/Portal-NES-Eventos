const express = require('express');
const router = express.Router();
const { obtenerPersonal } = require('../controladores/personalControlador');

router.get('/', obtenerPersonal);

module.exports = router;
