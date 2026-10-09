// backend/src/controladores/usuarioControlador.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. OBTENER TODOS LOS USUARIOS CON SU ROL
export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: {
        gerenteGeneral: true,
        personalOperaciones: true,
        cliente: true,
        personalEventual: true
      }
    });

    // Mapeamos para aplanar la respuesta y entregar un atributo "rol" claro
    const usuariosFormateados = usuarios.map((u) => {
      let rol = 'SIN_ROL';

      if (u.gerenteGeneral) rol = 'GERENTE_GENERAL';
      else if (u.personalOperaciones) rol = 'PERSONAL_OPERACIONES';
      else if (u.cliente) rol = 'CLIENTE';
      else if (u.personalEventual) rol = 'PERSONAL_EVENTUAL';

      // Omitimos la contraseña en la respuesta por seguridad
      const { password, ...usuarioSinPassword } = u;
      
      return {
        ...usuarioSinPassword,
        rol
      };
    });

    return res.status(200).json({
      exito: true,
      datos: usuariosFormateados
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al obtener los usuarios.'
    });
  }
};