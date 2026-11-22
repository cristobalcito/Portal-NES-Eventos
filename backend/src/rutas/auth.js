var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var { getJwtSecret } = require('../lib/jwt');
var prisma = require('../lib/prisma');
var { normalizarRut } = require('../servicios/rutServicio');

var determinarRolUsuario = function(usuario) {
  if (!usuario) return 'SIN_ROL';
  if (usuario.gerenteGeneral) return 'GERENTE_GENERAL';
  if (usuario.personalOperaciones) return 'PERSONAL_OPERACIONES';
  if (usuario.cliente) return 'CLIENTE';
  if (usuario.personalEventual) return 'PERSONAL_EVENTUAL';
  return 'SIN_ROL';
};

router.post('/login', async function(req, res) {
  const { email, rut, password } = req.body;

  try {
    const identificador = (email || rut || '').trim();
    const rutNormalizado = normalizarRut(identificador);

    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email: identificador },
          ...(rutNormalizado ? [{ rut: rutNormalizado }] : []),
        ],
      },
      include: {
        gerenteGeneral: true,
        personalOperaciones: true,
        cliente: true,
        personalEventual: true,
      },
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const rol = determinarRolUsuario(usuario);

    const token = jwt.sign(
      { rut: usuario.rut, email: usuario.email, rol: rol },
      getJwtSecret(),
      { expiresIn: '8h' }
    );

    const { password: _, ...usuarioSinPassword } = usuario;

    res.json({
      token,
      usuario: {
        ...usuarioSinPassword,
        rol: rol,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/registro', async function(req, res) {
  const { rut, nombre, email, fono, password } = req.body;

  try {
    if (!rut || !nombre || !email || !fono || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const rutValido = normalizarRut(rut);
    if (!rutValido) {
      return res.status(400).json({
        error: 'El RUT ingresado no es válido. Usa el formato 12345678-9.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres.',
      });
    }

    const emailLimpio = email.trim().toLowerCase();
    const nombreLimpio = nombre.trim();
    const fonoLimpio = fono.trim();

    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [
          { rut: rutValido },
          { email: emailLimpio },
        ],
      },
    });

    if (usuarioExistente) {
      return res.status(400).json({
        error: 'Ya existe una cuenta registrada con ese RUT o correo electrónico.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.$transaction(async function(tx) {
      const usuarioCreado = await tx.usuario.create({
        data: {
          rut: rutValido,
          nombre: nombreLimpio,
          email: emailLimpio,
          password: hashedPassword,
        },
      });

      await tx.cliente.create({
        data: {
          rut: rutValido,
          fono: fonoLimpio,
        },
      });

      return usuarioCreado;
    });

    const rol = 'CLIENTE';

    const token = jwt.sign(
      { rut: nuevoUsuario.rut, email: nuevoUsuario.email, rol: rol },
      getJwtSecret(),
      { expiresIn: '8h' }
    );

    res.status(201).json({
      token,
      usuario: {
        rut: nuevoUsuario.rut,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        fono: fonoLimpio,
        rol: rol,
      },
    });
  } catch (error) {
    console.error('Error en registro de cliente:', error);
    res.status(500).json({ error: 'Error interno al registrar la cuenta.' });
  }
});

module.exports = router;