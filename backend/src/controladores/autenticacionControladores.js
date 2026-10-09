// server/src/controladores/autenticacionControlador.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function loginBackend(req, res) {
  try {
    const { rut, password } = req.body;

    if (!rut || !password) {
      return res.status(400).json({ mensaje: 'El RUT y la contraseña son requeridos' });
    }

    // 1. Busca al usuario por su RUT e incluye las relaciones de ROL
    const usuario = await prisma.usuario.findUnique({
      where: { rut },
      include: {
        gerenteGeneral: true,
        personalOperaciones: true,
        cliente: true,
        personalEventual: true,
      },
    });

    if (!usuario) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }

    // 2. Validar la contraseña
    const esPasswordValida = await bcrypt.compare(password, usuario.password);
    if (!esPasswordValida) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }

    // 3. Determinar el ROL exacto en base a las relaciones activas
    let rol = 'SIN_ROL';
    if (usuario.gerenteGeneral) {
      rol = 'GERENTE_GENERAL';
    } else if (usuario.personalOperaciones) {
      rol = 'PERSONAL_OPERACIONES';
    } else if (usuario.cliente) {
      rol = 'CLIENTE';
    } else if (usuario.personalEventual) {
      rol = 'PERSONAL_EVENTUAL';
    }

    // Extraer la contraseña para no enviarla al frontend
    const { password: _, ...usuarioSinPassword } = usuario;

    // 4. Responder con los datos formateados e incluir la propiedad `rol`
    return res.json({
      mensaje: 'Autenticación exitosa',
      usuario: {
        ...usuarioSinPassword,
        rol: rol // <--- Esto permite que App.jsx reconozca el acceso
      }
    });

  } catch (error) {
    console.error('Error en loginBackend:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}