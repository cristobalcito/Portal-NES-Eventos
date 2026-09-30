var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./rutas/index');
var usersRouter = require('./rutas/users');
<<<<<<< Updated upstream

=======
var authRouter = require('./rutas/auth');
var clientesRouter = require('./rutas/clientes');
var eventosRouter = require('./rutas/eventos');
var inventarioRouter = require('./rutas/inventario');
var personalRouter = require('./rutas/personal'); 
>>>>>>> Stashed changes
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
<<<<<<< Updated upstream
=======
app.use('/api/auth', authRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/eventos', eventosRouter);
app.use('/api/inventario', inventarioRouter);
app.use('/api/personal', personalRouter); 

>>>>>>> Stashed changes

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
