const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { getJwtSecret } = require('../lib/jwt');

const autenticarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

const autorizarRoles = (...rolesPermitidos) => {
  return async (req, res, next) => {
    if (!req.usuario || typeof req.usuario.rut !== 'string' || !req.usuario.rut) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
    }

    let usuario;
    try {
      usuario = await prisma.usuario.findUnique({
        where: { rut: req.usuario.rut },
        select: { gerenteGeneral: true, personalOperaciones: true },
      });
    } catch (error) {
      return next(error);
    }

    const roles = [];
    if (usuario?.gerenteGeneral) roles.push('GERENTE_GENERAL');
    if (usuario?.personalOperaciones) roles.push('PERSONAL_OPERACIONES');

    if (!rolesPermitidos.some(rol => roles.includes(rol))) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
    }
    next();
  };
};

module.exports = {
  autenticarToken,
  autorizarRoles,
};
