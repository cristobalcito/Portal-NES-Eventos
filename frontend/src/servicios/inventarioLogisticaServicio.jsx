// Funciones compartidas por las páginas de Mantenciones y Equipos arrendados

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Hace una petición y lanza un Error con el mensaje del backend si falla
export async function pedir(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_URL}${ruta}`, opciones);
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos.mensaje || datos.error || 'Ocurrió un error en el servidor');
  }
  return datos;
}

// Encabezado con el token de la sesión (para acciones que requieren permisos)
export function encabezadoAutorizacion() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Usuario guardado al iniciar sesión
export function obtenerUsuarioSesion() {
  try {
    return JSON.parse(localStorage.getItem('usuario')) || null;
  } catch {
    return null;
  }
}

export const formatearFecha = (valor) =>
  valor ? new Date(valor).toLocaleDateString('es-CL') : '-';

export const formatearFechaHora = (valor) =>
  valor
    ? new Date(valor).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-';

export const formatearPesos = (valor) =>
  valor != null ? `$${Number(valor).toLocaleString('es-CL')}` : '-';

const dosDigitos = (n) => String(n).padStart(2, '0');

// Fecha guardada -> "YYYY-MM-DD" (hora local) para inputs type="date"
export const aFechaInput = (valor) => {
  if (!valor) return '';
  const d = new Date(valor);
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
};

// Estilos de formularios y modales (misma línea visual que Gestionar eventos)
export const estilos = {
  fondoModal: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
  },
  cajaModal: {
    backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '560px',
    maxHeight: '90vh', overflowY: 'auto', padding: '25px 30px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)', boxSizing: 'border-box', fontFamily: 'sans-serif'
  },
  encabezadoModal: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '2px solid #8a5b96', paddingBottom: '10px', marginBottom: '20px'
  },
  tituloModal: { margin: 0, color: '#523354', fontSize: '22px' },
  botonCerrar: { background: 'none', border: 'none', fontSize: '26px', lineHeight: 1, cursor: 'pointer', color: '#888' },
  botonTabla: { backgroundColor: 'white', color: '#523354', border: '1px solid #8a5b96', borderRadius: '15px', padding: '5px 12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' },
  botonTablaRojo: { backgroundColor: 'white', color: '#c0392b', border: '1px solid #c0392b', borderRadius: '15px', padding: '5px 12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' },
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#333' },
  input: {
    width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #ccc',
    fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit'
  },
  fila: { display: 'flex', gap: '10px' },
  error: { margin: 0, color: '#b3261e', backgroundColor: '#fdecea', padding: '8px 12px', borderRadius: '10px', fontSize: '14px' },
  exito: {
    backgroundColor: '#e6f4ea', color: '#1e6b34', padding: '10px 20px', borderRadius: '15px',
    marginBottom: '15px', fontWeight: 'bold', textAlign: 'center'
  },
  alerta: {
    backgroundColor: '#fff4e5', color: '#8a4b00', border: '1px solid #f0c27b', padding: '12px 20px',
    borderRadius: '15px', marginBottom: '15px', fontWeight: 'bold'
  },
  botonPrimario: {
    backgroundColor: '#8a5b96', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '20px',
    cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  botonSecundario: {
    backgroundColor: '#aaa', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px',
    cursor: 'pointer', fontWeight: 'bold'
  },
  botonGrande: {
    backgroundColor: '#8a5b96', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '25px',
    fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  tabla: { width: '100%', borderCollapse: 'collapse', textAlign: 'center' },
  th: { padding: '14px 10px', backgroundColor: '#734b75', color: 'white', fontSize: '14px' },
  td: { padding: '12px 10px', borderBottom: '1px solid #eee', fontSize: '14px' },
  contenedorTabla: { backgroundColor: 'white', borderRadius: '12px', overflow: 'auto', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  pagina: { minHeight: '100vh', backgroundColor: '#e5e5e5', fontFamily: 'sans-serif', padding: '30px', boxSizing: 'border-box' }
};

// Etiqueta de color para estados
export function Etiqueta({ color, children }) {
  const colores = {
    rojo: { backgroundColor: '#fdecea', color: '#b3261e' },
    naranjo: { backgroundColor: '#fff4e5', color: '#8a4b00' },
    verde: { backgroundColor: '#e6f4ea', color: '#1e6b34' },
    morado: { backgroundColor: '#f1e6f4', color: '#523354' },
    gris: { backgroundColor: '#eee', color: '#555' }
  };
  return (
    <span style={{ ...colores[color], padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

// Valida un RUT chileno (dígito verificador módulo 11). Acepta con o sin puntos y guion.
export function esRutValido(rutTexto) {
  const limpio = (rutTexto || '').replace(/[.\s-]/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false;
  const cuerpo = limpio.slice(0, -1);
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return limpio.slice(-1) === dvEsperado;
}
