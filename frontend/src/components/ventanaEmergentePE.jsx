import React, { useState, useEffect } from 'react';
import { CONFIG_CATALOGO } from '../constants/catalogoConstantes.js';

export default function VentanaCrearPlanEspecificoComponente({
  abierto,
  alCerrar,
  alGuardar,
  planBaseOrigen,
  listaInventario = []
}) {
  const MAX_CARACTERES = CONFIG_CATALOGO.MAX_CARACTERES_DESCRIPCION || 150;

  // Calcular la fecha mínima permitida (Hoy + 14 días)
  const obtenerFechaMinima = () => {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 14);
    return hoy.toISOString().split('T')[0];
  };

  const [costoTotal, setCostoTotal] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [lugar, setLugar] = useState('');
  const [numPersonas, setNumPersonas] = useState(1);
  const [personal, setPersonal] = useState('');
  const [fecha, setFecha] = useState(obtenerFechaMinima());
  
  // Horarios
  const [horaSalida, setHoraSalida] = useState('08:00');
  const [horaLlegada, setHoraLlegada] = useState('10:00');
  const [horaVuelta, setHoraVuelta] = useState('18:00');

  // Seleccion de Equipamiento
  const [equipamientoSeleccionado, setEquipamientoSeleccionado] = useState([]);
  
  const [errorLocal, setErrorLocal] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (planBaseOrigen) {
      setCostoTotal(Math.round(planBaseOrigen.costoBase || 0).toString());
      setDescripcion(planBaseOrigen.descripcion || '');
    } else {
      setCostoTotal('');
      setDescripcion('');
    }
  }, [planBaseOrigen, abierto]);

  if (!abierto) return null;

  // Controlar ingreso estricto de dinero (solo enteros positivos)
  const manejarCambioCosto = (e) => {
    const valor = e.target.value;
    if (valor === '' || (/^\d+$/.test(valor) && parseInt(valor, 10) >= 0)) {
      setCostoTotal(valor);
    }
  };

  const agregarEquipamiento = (idProducto) => {
    if (!idProducto) return;
    const existe = equipamientoSeleccionado.find(item => item.productoId === idProducto);
    if (existe) return;

    setEquipamientoSeleccionado([
      ...equipamientoSeleccionado,
      { productoId: parseInt(idProducto, 10), cantidad: 1 }
    ]);
  };

  const cambiarCantidadEquipamiento = (idProducto, cantidad) => {
    const cantNum = Math.max(1, parseInt(cantidad, 10) || 1);
    setEquipamientoSeleccionado(prev =>
      prev.map(item => item.productoId === idProducto ? { ...item, cantidad: cantNum } : item)
    );
  };

  const removerEquipamiento = (idProducto) => {
    setEquipamientoSeleccionado(prev => prev.filter(item => item.productoId !== idProducto));
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setErrorLocal('');

    const costoNum = Number(costoTotal);
    if (!costoTotal || isNaN(costoNum) || costoNum < 0 || !Number.isInteger(costoNum)) {
      setErrorLocal('El costo total debe ser un número entero positivo (sin decimales ni negativos).');
      return;
    }

    if (!descripcion.trim() || !lugar.trim() || !personal.trim()) {
      setErrorLocal('Por favor completa todos los campos requeridos.');
      return;
    }

    if (descripcion.length > MAX_CARACTERES) {
      setErrorLocal(`La descripción no puede superar los ${MAX_CARACTERES} caracteres.`);
      return;
    }

    // Construir objetos DateTime para los horarios
    const fechaSalidaDT = new Date(`${fecha}T${horaSalida}`);
    const fechaLlegadaDT = new Date(`${fecha}T${horaLlegada}`);
    const fechaVueltaDT = new Date(`${fecha}T${horaVuelta}`);

    try {
      setGuardando(true);
      await alGuardar({
        planBaseId: planBaseOrigen?.idPL || planBaseOrigen?.id || null,
        costoTotal: costoNum,
        descripcion: descripcion.trim(),
        lugar: lugar.trim(),
        numPersonas: parseInt(numPersonas, 10),
        personal: personal.trim(),
        fecha: new Date(fecha).toISOString(),
        horaSalida: fechaSalidaDT.toISOString(),
        horaLlegada: fechaLlegadaDT.toISOString(),
        horaVuelta: fechaVueltaDT.toISOString(),
        equipamientos: equipamientoSeleccionado
      });

      setGuardando(false);
      alCerrar();
    } catch (err) {
      console.error('Error al guardar plan especifico:', err);
      setErrorLocal(err.message || 'Ocurrió un error al crear el plan específico.');
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
        maxWidth: '650px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        <h2 style={{ marginTop: 0, color: '#1f2937', marginBottom: '1rem' }}>
          Crear Plan Específico {planBaseOrigen ? `(Basado en Plan #${planBaseOrigen.idPL || planBaseOrigen.id})` : ''}
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
          {/* Fecha del Evento */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', color: '#374151' }}>
              Fecha del Evento (Mínimo 2 semanas de antelación):
            </label>
            <input
              type="date"
              min={obtenerFechaMinima()}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>

          {/* Costo Total */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', color: '#374151' }}>
              Costo Total ($ CLP - Solo números enteros sin decimales):
            </label>
            <input
              type="text"
              placeholder="Ej: 250000"
              value={costoTotal}
              onChange={manejarCambioCosto}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>

          {/* Descripción con Contador Global */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <label style={{ fontWeight: 'bold', color: '#374151' }}>Descripción:</label>
              <span style={{ fontSize: '0.85rem', color: descripcion.length >= MAX_CARACTERES ? '#ef4444' : '#6b7280' }}>
                {descripcion.length} de {MAX_CARACTERES} caracteres permitidos
              </span>
            </div>
            <textarea
              rows="3"
              maxLength={MAX_CARACTERES}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: descripcion.length >= MAX_CARACTERES ? '1.5px solid #ef4444' : '1px solid #d1d5db',
                resize: 'none'
              }}
            />
          </div>

          {/* Lugar y Número de Personas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', color: '#374151' }}>Lugar:</label>
              <input
                type="text"
                placeholder="Ej: Centro de Eventos..."
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', color: '#374151' }}>N° Personas:</label>
              <input
                type="number"
                min="1"
                value={numPersonas}
                onChange={(e) => setNumPersonas(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
              />
            </div>
          </div>

          {/* Personal Requerido */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', color: '#374151' }}>Personal Requerido:</label>
            <input
              type="text"
              placeholder="Ej: 2 Garzones, 1 DJ, 1 Coordinador"
              value={personal}
              onChange={(e) => setPersonal(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>

          {/* Horarios */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Hora Salida:</label>
              <input type="time" value={horaSalida} onChange={(e) => setHoraSalida(e.target.value)} style={{ width: '100%', padding: '0.4rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Hora Llegada:</label>
              <input type="time" value={horaLlegada} onChange={(e) => setHoraLlegada(e.target.value)} style={{ width: '100%', padding: '0.4rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Hora Vuelta:</label>
              <input type="time" value={horaVuelta} onChange={(e) => setHoraVuelta(e.target.value)} style={{ width: '100%', padding: '0.4rem' }} />
            </div>
          </div>

          {/* Pre-asignación de Equipamiento de Inventario */}
          <div style={{ marginBottom: '1.5rem', border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '6px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem', color: '#374151' }}>
              Pre-asignar Equipamiento (Descuento de Inventario):
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <select
                onChange={(e) => {
                  agregarEquipamiento(e.target.value);
                  e.target.value = '';
                }}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
              >
                <option value="">-- Seleccionar item de inventario --</option>
                {listaInventario.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.producto} (Disponibles: {item.disponible})
                  </option>
                ))}
              </select>
            </div>

            {equipamientoSeleccionado.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {equipamientoSeleccionado.map(eq => {
                  const prod = listaInventario.find(i => i.id === eq.productoId);
                  return (
                    <li key={eq.productoId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem' }}>{prod?.producto || `Item #${eq.productoId}`}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="number"
                          min="1"
                          value={eq.cantidad}
                          onChange={(e) => cambiarCantidadEquipamiento(eq.productoId, e.target.value)}
                          style={{ width: '60px', padding: '0.2rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => removerEquipamiento(eq.productoId)}
                          style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '3px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
                        >
                          X
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="button"
              onClick={alCerrar}
              disabled={guardando}
              style={{ padding: '0.6rem 1.2rem', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              style={{ padding: '0.6rem 1.2rem', borderRadius: '4px', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: 'bold', cursor: guardando ? 'not-allowed' : 'pointer' }}
            >
              {guardando ? 'Guardando...' : 'Crear Plan Específico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}