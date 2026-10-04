// frontend/src/servicios/crearPlanBaseServicio.js
const API_BASE_URL = 'http://localhost:3000/api';

export async function crearPlanBaseServicio(datosPlan) {
  const respuesta = await fetch(`${API_BASE_URL}/catalogo/crear-plan-base`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datosPlan)
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok || !resultado.exito) {
    throw new Error(resultado.mensaje || 'Error al crear el plan base.');
  }

  // Retorna únicamente el objeto nuevo (que contiene idPL, costoBase, descripcion)
  return resultado.datos;
}