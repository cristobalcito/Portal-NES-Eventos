import React, { createContext, useContext, useState } from 'react';
import { iniciarSesionServicio } from '../servicios/autenticacionServicio.jsx';

const AutenticacionContexto = createContext(null);

export function ProveedorAutenticacion({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  // Función auxiliar para deducir el rol según las relaciones de Prisma
  const obtenerRol = (datosUsuario) => {
    if (!datosUsuario) return null;
    if (datosUsuario.gerenteGeneral) return 'GERENTE_GENERAL';
    if (datosUsuario.personalOperaciones) return 'PERSONAL_OPERACIONES';
    if (datosUsuario.cliente) return 'CLIENTE';
    if (datosUsuario.personalEventual) return 'PERSONAL_EVENTUAL';
    return 'USUARIO';
  };

  // Esta es la función login que llama a nuestro servicio
  const login = async (credenciales) => {
    // 1. Llama al servicio de autenticación
    const respuesta = await iniciarSesionServicio(credenciales);

    // 2. Extrae el usuario y asigna su rol detectado
    const datosUsuario = respuesta.usuario;
    const usuarioConRol = {
      ...datosUsuario,
      rol: obtenerRol(datosUsuario)
    };

    // 3. Guarda la sesión en el estado global y en localStorage
    setUsuario(usuarioConRol);
    localStorage.setItem('usuario', JSON.stringify(usuarioConRol));

    return usuarioConRol;
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
  };

  return (
    
      {children}
    
  );
}

// Hook personalizado para usar la sesión fácilmente en cualquier componente
export function useAutenticacion() {
  return useContext(AutenticacionContexto);
}