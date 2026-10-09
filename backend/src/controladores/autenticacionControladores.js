//src/controladores/autenticacionControlador.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function loginBackend(req, res) {
  try {
    const { email, rut, password } = req.body;
    const identificador = email || rut;

    if (!identificador || !password) {
      return res.status(400).json({ error: 'El correo/RUT y la contraseña son requeridos' });
    }

    // 1. Busca al usuario por Email o RUT e incluye las relaciones de ROL
    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email: identificador },
          { rut: identificador }
        ]
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

    // 2. Validar la contraseña (si usas contraseñas en plano para desarrollo o bcrypt)
    // Si usas bcrypt:
    const esPasswordValida = await bcrypt.compare(password, usuario.password).catch(() => usuario.password === password);
    // Si no usas bcrypt aún: const esPasswordValida = usuario.password === password;

    if (!esPasswordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Determinar el ROL exacto según las tablas asociadas
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

    // Quitar password del objeto devuelto
    const { password: _, ...usuarioSinPassword } = usuario;

    // 4. Retornar el objeto usuario completo con el rol explícito
    return res.json({
      token: 'jwt-token-demo', // Si utilizas JWT pon tu token aquí
      usuario: {
        ...usuarioSinPassword,
        rol: rol
      }
    });

  } catch (error) {
    console.error('Error en loginBackend:', error);
    return res.status(500).json({ error: 'Error interno del servidor al autenticar' });
  }
}