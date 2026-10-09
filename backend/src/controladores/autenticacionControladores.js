// server/src/controladores/autenticacionControlador.js
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

    // 1. Buscar usuario e incluir las relaciones asociadas
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

    // 2. Validar contraseña
    let esPasswordValida = false;
    try {
      esPasswordValida = await bcrypt.compare(password, usuario.password);
    } catch {
      esPasswordValida = false;
    }

    if (!esPasswordValida && usuario.password === password) {
      esPasswordValida = true;
    }

    if (!esPasswordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Determinar el ROL exacto
    let rol = 'SIN_ROL';

    if (usuario.gerenteGeneral) {
      rol = 'GERENTE_GENERAL';
    } else if (usuario.personalOperaciones) {
      rol = 'PERSONAL_OPERACIONES';
    } else if (usuario.cliente) {
      rol = 'CLIENTE';
    } else if (usuario.personalEventual) {
      rol = 'PERSONAL_EVENTUAL';
    } else if (usuario.email === 'gerente@nes-eventos.cl' || usuario.rut === '12345678-9') {
      // Respaldo de seguridad si falta el registro en la tabla GerenteGeneral
      rol = 'GERENTE_GENERAL';
    }

    // 4. Enviar respuesta con el rol asignado
    return res.json({
      token: 'jwt-token-demo',
      usuario: {
        id: usuario.id,
        rut: usuario.rut,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono || '',
        rol: rol
      }
    });

  } catch (error) {
    console.error('Error en loginBackend:', error);
    return res.status(500).json({ error: 'Error interno del servidor al autenticar' });
  }
}