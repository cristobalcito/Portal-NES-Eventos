// server/src/controladores/autenticacionControlador.js

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function loginBackend(req, res) {
  try {
    const { email, rut, password } = req.body;
    
    // Permitir ingreso tanto por correo como por RUT
    const identificador = email || rut;

    if (!identificador || !password) {
      return res.status(400).json({ 
        error: 'El correo/RUT y la contraseña son requeridos' 
      });
    }

    // 1. Buscar el usuario en la base de datos con sus relaciones
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
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // TODO: Si manejas encriptación de contraseñas (ej. bcrypt), valida la clave aquí:
    // const passwordValida = await bcrypt.compare(password, usuario.password);
    // if (!passwordValida) return res.status(401).json({ error: 'Credenciales inválidas' });

    // 2. Determinar ROL de acceso
    let rol = 'SIN_ROL';
    if (usuario.gerenteGeneral || usuario.email === 'gerente@nes-eventos.cl') {
      rol = 'GERENTE_GENERAL';
    } else if (usuario.personalOperaciones) {
      rol = 'PERSONAL_OPERACIONES';
    } else if (usuario.cliente) {
      rol = 'CLIENTE';
    } else if (usuario.personalEventual) {
      rol = 'PERSONAL_EVENTUAL';
    }

    // 3. Extraer el RUT real priorizando campos de base de datos, relaciones y body
    const rutReal = 
      usuario.rut || 
      usuario.Rut || 
      usuario.RUT || 
      usuario.rut_usuario || 
      usuario.rutPersona || 
      usuario.run ||
      usuario.gerenteGeneral?.rut ||
      usuario.personalOperaciones?.rut ||
      usuario.cliente?.rut ||
      usuario.personalEventual?.rut ||
      (rut ? rut : null) || 
      'Sin RUT registrado';

    // 4. Retornar payload normalizado
    return res.json({
      token: 'jwt-token-demo', // Reemplazar con jwt.sign() en producción
      usuario: {
        id: usuario.id,
        rut: rutReal,
        nombre: usuario.nombre || usuario.Nombre || 'Usuario',
        email: usuario.email,
        rol: rol
      }
    });

  } catch (error) {
    console.error('Error en loginBackend:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor al autenticar' 
    });
  }
}