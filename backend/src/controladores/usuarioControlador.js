import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Obtener la lista completa de usuarios con su rol deducido
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

    // Mapeamos el resultado para entregar un campo "rol" explícito al frontend
    const usuariosFormateados = usuarios.map((usuario) => {
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

      // Quitamos la contraseña del objeto retornado
      const { password, ...usuarioSinPassword } = usuario;

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
      mensaje: 'Error interno al obtener la lista de usuarios.'
    });
  }
};