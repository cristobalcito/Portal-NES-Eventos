const API_URL = '/api/planes-especificos';

/**
 * Obtiene la lista de planes específicos creados.
 */
export const obtenerPlanesEspecificosServicio = async () => {
  const respuesta = await fetch(API_URL);
  if (!respuesta.ok) {
    const errorData = await respuesta.json().catch(() => ({}));
    throw new Error(errorData.mensaje || 'Error al obtener los planes específicos.');
  }
  return await respuesta.json();
};

/**
 * Envía la petición para crear un nuevo plan específico.
 * @param {Object} datosPlan Datos del plan (incluye costoTotal, fecha, horario, equipamientos, etc.)
 */
export const crearPlanEspecificoServicio = async (datosPlan) => {
  const respuesta = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datosPlan)
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.mensaje || 'Error al crear el plan específico.');
  }

  return data;
};

/**
 * Actualiza un plan específico existente.
 * @param {number|string} idPE ID del plan específico
 * @param {Object} datosPlan Datos a modificar
 */
export const modificarPlanEspecificoServicio = async (idPE, datosPlan) => {
  const respuesta = await fetch(`${API_URL}/${idPE}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datosPlan)
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.mensaje || 'Error al modificar el plan específico.');
  }

  return data;
};

/**
 * Elimina o cancela un plan específico.
 * @param {number|string} idPE ID del plan específico
 */
export const eliminarPlanEspecificoServicio = async (idPE) => {
  const respuesta = await fetch(`${API_URL}/${idPE}`, {
    method: 'DELETE'
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.mensaje || 'Error al eliminar el plan específico.');
  }

  return data;
};