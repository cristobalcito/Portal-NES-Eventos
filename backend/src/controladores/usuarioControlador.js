var { PrismaClient } = require('@prisma/client');
var prisma = new PrismaClient();

var obtenerUsuarios = async (req, res) => {
  try {
    var usuarios = await prisma.usuario.findMany({
      include: {
        gerenteGeneral: true,
        personalOperaciones: true,
        cliente: true,
        personalEventual: true
      }
    });

    var usuariosFormateados = usuarios.map(function(usuario) {
      var rol = 'SIN_ROL';

      if (usuario.gerenteGeneral) {
        rol = 'GERENTE_GENERAL';
      } else if (usuario.personalOperaciones) {
        rol = 'PERSONAL_OPERACIONES';
      } else if (usuario.cliente) {
        rol = 'CLIENTE';
      } else if (usuario.personalEventual) {
        rol = 'PERSONAL_EVENTUAL';
      }

      var { password, ...usuarioSinPassword } = usuario;

      return {
        ...usuarioSinPassword,
        rol: rol
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

module.exports = { obtenerUsuarios };