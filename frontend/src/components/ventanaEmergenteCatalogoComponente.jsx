import React, { useState } from 'react';
import BotonComponente from './BotonComponente.jsx';

export default function VentanaEmergenteCatalogoComponente({ abierto, alCerrar, alGuardar }) {
  const [costoBase, setCostoBase] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');

  if (!abierto) return null;

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setErrorLocal('');

    if (!costoBase || !descripcion.trim()) {
      setErrorLocal('Por favor completa todos los campos.');
      return;
    }

    try {
      setEnviando(true);
      await alGuardar({
        costoBase: parseFloat(costoBase),
        descripcion: descripcion.trim()
      });
      // Limpiar formulario y cerrar
      setCostoBase('');
      setDescripcion('');
      setEnviando(false);
      alCerrar();
    } catch (err) {
      setEnviando(false);
      setErrorLocal(err.message || 'Error al guardar el plan.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '450px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ marginTop: 0, color: '#523354', marginBottom: '1.5rem' }}>
          Nuevo Plan Base
        </h2>

        {errorLocal && (
          <div style={{
            color: '#ef4444',
            backgroundColor: '#fee2e2',
            padding: '0.5rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {errorLocal}
          </div>
        )}

        <form onSubmit={manejarSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Costo Base ($):
            </label>
            <input
              type="number"
              step="0.01"
              value={costoBase}
              onChange={(e) => setCostoBase(e.target.value)}
              placeholder="Ej: 150000"
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '6px',
                border: '1px solid #ccc',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Descripción:
            </label>
            <textarea
              rows="4"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción detallada del plan base..."
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '6px',
                border: '1px solid #ccc',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <BotonComponente
              texto="Cancelar"
              variante="secundario"
              onClick={alCerrar}
              deshabilitado={enviando}
            />
            <BotonComponente
              texto={enviando ? "Guardando..." : "Guardar Plan"}
              variante="primario"
              onClick={manejarSubmit}
              deshabilitado={enviando}
            />
          </div>
        </form>
      </div>
    </div>
  );
}