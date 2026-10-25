const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const {
  CARPETA_GARANTIAS,
  obtenerEquiposArrendados,
  registrarEquipoArrendado,
  marcarDevuelto,
  eliminarEquipoArrendado,
  descargarGarantia
} = require('../controladores/equiposArrendadosControlador');

const router = express.Router();

// Crear la carpeta de garantías si no existe
fs.mkdirSync(CARPETA_GARANTIAS, { recursive: true });

// Multer: librería que recibe archivos enviados desde un formulario.
// Aquí se configura dónde guardar la garantía, con qué nombre, el tamaño máximo y los tipos permitidos.
const subirGarantia = multer({
  // Se guarda en la carpeta de garantías con un nombre único: garantia-<fecha>.pdf
  storage: multer.diskStorage({
    destination: CARPETA_GARANTIAS,
    filename: (req, archivo, cb) => {
      const extension = path.extname(archivo.originalname).toLowerCase();
      cb(null, `garantia-${Date.now()}${extension}`);
    }
  }),
  // Máximo 5 MB
  limits: { fileSize: 5 * 1024 * 1024 },
  // Solo PDF, JPG o PNG
  fileFilter: (req, archivo, cb) => {
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png'];
    if (tiposPermitidos.includes(archivo.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('La garantía debe ser un PDF, JPG o PNG.'));
    }
  }
}).single('garantia'); // "garantia" es el nombre del campo de archivo en el formulario

// Recibe el archivo y, si hay un problema (muy pesado o tipo no permitido), responde con un mensaje claro
const recibirGarantia = (req, res, next) => {
  subirGarantia(req, res, (error) => {
    if (!error) return next();

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ mensaje: 'El documento de garantía no puede pesar más de 5 MB.' });
    }
    res.status(400).json({ mensaje: error.message });
  });
};

router.get('/', obtenerEquiposArrendados);
router.post('/', recibirGarantia, registrarEquipoArrendado);
router.get('/:id/garantia', descargarGarantia);
router.patch('/:id/devolver', marcarDevuelto);
router.delete('/:id', eliminarEquipoArrendado);

module.exports = router;
