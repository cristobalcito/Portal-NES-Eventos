import React from 'react';

export default function TarjetaPlan({ titulo, precio, descripcion }) {
  return (
    <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{
        backgroundColor: '#6b46c1',
        color: '#ffffff',
        padding: '1.5rem 1rem',
        borderRadius: '24px',
        border: '2px solid #1a202c',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '1.1rem'
      }}>
        {titulo}
      </div>

      <div style={{
        backgroundColor: '#f8fafc',
        border: '2px solid #1a202c',
        borderRadius: '24px',
        padding: '1.5rem 1.25rem',
        minHeight: '380px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0 0 1rem 0', color: '#1a202c', fontSize: '0.95rem' }}>
          precio: {precio}
        </p>

        <p style={{ margin: 0, color: '#334155', fontSize: '0.9rem', lineHeight: '1.5' }}>
          descripción: {descripcion}
        </p>
      </div>
    </div>
  );
}
