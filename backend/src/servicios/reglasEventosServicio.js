
var calcularCambioFecha = function(diasRestantes) {
    if (diasRestantes > 30) {
        return { 
            permitido: true, 
            recargo: 0, 
            mensaje: "Cambio de fecha aplicado sin costo (más de 30 días de anticipación)." 
        };
    } else if (diasRestantes >= 15 && diasRestantes <= 30) {
        return { 
            permitido: true, 
            recargo: 0.10, 
            mensaje: "Cambio de fecha aplicado con un recargo del 10% (entre 15 y 30 días)." 
        };
    } else {
        return { 
            permitido: false, 
            mensaje: "No se permite cambiar la fecha con menos de 15 días de anticipación." 
        };
    }
};

var calcularCambioInvitados = function(diasRestantes, cantidadActual, cantidadNueva) {
    if (diasRestantes > 15) {
        return { 
            permitido: true, 
            tipo: "recalculo", 
            mensaje: "Recálculo de invitados permitido (más de 15 días de anticipación)." 
        };
    } else if (diasRestantes >= 7 && diasRestantes < 15) {
        if (cantidadNueva >= cantidadActual) {
            return { 
                permitido: true, 
                tipo: "aumento", 
                mensaje: "Aumento de invitados permitido (entre 7 y 15 días)." 
            };
        } else {
            return { 
                permitido: false, 
                mensaje: "No se permite disminuir la cantidad de invitados entre 7 y 15 días de anticipación." 
            };
        }
    } else {
        return { 
            permitido: false, 
            mensaje: "No se permite modificar la cantidad de invitados con menos de 7 días de anticipación." 
        };
    }
};

module.exports = {
    calcularCambioFecha: calcularCambioFecha,
    calcularCambioInvitados: calcularCambioInvitados
};