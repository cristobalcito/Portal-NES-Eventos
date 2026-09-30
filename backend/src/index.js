var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
require('dotenv').config();

var indexRouter = require('./rutas/index');
var usersRouter = require('./rutas/users');
var authRouter = require('./rutas/auth');
var clientesRouter = require('./rutas/clientes');
var eventosRouter = require('./rutas/eventos');
var inventarioRouter = require('./rutas/inventario');
var personalRouter = require('./rutas/personal');

var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/eventos', eventosRouter);
app.use('/api/inventario', inventarioRouter);
app.use('/api/personal', personalRouter);

app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.use(function(err, req, res, next) {
  console.error('Error de servidor: ', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 1549;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
