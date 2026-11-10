const obtenerDiasDiferencia = (fechaEvento) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaEv = new Date(fechaEvento);
  fechaEv.setHours(0, 0, 0, 0);

  const diferenciaMs = fechaEv.getTime() - hoy.getTime();
  return Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
};

const evaluarAjusteAsistentes = (fechaEvento, asistentesActuales, nuevosAsistentes) => {
  const diasFaltantes = obtenerDiasDiferencia(fechaEvento);

  if (diasFaltantes < 7) {
    return {
      permitido: false,
      codigo: 'BLOQUEADO_POR_TIEMPO',
      mensaje: `No se puede modificar la cantidad de asistentes con menos de 7 dias de anticipacion (Faltan ${diasFaltantes} dias).`
    };
  }

  if (diasFaltantes >= 7 && diasFaltantes <= 15) {
    if (nuevosAsistentes < asistentesActuales) {
      return {
        permitido: false,
        codigo: 'SOLO_INCREMENTO_PERMITIDO',
        mensaje: `Entre 7 y 15 dias de anticipacion solo se permite aumentar la cantidad de asistentes (Faltan ${diasFaltantes} dias).`
      };
    }

    return {
      permitido: true,
      codigo: 'INCREMENTO_CON_RECARGO',
      diasFaltantes,
      aplicaRecargoInsumos: true,
      mensaje: 'Aumento de asistentes permitido. Se recalcularan cobros e insumos adicionales.'
    };
  }

  return {
    permitido: true,
    codigo: 'AJUSTE_LIBRE',
    diasFaltantes,
    aplicaRecargoInsumos: false,
    mensaje: 'Ajuste de asistentes permitido sin restricciones temporales.'
  };
};

const evaluarReprogramacionFecha = (fechaEventoActual) => {
  const diasFaltantes = obtenerDiasDiferencia(fechaEventoActual);

  if (diasFaltantes < 15) {
    return {
      permitido: false,
      codigo: 'REPROGRAMACION_BLOQUEADA',
      porcentajeRecargo: 0,
      mensaje: `No es posible reprogramar el evento con menos de 15 dias de anticipacion (Faltan ${diasFaltantes} dias).`
    };
  }

  if (diasFaltantes >= 15 && diasFaltantes <= 30) {
    return {
      permitido: true,
      codigo: 'REPROGRAMACION_CON_RECARGO',
      porcentajeRecargo: 10,
      diasFaltantes,
      mensaje: `Reprogramacion permitida con recargo del 10% sobre el monto total (Faltan ${diasFaltantes} dias).`
    };
  }

  return {
    permitido: true,
    codigo: 'REPROGRAMACION_SIN_COSTO',
    porcentajeRecargo: 0,
    diasFaltantes,
    mensaje: 'Reprogramacion permitida sin penalizacion financiera.'
  };
};

module.exports = {
  obtenerDiasDiferencia,
  evaluarAjusteAsistentes,
  evaluarReprogramacionFecha
};