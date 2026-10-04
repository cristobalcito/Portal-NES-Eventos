import React from 'react';

export default function BotonComponente({
  texto,
  onClick,
  variante = 'primario', // 'primario', 'icono', 'secundario'
  deshabilitado = false,
  estiloExtra = {}
}) {
  // Estilos base compartidos
  const estiloBase = {
    fontFamily: 'inherit',
    border: 'none',
    cursor: deshabilitado ? 'not-allowed' : 'pointer',
    opacity: deshabilitado ? 0.6 : 1,
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600'
  };

  // Variaciones de estilo
  const variaciones = {
    primario: {
      backgroundColor: '#523354',
      color: '#ffffff',
      padding: '0.6rem 1.2rem',
      borderRadius: '8px',
      fontSize: '0.95rem'
    },
    secundario: {
      backgroundColor: 'transparent',
      color: '#523354',
      border: '2px solid #523354',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      fontSize: '0.95rem'
    },
    icono: {
      backgroundColor: '#523354',
      color: '#ffffff',
      borderRadius: '50%',
      width: '55px',
      height: '55px',
      fontSize: '1.8rem',
      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
      flexShrink: 0
    }
  };

  const estiloFinal = {
    ...estiloBase,
    ...(variaciones[variante] || variaciones.primario),
    ...estiloExtra
  };

  return (
    <button
      onClick={onClick}
      disabled={deshabilitado}
      style={estiloFinal}
    >
      {texto}
    </button>
  );
}