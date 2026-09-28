var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var prisma = require('../lib/prisma'); // O la ruta correspondiente a tu instancia de Prisma

router.post('/login', async function(req, res) {
  const { email, password } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { rut: usuario.rut, email: usuario.email },
      process.env.JWT_SECRET || 'secret_key_provisoria',
      { expiresIn: '8h' }
    );

    const { password: _, ...usuarioSinPassword } = usuario;

    res.json({
      token,
      usuario: usuarioSinPassword,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;