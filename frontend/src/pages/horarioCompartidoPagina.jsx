import React, { useState, useEffect } from 'react';
import { obtenerPlanesEspecificosServicio } from '../servicios/planEspecificoServicio.js';

export default function HorarioCompartidoPagina() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Control del mes y año visible en el calendario
  const [fechaActual, setFechaActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError(null);
        const respuesta = await obtenerPlanesEspecificosServicio();
        const lista = respuesta.datos || respuesta;
        setEventos(Array.isArray(lista) ? lista : []);
      } catch (err) {
        console.error('Error al cargar calendario de eventos:', err);
        setError('No se pudieron obtener los datos de ocupación (mostrando calendario en blanco).');
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

  // Cálculo de fechas y celdas para el mes activo
  const ano = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();
  
  const primerDiaMes = new Date(ano, mes, 1).getDay(); 
  // Ajustar para que el primer día de la semana sea Lunes (0: Lunes, ..., 6: Domingo)
  const diaInicioSemana = primerDiaMes === 0 ? 6 : primerDiaMes - 1;
  const diasEnMes = new Date(ano, mes + 1, 0).getDate();

  // Mapear eventos por fecha en formato local YYYY-MM-DD
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

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ color: '#523354', margin: 0, fontSize: '1.8rem' }}>📅 Horario Compartido</h1>
          <p style={{ color: '#666', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Consulta la ocupación y disponibilidad de fechas.</p>
        </div>
        {cargando && <span style={{ fontSize: '0.85rem', color: '#734b75', fontWeight: 'bold' }}>🔄 Actualizando...</span>}
      </div>

      {error && (
        <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '0.8rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Selector de Meses */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', backgroundColor: '#fff', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <button onClick={mesAnterior} style={btnNavStyle}>&lt; Mes Anterior</button>
        <h2 style={{ margin: 0, color: '#523354', fontSize: '1.2rem' }}>
          {nombresMeses[mes]} {ano}
        </h2>
        <button onClick={mesSiguiente} style={btnNavStyle}>Mes Siguiente &gt;</button>
      </div>

      {/* Grilla del Calendario (Siempre visible) */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        {/* Encabezados de días */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 'bold', color: '#734b75', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
          {diasSemana.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Celdas del mes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginTop: '10px' }}>
          {/* Días en blanco del mes anterior */}
          {Array.from({ length: diaInicioSemana }).map((_, i) => (
            <div key={`vacio-${i}`} style={{ height: '80px', backgroundColor: '#f9fafb', borderRadius: '8px' }} />
          ))}

          {/* Días numéricos */}
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
                  justifyContent: 'space-between',
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

      {/* Detalle al pulsar un día ocupado */}
      {diaSeleccionado && (
        <div style={{ marginTop: '1.5rem', backgroundColor: '#fff', padding: '1.2rem 1.5rem', borderRadius: '12px', borderLeft: '5px solid #ef4444', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#991b1b', fontSize: '1.1rem' }}>
              Ocupación para el {diaSeleccionado.fecha}
            </h3>
            <button onClick={() => setDiaSeleccionado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#888' }}>✕ Cerrar</button>
          </div>

          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {diaSeleccionado.eventos.map((ev, index) => (
              <div key={ev.idPE || index} style={{ backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px', fontSize: '0.9rem', color: '#7f1d1d' }}>
                📍 <strong>{ev.descripcion || `Evento #${ev.idPE}`}</strong> — Lugar: {ev.lugar || 'No especificado'}
              </div>
            ))}
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