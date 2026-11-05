// Funciones para importar eventos desde un archivo CSV (Excel puede guardar y abrir este formato).
//
// Columnas del archivo (la primera fila son los títulos):
//   descripcion; lugar; fecha; invitados; costo; encargado; hora_salida; hora_llegada; hora_vuelta
// Las últimas cuatro son opcionales.

// 1. LEER EL ARCHIVO
// Excel a veces guarda en UTF-8 y a veces en el formato antiguo de Windows.
// Se intenta primero UTF-8 y, si falla, el formato de Windows, para que los tildes y la ñ se lean bien.
export async function leerArchivo(archivo) {
  const bytes = await archivo.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

// 2. SEPARAR EL TEXTO EN FILAS Y COLUMNAS
// Excel en español separa con ";" y en inglés con ",". Se usa el que aparezca más en la primera línea.
// Un valor entre comillas puede contener el separador, por ejemplo: "Centro de eventos; salón 2"
export function parsearCSV(texto) {
  const limpio = texto.replace(/^﻿/, ''); // quita un carácter invisible que agrega Excel al inicio
  const primeraLinea = limpio.split(/\r?\n/)[0];
  const separador = primeraLinea.split(';').length >= primeraLinea.split(',').length ? ';' : ',';

  const filas = [];
  let fila = [];
  let valor = '';
  let entreComillas = false;

  for (let i = 0; i < limpio.length; i++) {
    const caracter = limpio[i];

    if (entreComillas) {
      if (caracter === '"' && limpio[i + 1] === '"') {
        valor += '"'; // dos comillas seguidas = una comilla dentro del texto
        i++;
      } else if (caracter === '"') {
        entreComillas = false;
      } else {
        valor += caracter;
      }
    } else if (caracter === '"') {
      entreComillas = true;
    } else if (caracter === separador) {
      fila.push(valor.trim());
      valor = '';
    } else if (caracter === '\n') {
      fila.push(valor.trim());
      filas.push(fila);
      fila = [];
      valor = '';
    } else if (caracter !== '\r') {
      valor += caracter;
    }
  }
  fila.push(valor.trim());
  filas.push(fila);

  // Se descartan las filas vacías
  return filas.filter((f) => f.some((v) => v !== ''));
}

// 3. RECONOCER LAS COLUMNAS
// Se aceptan títulos con o sin tildes, mayúsculas o espacios, y algunos sinónimos.
const SINONIMOS = {
  descripcion: ['descripcion', 'nombre', 'evento', 'nombre_evento'],
  lugar: ['lugar', 'direccion', 'ubicacion'],
  fecha: ['fecha', 'fecha_evento'],
  invitados: ['invitados', 'num_personas', 'personas', 'n_invitados'],
  costo: ['costo', 'costo_total', 'precio', 'valor'],
  encargado: ['encargado', 'personal', 'organizador'],
  hora_salida: ['hora_salida', 'salida'],
  hora_llegada: ['hora_llegada', 'llegada'],
  hora_vuelta: ['hora_vuelta', 'vuelta']
};

const normalizarTitulo = (titulo) =>
  titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[°º.]/g, '').trim().replace(/\s+/g, '_');

function ubicarColumnas(titulos) {
  const normalizados = titulos.map(normalizarTitulo);
  const posiciones = {};
  for (const [campo, opciones] of Object.entries(SINONIMOS)) {
    posiciones[campo] = normalizados.findIndex((t) => opciones.includes(t));
  }
  return posiciones;
}

// 4. CONVERTIR FECHAS, HORAS Y NÚMEROS ESCRITOS EN EXCEL
// Fecha: acepta 20-11-2026, 20/11/2026 o 2026-11-20. Devuelve "2026-11-20" o null.
function convertirFecha(texto) {
  let dia, mes, anio;
  let partes = texto.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (partes) {
    [, dia, mes, anio] = partes;
  } else {
    partes = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!partes) return null;
    [, anio, mes, dia] = partes;
  }

  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
  // Revisa que la fecha exista (por ejemplo, rechaza 31-02-2026)
  if (fecha.getMonth() !== Number(mes) - 1) return null;

  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

// Hora: acepta 9:30 o 09:30. Devuelve "09:30" o null.
function convertirHora(texto) {
  const partes = texto.match(/^(\d{1,2}):(\d{2})/);
  if (!partes || Number(partes[1]) > 23 || Number(partes[2]) > 59) return null;
  return `${partes[1].padStart(2, '0')}:${partes[2]}`;
}

// Número entero (pesos o personas): acepta "2.500.000", "$2.500.000", "2,500,000" o "2500000".
// Se dejan solo los dígitos. Si no hay dígitos o es negativo, no es válido.
function convertirNumero(texto) {
  if (texto.includes('-')) return NaN;
  const soloDigitos = texto.replace(/\D/g, '');
  return soloDigitos === '' ? NaN : Number(soloDigitos);
}

// Une fecha y hora (hora local) y la pasa al formato que espera el backend
const unirFechaHora = (fecha, hora) => new Date(`${fecha}T${hora}:00`).toISOString();

// 5. CONVERTIR TODO EL ARCHIVO EN EVENTOS
// Devuelve una lista donde cada fila trae sus datos y sus errores (si los hay).
export function convertirFilasEnEventos(filas) {
  if (filas.length < 2) {
    throw new Error('El archivo no tiene eventos. La primera fila deben ser los títulos y luego un evento por fila.');
  }

  const columnas = ubicarColumnas(filas[0]);
  const faltantes = ['descripcion', 'lugar', 'fecha', 'invitados', 'costo'].filter((c) => columnas[c] === -1);
  if (faltantes.length > 0) {
    throw new Error(`Al archivo le faltan las columnas: ${faltantes.join(', ')}. Descarga la plantilla para ver el formato.`);
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return filas.slice(1).map((valores, indice) => {
    const leer = (campo) => (columnas[campo] === -1 ? '' : valores[columnas[campo]] || '');
    const errores = [];

    const descripcion = leer('descripcion');
    const lugar = leer('lugar');
    const fecha = convertirFecha(leer('fecha'));
    const invitados = convertirNumero(leer('invitados'));
    const costo = convertirNumero(leer('costo'));
    const encargado = leer('encargado');
    const horas = [leer('hora_salida'), leer('hora_llegada'), leer('hora_vuelta')];

    if (!descripcion) errores.push('Falta la descripción.');
    if (!lugar) errores.push('Falta el lugar.');
    if (!fecha) errores.push('Fecha no válida (usa DD-MM-AAAA).');
    else if (new Date(`${fecha}T00:00:00`) < hoy) errores.push('La fecha ya pasó.');
    if (!Number.isInteger(invitados) || invitados <= 0) errores.push('Invitados debe ser un número entero mayor a 0.');
    if (isNaN(costo) || costo < 0) errores.push('Costo no válido.');

    // Horario opcional: o se completan las tres horas o ninguna
    const horasEscritas = horas.filter((h) => h !== '');
    let horario = null;
    if (horasEscritas.length > 0) {
      const horasConvertidas = horas.map(convertirHora);
      if (horasEscritas.length < 3 || horasConvertidas.includes(null)) {
        errores.push('Horario incompleto o mal escrito (usa HH:MM en las tres horas).');
      } else if (fecha) {
        horario = {
          horaSalida: unirFechaHora(fecha, horasConvertidas[0]),
          horaLlegada: unirFechaHora(fecha, horasConvertidas[1]),
          horaVuelta: unirFechaHora(fecha, horasConvertidas[2])
        };
      }
    }

    return {
      fila: indice + 2, // número de fila tal como se ve en Excel (la 1 son los títulos)
      errores,
      // Datos con el mismo formato que usa el formulario de "Agregar evento"
      evento: {
        fila: indice + 2,
        descripcion,
        lugar,
        fecha: fecha ? unirFechaHora(fecha, '12:00') : null,
        numPersonas: invitados,
        costoTotal: costo,
        personal: encargado,
        horario
      }
    };
  });
}

// 6. PLANTILLA DE EJEMPLO PARA DESCARGAR
// Se separa con ";" y se agrega un carácter especial al inicio para que Excel muestre bien los tildes.
export function descargarPlantilla() {
  const anio = new Date().getFullYear() + 1;
  const lineas = [
    'descripcion;lugar;fecha;invitados;costo;encargado;hora_salida;hora_llegada;hora_vuelta',
    `Matrimonio Pérez Soto;Centro de Eventos Los Robles;14-02-${anio};150;2500000;Mateo González;14:00;15:30;23:30`,
    `Aniversario Empresa Sur;Hotel Diego de Almagro, Concepción;20-03-${anio};80;1200000;;;;`
  ];

  const archivo = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = 'plantilla_eventos.csv';
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}
