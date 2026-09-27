var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({ mensaje: 'API NES-Eventos funcionando correctamente' });
});

module.exports = router;