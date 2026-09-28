import React from 'react';

export default function CampoTexto({
  etiqueta,
  tipo = 'text',
  nombre,
  valor,
  onChange,
  placeholder,
  requerido = false
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label htmlFor={nombre} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
        {etiqueta}
      </label>
      <input
        id={nombre}
        name={nombre}
        type={tipo}
        value={valor}
        onChange={onChange}
        placeholder={placeholder}
        required={requerido}
        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
      />
    </div>
  );
}
