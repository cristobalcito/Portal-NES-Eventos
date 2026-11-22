const MS_MARGEN_OPERATIVO = 3 * 60 * 60 * 1000;
const zonaHoraria = 'America/Santiago';
const formatoHuso = new Intl.DateTimeFormat('en-US', {
  timeZone: zonaHoraria,
  timeZoneName: 'longOffset'
});
const formatoHora = new Intl.DateTimeFormat('es-CL', {
  timeZone: zonaHoraria,
  hour: '2-digit',
  minute: '2-digit'
});

export const extraerFechaClave = (valor) => {
  if (!valor) return null;
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valor)) {
    return valor.slice(0, 10);
  }
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString().slice(0, 10);
};

const horaEnSantiago = (fecha, hora) => {
  const horaLocal = `${fecha}T${hora}:00:00`;
  const { value } = formatoHuso.formatToParts(new Date(`${horaLocal}Z`))
    .find((parte) => parte.type === 'timeZoneName');
  return new Date(`${horaLocal}${value.slice(3) || 'Z'}`);
};

export const calcularBloqueOperativo = (evento) => {
  const fecha = extraerFechaClave(evento.fecha) || '2026-01-01';
  const salida = evento.horario?.horaSalida;
  const regreso = evento.horario?.horaVuelta || evento.horario?.horaLlegada;
  let inicioBase = new Date(salida);
  let finBase = new Date(regreso);

  if (!salida || !regreso || isNaN(inicioBase) || isNaN(finBase) || inicioBase.getTime() === finBase.getTime()) {
    inicioBase = horaEnSantiago(fecha, '08');
    finBase = horaEnSantiago(fecha, '16');
  }

  const inicioBloqueo = new Date(inicioBase.getTime() - MS_MARGEN_OPERATIVO);
  const finBloqueo = new Date(finBase.getTime() + MS_MARGEN_OPERATIVO);
  return {
    inicioBase,
    finBase,
    inicioBloqueo,
    finBloqueo,
    textoEvento: `${formatoHora.format(inicioBase)} - ${formatoHora.format(finBase)}`,
    textoBloqueo: `${formatoHora.format(inicioBloqueo)} - ${formatoHora.format(finBloqueo)}`
  };
};

const extraerPersonal = (texto) => new Set(String(texto || '')
  .split(/[,;/]+/)
  .map((persona) => persona.trim().toLowerCase())
  .filter((persona) => persona && !['sin asignar', 'no asignado', 'no especificado'].includes(persona)));

// El calendario compara los bloques ampliados solo entre eventos de un mismo día.
export const detectarCrucesDelDia = (eventos) => {
  const cruces = [];
  for (let i = 0; i < eventos.length; i++) {
    const a = eventos[i];
    const personal = extraerPersonal(a.personal);
    for (let j = i + 1; j < eventos.length; j++) {
      const b = eventos[j];
      if (a.bloque.inicioBloqueo < b.bloque.finBloqueo && b.bloque.inicioBloqueo < a.bloque.finBloqueo) {
        const otroPersonal = extraerPersonal(b.personal);
        cruces.push({ a, b, personalRepetido: [...personal].filter((persona) => otroPersonal.has(persona)) });
      }
    }
  }
  return cruces;
};
