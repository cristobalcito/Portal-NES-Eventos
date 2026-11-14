import React, { useState, useEffect } from 'react';
import { obtenerPlanesEspecificosServicio } from '../servicios/planEspecificoServicio.js';

export default function HorarioCompartidoPagina() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorApi, setErrorApi] = useState(false);

  const [fechaActual, setFechaActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setErrorApi(false);
        const respuesta = await obtenerPlanesEspecificosServicio();
        const lista = respuesta.datos || respuesta;
        setEventos(Array.isArray(lista) ? lista : []);
      } catch (err) {
        console.warn('⚠️ No se pudieron obtener los datos de la API:', err);
        setErrorApi(true);
        setEventos([]);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  // Navegación entre meses
  const mesAnterior = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
    setDiaSeleccionado(null);
  };

  const mesSiguiente = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
    setDiaSeleccionado(null);
  };

  // Cálculo del mes activo
  const ano = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();

  const primerDiaMes = new Date(ano, mes, 1).getDay();
  const diaInicioSemana = primerDiaMes === 0 ? 6 : primerDiaMes - 1;
  const diasEnMes = new Date(ano, mes + 1, 0).getDate();

  // Agrupación de eventos por fecha local (YYYY-MM-DD)
  const eventosPorFecha = {};
  if (Array.isArray(eventos)) {
    eventos.forEach((ev) => {
      if (ev.fecha) {
        const d = new Date(ev.fecha);
        const anoEv = d.getFullYear();
        const mesEv = String(d.getMonth() + 1).padStart(2, '0');
        const diaEv = String(d.getDate()).padStart(2, '0');
        const fechaClave = `${anoEv}-${mesEv}-${diaEv}`;

        if (!eventosPorFecha[fechaClave]) {
          eventosPorFecha[fechaClave] = [];
        }
        eventosPorFecha[fechaClave].push(ev);
      }
    });
  }

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Función para cálculo de aforo
  const calcularPorcentajeAforo = (asistentes, maximo) => {
    if (!maximo || maximo <= 0) return null;
    const pct = Math.round(((asistentes || 0) / maximo) * 100);
    return pct > 100 ? 100 : pct;
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ color: '#523354', margin: 0, fontSize: '1.8rem' }}>📅 Horario Compartido</h1>
          <p style={{ color: '#666', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Consulta la ocupación y disponibilidad de fechas.</p>
        </div>
        {cargando && <span style={{ fontSize: '0.85rem', color: '#734b75', fontWeight: 'bold' }}>🔄 Cargando ocupación...</span>}
      </div>

      {errorApi && (
        <div style={{ backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba', padding: '0.8rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
          ⚠️ Conexión en modo sin datos: No se pudo sincronizar la lista de eventos desde la API.
        </div>
      )}

      {/* Selector de Meses */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', backgroundColor: '#fff', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <button type="button" onClick={mesAnterior} style={btnNavStyle}>&lt; Mes Anterior</button>
        <h2 style={{ margin: 0, color: '#523354', fontSize: '1.2rem' }}>
          {nombresMeses[mes]} {ano}
        </h2>
        <button type="button" onClick={mesSiguiente} style={btnNavStyle}>Mes Siguiente &gt;</button>
      </div>

      {/* Grilla del Calendario */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 'bold', color: '#734b75', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
          {diasSemana.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginTop: '10px' }}>
          {/* Celdas vacías previas */}
          {Array.from({ length: diaInicioSemana }).map((_, i) => (
            <div key={`vacio-${i}`} style={{ height: '85px', backgroundColor: '#f9fafb', borderRadius: '8px' }} />
          ))}

          {/* Días del mes */}
          {Array.from({ length: diasEnMes }).map((_, i) => {
            const numeroDia = i + 1;
            const mesStr = String(mes + 1).padStart(2, '0');
            const diaStr = String(numeroDia).padStart(2, '0');
            const fechaClave = `${ano}-${mesStr}-${diaStr}`;

            const listaEventosDia = eventosPorFecha[fechaClave] || [];
            const tieneOcupacion = listaEventosDia.length > 0;
            const esSeleccionado = diaSeleccionado?.fecha === fechaClave;

            return (
              <div
                key={numeroDia}
                onClick={() => tieneOcupacion && setDiaSeleccionado({ fecha: fechaClave, eventos: listaEventosDia })}
                style={{
                  height: '85px',
                  borderRadius: '10px',
                  padding: '6px',
                  boxSizing: 'border-box',
                  backgroundColor: tieneOcupacion ? '#fde8e8' : '#f8fafc',
                  border: esSeleccionado ? '2px solid #b3261e' : tieneOcupacion ? '1px solid #f87171' : '1px solid #e2e8f0',
                  cursor: tieneOcupacion ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: tieneOcupacion ? '#991b1b' : '#334155' }}>
                    {numeroDia}
                  </span>
                  {tieneOcupacion && (
                    <span style={{ fontSize: '10px', backgroundColor: '#ef4444', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontWeight: 'bold' }}>
                      Ocupado
                    </span>
                  )}
                </div>

                {tieneOcupacion && (
                  <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: '500' }}>
                    📌 {listaEventosDia.length} {listaEventosDia.length === 1 ? 'evento' : 'eventos'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Detalles del Día / Eventos */}
      {diaSeleccionado && (
        <div style={styles.modalOverlay} onClick={() => setDiaSeleccionado(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitulo}>Eventos del {diaSeleccionado.fecha}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', margin: '1rem 0' }}>
              {diaSeleccionado.eventos.map((ev, index) => {
                const max = ev.numPersonas || ev.capacidadMaxima || ev.aforoMaximo;
                const asis = ev.asistentes || ev.asistentesEstimados || 0;
                const pct = calcularPorcentajeAforo(asis, max);

                return (
                  <div key={ev.idPE || ev.id || index} style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#523354' }}>📍 {ev.descripcion || `Evento #${ev.idPE || ev.id}`}</h4>
                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Lugar:</strong> {ev.lugar || 'No especificado'}</p>
                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Encargado/Personal:</strong> {ev.personal || 'Sin asignar'}</p>
                    
                    {/* Aforo / Capacidad */}
                    <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>Capacidad y Aforo</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569' }}>
                        <span>Asistentes / Invitados:</span>
                        <strong>{max ? `${max} personas` : 'No especificado'}</strong>
                      </div>
                      {pct !== null && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1', fontSize: '0.8rem' }}>
                          <span>Ocupación estimada:</span>
                          <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{pct}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button style={styles.btnCerrar} onClick={() => setDiaSeleccionado(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const btnNavStyle = {
  backgroundColor: '#734b75',
  color: '#fff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.85rem'
};

const styles = {
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
    padding: '1.5rem',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
  },
  modalTitulo: {
    marginTop: 0,
    color: '#0f172a',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.5rem',
  },
  btnCerrar: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#734b75',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};