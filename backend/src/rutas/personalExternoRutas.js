var express = require('express');
const multer = require('multer');
var router = express.Router();
var personalExternoControlador = require('../controladores/personalExternoControlador');
var { autenticarToken, autorizarRoles } = require('../middlewares/auth');
var permitirGestionPersonal = autorizarRoles('GERENTE_GENERAL', 'PERSONAL_OPERACIONES');

const maximoPdf = 5 * 1024 * 1024;
const recibirPdf = multer({
  storage: multer.memoryStorage(),
  // Las versiones anteriores de Multer rechazaban el archivo al alcanzar este límite.
  limits: { fileSize: maximoPdf + 1, files: 1, fields: 12 }
}).single('curriculum');

function leerAdjunto(req, res, next) {
  recibirPdf(req, res, error => {
    const archivo = req.file;
    if (error || archivo?.size > maximoPdf) {
      return res.status(400).json({ mensaje: 'Adjunta un solo PDF de hasta 5 MB.' });
    }

    if (archivo) {
      const tipoPdf = ['application/pdf', 'application/octet-stream'].includes(archivo.mimetype);
      const firmaPdf = archivo.buffer.subarray(0, 5).toString() === '%PDF-';
      if (!tipoPdf || !firmaPdf) {
        return res.status(400).json({ mensaje: 'El currículum debe ser un PDF.' });
      }
    }

    next();
  });
}

router.get('/:rut/curriculum', autenticarToken, permitirGestionPersonal, personalExternoControlador.obtenerCurriculum);

// Ruta para listar todo el personal eventual registrado
router.get('/', autenticarToken, permitirGestionPersonal, personalExternoControlador.obtenerPersonal);

// Ruta para actualizar todo el personal eventual registrado
router.patch('/:rut', autenticarToken, permitirGestionPersonal, leerAdjunto, personalExternoControlador.registrarPersonal);

module.exports = router;
