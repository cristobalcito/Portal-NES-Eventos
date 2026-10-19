var { PrismaClient } = require('@prisma/client');
var prisma = new PrismaClient();

var verificarGerenteGeneral = async (req, res, next) => {
  try {
    var rutUsuario = req.headers['x-usuario-rut'];

    if (!rutUsuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Acceso denegado. Se requiere el RUT del usuario en los encabezados.'
      });
    }

    var esGerente = await prisma.gerenteGeneral.findUnique({
      where: { rut: rutUsuario }
    });

    if (!esGerente) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Acceso denegado. Solamente el Gerente General tiene autorización para esta acción.'
      });
    }

    next();
  } catch (error) {
    console.error('Error en verificarGerenteGeneral:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno de autenticación en el servidor.'
    });
  }
};

module.exports = { verificarGerenteGeneral };