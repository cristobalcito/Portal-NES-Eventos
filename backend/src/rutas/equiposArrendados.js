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

fs.mkdirSync(CARPETA_GARANTIAS, { recursive: true });

const subirGarantia = multer({
  storage: multer.diskStorage({
    destination: CARPETA_GARANTIAS,
    filename: (req, archivo, cb) => {
      const extension = path.extname(archivo.originalname).toLowerCase();
      cb(null, `garantia-${Date.now()}${extension}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, archivo, cb) => {
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png'];
    if (tiposPermitidos.includes(archivo.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('La garantia debe ser un PDF, JPG o PNG.'));
    }
  }
}).single('garantia');

const recibirGarantia = (req, res, next) => {
  subirGarantia(req, res, (error) => {
    if (!error) return next();

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ mensaje: 'El documento de garantia no puede pesar mas de 5 MB.' });
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