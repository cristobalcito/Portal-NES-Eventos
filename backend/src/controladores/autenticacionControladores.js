// server/src/controladores/autenticacionControlador.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function loginBackend(req, res) {
  const { rut, password } = req.body;

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
    return res.status(401).json({ mensaje: 'Usuario no encontrado' });
  }

  // 2. Aquí validas la contraseña (con bcrypt)
  // ...

  // 3. Responde al frontend con los datos del usuario
  return res.json({
    mensaje: 'Autenticación exitosa',
    usuario,
  });
}