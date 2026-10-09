// frontend/src/servicios/sidebarServicio.js

/**
 * Obtiene el estilo para el botón de la barra lateral según la ruta activa
 * @param {string} rutaItem - Ruta del menú (ej: '/catalogo')
 * @param {string} rutaActual - Ruta/sección en la que se encuentra el usuario
 */
export function obtenerEstiloBoton(rutaItem, rutaActual = '/catalogo') {
  const esActivo = rutaItem.toLowerCase() === rutaActual.toLowerCase();

  return {
    padding: '14px 24px',
    color: 'white',
    textDecoration: 'none',
    fontSize: '15px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: esActivo ? '#523354' : 'transparent',
    fontWeight: esActivo ? 'bold' : 'normal',
    transition: 'background-color 0.2s ease',
    cursor: 'pointer'
  };
}