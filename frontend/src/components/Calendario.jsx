// src/components/Calendario.jsx
import React, { useState, useEffect } from 'react';

export const Calendario = () => {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);

  const anio = fechaActual.getFullYear();
  const mes = fechaActual.getMonth(); // 0 = Enero, 11 = Diciembre

  // Nombres de meses y días
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Cargar eventos del backend
  useEffect(() => {
    const cargarEventos = async () => {
      setCargando(true);
      try {
        const res = await fetch('http://localhost:3000/api/eventos');
        if (res.ok) {
          const data = await res.json();
          setEventos(data);
        }
      } catch (err) {
        console.error('Error al cargar eventos para el calendario:', err);
      } finally {
        setCargando(false);
      }
    };

    cargarEventos();
  }, [mes, anio]);

  // Navegación de meses
  const mesAnterior = () => setFechaActual(new Date(anio, mes - 1, 1));
  const mesSiguiente = () => setFechaActual(new Date(anio, mes + 1, 1));

  // Lógica de cálculo de días
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  // Ajuste para que la semana empiece en Lunes (0)
  const primerDiaSemana = (new Date(anio, mes, 1).getDay() + 6) % 7;

  // Formateador auxiliar YYYY-MM-DD
  const esMismaFecha = (fecha1, diaNumero) => {
    const f = new Date(fecha1);
    return (
      f.getUTCDate() === diaNumero &&
      f.getUTCMonth() === mes &&
      f.getUTCFullYear() === anio
    );
  };

  // Cálculo porcentaje de aforo del evento seleccionado
  const calcularPorcentajeAforo = (asistentes, maximo) => {
    if (!maximo || maximo <= 0) return null;
    const pct = Math.round(((asistentes || 0) / maximo) * 100);
    return pct > 100 ? 100 : pct;
  };

  return (
    <div style={styles.container}>
      {/* Encabezado del Calendario */}
      <div style={styles.header}>
        <button style={styles.btnNav} onClick={mesAnterior}>&lt; Anterior</button>
        <h2 style={styles.tituloMes}>
          {nombresMeses[mes]} {anio}
        </h2>
        <button style={styles.btnNav} onClick={mesSiguiente}>Siguiente &gt;</button>
      </div>

      {cargando ? (
        <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando calendario...</p>
      ) : (
        /* Cuadrícula del Calendario */
        <div style={styles.gridContainer}>
          {/* Cabecera de días de la semana */}
          {diasSemana.map((dia) => (
            <div key={dia} style={styles.headerDia}>
              {dia}
            </div>
          ))}

          {/* Espacios en blanco previo al primer día del mes */}
          {Array.from({ length: primerDiaSemana }).map((_, i) => (
            <div key={`blank-${i}`} style={styles.celdaVacia}></div>
          ))}

          {/* Días del mes */}
          {Array.from({ length: diasEnMes }).map((_, i) => {
            const numeroDia = i + 1;
            // Buscar si existe un evento programado para este día
            const eventoDelDia = eventos.find((e) => esMismaFecha(e.fecha, numeroDia));

            return (
              <div key={numeroDia} style={styles.celdaDia}>
                <span style={styles.numeroDia}>{numeroDia}</span>
                
                {eventoDelDia && (
                  <button
                    style={styles.indicadorEvento}
                    title="Hacer clic para ver detalles del evento"
                    onClick={() => setEventoSeleccionado(eventoDelDia)}
                  >
                    ❌
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para ver detalles del Evento */}
      {eventoSeleccionado && (
        <div style={styles.modalOverlay} onClick={() => setEventoSeleccionado(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitulo}>Detalles del Evento</h3>
            <div style={styles.modalBody}>
              <p><strong>ID Evento:</strong> {eventoSeleccionado.id || eventoSeleccionado.idPE}</p>
              <p><strong>Descripción / Plan:</strong> {eventoSeleccionado.nombre || eventoSeleccionado.descripcion || 'Sin nombre asignado'}</p>
              <p><strong>Fecha:</strong> {new Date(eventoSeleccionado.fecha).toLocaleDateString('es-CL')}</p>
              
              {eventoSeleccionado.horario && (
                <p>
                  <strong>Horario:</strong> {eventoSeleccionado.horario.inicio || 'N/A'} - {eventoSeleccionado.horario.fin || 'N/A'}
                </p>
              )}

              {/* Sección de Capacidad y Aforo */}
              <div style={styles.aforoBox}>
                <p style={styles.aforoTitle}>Capacidad y Aforo del Evento</p>
                <div style={styles.aforoRow}>
                  <span>Asistentes estimados:</span>
                  <strong>{eventoSeleccionado.asistentes || eventoSeleccionado.asistentesEstimados || 0} personas</strong>
                </div>
                <div style={styles.aforoRow}>
                  <span>Capacidad máxima del recinto:</span>
                  <strong>
                    {eventoSeleccionado.capacidadMaxima || eventoSeleccionado.aforoMaximo 
                      ? `${eventoSeleccionado.capacidadMaxima || eventoSeleccionado.aforoMaximo} personas`
                      : 'No especificada'}
                  </strong>
                </div>

                {/* Porcentaje de ocupación */}
                {(() => {
                  const max = eventoSeleccionado.capacidadMaxima || eventoSeleccionado.aforoMaximo;
                  const asis = eventoSeleccionado.asistentes || eventoSeleccionado.asistentesEstimados || 0;
                  const pct = calcularPorcentajeAforo(asis, max);

                  if (pct !== null) {
                    return (
                      <div style={styles.porcentajeRow}>
                        <span>Porcentaje de Ocupación:</span>
                        <span style={styles.porcentajeBadge}>{pct}%</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            <button style={styles.btnCerrar} onClick={() => setEventoSeleccionado(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Estilos responsivos usando CSS Grid
const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  tituloMes: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#0f172a',
  },
  btnNav: {
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    color: '#334155',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
  },
  headerDia: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#64748b',
    paddingBottom: '8px',
    borderBottom: '2px solid #e2e8f0',
  },
  celdaVacia: {
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    minHeight: '80px',
  },
  celdaDia: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    minHeight: '80px',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
  },
  numeroDia: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#475569',
  },
  indicadorEvento: {
    alignSelf: 'center',
    marginBottom: '8px',
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: '2rem',
    borderRadius: '12px',
    maxWidth: '450px',
    width: '90%',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
  },
  modalTitulo: {
    marginTop: 0,
    color: '#0f172a',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.5rem',
  },
  modalBody: {
    margin: '1rem 0',
    lineHeight: '1.6',
    color: '#334155',
  },
  aforoBox: {
    marginTop: '1.25rem',
    padding: '0.85rem 1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  aforoTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  aforoRow: {
    display: 'flex',
    justify: 'space-between',
    fontSize: '0.875rem',
    color: '#475569',
    marginBottom: '0.35rem',
  },
  porcentajeRow: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: '1px dashed #cbd5e1',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#0f172a',
  },
  porcentajeBadge: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '0.2rem 0.6rem',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '0.85rem',
    border: '1px solid #bfdbfe',
  },
  btnCerrar: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};