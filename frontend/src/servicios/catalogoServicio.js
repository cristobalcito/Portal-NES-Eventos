const API_BASE_URL = 'http://localhost:3000/api'; 

export async function obtenerPlanesBaseServicio() {
  const respuesta = await fetch(`${API_BASE_URL}/catalogo/planes-base`);

  if (!respuesta.ok) {
    throw new Error('Error al consultar el catálogo');
  }

  const resultado = await respuesta.json();
  return resultado;
}

export async function obtenerPermisoCatalogoServicio() {
  const token = localStorage.getItem('token');
  if (!token) return false;

  const respuesta = await fetch(`${API_BASE_URL}/catalogo/planes-base/permisos`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (respuesta.status === 401 || respuesta.status === 403) return false;
  if (!respuesta.ok) {
    throw new Error('Error al consultar el permiso de gestión del catálogo');
  }

  const resultado = await respuesta.json();
  return resultado.puedeGestionarPlanesBase === true;
}

export async function crearPlanBaseServicio(datosNuevoPlan) {
  const token = localStorage.getItem('token');

  const respuesta = await fetch(`${API_BASE_URL}/catalogo/plan-base`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(datosNuevoPlan)
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.mensaje || 'Error al crear el plan base');
  }

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

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.mensaje || `Error al modificar el plan base #${idPL}`);
  }

  return resultado;
}

export async function eliminarPlanBaseServicio(idPL) {
  const token = localStorage.getItem('token');

  const respuesta = await fetch(`${API_BASE_URL}/catalogo/plan-base/${idPL}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.mensaje || `Error al eliminar el plan base #${idPL}`);
  }

  return resultado;
}
