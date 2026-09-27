const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    // 1. Buscar usuario por email
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 2. Comparar contraseña hashed
    const esPasswordValida = await bcrypt.compare(password, usuario.password);
    if (!esPasswordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Generar token JWT
    const secret = process.env.JWT_SECRET || 'clave_secreta_para_tokens_locales';
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        rol: usuario.rol 
      },
      secret,
      { expiresIn: '8h' }
    );

    // 4. Retornar token y datos del usuario (sin el password)
    const { password: _, ...usuarioSinPassword } = usuario;

    return res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: usuarioSinPassword,
    });
  } catch (error) {
    console.error('Error en /login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;