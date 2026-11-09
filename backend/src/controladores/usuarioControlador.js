var { PrismaClient } = require('@prisma/client');
var prisma = new PrismaClient();
var bcrypt = require('bcrypt'); // Asegurar importación para hash de contraseña
var { normalizarRut } = require('../servicios/rutServicio'); // Importar normalizador

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

      if (usuario.gerenteGeneral && (!Array.isArray(usuario.gerenteGeneral) || usuario.gerenteGeneral.length > 0)) {
        rol = 'GERENTE_GENERAL';
      } else if (usuario.personalOperaciones && (!Array.isArray(usuario.personalOperaciones) || usuario.personalOperaciones.length > 0)) {
        rol = 'PERSONAL_OPERACIONES';
      } else if (usuario.cliente && (!Array.isArray(usuario.cliente) || usuario.cliente.length > 0)) {
        rol = 'CLIENTE';
      } else if (usuario.personalEventual && (!Array.isArray(usuario.personalEventual) || usuario.personalEventual.length > 0)) {
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

var crearUsuario = async (req, res) => {
  try {
    var { rut, nombre, email, password, rol } = req.body;

    // 1. Validar y normalizar el RUT al formato XXXXXXXX-X
    var rutValido = normalizarRut(rut);
    if (!rutValido) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El RUT ingresado no es válido. Debe tener entre 7 y 8 números sin letras antes del guión (ej: 12345678-9).'
      });
    }

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Todos los campos son obligatorios.'
      });
    }

    // 2. Verificar duplicados usando el RUT ya normalizado
    var usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [
          { rut: rutValido },
          { email: email }
        ]
      }
    });

    if (usuarioExistente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe una cuenta registrada con ese RUT o Email.'
      });
    }

    // 4. Encriptar contraseña
    var hashedPassword = await bcrypt.hash(password, 10);

    // 3. Guardar en la base de datos con el RUT normalizado
    var nuevoUsuario = await prisma.$transaction(async (tx) => {
      var usuario = await tx.usuario.create({
        data: {
          rut: rutValido,
          nombre: nombre,
          email: email,
          password: hashedPassword
        }
      });

      if (rol === 'GERENTE_GENERAL') {
        await tx.gerenteGeneral.create({ data: { rut: rutValido } });
      } else if (rol === 'PERSONAL_OPERACIONES') {
        await tx.personalOperaciones.create({
          data: { rut: rutValido, especialidad: 'Operaciones Generales', fono: '' }
        });
      } else if (rol === 'CLIENTE') {
        await tx.cliente.create({ data: { rut: rutValido } });
      } else if (rol === 'PERSONAL_EVENTUAL') {
        await tx.personalEventual.create({
          data: {
            rut: rutValido,
            rol: '',
            disponibilidad: '',
            fono: '',
            experiencia: '',
            evaluacionDesempeno: '',
            datosDePago: '',
            tallaDeRopa: ''
          }
        });
      }

      return usuario;
    });

    return res.status(201).json({
      exito: true,
      mensaje: 'Usuario creado exitosamente.',
      datos: { rut: nuevoUsuario.rut, nombre: nuevoUsuario.nombre, email: nuevoUsuario.email, rol: rol }
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno al crear el usuario.' });
  }
};

var modificarUsuario = async (req, res) => {
  try {
    var { rut } = req.params;
    var { nombre, email, password, nuevoRol, nuevoRut } = req.body;

    var usuarioExiste = await prisma.usuario.findUnique({
      where: { rut: rut },
      include: {
        gerenteGeneral: true,
        personalOperaciones: true,
        cliente: true,
        personalEventual: true
      }
    });

    if (!usuarioExiste) {
      return res.status(404).json({
        exito: false,
        mensaje: 'El usuario a modificar no existe.'
      });
    }

    if (email && email !== usuarioExiste.email) {
      var emailOcupado = await prisma.usuario.findUnique({ where: { email: email } });
      if (emailOcupado) {
        return res.status(400).json({ exito: false, mensaje: 'El correo electrónico ya está registrado.' });
      }
    }

    // Si intenta cambiar a un nuevo RUT ya usado por otra cuenta
    if (nuevoRut && nuevoRut !== rut) {
      var rutOcupado = await prisma.usuario.findUnique({ where: { rut: nuevoRut } });
      if (rutOcupado) {
        return res.status(400).json({ exito: false, mensaje: 'El nuevo RUT ya está registrado.' });
      }
    }

    var rutFinal = nuevoRut || rut;
    var rolFinal = 'SIN_ROL';

    // Determinar rol actual si no se envió un nuevoRol
    if (usuarioExiste.gerenteGeneral) rolFinal = 'GERENTE_GENERAL';
    else if (usuarioExiste.personalOperaciones) rolFinal = 'PERSONAL_OPERACIONES';
    else if (usuarioExiste.cliente) rolFinal = 'CLIENTE';
    else if (usuarioExiste.personalEventual) rolFinal = 'PERSONAL_EVENTUAL';

    if (nuevoRol) {
      rolFinal = nuevoRol;
    }

    // Transacción para garantizar consistencia atómica
    await prisma.$transaction(async (tx) => {
      // 1. Si se actualiza el rol o el RUT, eliminamos relaciones previas
      if (nuevoRol || (nuevoRut && nuevoRut !== rut)) {
        await tx.gerenteGeneral.deleteMany({ where: { rut: rut } });
        await tx.personalOperaciones.deleteMany({ where: { rut: rut } });
        await tx.cliente.deleteMany({ where: { rut: rut } });
        await tx.personalEventual.deleteMany({ where: { rut: rut } });
      }

      // 2. Preparar campos básicos a actualizar en Usuario
      var datosActualizar = {};
      if (nombre) datosActualizar.nombre = nombre;
      if (email) datosActualizar.email = email;
      if (nuevoRut) datosActualizar.rut = nuevoRut;
      if (password) {
        datosActualizar.password = await bcrypt.hash(password, 10);
      }

      if (Object.keys(datosActualizar).length > 0) {
        await tx.usuario.update({
          where: { rut: rut },
          data: datosActualizar
        });
      }

      // 3. Recrear la relación de rol correspondiente con el rutFinal
      if (nuevoRol || (nuevoRut && nuevoRut !== rut)) {
        if (rolFinal === 'GERENTE_GENERAL') {
          await tx.gerenteGeneral.create({ data: { rut: rutFinal } });
        } else if (rolFinal === 'PERSONAL_OPERACIONES') {
          await tx.personalOperaciones.create({
            data: {
              rut: rutFinal,
              especialidad: 'Operaciones Generales',
              fono: ''
            }
          });
        } else if (rolFinal === 'CLIENTE') {
          await tx.cliente.create({ data: { rut: rutFinal } });
        } else if (rolFinal === 'PERSONAL_EVENTUAL') {
          await tx.personalEventual.create({
            data: {
              rut: rutFinal,
              rol: 'Por definir',
              disponibilidad: 'Por definir',
              fono: '',
              experiencia: 'Sin registrar',
              evaluacionDesempeno: 'Sin calificar',
              datosDePago: 'Pendiente',
              tallaDeRopa: 'Por definir'
            }
          });
        }
      }
    });

    return res.status(200).json({
      exito: true,
      mensaje: 'Usuario actualizado correctamente.',
      datos: {
        rut: rutFinal,
        nombre: nombre || usuarioExiste.nombre,
        email: email || usuarioExiste.email,
        rol: rolFinal
      }
    });
  } catch (error) {
    console.error('Error al modificar usuario:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al modificar el usuario.'
    });
  }
};

var eliminarUsuario = async (req, res) => {
  try {
    var { rut } = req.params;

    var usuarioExiste = await prisma.usuario.findUnique({ where: { rut: rut } });
    if (!usuarioExiste) {
      return res.status(404).json({ exito: false, mensaje: 'El usuario a eliminar no existe.' });
    }

    // Eliminación en transacción borrando relaciones primero
    await prisma.$transaction([
      prisma.gerenteGeneral.deleteMany({ where: { rut: rut } }),
      prisma.personalOperaciones.deleteMany({ where: { rut: rut } }),
      prisma.cliente.deleteMany({ where: { rut: rut } }),
      prisma.personalEventual.deleteMany({ where: { rut: rut } }),
      prisma.usuario.delete({ where: { rut: rut } })
    ]);

    return res.status(200).json({
      exito: true,
      mensaje: 'Usuario eliminado exitosamente.'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al eliminar el usuario.'
    });
  }
};

module.exports = { obtenerUsuarios, crearUsuario, modificarUsuario, eliminarUsuario };