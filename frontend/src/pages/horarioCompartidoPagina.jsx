import React, { useState, useEffect } from 'react';
import {
  obtenerPlanesEspecificosServicio,
  modificarPlanEspecificoServicio,
  eliminarPlanEspecificoServicio
} from '../servicios/planEspecificoServicio.js';
import { CONFIG_CATALOGO } from '../constants/catalogoConstantes.js';

export default function HorarioCompartidoPagina() {
  const [planesEspecificos, setPlanesEspecificos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState('');

  // Estado para modal de edicion rápida
  const [planAEditar, setPlanAEditar] = useState(null);
  const [nuevoCosto, setNuevoCosto] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const MAX_CARACTERES = CONFIG_CATALOGO.MAX_CARACTERES_DESCRIPCION || 300;

  const cargarPlanesEspecificos = async () => {
    try {
      setCargando(true);
      const respuesta = await obtenerPlanesEspecificosServicio();
      const lista = respuesta.datos || respuesta;
      setPlanesEspecificos(Array.isArray(lista) ? lista : []);
      setCargando(false);
    } catch (err) {
      console.error('Error al cargar eventos/horario compartido:', err);
      setError('No se pudieron cargar los eventos del horario compartido.');
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPlanesEspecificos();
  }, []);

  const abrirModalEdicion = (plan) => {
    setPlanAEditar(plan);
    setNuevoCosto(plan.costoTotal ? plan.costoTotal.toString() : '');
    setNuevaDescripcion(plan.descripcion || '');
  };

  const manejarGuardarEdicion = async (e) => {
    e.preventDefault();
    setError(null);
    setMensajeExito('');

    const costoNum = Number(nuevoCosto);
    if (!nuevoCosto || isNaN(costoNum) || costoNum < 0 || !Number.isInteger(costoNum)) {
      setError('El costo total debe ser un número entero positivo (sin decimales).');
      return;
    }

    try {
      const res = await modificarPlanEspecificoServicio(planAEditar.idPE, {
        costoTotal: costoNum,
        descripcion: nuevaDescripcion.trim()
      });

      setMensajeExito(res.mensaje || 'Plan específico actualizado.');
      setPlanAEditar(null);
      cargarPlanesEspecificos();
    } catch (err) {
      setError(err.message || 'Error al modificar el plan específico.');
    }
  };

  const manejarEliminar = async (idPE) => {
    if (!window.confirm('¿Estás seguro de cancelar/eliminar este plan específico?')) return;

    try {
      setError(null);
      const res = await eliminarPlanEspecificoServicio(idPE);
      setMensajeExito(res.mensaje || 'Plan específico eliminado.');
      cargarPlanesEspecificos();
    } catch (err) {
      setError(err.message || 'Error al eliminar el plan específico.');
    }
  };

  const formatearHora = (fechaIso) => {
    if (!fechaIso) return '--:--';
    const fecha = new Date(fechaIso);
    return fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  };

  if (cargando) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}><h3>Cargando Horario Compartido y Eventos...</h3></div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#1f2937', marginBottom: '1.5rem' }}>Horario Compartido y Sección de Eventos</h1>

      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {mensajeExito && (
        <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {mensajeExito}
        </div>
      )}

      {planesEspecificos.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', marginTop: '2rem' }}>No hay planes específicos o eventos programados.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {planesEspecificos.map((plan) => {
            const fechaEvento = new Date(plan.fecha).toLocaleDateString('es-CL');
            const esPendiente = plan.estado === 'PENDIENTE';

            return (
              <div
                key={plan.idPE}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: esPendiente ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                  padding: '1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>
                      Evento #{plan.idPE}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      backgroundColor: esPendiente ? '#fef3c7' : '#dcfce7',
                      color: esPendiente ? '#d97706' : '#15803d'
                    }}>
                      {plan.estado || (esPendiente ? 'PENDIENTE' : 'CONFIRMADO')}
                    </span>
                  </div>

                  <p style={{ margin: '0.3rem 0', color: '#4b5563', fontSize: '0.95rem' }}>
                    <strong>Fecha:</strong> {fechaEvento}
                  </p>
                  <p style={{ margin: '0.3rem 0', color: '#4b5563', fontSize: '0.95rem' }}>
                    <strong>Lugar:</strong> {plan.lugar || 'No especificado'}
                  </p>
                  <p style={{ margin: '0.3rem 0', color: '#4b5563', fontSize: '0.95rem' }}>
                    <strong>Costo Total:</strong> ${Number(plan.costoTotal || 0).toLocaleString('es-CL')} CLP
                  </p>
                  <p style={{ margin: '0.3rem 0', color: '#4b5563', fontSize: '0.95rem' }}>
                    <strong>Asistentes:</strong> {plan.numPersonas} personas
                  </p>
                  <p style={{ margin: '0.3rem 0', color: '#4b5563', fontSize: '0.95rem' }}>
                    <strong>Personal:</strong> {plan.personal}
                  </p>

                  {/* Detalle de Horarios */}
                  {plan.horario && (
                    <div style={{ backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '4px', margin: '0.75rem 0' }}>
                      <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#374151' }}>
                        <strong>Salida:</strong> {formatearHora(plan.horario.horaSalida)} | 
                        <strong> Llegada:</strong> {formatearHora(plan.horario.horaLlegada)} | 
                        <strong> Vuelta:</strong> {formatearHora(plan.horario.horaVuelta)}
                      </p>
                    </div>
                  )}

                  <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    "{plan.descripcion}"
                  </p>
                </div>

                {/* Acciones de Edición y Cancelación */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                  <button
                    onClick={() => abrirModalEdicion(plan)}
                    style={{ flex: 1, padding: '0.5rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => manejarEliminar(plan.idPE)}
                    style={{ flex: 1, padding: '0.5rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de edición rápida */}
      {planAEditar && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '450px' }}>
            <h3>Editar Evento #{planAEditar.idPE}</h3>
            <p style={{ fontSize: '0.85rem', color: '#d97706' }}>
              * Si modificas entre 1 y 2 semanas antes del evento, se aplicará un recargo del 5%. A menos de 1 semana no se permite modificar.
            </p>
            <form onSubmit={manejarGuardarEdicion}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem' }}>Costo Total ($):</label>
                <input
                  type="text"
                  value={nuevoCosto}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '' || (/^\d+$/.test(v) && parseInt(v, 10) >= 0)) setNuevoCosto(v);
                  }}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <label style={{ fontWeight: 'bold' }}>Descripción:</label>
                  <span style={{ fontSize: '0.8rem', color: nuevaDescripcion.length >= MAX_CARACTERES ? '#ef4444' : '#6b7280' }}>
                    {nuevaDescripcion.length} de {MAX_CARACTERES} caracteres permitidos
                  </span>
                </div>
                <textarea
                  rows="3"
                  maxLength={MAX_CARACTERES}
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setPlanAEditar(null)} style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', background: '#fff' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 'bold' }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}