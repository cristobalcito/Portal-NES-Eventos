const prisma = require('../lib/prisma');

// Busca al usuario en la base de datos y devuelve su nombre y rol
const obtenerRolUsuario = async (rut) => {
  const usuario = await prisma.usuario.findUnique({
    where: { rut },
    include: { gerenteGeneral: true, personalOperaciones: true }
  });

  if (!usuario) return null;

  // El Jefe de Operaciones es un usuario de operaciones cuya especialidad dice "jefe"
  const especialidad = usuario.personalOperaciones ? usuario.personalOperaciones.especialidad : '';

  return {
    nombre: usuario.nombre,
    esGerente: Boolean(usuario.gerenteGeneral),
    esJefeOperaciones: especialidad.toLowerCase().includes('jefe')
  };
};

// RU-3: solo el Gerente General y el Jefe de Operaciones pueden marcar un equipo como disponible
const puedeFinalizarMantencion = (usuario) => {
  if (!usuario) return false;
  return usuario.esGerente || usuario.esJefeOperaciones;
};

module.exports = { obtenerRolUsuario, puedeFinalizarMantencion };
