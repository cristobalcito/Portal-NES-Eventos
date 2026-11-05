const API_BASE_URL = 'http://localhost:3000/api'; 

export async function obtenerPlanesBaseServicio() {
  const respuesta = await fetch(`${API_BASE_URL}/catalogo/planes-base`);

  if (!respuesta.ok) {
    throw new Error('Error al consultar el catálogo');
  }

  const resultado = await respuesta.json();
  return resultado;
}

export async function modificarPlanBaseServicio(idPL, datosActualizados) {
  const token = localStorage.getItem('token');
  
  const respuesta = await fetch(`${API_BASE_URL}/catalogo/plan-base/${idPL}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(datosActualizados)
  });

  if (!respuesta.ok) {
    throw new Error(`Error al modificar el plan base #${idPL}`);
  }

  const resultado = await respuesta.json();
  return resultado;
}
