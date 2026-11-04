
var reglasServicio = require('../servicios/reglasEventosServicio');

var validarCambioFecha = function(req, res) {
    var diasRestantes = req.body.diasRestantes;

    if (diasRestantes === undefined || diasRestantes === null) {
        return res.status(400).json({ error: "Debe indicar los días restantes para el evento." });
    }

    var resultado = reglasServicio.calcularCambioFecha(diasRestantes);
    return res.json(resultado);
};

var validarCambioInvitados = function(req, res) {
    var diasRestantes = req.body.diasRestantes;
    var cantidadActual = req.body.cantidadActual;
    var cantidadNueva = req.body.cantidadNueva;

    if (!diasRestantes || !cantidadActual || !cantidadNueva) {
        return res.status(400).json({ error: "Faltan parámetros requeridos para la validación." });
    }

    var resultado = reglasServicio.calcularCambioInvitados(diasRestantes, cantidadActual, cantidadNueva);
    return res.json(resultado);
};

module.exports = {
    validarCambioFecha: validarCambioFecha,
    validarCambioInvitados: validarCambioInvitados
};