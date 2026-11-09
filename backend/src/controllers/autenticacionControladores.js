const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const loginBackend = async (req, res) => {
  try {
    // 1. Recibir email o rut desde req.body (Login.jsx envía 'email')
    const { email, rut, identificador, password } = req.body;
    const busqueda = email || rut || identificador;

    if (!busqueda) {
      return res.status(400).json({ error: 'Debe ingresar correo o RUT' });
    }

    // 2. Buscar usuario por email o RUT e incluir las tablas de roles
    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email: busqueda },
          { rut: busqueda }
        ]
      },
      include: {
        gerenteGeneral: true,
        personalOperaciones: true,
        personalEventual: true,
        cliente: true,
      },
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // 3. Determinar el ROL dinámicamente según la relación existente en Prisma
    let rolCalculado = 'CLIENTE';

    if (usuario.gerenteGeneral) {
      rolCalculado = 'GERENTE_GENERAL';
    } else if (usuario.personalOperaciones) {
      rolCalculado = 'PERSONAL_OPERACIONES';
    } else if (usuario.personalEventual) {
      rolCalculado = 'PERSONAL_EVENTUAL';
    } else if (usuario.cliente) {
      rolCalculado = 'CLIENTE';
    }

    // 4. Retornar el objeto con la propiedad 'rol' explícita para el frontend
    return res.status(200).json({
      mensaje: 'Autenticación exitosa',
      token: 'jwt-token-simulado-nes', // Requerido por App.jsx
      usuario: {
        rut: usuario.rut,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: rolCalculado, // <-- Inyecta 'GERENTE_GENERAL'
      },
    });
  } catch (error) {
    console.error('Error en loginBackend:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  loginBackend,
};