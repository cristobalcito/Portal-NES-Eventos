var { PrismaClient } = require('@prisma/client');
var prisma = new PrismaClient();

/**
 * Registra un nuevo miembro del personal eventual (RF-FC-01)
 */
var registrarPersonal = async function(req, res) {
  try {
    var { 
      rut, 
      nombre, 
      email, 
      password, 
      rol, 
      disponibilidad, 
      fono, 
      experiencia, 
      datosDePago, 
      tallaDeRopa 
    } = req.body;

    var nuevoPersonal = await prisma.personalEventual.create({
      data: {
        rol: rol,
        disponibilidad: disponibilidad,
        fono: fono,
        experiencia: experiencia,
        evaluacionDesempeno: 'Sin calificar',
        datosDePago: datosDePago,
        tallaDeRopa: tallaDeRopa,
        notaFinal: 5.0,
        usuario: {
          connectOrCreate: {
            where: { rut: rut },
            create: {
              rut: rut,
              nombre: nombre,
              email: email || `${rut.replace(/[^0-9kK]/g, '')}@nes.cl`,
              password: password || 'temporal123'
            }
          }
        }
      },
      include: {
         usuario: {
          select: {
            rut: true,
            nombre: true,
            email: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      mensaje: 'Personal eventual registrado exitosamente',
      datos: nuevoPersonal
    });
  } catch (error) {
    console.error('Error al registrar personal eventual:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'No se pudo registrar el personal eventual en la base de datos.',
      error: error.message
    });
  }
};

/**
 * Obtiene la lista completa del personal eventual registrado
 */
var obtenerPersonal = async function(req, res) {
  try {
    var listaPersonal = await prisma.personalEventual.findMany({
      include: {
        usuario: {
          select: {
            rut: true,
            nombre: true,
            email: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      total: listaPersonal.length,
      datos: listaPersonal
    });
  } catch (error) {
    console.error('Error al obtener el personal eventual:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'No se pudo obtener la lista del personal eventual.',
      error: error.message
    });
  }
};

module.exports = {
  registrarPersonal,
  obtenerPersonal
};