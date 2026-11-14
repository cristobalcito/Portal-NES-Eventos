
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const clienteApi = {
  // POST: mantiene el funcionamiento del inicio de sesión
  post: async (endpoint, datos) => {
    const respuesta = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });

    if (!respuesta.ok) {
      const errorData = await respuesta.json().catch(() => ({}));
      throw new Error(errorData.mensaje || 'Error en la solicitud');
    }

    return await respuesta.json();
  },

  // GET: consultar información protegida
  get: async (endpoint) => {
    const token = localStorage.getItem('token');

    const respuesta = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      throw new Error(datos.mensaje || datos.error || 'Error al consultar información');
    }

    return datos;
  },

  // PATCH: actualizar información protegida
  patch: async (endpoint, datos) => {
    const token = localStorage.getItem('token');

    const respuesta = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(datos !== undefined ? { body: JSON.stringify(datos) } : {})
    });

    const resultado = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || resultado.error || 'Error al actualizar información');
    }

    return resultado;
  }
};
