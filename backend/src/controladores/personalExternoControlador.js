var { PrismaClient } = require('@prisma/client');
var prisma = new PrismaClient();

/**
 * Registra un nuevo miembro del personal eventual (RF-FC-01)
 */
var registrarPersonal = async function(req, res) {
  try {
    var { rut } = req.params;

    var {
      rol,
      disponibilidad,
      fono,
      experiencia,
      datosDePago,
      tallaDeRopa
    } = req.body;

    // Validar que se haya enviado el RUT
    if (!rut) {
      return res.status(400).json({
        success: false,
        mensaje: 'El RUT es obligatorio.'
      });
    }

    // Buscar la ficha creada previamente por el GG
    var personalExistente = await prisma.personalEventual.findUnique({
      where: { rut: rut }
    });

    if (!personalExistente) {
      return res.status(404).json({
        success: false,
        mensaje: 'El trabajador no existe. Primero debe ser registrado por el Gerente General.'
      });
    }

    // Actualizar los antecedentes laborales
    var personalActualizado = await prisma.personalEventual.update({
      where: { rut: rut },
      data: {
        rol: rol,
        disponibilidad: disponibilidad,
        fono: fono,
        experiencia: experiencia,
        datosDePago: datosDePago,
        tallaDeRopa: tallaDeRopa
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

    return res.status(200).json({
      success: true,
      mensaje: 'Ficha de personal eventual actualizada correctamente.',
      datos: personalActualizado
    });

  } catch (error) {
    console.error('Error al actualizar personal eventual:', error);

    return res.status(500).json({
      success: false,
      mensaje: 'No se pudo actualizar la ficha del trabajador.'
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