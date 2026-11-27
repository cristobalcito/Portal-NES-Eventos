var express = require('express');
var request = require('supertest');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

jest.mock('../src/lib/prisma', function() {
  var colecciones = {};
  var metodos = ['findMany', 'findUnique', 'findFirst', 'create', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert'];
  metodos.forEach(function(metodo) {
    colecciones[metodo] = jest.fn();
  });

  var mock = {
    usuario: colecciones.usuario || {
      findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn()
    },
    gerenteGeneral: { findUnique: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    personalOperaciones: { findUnique: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    personalEventual: {
      findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn()
    },
    cliente: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
    curriculumPersonal: { findUnique: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
    planBase: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    planEspecifico: {
      findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn()
    },
    inventario: {
      findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn(), create: jest.fn(), update: jest.fn()
    },
    mantencion: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    equipoArrendado: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    proveedor: { upsert: jest.fn() },
    vehiculo: { findMany: jest.fn().mockResolvedValue([]) },
    equipamiento: { findMany: jest.fn().mockResolvedValue([]) },
    alerta: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    encuestaSatisfaccion: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn()
  };
  return mock;
});

jest.mock('@prisma/client', function() {
  return {
    PrismaClient: function() {
      return require('../src/lib/prisma');
    }
  };
});

jest.mock('../src/servicios/alertasOperativasServicio', function() {
  return {
    CRUCE_AGENDA: 'CRUCE_AGENDA', STOCK_BAJO: 'STOCK_BAJO', MANTENCION_PENDIENTE: 'MANTENCION_PENDIENTE',
    TIPOS_OPERATIVOS: ['CRUCE_AGENDA', 'STOCK_BAJO', 'MANTENCION_PENDIENTE'],
    actualizarAlertasTrasGuardar: jest.fn().mockResolvedValue(undefined),
    actualizarAlertasOperativas: jest.fn().mockResolvedValue(undefined)
  };
});

jest.mock('../src/servicios/alertasServicio', function() {
  return { generarAlertasLogisticas: jest.fn().mockResolvedValue([]) };
});

jest.mock('../src/servicios/permisosServicio', function() {
  return {
    obtenerRolUsuario: jest.fn().mockResolvedValue({ nombre: 'Gerente', gerenteGeneral: { rut: '12345678-5' }, personalOperaciones: null }),
    puedeFinalizarMantencion: jest.fn().mockReturnValue(true)
  };
});

jest.mock('../src/servicios/reglasEventosServicio', function() {
  return {
    calcularCambioFecha: jest.fn().mockReturnValue({ permitido: true, recargo: 0, requiereConfirmacion: false, mensaje: '' }),
    calcularCambioInvitados: jest.fn().mockReturnValue({ permitido: true, requiereConfirmacion: false, mensaje: '' })
  };
});

var prisma = require('../src/lib/prisma');
var jwtSecret = require('../src/lib/jwt').getJwtSecret();
var authRouter = require('../src/rutas/auth');
var catalogoRouter = require('../src/rutas/catalogoRutas');
var eventosRouter = require('../src/rutas/eventos');
var inventarioRouter = require('../src/rutas/inventario');
var personalRouter = require('../src/rutas/personal');
var personalExternoRouter = require('../src/rutas/personalExternoRutas');
var alertasRouter = require('../src/rutas/alertasRutas');
var planesRouter = require('../src/rutas/planEspecificoRutas');
var mantencionesRouter = require('../src/rutas/mantenciones');
var arrendadosRouter = require('../src/rutas/equiposArrendados');
var estadoEquiposRouter = require('../src/rutas/estadoEquipos');
var usuariosRouter = require('../src/rutas/usuarioRutas');
var reglasRouter = require('../src/rutas/reglasEventosRutas');
var { normalizarRut } = require('../src/servicios/rutServicio');

var app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/catalogo', catalogoRouter);
app.use('/api/eventos', eventosRouter);
app.use('/api/inventario', inventarioRouter);
app.use('/api/personal', personalRouter);
app.use('/api/personal-externo', personalExternoRouter);
app.use('/api/alertas', alertasRouter);
app.use('/api/planes-especificos', planesRouter);
app.use('/api/mantenciones', mantencionesRouter);
app.use('/api/equipos-arrendados', arrendadosRouter);
app.use('/api/estado-equipos', estadoEquiposRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/reglas-eventos', reglasRouter);
app.use(function(error, req, res, next) {
  res.status(error.status || 500).json({ error: error.message || 'Error interno del servidor' });
});

function crearToken(rut, rol) {
  return jwt.sign({ rut: rut, rol: rol }, jwtSecret, { expiresIn: '8h' });
}

var reporteValidaciones = [];

function registrarCaso(endpoint, campo, valor, limite, esperado, resultado, detalles) {
  reporteValidaciones.push({
    endpoint: endpoint,
    campo: campo,
    valor: String(valor),
    limite: limite,
    esperado: esperado,
    resultadoHTTP: resultado,
    clasificacion: (typeof resultado === 'number' && (resultado === 200 || resultado === 201 || resultado === 204)) || resultado === '12345678-5' || resultado === '11111112-K'
      ? 'VÁLIDO'
      : 'INVÁLIDO',
    detalle: detalles || ''
  });
}

afterAll(function() {
  console.log('\n=== DESGLOSE DE VALORES, LÍMITES Y RESULTADOS TESTEADOS ===');
  console.table(reporteValidaciones.map(function(caso) {
    return {
      Endpoint: caso.endpoint,
      Campo: caso.campo,
      Valor: caso.valor,
      'Límite/Regla': caso.limite,
      Esperado: caso.esperado,
      HTTP: caso.resultadoHTTP,
      Resultado: caso.clasificacion,
      Detalle: caso.detalle
    };
  }));
});

describe('Caja blanca - utilidades y normalización', function() {
  test('normaliza RUT con puntos e guion', function() {
    var resultado = normalizarRut('12.345.678-5');
    expect(resultado).toBe('12345678-5');
    registrarCaso('normalizarRut()', 'RUT', '12.345.678-5', '7-8 dígitos + DV válido', '12345678-5', resultado || 'null', 'Formato válido con puntos y guion');
  });

  test('normaliza K a mayúscula', function() {
    var resultado = normalizarRut('11111112-k');
    expect(resultado).toBe('11111112-K');
    registrarCaso('normalizarRut()', 'RUT', '11111112-k', 'DV válido: número o K', '11111112-K', resultado || 'null', 'K se convierte a mayúscula');
  });

  test('rechaza RUT inválido', function() {
    var casos = ['12.345.678-9', '1234abc-9', ''];
    casos.forEach(function(valor) {
      var resultado = normalizarRut(valor);
      expect(resultado).toBeNull();
      registrarCaso('normalizarRut()', 'RUT', valor || '(vacío)', '7-8 dígitos + DV coincidente', 'null', resultado || 'null', 'Valor inválido rechazado');
    });
  });
});

describe('Caja negra - autenticación y registro', function() {
  beforeEach(function() {
    jest.clearAllMocks();
    prisma.usuario.findFirst.mockResolvedValue(null);
  });

  test('login válido retorna 200, token y rol cliente sin contraseña', async function() {
    var hashReal = await bcrypt.hash('claveSegura123', 10);
    prisma.usuario.findFirst.mockResolvedValue({
      rut: '12345678-5', nombre: 'Camila Soto', email: 'camila@nes-eventos.cl', password: hashReal,
      gerenteGeneral: null, personalOperaciones: null,
      cliente: { rut: '12345678-5', fono: '+56912345678' }, personalEventual: null
    });

    var res = await request(app).post('/api/auth/login').send({ email: 'camila@nes-eventos.cl', password: 'claveSegura123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.usuario.rol).toBe('CLIENTE');
    expect(res.body.usuario.password).toBeUndefined();
    registrarCaso('/api/auth/login', 'credenciales', 'email válido + contraseña válida', 'Usuario existente + contraseña coincidente', 200, res.statusCode, 'Login válido');
  });

  test('login con contraseña incorrecta retorna 401', async function() {
    prisma.usuario.findFirst.mockResolvedValue({
      rut: '12345678-5', password: await bcrypt.hash('claveCorrecta', 10), cliente: { rut: '12345678-5' }
    });
    var res = await request(app).post('/api/auth/login').send({ email: 'camila@nes-eventos.cl', password: 'incorrecta' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
    registrarCaso('/api/auth/login', 'password', 'incorrecta', 'Debe coincidir con el hash almacenado', 401, res.statusCode, 'Contraseña rechazada');
  });

  test('login con usuario inexistente retorna 401', async function() {
    var res = await request(app).post('/api/auth/login').send({ email: 'nadie@nes.cl', password: 'clave' });
    expect(res.statusCode).toBe(401);
    registrarCaso('/api/auth/login', 'usuario', 'nadie@nes.cl', 'Debe existir en la base de datos', 401, res.statusCode, 'Usuario inexistente');
  });

  test('registro crea cliente y retorna 201', async function() {
    prisma.$transaction.mockImplementation(async function(callback) {
      var tx = {
        usuario: { create: jest.fn().mockResolvedValue({ rut: '18765432-7', nombre: 'Diego Morales', email: 'diego@correo.cl' }) },
        cliente: { create: jest.fn().mockResolvedValue({ rut: '18765432-7', fono: '+56987654321' }) }
      };
      return callback(tx);
    });

    var res = await request(app).post('/api/auth/registro').send({
      nombre: 'Diego Morales', rut: '18.765.432-7', email: 'diego@correo.cl', fono: '+56987654321', password: 'password123'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.usuario.rol).toBe('CLIENTE');
    expect(res.body.usuario.rut).toBe('18765432-7');
    registrarCaso('/api/auth/registro', 'datos', 'RUT 18765432-7 + todos los campos', 'Todos los obligatorios + RUT válido', 201, res.statusCode, 'Registro válido');
  });

  test('registro rechaza campos incompletos', async function() {
    var res = await request(app).post('/api/auth/registro').send({ nombre: 'Diego', rut: '18765432-7' });
    expect(res.statusCode).toBe(400);
    registrarCaso('/api/auth/registro', 'campos obligatorios', 'nombre + RUT, sin email/fono/password', 'nombre, RUT, email, fono y password obligatorios', 400, res.statusCode, 'Campos incompletos');
  });

  test('registro rechaza RUT ya registrado', async function() {
    prisma.usuario.findFirst.mockResolvedValue({ rut: '18765432-7', email: 'diego@correo.cl' });
    var res = await request(app).post('/api/auth/registro').send({
      nombre: 'Diego Morales', rut: '18765432-7', email: 'diego@correo.cl', fono: '+56987654321', password: 'password123'
    });
    expect(res.statusCode).toBe(400);
    registrarCaso('/api/auth/registro', 'duplicado', 'RUT 18765432-7 + correo existente', 'RUT y correo deben ser únicos', 400, res.statusCode, 'RUT/correo duplicado');
  });
});

describe('Caja negra - autenticación y autorización JWT', function() {
  beforeEach(function() { jest.clearAllMocks(); });

  test('ruta protegida rechaza petición sin token', async function() {
    var res = await request(app).get('/api/planes-especificos');
    expect(res.statusCode).toBe(401);
    registrarCaso('/api/planes-especificos', 'Authorization', '(sin header)', 'Debe enviar Bearer <token>', 401, res.statusCode, 'Token ausente');
  });

  test('ruta protegida rechaza token inválido', async function() {
    var res = await request(app).get('/api/planes-especificos').set('Authorization', 'Bearer token-invalido');
    expect(res.statusCode).toBe(403);
    registrarCaso('/api/planes-especificos', 'Authorization', 'Bearer token-invalido', 'JWT firmado y no expirado', 403, res.statusCode, 'Token inválido');
  });

  test('token válido permite consultar horario compartido', async function() {
    prisma.planEspecifico.findMany.mockResolvedValue([]);
    var token = crearToken('12345678-5', 'GERENTE_GENERAL');
    var res = await request(app).get('/api/planes-especificos').set('Authorization', 'Bearer ' + token);
    expect(res.statusCode).toBe(200);
    registrarCaso('/api/planes-especificos', 'Authorization', 'Bearer JWT GERENTE_GENERAL', 'JWT válido firmado por el backend', 200, res.statusCode, 'Token válido');
  });

  test('alertas permiten gerente y rechazan cliente', async function() {
    prisma.usuario.findUnique.mockResolvedValueOnce({ gerenteGeneral: { rut: '12345678-5' }, personalOperaciones: null });
    var gerente = await request(app).get('/api/alertas').set('Authorization', 'Bearer ' + crearToken('12345678-5', 'GERENTE_GENERAL'));
    expect(gerente.statusCode).toBe(200);

    prisma.usuario.findUnique.mockResolvedValueOnce({ gerenteGeneral: null, personalOperaciones: null });
    var cliente = await request(app).get('/api/alertas').set('Authorization', 'Bearer ' + crearToken('18765432-7', 'CLIENTE'));
    expect(cliente.statusCode).toBe(403);
    registrarCaso('/api/alertas', 'rol', 'CLIENTE', 'Debe ser GERENTE_GENERAL o PERSONAL_OPERACIONES', 403, cliente.statusCode, 'Cliente rechazado');
  });

  test('personal externo permite personal y rechaza usuario sin rol', async function() {
    prisma.usuario.findUnique.mockResolvedValueOnce({ gerenteGeneral: { rut: '12345678-5' }, personalOperaciones: null });
    var permitido = await request(app).get('/api/personal-externo').set('Authorization', 'Bearer ' + crearToken('12345678-5', 'GERENTE_GENERAL'));
    expect(permitido.statusCode).toBe(200);
    registrarCaso('/api/personal-externo', 'rol', 'GERENTE_GENERAL', 'Roles permitidos: GERENTE_GENERAL o PERSONAL_OPERACIONES', 200, permitido.statusCode, 'Personal autorizado');

    prisma.usuario.findUnique.mockResolvedValueOnce({ gerenteGeneral: null, personalOperaciones: null });
    var denegado = await request(app).get('/api/personal-externo').set('Authorization', 'Bearer ' + crearToken('18765432-7', 'CLIENTE'));
    expect(denegado.statusCode).toBe(403);
    registrarCaso('/api/personal-externo', 'rol', 'CLIENTE', 'Debe ser GERENTE_GENERAL o PERSONAL_OPERACIONES', 403, denegado.statusCode, 'Cliente rechazado');
  });
});

describe('Caja negra - módulos operativos', function() {
  beforeEach(function() {
    jest.clearAllMocks();
    prisma.planBase.findMany.mockResolvedValue([]);
    prisma.planEspecifico.findMany.mockResolvedValue([]);
    prisma.inventario.findMany.mockResolvedValue([]);
    prisma.personalEventual.findMany.mockResolvedValue([]);
    prisma.mantencion.findMany.mockResolvedValue([]);
    prisma.equipoArrendado.findMany.mockResolvedValue([]);
  });

  test('catálogo responde lista de planes base', async function() {
    var res = await request(app).get('/api/catalogo/planes-base');
    expect(res.statusCode).toBe(200);
    registrarCaso('/api/catalogo/planes-base', 'GET sin filtros', 'lista', 'Resultado esperado: arreglo', 200, res.statusCode, 'Consulta válida');
  });

  test('eventos responde lista', async function() {
    var res = await request(app).get('/api/eventos');
    expect(res.statusCode).toBe(200);
  });

  test('inventario responde lista', async function() {
    var res = await request(app).get('/api/inventario');
    expect(res.statusCode).toBe(200);
  });

  test('personal responde lista', async function() {
    var res = await request(app).get('/api/personal');
    expect(res.statusCode).toBe(200);
  });

  test('mantenciones responde lista', async function() {
    var res = await request(app).get('/api/mantenciones');
    expect(res.statusCode).toBe(200);
  });

  test('equipos arrendados responde lista', async function() {
    var res = await request(app).get('/api/equipos-arrendados');
    expect(res.statusCode).toBe(200);
  });

  test('estado de equipos requiere autenticación', async function() {
    var sinToken = await request(app).get('/api/estado-equipos');
    expect(sinToken.statusCode).toBe(401);

    prisma.usuario.findUnique.mockResolvedValueOnce({ gerenteGeneral: { rut: '12345678-5' }, personalOperaciones: null, personalEventual: null });
    prisma.inventario.findMany.mockResolvedValueOnce([]);
    var conToken = await request(app).get('/api/estado-equipos').set('Authorization', 'Bearer ' + crearToken('12345678-5', 'GERENTE_GENERAL'));
    expect(conToken.statusCode).toBe(200);
  });

  test('crear evento valida campos obligatorios', async function() {
    var res = await request(app).post('/api/eventos').send({});
    expect(res.statusCode).toBe(400);
    registrarCaso('/api/eventos', 'POST body', '{}', 'Todos los campos obligatorios', 400, res.statusCode, 'Evento vacío rechazado');
  });

  test('crear evento válido acepta personas, costo y fecha válidos', async function() {
    prisma.planEspecifico.create.mockResolvedValueOnce({
      idPE: 1, descripcion: 'Boda', lugar: 'Collao', fecha: new Date('2026-12-20'), numPersonas: 100,
      personasConfirmadas: 0, personal: 'Equipo', costoTotal: 500000, horario: null
    });
    var res = await request(app).post('/api/eventos').send({
      descripcion: 'Boda', lugar: 'Collao', fecha: '2026-12-20', numPersonas: 100,
      personasConfirmadas: 0, personal: 'Equipo', costoTotal: 500000
    });
    expect(res.statusCode).toBe(201);
    registrarCaso('/api/eventos', 'numPersonas/costoTotal', '100 / 500000', 'numPersonas > 0; costo >= 0', 201, res.statusCode, 'Evento válido creado');
  });

  test('asistencia rechaza confirmados negativos y superiores al aforo', async function() {
    prisma.planEspecifico.findUnique.mockResolvedValueOnce({ idPE: 1, numPersonas: 100 });
    var negativo = await request(app).patch('/api/eventos/1/asistencia').send({ personasConfirmadas: -1 });
    expect(negativo.statusCode).toBe(400);
    registrarCaso('/api/eventos/:id/asistencia', 'personasConfirmadas', -1, 'Entero >= 0 y <= numPersonas', 400, negativo.statusCode, 'Valor negativo inválido');

    prisma.planEspecifico.findUnique.mockResolvedValueOnce({ idPE: 1, numPersonas: 100 });
    var exceso = await request(app).patch('/api/eventos/1/asistencia').send({ personasConfirmadas: 101 });
    expect(exceso.statusCode).toBe(400);
    registrarCaso('/api/eventos/:id/asistencia', 'personasConfirmadas', 101, 'Máximo: numPersonas = 100', 400, exceso.statusCode, 'Exceso sobre aforo');
  });

  test('importación rechaza lista vacía y supera el máximo de 200', async function() {
    var vacia = await request(app).post('/api/eventos/importar').send({ eventos: [] });
    expect(vacia.statusCode).toBe(400);
    registrarCaso('/api/eventos/importar', 'eventos.length', 0, 'Debe contener 1 a 200 eventos', 400, vacia.statusCode, 'Lista vacía');

    var demasiados = await request(app).post('/api/eventos/importar').send({ eventos: Array(201).fill({}) });
    expect(demasiados.statusCode).toBe(400);
    registrarCaso('/api/eventos/importar', 'eventos.length', 201, 'Máximo: 200', 400, demasiados.statusCode, 'Excede límite máximo');
  });

  test('eliminar evento rechaza id inválido', async function() {
    var res = await request(app).delete('/api/eventos/abc');
    expect(res.statusCode).toBe(400);
    registrarCaso('/api/eventos/:id', 'DELETE id', 'abc', 'Entero positivo', 400, res.statusCode, 'ID inválido');
  });

  test('crear plan base valida descripción y costo', async function() {
    var sinDescripcion = await request(app).post('/api/catalogo/plan-base').send({ costoBase: 1000, descripcion: '' });
    expect(sinDescripcion.statusCode).toBe(400);
    registrarCaso('/api/catalogo/plan-base', 'descripcion', '(vacía)', 'Obligatoria y máximo 300 caracteres', 400, sinDescripcion.statusCode, 'Descripción inválida');

    var costoNegativo = await request(app).post('/api/catalogo/plan-base').send({ costoBase: -1, descripcion: 'Plan válido' });
    expect(costoNegativo.statusCode).toBe(400);
    registrarCaso('/api/catalogo/plan-base', 'costoBase', -1, 'Número >= 0', 400, costoNegativo.statusCode, 'Costo negativo');

    prisma.planBase.create.mockResolvedValueOnce({ idPL: 1, costoBase: 0, descripcion: 'Plan básico' });
    var frontera = await request(app).post('/api/catalogo/plan-base').send({ costoBase: 0, descripcion: 'Plan básico' });
    expect(frontera.statusCode).toBe(201);
    registrarCaso('/api/catalogo/plan-base', 'costoBase', 0, 'Límite válido: >= 0', 201, frontera.statusCode, 'Costo mínimo válido');
  });

  test('modificar y eliminar plan base cubren inexistente', async function() {
    prisma.planBase.findUnique.mockResolvedValueOnce(null);
    var modificar = await request(app).put('/api/catalogo/plan-base/999').send({ costoBase: 100, descripcion: 'Otro plan' });
    expect(modificar.statusCode).toBe(404);
    registrarCaso('/api/catalogo/plan-base/:id', 'PUT id', 999, 'Debe existir', 404, modificar.statusCode, 'Plan inexistente');

    prisma.planBase.findUnique.mockResolvedValueOnce(null);
    var eliminar = await request(app).delete('/api/catalogo/plan-base/999');
    expect(eliminar.statusCode).toBe(404);
    registrarCaso('/api/catalogo/plan-base/:id', 'DELETE id', 999, 'Debe existir', 404, eliminar.statusCode, 'Plan inexistente');
  });

  test('inventario reserva cantidades válidas e inválidas', async function() {
    var cero = await request(app).post('/api/inventario/reservar').send({ idInventario: 1, cantidadRequerida: 0 });
    expect(cero.statusCode).toBe(400);
    registrarCaso('/api/inventario/reservar', 'cantidadRequerida', 0, 'Debe ser > 0', 400, cero.statusCode, 'Valor frontera inferior inválido');

    prisma.inventario.findUnique.mockResolvedValueOnce(null);
    var inexistente = await request(app).post('/api/inventario/reservar').send({ idInventario: 999, cantidadRequerida: 1 });
    expect(inexistente.statusCode).toBe(404);
    registrarCaso('/api/inventario/reservar', 'idInventario', 999, 'Debe existir', 404, inexistente.statusCode, 'Artículo inexistente');

    prisma.inventario.findUnique.mockResolvedValueOnce({ id: 1, producto: 'Parlante', disponible: 2, ocupado: 0 });
    prisma.inventario.update.mockResolvedValueOnce({ id: 1, producto: 'Parlante', disponible: 1, ocupado: 1 });
    var reserva = await request(app).post('/api/inventario/reservar').send({ idInventario: 1, cantidadRequerida: 1, idPE: 1 });
    expect(reserva.statusCode).toBe(200);
    registrarCaso('/api/inventario/reservar', 'cantidadRequerida', 1, '1 <= disponible 2', 200, reserva.statusCode, 'Reserva válida');

    prisma.inventario.findUnique.mockResolvedValueOnce({ id: 1, producto: 'Parlante', disponible: 1, ocupado: 0 });
    var deficit = await request(app).post('/api/inventario/reservar').send({ idInventario: 1, cantidadRequerida: 2 });
    expect(deficit.statusCode).toBe(409);
    registrarCaso('/api/inventario/reservar', 'cantidadRequerida', 2, 'No superar disponible 1', 409, deficit.statusCode, 'Déficit de stock');
  });

  test('inventario rechaza valores numéricos negativos', async function() {
    prisma.inventario.create.mockClear();
    var res = await request(app).post('/api/inventario').send({ producto: 'Cable', stock: -5, disponible: -2, ocupado: -1, mantencion: -1 });
    expect(res.statusCode).toBe(400);
    expect(prisma.inventario.create).not.toHaveBeenCalled();
    registrarCaso('/api/inventario', 'stock/disponible/ocupado/mantencion', '-5/-2/-1', 'Todos deben ser enteros >= 0', 400, res.statusCode, 'Valores negativos rechazados');
  });

  test('mantención valida costo, cantidad y fechas', async function() {
    var vacio = await request(app).post('/api/mantenciones').send({});
    expect(vacio.statusCode).toBe(400);
    registrarCaso('/api/mantenciones', 'POST body', '{}', 'inventarioId, cantidad, falla, aprobación y fechas obligatorios', 400, vacio.statusCode, 'Registro incompleto');

    prisma.mantencion.findUnique.mockResolvedValueOnce(null);
    var detalle = await request(app).get('/api/mantenciones/999');
    expect(detalle.statusCode).toBe(404);
    registrarCaso('/api/mantenciones/:id', 'GET id', 999, 'Debe existir', 404, detalle.statusCode, 'Mantención inexistente');

    prisma.mantencion.findUnique.mockResolvedValueOnce({ id: 1, estado: 'finalizada', inventarioId: 1, cantidad: 1 });
    var finalizar = await request(app).patch('/api/mantenciones/1/finalizar').set('Authorization', 'Bearer ' + crearToken('12345678-5', 'GERENTE_GENERAL'));
    expect(finalizar.statusCode).toBe(400);
    registrarCaso('/api/mantenciones/:id/finalizar', 'estado', 'finalizada', 'Debe estar en mantención', 400, finalizar.statusCode, 'Mantención ya finalizada');

    var costoNegativo = await request(app).post('/api/mantenciones').send({
      inventarioId: 1, cantidad: 1, falla: 'Sin señal', aprobadoPor: 'Gerente',
      fechaEnvio: '2026-12-01', fechaRetornoEstimada: '2026-12-02', costoReparacion: -1
    });
    prisma.inventario.findUnique.mockResolvedValueOnce({ id: 1, disponible: 1, mantencion: 0, producto: 'Consola' });
    expect(costoNegativo.statusCode).toBe(400);
    registrarCaso('/api/mantenciones', 'costoReparacion', -1, 'Número >= 0', 400, costoNegativo.statusCode, 'Costo negativo');
  });

  test('personal crea y asigna con límites válidos e inválidos', async function() {
    var incompleto = await request(app).post('/api/personal').send({ nombre: 'Ana' });
    expect(incompleto.statusCode).toBe(400);
    registrarCaso('/api/personal', 'rut + nombre', 'solo nombre', 'RUT y nombre obligatorios', 400, incompleto.statusCode, 'Datos incompletos');

    prisma.$transaction.mockImplementationOnce(async function(callback) {
      var tx = {
        usuario: { create: jest.fn().mockResolvedValue({ rut: '11111111-1', nombre: 'Ana' }) },
        personalEventual: { create: jest.fn().mockResolvedValue({ rut: '11111111-1', rol: 'Técnico', disponibilidad: 'Disponible', fono: '' }) }
      };
      return callback(tx);
    });
    var creado = await request(app).post('/api/personal').send({ rut: '11111111-1', nombre: 'Ana', rol: 'Técnico', estado: 'Disponible' });
    expect(creado.statusCode).toBe(201);
    registrarCaso('/api/personal', 'POST datos', 'RUT válido + nombre', 'RUT y nombre obligatorios', 201, creado.statusCode, 'Personal creado');

    var asignarIncompleto = await request(app).post('/api/personal/asignar').send({});
    expect(asignarIncompleto.statusCode).toBe(400);
    registrarCaso('/api/personal/asignar', 'rut + idPE', '(vacíos)', 'Ambos obligatorios', 400, asignarIncompleto.statusCode, 'Asignación incompleta');

    prisma.planEspecifico.findUnique.mockResolvedValueOnce(null);
    var eventoInexistente = await request(app).post('/api/personal/asignar').send({ rut: '11111111-1', idPE: 999 });
    expect(eventoInexistente.statusCode).toBe(404);
    registrarCaso('/api/personal/asignar', 'idPE', 999, 'Debe existir', 404, eventoInexistente.statusCode, 'Evento inexistente');
  });

  test('personal externo exige autorización y valida currículum', async function() {
    var sinToken = await request(app).get('/api/personal-externo');
    expect(sinToken.statusCode).toBe(401);
    registrarCaso('/api/personal-externo', 'Authorization', '(sin token)', 'Bearer obligatorio', 401, sinToken.statusCode, 'Acceso sin autenticación');

    prisma.usuario.findUnique.mockResolvedValueOnce({ gerenteGeneral: { rut: '12345678-5' }, personalOperaciones: null });
    prisma.personalEventual.findMany.mockResolvedValueOnce([]);
    var permitido = await request(app).get('/api/personal-externo').set('Authorization', 'Bearer ' + crearToken('12345678-5', 'GERENTE_GENERAL'));
    expect(permitido.statusCode).toBe(200);
    registrarCaso('/api/personal-externo', 'rol', 'GERENTE_GENERAL', 'Gerente o personal de operaciones', 200, permitido.statusCode, 'Lista autorizada');

    prisma.usuario.findUnique.mockResolvedValueOnce({ gerenteGeneral: null, personalOperaciones: null });
    var denegado = await request(app).get('/api/personal-externo').set('Authorization', 'Bearer ' + crearToken('18765432-7', 'CLIENTE'));
    expect(denegado.statusCode).toBe(403);
    registrarCaso('/api/personal-externo', 'rol', 'CLIENTE', 'No permitido', 403, denegado.statusCode, 'Cliente rechazado');

    prisma.usuario.findUnique.mockResolvedValueOnce({ gerenteGeneral: { rut: '12345678-5' }, personalOperaciones: null });
    prisma.curriculumPersonal.findUnique.mockResolvedValueOnce(null);
    var curriculum = await request(app).get('/api/personal-externo/11111111-1/curriculum').set('Authorization', 'Bearer ' + crearToken('12345678-5', 'GERENTE_GENERAL'));
    expect(curriculum.statusCode).toBe(404);
    registrarCaso('/api/personal-externo/:rut/curriculum', 'curriculum', 'sin adjunto', 'Debe existir', 404, curriculum.statusCode, 'Currículum inexistente');
  });

  test('alertas exige rol interno y valida IDs', async function() {
    var sinToken = await request(app).get('/api/alertas');
    expect(sinToken.statusCode).toBe(401);
    registrarCaso('/api/alertas', 'Authorization', '(sin token)', 'Bearer obligatorio', 401, sinToken.statusCode, 'Alerta sin autenticación');

    prisma.usuario.findUnique.mockResolvedValueOnce({ gerenteGeneral: { rut: '12345678-5' }, personalOperaciones: null });
    var gerente = await request(app).get('/api/alertas').set('Authorization', 'Bearer ' + crearToken('12345678-5', 'GERENTE_GENERAL'));
    expect(gerente.statusCode).toBe(200);
    registrarCaso('/api/alertas', 'rol', 'GERENTE_GENERAL', 'Gerente o personal de operaciones', 200, gerente.statusCode, 'Lista autorizada');

    prisma.usuario.findUnique.mockResolvedValueOnce({ gerenteGeneral: null, personalOperaciones: null });
    var cliente = await request(app).get('/api/alertas').set('Authorization', 'Bearer ' + crearToken('18765432-7', 'CLIENTE'));
    expect(cliente.statusCode).toBe(403);
    registrarCaso('/api/alertas', 'rol', 'CLIENTE', 'No permitido', 403, cliente.statusCode, 'Cliente rechazado');

    prisma.usuario.findUnique.mockResolvedValueOnce({ gerenteGeneral: { rut: '12345678-5' }, personalOperaciones: null });
    var idInvalido = await request(app).patch('/api/alertas/abc/leida').set('Authorization', 'Bearer ' + crearToken('12345678-5', 'GERENTE_GENERAL'));
    expect(idInvalido.statusCode).toBe(400);
    registrarCaso('/api/alertas/:id/leida', 'id', 'abc', 'Entero positivo', 400, idInvalido.statusCode, 'ID inválido');

    prisma.usuario.findUnique.mockResolvedValueOnce({ gerenteGeneral: { rut: '12345678-5' }, personalOperaciones: null });
    prisma.alerta.updateMany.mockResolvedValueOnce({ count: 1 });
    var marcada = await request(app).patch('/api/alertas/1/leida').set('Authorization', 'Bearer ' + crearToken('12345678-5', 'GERENTE_GENERAL'));
    expect(marcada.statusCode).toBe(200);
    registrarCaso('/api/alertas/:id/leida', 'id', 1, 'Alerta existente', 200, marcada.statusCode, 'Alerta marcada');
  });

  test('planes específicos valida asistentes, fechas y horario', async function() {
    var asistentes = await request(app).put('/api/planes-especificos/1/ajustar-asistentes').send({ nuevosAsistentes: 0 });
    expect(asistentes.statusCode).toBe(400);
    registrarCaso('/api/planes-especificos/:id/ajustar-asistentes', 'nuevosAsistentes', 0, 'Entero > 0', 400, asistentes.statusCode, 'Aforo mínimo inválido');

    var sinFecha = await request(app).put('/api/planes-especificos/1/reprogramar-fecha').send({});
    expect(sinFecha.statusCode).toBe(400);
    registrarCaso('/api/planes-especificos/:id/reprogramar-fecha', 'nuevaFecha', '(vacía)', 'Fecha obligatoria', 400, sinFecha.statusCode, 'Fecha ausente');

    var inexistente = await request(app).put('/api/planes-especificos/999/reprogramar-fecha').send({ nuevaFecha: '2026-12-20' });
    prisma.planEspecifico.findUnique.mockResolvedValueOnce(null);
    expect(inexistente.statusCode).toBe(404);
    registrarCaso('/api/planes-especificos/:id/reprogramar-fecha', 'id', 999, 'Evento debe existir', 404, inexistente.statusCode, 'Evento inexistente');
  });

  test('equipos arrendados valida registro, devolución y eliminación', async function() {
    var sinDocumento = await request(app).post('/api/equipos-arrendados').send({});
    expect(sinDocumento.statusCode).toBe(400);
    registrarCaso('/api/equipos-arrendados', 'POST body', '{}', 'Proveedor, equipo, fechas, receptor, garantía y evento válidos', 400, sinDocumento.statusCode, 'Registro incompleto');

    prisma.equipoArrendado.findUnique.mockResolvedValueOnce(null);
    var devolver = await request(app).patch('/api/equipos-arrendados/999/devolver');
    expect(devolver.statusCode).toBe(404);
    registrarCaso('/api/equipos-arrendados/:id/devolver', 'id', 999, 'Debe existir', 404, devolver.statusCode, 'Equipo inexistente');

    prisma.equipoArrendado.findUnique.mockResolvedValueOnce(null);
    var eliminar = await request(app).delete('/api/equipos-arrendados/999');
    expect(eliminar.statusCode).toBe(404);
    registrarCaso('/api/equipos-arrendados/:id', 'DELETE id', 999, 'Debe existir', 404, eliminar.statusCode, 'Equipo inexistente');
  });

  test('usuarios cubre rol permitido, denegado y cliente', async function() {
    prisma.usuario.findUnique.mockResolvedValueOnce({ gerenteGeneral: null, personalOperaciones: { rut: '11111111-1' } });
    var operaciones = await request(app).get('/api/usuarios').set('Authorization', 'Bearer ' + crearToken('11111111-1', 'PERSONAL_OPERACIONES'));
    expect(operaciones.statusCode).toBe(403);
    registrarCaso('/api/usuarios', 'rol', 'PERSONAL_OPERACIONES', 'Solo GERENTE_GENERAL permitido', 403, operaciones.statusCode, 'Rol insuficiente');

    prisma.usuario.findUnique.mockResolvedValueOnce({ gerenteGeneral: { rut: '12345678-5' }, personalOperaciones: null });
    prisma.usuario.findMany.mockResolvedValueOnce([]);
    var gerente = await request(app).get('/api/usuarios').set('Authorization', 'Bearer ' + crearToken('12345678-5', 'GERENTE_GENERAL'));
    expect(gerente.statusCode).toBe(200);
    registrarCaso('/api/usuarios', 'rol', 'GERENTE_GENERAL', 'Rol exclusivo permitido', 200, gerente.statusCode, 'Gerente autorizado');

    prisma.usuario.findUnique.mockResolvedValueOnce({ gerenteGeneral: null, personalOperaciones: null });
    var cliente = await request(app).get('/api/usuarios').set('Authorization', 'Bearer ' + crearToken('18765432-7', 'CLIENTE'));
    expect(cliente.statusCode).toBe(403);
    registrarCaso('/api/usuarios', 'rol', 'CLIENTE', 'Solo GERENTE_GENERAL permitido', 403, cliente.statusCode, 'Cliente rechazado');

    prisma.usuario.findUnique
      .mockResolvedValueOnce({ gerenteGeneral: { rut: '12345678-5' }, personalOperaciones: null })
      .mockResolvedValueOnce(null);
    var usuarioInexistente = await request(app).delete('/api/usuarios/99999999-9').set('Authorization', 'Bearer ' + crearToken('12345678-5', 'GERENTE_GENERAL'));
    expect(usuarioInexistente.statusCode).toBe(404);
    registrarCaso('/api/usuarios/:rut', 'DELETE rut', '99999999-9', 'Usuario debe existir', 404, usuarioInexistente.statusCode, 'Usuario inexistente');
  });

  test('reglas de eventos valida parámetros faltantes y válidos', async function() {
    var faltaFecha = await request(app).post('/api/reglas-eventos/validar-fecha').send({});
    expect(faltaFecha.statusCode).toBe(400);
    registrarCaso('/api/reglas-eventos/validar-fecha', 'diasRestantes', '(vacío)', 'Obligatorio', 400, faltaFecha.statusCode, 'Parámetro ausente');

    var fecha = await request(app).post('/api/reglas-eventos/validar-fecha').send({ diasRestantes: 30 });
    expect(fecha.statusCode).toBe(200);
    registrarCaso('/api/reglas-eventos/validar-fecha', 'diasRestantes', 30, 'Número entero', 200, fecha.statusCode, 'Fecha válida');

    var faltaInvitados = await request(app).post('/api/reglas-eventos/validar-invitados').send({});
    expect(faltaInvitados.statusCode).toBe(400);
    registrarCaso('/api/reglas-eventos/validar-invitados', 'cantidadActual/nueva', '(vacías)', 'Tres parámetros obligatorios', 400, faltaInvitados.statusCode, 'Parámetros ausentes');

    var invitados = await request(app).post('/api/reglas-eventos/validar-invitados').send({ diasRestantes: 30, cantidadActual: 100, cantidadNueva: 120 });
    expect(invitados.statusCode).toBe(200);
    registrarCaso('/api/reglas-eventos/validar-invitados', 'cantidadNueva', 120, 'Cantidad nueva válida', 200, invitados.statusCode, 'Cambio válido');
  });
});