import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function loginBackend(req, res) {
  try {
    const { email, rut, password } = req.body;
    const identificador = email || rut;

    // 1. Validar que vengan los datos necesarios
    if (!identificador || !password) {
      return res.status(400).json({ error: 'El correo/RUT y la contraseña son requeridos' });
    }

    // 2. Buscar al usuario en la base de datos e incluir las tablas asociadas para determinar el rol
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

    // 3. Validar la contraseña (soporta hash bcrypt o texto en plano)
    let esPasswordValida = false;
    try {
      esPasswordValida = await bcrypt.compare(password, usuario.password);
    } catch {
      esPasswordValida = false;
    }

    // Respaldo en caso de que la contraseña esté almacenada en texto plano
    if (!esPasswordValida && usuario.password === password) {
      esPasswordValida = true;
    }

    if (!esPasswordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 4. Determinar el ROL exacto según las relaciones
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

    // 5. Retornar la respuesta con la estructura exacta que espera el Frontend
    return res.json({
      token: 'jwt-token-demo', // Si utilizas un token JWT generado, colócalo aquí
      usuario: {
        id: usuario.id,
        rut: usuario.rut,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono || '',
        rol: rol // Propiedad indispensable para App.jsx
      }
    });

  } catch (error) {
    console.error('Error en loginBackend:', error);
    return res.status(500).json({ error: 'Error interno del servidor al autenticar' });
  }
}