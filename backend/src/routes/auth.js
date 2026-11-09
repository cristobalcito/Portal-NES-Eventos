var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var prisma = require('../lib/prisma'); // O la ruta correspondiente a tu instancia de Prisma

router.post('/login', async function(req, res) {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario e incluir las tablas de roles
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: {
        gerenteGeneral: true,
        personalOperaciones: true,
        personalEventual: true,
        cliente: true,
      },
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 2. Validar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Determinar el ROL dinámicamente según la relación en Prisma
    let rolCalculado = 'CLIENTE';

    if (usuario.gerenteGeneral) {
      rolCalculado = 'GERENTE_GENERAL';
    } else if (usuario.personalOperaciones) {
      rolCalculado = 'PERSONAL_OPERACIONES';
    } else if (usuario.personalEventual) {
      rolCalculado = 'PERSONAL_EVENTUAL';
    } else if (usuario.cliente) {
      rolCalculado = 'CLIENTE';
    }

    // 4. Firmar el Token JWT
    const token = jwt.sign(
      { rut: usuario.rut, email: usuario.email, rol: rolCalculado },
      process.env.JWT_SECRET || 'secret_key_provisoria',
      { expiresIn: '8h' }
    );

    // 5. Excluir la contraseña y relaciones pesadas, e inyectar 'rol'
    const { password: _, gerenteGeneral, personalOperaciones, personalEventual, cliente, ...datosBase } = usuario;

    const usuarioRespuesta = {
      ...datosBase,
      rol: rolCalculado,
    };

    res.json({
      token,
      usuario: usuarioRespuesta,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;