import { Router } from 'express';
import { obtenerUsuarios } from '../controladores/usuarioControlador.js';
import { verificarGerenteGeneral } from '../middlewares/verificarGerenteGeneral.js';

const router = Router();

// Endpoint para listar todos los usuarios
// Protegido: Solo pasa si el middleware confirma que el x-usuario-rut es Gerente General
router.get('/usuarios', verificarGerenteGeneral, obtenerUsuarios);

export default router;