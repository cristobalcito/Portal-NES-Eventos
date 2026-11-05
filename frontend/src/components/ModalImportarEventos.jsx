import React, { useState, useEffect } from 'react';
import {
  leerArchivo, parsearCSV, convertirFilasEnEventos, descargarPlantilla
} from '../servicios/importarEventosServicio.js';

// Modal para importar varios eventos desde un archivo CSV.
// Pasos: 1) elegir archivo  2) revisar la vista previa  3) importar las filas válidas
export default function ModalImportarEventos({ isOpen, onClose, onImportar }) {
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [filas, setFilas] = useState([]);
  const [error, setError] = useState('');
  const [importando, setImportando] = useState(false);

  // Limpiar todo cada vez que se abre
  useEffect(() => {
    if (isOpen) {
      setNombreArchivo('');
      setFilas([]);
      setError('');
      setImportando(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filasValidas = filas.filter((f) => f.errores.length === 0);
  const filasConError = filas.filter((f) => f.errores.length > 0);

  // Paso 1: leer el archivo elegido y armar la vista previa
  const handleArchivo = async (e) => {
    const archivo = e.target.files[0];
    setFilas([]);
    setError('');
    if (!archivo) return;

    setNombreArchivo(archivo.name);

    if (!archivo.name.toLowerCase().endsWith('.csv')) {
      setError('El archivo debe ser .csv. En Excel usa "Archivo > Guardar como" y elige "CSV UTF-8".');
      return;
    }

    try {
      const texto = await leerArchivo(archivo);
      const resultado = convertirFilasEnEventos(parsearCSV(texto));
      setFilas(resultado);
    } catch (err) {
      setError(err.message);
    }
  };

  // Paso 3: enviar solo las filas válidas al backend
  const handleImportar = async () => {
    try {
      setImportando(true);
      setError('');
      await onImportar(filasValidas.map((f) => f.evento));
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setImportando(false);
    }
  };

  const formatearFecha = (valor) => (valor ? new Date(valor).toLocaleDateString('es-CL') : '-');

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: 'white', borderRadius: '20px', width: '92%', maxWidth: '820px', maxHeight: '90vh',
        overflowY: 'auto', padding: '25px 30px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        boxSizing: 'border-box', fontFamily: 'sans-serif'
      }}>
        {/* Encabezado */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '2px solid #8a5b96', paddingBottom: '10px', marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#523354', fontSize: '22px' }}>Importar eventos</h2>
          <button type="button" onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '26px', lineHeight: 1, cursor: 'pointer', color: '#888' }}>×</button>
        </div>

        {/* Instrucciones y plantilla */}
        <p style={{ margin: '0 0 12px', fontSize: '14px', lineHeight: 1.5, color: '#333' }}>
          Sube un archivo <strong>CSV</strong> con un evento por fila. Puedes prepararlo en Excel y guardarlo
          como <strong>"CSV UTF-8"</strong>. Columnas obligatorias: descripción, lugar, fecha (DD-MM-AAAA), invitados y costo.
          Encargado y horario (hora de salida, llegada y vuelta) son opcionales.
        </p>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '15px' }}>
          <button type="button" onClick={descargarPlantilla} style={{
            backgroundColor: 'white', color: '#523354', border: '1px solid #8a5b96', borderRadius: '20px',
            padding: '9px 18px', fontWeight: 'bold', cursor: 'pointer'
          }}>
            Descargar plantilla
          </button>

          <label style={{
            backgroundColor: '#8a5b96', color: 'white', borderRadius: '20px', padding: '10px 20px',
            fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            Elegir archivo CSV
            <input type="file" accept=".csv" onChange={handleArchivo} style={{ display: 'none' }} />
          </label>

          {nombreArchivo && <span style={{ fontSize: '14px', color: '#555' }}>{nombreArchivo}</span>}
        </div>

        {/* Vista previa */}
        {filas.length > 0 && (
          <>
            <p style={{ margin: '0 0 10px', fontSize: '14px' }}>
              <strong style={{ color: '#1e6b34' }}>{filasValidas.length} evento(s) listos para importar</strong>
              {filasConError.length > 0 && (
                <> · <strong style={{ color: '#b3261e' }}>{filasConError.length} fila(s) con errores</strong> (no se importarán)</>
              )}
            </p>

            <div style={{ border: '1px solid #eee', borderRadius: '12px', overflow: 'auto', maxHeight: '320px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#734b75', color: 'white', position: 'sticky', top: 0 }}>
                    <th style={celdaTitulo}>Fila</th>
                    <th style={celdaTitulo}>Descripción</th>
                    <th style={celdaTitulo}>Lugar</th>
                    <th style={celdaTitulo}>Fecha</th>
                    <th style={celdaTitulo}>Invitados</th>
                    <th style={celdaTitulo}>Costo</th>
                    <th style={celdaTitulo}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.fila} style={{ backgroundColor: f.errores.length ? '#fff8f7' : 'white' }}>
                      <td style={celda}>{f.fila}</td>
                      <td style={celda}>{f.evento.descripcion || '-'}</td>
                      <td style={celda}>{f.evento.lugar || '-'}</td>
                      <td style={celda}>{formatearFecha(f.evento.fecha)}</td>
                      <td style={celda}>{isNaN(f.evento.numPersonas) ? '-' : f.evento.numPersonas}</td>
                      <td style={celda}>{isNaN(f.evento.costoTotal) ? '-' : `$${f.evento.costoTotal.toLocaleString('es-CL')}`}</td>
                      <td style={{ ...celda, color: f.errores.length ? '#b3261e' : '#1e6b34', fontWeight: 'bold' }}>
                        {f.errores.length ? f.errores.join(' ') : 'OK'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {error && (
          <p style={{ margin: '15px 0 0', color: '#b3261e', backgroundColor: '#fdecea', padding: '8px 12px', borderRadius: '10px', fontSize: '14px' }}>
            {error}
          </p>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button type="button" onClick={onClose} style={{
            backgroundColor: '#aaa', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold'
          }}>
            Cancelar
          </button>
          <button type="button" onClick={handleImportar} disabled={filasValidas.length === 0 || importando} style={{
            backgroundColor: '#8a5b96', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '20px', fontWeight: 'bold',
            cursor: filasValidas.length === 0 ? 'not-allowed' : importando ? 'wait' : 'pointer',
            opacity: filasValidas.length === 0 || importando ? 0.6 : 1, boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {importando ? 'Importando...' : `Importar ${filasValidas.length} evento(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}

const celdaTitulo = { padding: '10px 8px', textAlign: 'left', whiteSpace: 'nowrap' };
const celda = { padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left', verticalAlign: 'top' };
