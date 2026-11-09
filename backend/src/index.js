var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
require('dotenv').config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var clientesRouter = require('./routes/clientes');
var eventosRouter = require('./routes/eventos');
var inventarioRouter = require('./routes/inventario');
var personalRouter = require('./routes/personal');

// Importación corregida del router de dashboard
var dashboardRouter = require('./routes/dashboard.js').default || require('./routes/dashboard.js');

var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/eventos', eventosRouter);
app.use('/api/inventario', inventarioRouter);
app.use('/api/personal', personalRouter);
app.use('/api/dashboard', dashboardRouter); // Coincide con la variable declarada arriba

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  console.error('Error de servidor: ', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;