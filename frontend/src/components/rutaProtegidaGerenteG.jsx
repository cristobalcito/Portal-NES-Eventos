import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Función auxiliar para recuperar la sesión activa del almacenamiento local o de sesión
const obtenerUsuarioSesion = () => {
  const clavesPosibles = ['usuario', 'user', 'session', 'auth'];
  for (const clave of clavesPosibles) {
    const item = localStorage.getItem(clave) || sessionStorage.getItem(clave);
    if (item) {
      try {
        return JSON.parse(item);
      } catch (e) {
        // En caso de que se haya guardado sólo un identificador
        return null;
      }
    }
  }
  return null;
};

const RutaProtegidaGerente = () => {
  const usuario = obtenerUsuarioSesion();

  // 1. Si no hay sesión iniciada o el rol no es GERENTE_GENERAL, bloquea el acceso
  if (!usuario || usuario.rol !== 'GERENTE_GENERAL') {
    // Redirige al usuario a la página principal o login
    return <Navigate to="/" replace />;
  }

  // 2. Si es GERENTE_GENERAL, le da paso para renderizar las rutas Hijas (<Outlet />)
  return <Outlet />;
};

export default RutaProtegidaGerente;