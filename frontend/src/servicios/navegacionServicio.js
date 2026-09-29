import { useState, useEffect } from 'react';

// Clave para guardar la pestaña actual en el almacenamiento local
const SECCION_STORAGE_KEY = 'seccion_activa_app';

/**
 * Hook personalizado para gestionar la navegación global de la interfaz
 * @param {string} seccionInicial - Nombre de la sección por defecto (ej. 'Home' o 'Catálogo')
 */
export function useNavegacion(seccionInicial = 'Home') {
  const [seccionActual, setSeccionActual] = useState(() => {
    const guardada = localStorage.getItem(SECCION_STORAGE_KEY);
    return guardada || seccionInicial;
  });

  useEffect(() => {
    localStorage.setItem(SECCION_STORAGE_KEY, seccionActual);
  }, [seccionActual]);

  const irA = (nuevaSeccion) => {
    if (nuevaSeccion && typeof nuevaSeccion === 'string') {
      setSeccionActual(nuevaSeccion);
    }
  };

  return {
    seccionActual,
    irA
  };
}