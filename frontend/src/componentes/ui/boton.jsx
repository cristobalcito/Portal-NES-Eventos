import React from 'react';

export default function Boton({ texto, tipo = 'button', cargando = false, onClick }) {
  const textoBoton = cargando ? 'Cargando...' : texto;

  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={cargando}
      style={{
        width: '100%',
        padding: '0.75rem',
        cursor: cargando ? 'not-allowed' : 'pointer',
        backgroundColor: '#0070f3',
        color: 'white',
        border: 'none',
        borderRadius: '4px'
      }}
    >
      {textoBoton}
    </button>
  );
}