var calcularCambioFecha = function(diasRestantes, rol) {
    if (diasRestantes > 30) {
        return {
            permitido: true,
            recargo: 0,
            mensaje: "Cambio de fecha aplicado sin costo (más de 30 días de anticipación)."
        };
    }

    if (diasRestantes >= 15) {
        return {
            permitido: true,
            recargo: 0.10,
            mensaje: "Cambio de fecha aplicado con un recargo del 10% (entre 15 y 30 días)."
        };
    }

    if (rol === 'GERENTE_GENERAL') {
        return {
            permitido: true,
            requiereConfirmacion: true,
            mensaje: "Advertencia: faltan menos de 15 días para el evento. ¿Confirmas el cambio de fecha fuera de plazo?"
        };
    }

    return {
        permitido: false,
        mensaje: "No se permite cambiar la fecha con menos de 15 días de anticipación."
    };
};

var calcularCambioInvitados = function(diasRestantes, cantidadActual, cantidadNueva, rol) {
    if (diasRestantes > 15) {
        return {
            permitido: true,
            tipo: "recalculo",
            mensaje: "Recálculo de invitados permitido (más de 15 días de anticipación)."
        };
    }

    if (diasRestantes >= 7 && cantidadNueva >= cantidadActual) {
        return {
            permitido: true,
            tipo: "aumento",
            mensaje: "Aumento de invitados permitido (entre 7 y 15 días de anticipación)."
        };
    }

    if (rol === 'GERENTE_GENERAL') {
        return {
            permitido: true,
            requiereConfirmacion: true,
            mensaje: `Advertencia: cambiar de ${cantidadActual} a ${cantidadNueva} invitados está fuera del plazo permitido. ¿Confirmas el cambio?`
        };
    }

    if (diasRestantes >= 7) {
        return {
            permitido: false,
            mensaje: "No se permite disminuir la cantidad de invitados entre 7 y 15 días de anticipación."
        };
    }

    return {
        permitido: false,
        mensaje: "No se permite modificar la cantidad de invitados con menos de 7 días de anticipación."
    };
};

module.exports = {
    calcularCambioFecha: calcularCambioFecha,
    calcularCambioInvitados: calcularCambioInvitados
};