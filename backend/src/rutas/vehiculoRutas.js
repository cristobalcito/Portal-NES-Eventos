const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { getJwtSecret } = require('../lib/jwt');
const vehiculoControlador = require('../controladores/vehiculoControlador');

const carpetaUploads = path.join(__dirname, '../../uploads/vehiculos');
if (!fs.existsSync(carpetaUploads)) {
  fs.mkdirSync(carpetaUploads, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, carpetaUploads),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});

const upload = multer({ storage });
const subirDocumentos = upload.fields([
  { name: 'permisoCirculacion', maxCount: 1 },
  { name: 'revisionTecnica', maxCount: 1 },
  { name: 'antecedentes', maxCount: 1 }
]);

const limpiarFormatoRut = (rut = '') =>
  String(rut).replace(/\./g, '').replace(/\s+/g, '').trim().toUpperCase();

const verificarGerenteGeneral = async (req, res, next) => {
  try {
    let rutBuscar = req.headers['x-usuario-rut'] || '';
    let emailBuscar = req.headers['x-usuario-email'] || '';

    if (rutBuscar === 'No especificado') rutBuscar = '';

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, getJwtSecret());
        if (decoded.rut) rutBuscar = decoded.rut;
        if (decoded.email) emailBuscar = decoded.email;
      } catch (_) {}
    }

    const rutLimpio = limpiarFormatoRut(rutBuscar);

    const usuarios = await prisma.usuario.findMany({
      include: { gerenteGeneral: true }
    });

    const usuario = usuarios.find(
      (u) =>
        (rutLimpio && limpiarFormatoRut(u.rut) === rutLimpio) ||
        (emailBuscar && u.email.toLowerCase() === emailBuscar.toLowerCase())
    );

    if (!usuario || !usuario.gerenteGeneral) {
      return res.status(403).json({
        exito: false,
        esGerente: false,
        mensaje: 'Acceso denegado: Solamente el Gerente General tiene autorización.'
      });
    }

    req.usuario = usuario;
    req.esGerente = true;
    next();
  } catch (error) {
    console.error('Error al verificar Gerente General:', error);
    return res.status(500).json({
      exito: false,
      esGerente: false,
      mensaje: 'Error interno al verificar permisos.'
    });
  }
};

// Rutas de verificación y opciones
router.get('/verificar-gerente', verificarGerenteGeneral, (req, res) => {
  res.status(200).json({ exito: true, esGerente: true });
});
router.get('/opciones-reserva', vehiculoControlador.obtenerOpcionesReserva);

// CRUD y reservas de vehículos
router.get('/', vehiculoControlador.obtenerVehiculos);
router.post('/', verificarGerenteGeneral, subirDocumentos, vehiculoControlador.crearVehiculo);
router.post('/:patente/reservar', vehiculoControlador.reservarVehiculo);
router.patch('/:patente/mantencion', vehiculoControlador.cambiarEstadoMantencion);
router.delete('/reservas/:id', vehiculoControlador.cancelarReservaVehiculo);
router.put('/:patente', verificarGerenteGeneral, subirDocumentos, vehiculoControlador.modificarVehiculo);
router.delete('/:patente', verificarGerenteGeneral, vehiculoControlador.eliminarVehiculo);


module.exports = router;