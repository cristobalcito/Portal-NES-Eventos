import React from 'react';

export default function Boton({ texto, tipo = 'button', cargando = false, onClick }) {
  const contenido = cargando ? 'Cargando...' : texto;

  return (
    
      {contenido}
    
  );
}