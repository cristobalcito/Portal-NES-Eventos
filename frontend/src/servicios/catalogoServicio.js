// Asegúrate de que el puerto (3000, 4000, 5000) coincida con tu servidor Express
const API_BASE_URL = 'http://localhost:3000/api'; 

export async function obtenerPlanesBaseServicio() {
  const respuesta = await fetch(`${API_BASE_URL}/catalogo/planes-base`);

  if (!respuesta.ok) {
    throw new Error('Error al consultar el catálogo');
  }

  const resultado = await respuesta.json();
  return resultado.datos || [];
}