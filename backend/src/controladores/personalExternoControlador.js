const prisma = require('../lib/prisma');

const LICENCIAS_VALIDAS = [
  'Clase B',
  'Clase A2',
  'Clase A3',
  'Clase A4',
  'Clase A5',
  'Clase D'
];

const parsearLicencias = (valor) => {
  if (!valor) return [];
  let lista = [];

  if (Array.isArray(valor)) {
    lista = valor;
  } else if (typeof valor === 'string') {
    const texto = valor.trim();
    if (!texto) return [];
    if (texto.startsWith('[')) {
      try {
        const parsed = JSON.parse(texto);
        lista = Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        lista = [];
      }
    } else {
      lista = texto.split(',').map((item) => item.trim());
    }
  }

  return [...new Set(lista.filter((lic) => LICENCIAS_VALIDAS.includes(lic)))];
};

const incluirFicha = {
  curriculum: { select: { rut: true } },
  usuario: { select: { rut: true, nombre: true, email: true } }
};

/**
 * Actualiza la ficha del personal eventual (RF-FC-01)
 */
var registrarPersonal = async function(req, res) {
  try {
    var { rut } = req.params;

    var {
      rol,
      disponibilidad,
      licencias,
      fono,
      experiencia,
      datosDePago,
      tallaDeRopa,
      eliminarCurriculum
    } = req.body;
    const borrarCurriculum = eliminarCurriculum === true || eliminarCurriculum === 'true';

    if (!rut) {
      return res.status(400).json({
        success: false,
        mensaje: 'El RUT es obligatorio.'
      });
    }

    if (borrarCurriculum && req.file) {
      return res.status(400).json({
        success: false,
        mensaje: 'Elige entre quitar el currículum o adjuntar un reemplazo.'
      });
    }

    const datosActualizar = {
      rol,
      disponibilidad,
      fono,
      experiencia,
      datosDePago,
      tallaDeRopa
    };

    if (licencias !== undefined) {
      datosActualizar.licencias = parsearLicencias(licencias);
    }

    const actualizarFicha = prisma.personalEventual.update({
      where: { rut },
      data: datosActualizar,
      include: incluirFicha
    });

    let personalActualizado;
    if (req.file) {
      const contenido = req.file.buffer;
      const [ficha, curriculum] = await prisma.$transaction([
        actualizarFicha,
        prisma.curriculumPersonal.upsert({
          where: { rut },
          create: { rut, contenido },
          update: { contenido },
          select: { rut: true }
        })
      ]);
      personalActualizado = { ...ficha, curriculum };
    } else if (borrarCurriculum) {
      const [ficha] = await prisma.$transaction([
        actualizarFicha,
        prisma.curriculumPersonal.deleteMany({ where: { rut } })
      ]);
      personalActualizado = { ...ficha, curriculum: null };
    } else {
      personalActualizado = await actualizarFicha;
    }

    return res.status(200).json({
      success: true,
      mensaje: 'Ficha de personal eventual actualizada correctamente.',
      datos: personalActualizado
    });

  } catch (error) {
    if (error.code === 'P2025' || error.code === 'P2003') {
      return res.status(404).json({
        success: false,
        mensaje: 'El trabajador no existe. Primero debe ser registrado por el Gerente General.'
      });
    }

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
      include: incluirFicha
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

async function obtenerCurriculum(req, res) {
  try {
    const curriculum = await prisma.curriculumPersonal.findUnique({
      where: { rut: req.params.rut },
      select: { contenido: true }
    });

    if (!curriculum) {
      return res.status(404).json({ mensaje: 'La ficha no tiene currículum.' });
    }

    const disposicion = req.query.vista === '1' ? 'inline' : 'attachment';
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposicion}; filename="curriculum.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    return res.send(Buffer.from(curriculum.contenido));
  } catch (error) {
    console.error('Error al obtener el currículum:', error);
    return res.status(500).json({ mensaje: 'No se pudo obtener el currículum.' });
  }
}

module.exports = {
  registrarPersonal,
  obtenerPersonal,
  obtenerCurriculum
};