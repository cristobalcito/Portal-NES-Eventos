// frontend/src/servicios/crearPlanBaseServicio.js

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Registra un nuevo Plan Base en el sistema (Exclusivo Gerente General)
 * @param {Object} datosPlan - { costoBase: number, descripcion: string }
 */
export async function crearPlanBaseServicio(datosPlan) {
  const token = localStorage.getItem('token');

  const respuesta = await fetch(`${API_BASE_URL}/catalogo/planes-base`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify(datosPlan)
  });

  if (!respuesta.ok) {
    const errorData = await respuesta.json();
    throw new Error(errorData.mensaje || 'Error al registrar el plan base.');
  }

  const resultado = await respuesta.json();
  return resultado.datos;
}