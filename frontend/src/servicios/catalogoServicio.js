// URL base apuntando a Express (Puerto 3000 según tu index.js)
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Petición al backend para obtener la lista de planes base del catálogo
 */
export async function obtenerPlanesBaseServicio() {
  const token = localStorage.getItem('token');

  const respuesta = await fetch(`${API_BASE_URL}/catalogo/planes-base`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });

  if (!respuesta.ok) {
    throw new Error('No se pudo obtener la información del catálogo.');
  }

  const resultado = await respuesta.json();
  return resultado.datos;
}