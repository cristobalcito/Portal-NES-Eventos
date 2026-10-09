import axios from 'axios';

const API_URL = 'http://localhost:3000/api/usuarios';

// Extrae el RUT del usuario en sesión (busca en claves comunes de localStorage/sessionStorage)
const obtenerRutUsuarioSesion = () => {
  const clavesPosibles = ['usuario', 'user', 'session', 'auth'];
  
  for (const clave of clavesPosibles) {
    const item = localStorage.getItem(clave) || sessionStorage.getItem(clave);
    if (item) {
      try {
        const datos = JSON.parse(item);
        // Lee directamente la propiedad 'rut' del modelo Usuario
        if (datos?.rut) return datos.rut;
        if (datos?.usuario?.rut) return datos.usuario.rut;
      } catch (e) {
        if (typeof item === 'string' && item.length >= 8) return item;
      }
    }
  }
  return '';
};

const obtenerHeaders = () => {
  return {
    headers: {
      'Content-Type': 'application/json',
      'x-usuario-rut': obtenerRutUsuarioSesion()
    }
  };
};

export const obtenerUsuarios = async () => {
  const respuesta = await axios.get(API_URL, obtenerHeaders());
  return respuesta.data;
};

export const crearUsuario = async (datosUsuario) => {
  const respuesta = await axios.post(API_URL, datosUsuario, obtenerHeaders());
  return respuesta.data;
};

export const modificarUsuario = async (rut, datosUsuario) => {
  const respuesta = await axios.put(`${API_URL}/${rut}`, datosUsuario, obtenerHeaders());
  return respuesta.data;
};

export const eliminarUsuario = async (rut) => {
  const respuesta = await axios.delete(`${API_URL}/${rut}`, obtenerHeaders());
  return respuesta.data;
};