// src/servicios/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const clienteApi = {
  post: async (endpoint, datos) => {
    const respuesta = await fetch(`\({API_URL}\){endpoint}`, {
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
  }
};