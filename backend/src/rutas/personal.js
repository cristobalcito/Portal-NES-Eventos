var express = require('express');
var router = express.Router();
var { PrismaClient } = require('@prisma/client');
var prisma = new PrismaClient();

router.get('/', async function(req, res, next) {
  try {
    const personal = await prisma.usuario.findMany({
      select: {
        rut: true,
        nombre: true,
        email: true,
        personalEventual: true
      }
    });

    res.json(personal);
  } catch (error) {
    next(error);
  }
});

module.exports = router;