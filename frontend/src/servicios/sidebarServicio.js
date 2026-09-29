// frontend/src/servicios/sidebarServicio.js

/**
 * Obtiene el estilo para el botón de la barra lateral según la ruta activa
 * @param {string} rutaItem - Ruta del menú (ej: '/catalogo')
 * @param {string} rutaActual - Ruta/sección en la que se encuentra el usuario
 */
export function obtenerEstiloBoton(rutaItem, rutaActual = '/catalogo') {
  const esActivo = rutaItem.toLowerCase().includes(rutaActual.toLowerCase()) || 
                   rutaActual.toLowerCase().includes(rutaItem.toLowerCase());

  return {
    padding: '14px 24px',
    color: 'white',
    textDecoration: 'none',
    fontSize: '15px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    // Se oscurece con el morado oscuro del diseño cuando está activo
    backgroundColor: esActivo ? '#523354' : 'transparent',
    fontWeight: esActivo ? 'bold' : 'normal',
    transition: 'background-color 0.2s ease'
  };
}