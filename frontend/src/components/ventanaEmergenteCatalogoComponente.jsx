import React, { useState } from 'react';

export default function VentanaEmergenteCatalogoComponente({ abierto, alCerrar, alGuardar }) {
  const [costoBase, setCostoBase] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errorLocal, setErrorLocal] = useState('');
  const [guardando, setGuardando] = useState(false);

  if (!abierto) return null;

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setErrorLocal('');

    if (!costoBase || !descripcion.trim()) {
      setErrorLocal('Por favor completa todos los campos.');
      return;
    }

    try {
      setGuardando(true);
      await alGuardar({
        costoBase: parseFloat(costoBase),
        descripcion: descripcion.trim()
      });

      setCostoBase('');
      setDescripcion('');
      setGuardando(false);
      alCerrar();
    } catch (err) {
      console.error('Error al guardar desde el modal:', err);
      setErrorLocal('Ocurrió un error al guardar el plan base.');
      setGuardando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '2rem',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        <h2 style={{ marginTop: 0, color: '#1f2937', marginBottom: '1.5rem' }}>
          Agregar Nuevo Plan Base
        </h2>

        {errorLocal && (
          <div style={{
            color: '#ef4444',
            backgroundColor: '#fee2e2',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {errorLocal}
          </div>
        )}

        <form onSubmit={manejarSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}>
              Costo Base ($):
            </label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Ej: 150000"
              value={costoBase}
              onChange={(e) => setCostoBase(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}>
              Descripción:
            </label>
            <textarea
              rows="4"
              placeholder="Descripción detallada del plan base..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="button"
              onClick={alCerrar}
              disabled={guardando}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 'bold',
                cursor: guardando ? 'not-allowed' : 'pointer'
              }}
            >
              {guardando ? 'Guardando...' : 'Guardar Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}