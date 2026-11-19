import React, { useState, useEffect } from 'react';
import { obtenerPlanesEspecificosServicio } from '../servicios/planEspecificoServicio.js';

const HORAS_MARGEN_OPERATIVO = 3; // 3h traslado/montaje previo + 3h desmontaje/retorno posterior
const UMBRAL_EVENTO_GRANDE = 100; // Eventos de 100 o más personas se consideran jornada completa

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

  // Calcula el bloque horario real incluyendo las 3 horas previas y posteriores
  const calcularBloqueOperativo = (evento) => {
    const salidaRaw = evento.horario?.horaSalida || evento.fecha;
    const vueltaRaw = evento.horario?.horaVuelta || evento.horario?.horaLlegada || evento.fecha;

    const inicioBase = new Date(salidaRaw);
    const finBase = new Date(vueltaRaw);

    // Si no tiene horas específicas cargadas (ej. 00:00 a 00:00), asumimos jornada referencial 08:00 - 16:00
    if (inicioBase.getTime() === finBase.getTime()) {
      inicioBase.setHours(8, 0, 0, 0);
      finBase.setHours(16, 0, 0, 0);
    }

    const msMargen = HORAS_MARGEN_OPERATIVO * 60 * 60 * 1000;
    const inicioBloqueo = new Date(inicioBase.getTime() - msMargen);
    const finBloqueo = new Date(finBase.getTime() + msMargen);

    const formatear = (d) =>
      d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    return {
      inicioBase,
      finBase,
      inicioBloqueo,
      finBloqueo,
      textoEvento: `${formatear(inicioBase)} - ${formatear(finBase)}`,
      textoBloqueo: `${formatear(inicioBloqueo)} - ${formatear(finBloqueo)}`,
    };
  };

  // Analiza todos los eventos de una misma fecha para detectar cruces y límite diario
  const analizarDiaOperativo = (eventosDelDia) => {
    if (!eventosDelDia || eventosDelDia.length === 0) {
      return {
        eventosEnriquecidos: [],
        cruces: [],
        alertasCapacidad: [],
        hayConflicto: false,
        resumenCapacidad: 'Libre',
      };
    }

    const conBloques = eventosDelDia.map((ev) => {
      const capacidad = ev.numPersonas || ev.capacidadMaxima || ev.aforoMaximo || 0;
      return {
        ...ev,
        bloque: calcularBloqueOperativo(ev),
        esGrande: capacidad >= UMBRAL_EVENTO_GRANDE,
      };
    });

    // 1. Detección de cruces horarios comparando el bloque operativo completo (±3h)
    const cruces = [];
    for (let i = 0; i < conBloques.length; i++) {
      for (let j = i + 1; j < conBloques.length; j++) {
        const a = conBloques[i];
        const b = conBloques[j];
        const seSolapan =
          a.bloque.inicioBloqueo < b.bloque.finBloqueo &&
          b.bloque.inicioBloqueo < a.bloque.finBloqueo;

        if (seSolapan) {
          cruces.push(
            `Cruce operativo entre "${a.descripcion || 'Evento 1'}" (${a.bloque.textoBloqueo}) y "${b.descripcion || 'Evento 2'}" (${b.bloque.textoBloqueo}).`
          );
        }
      }
    }

    // 2. Regla de capacidad diaria: máximo 1 evento grande o hasta 2 eventos pequeños
    const alertasCapacidad = [];
    const cantGrandes = conBloques.filter((e) => e.esGrande).length;
    const totalEventos = conBloques.length;

    if (cantGrandes > 1) {
      alertasCapacidad.push(`Capacidad excedida: hay ${cantGrandes} eventos grandes el mismo día (máximo 1).`);
    } else if (cantGrandes === 1 && totalEventos > 1) {
      alertasCapacidad.push('Capacidad excedida: un evento grande ocupa la jornada completa y no admite eventos simultáneos.');
    } else if (totalEventos > 2) {
      alertasCapacidad.push(`Capacidad excedida: hay ${totalEventos} eventos pequeños agendados (máximo 2 por día).`);
    }

    const resumenCapacidad =
      cantGrandes >= 1
        ? `${totalEventos} evento (Jornada completa)`
        : `${totalEventos}/2 eventos pequeños`;

    return {
      eventosEnriquecidos: conBloques,
      cruces,
      alertasCapacidad,
      hayConflicto: cruces.length > 0 || alertasCapacidad.length > 0,
      resumenCapacidad,
    };
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ color: '#523354', margin: 0, fontSize: '1.8rem' }}>📅 Horario Compartido</h1>
          <p style={{ color: '#666', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Consulta la ocupación, bloques operativos (±3h) y disponibilidad de fechas.
          </p>
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
            <div key={`vacio-${i}`} style={{ height: '95px', backgroundColor: '#f9fafb', borderRadius: '8px' }} />
          ))}

          {/* Días del mes */}
          {Array.from({ length: diasEnMes }).map((_, i) => {
            const numeroDia = i + 1;
            const mesStr = String(mes + 1).padStart(2, '0');
            const diaStr = String(numeroDia).padStart(2, '0');
            const fechaClave = `${ano}-${mesStr}-${diaStr}`;

            const listaEventosDia = eventosPorFecha[fechaClave] || [];
            const tieneOcupacion = listaEventosDia.length > 0;
            const analisis = analizarDiaOperativo(listaEventosDia);
            const esSeleccionado = diaSeleccionado?.fecha === fechaClave;

            return (
              <div
                key={numeroDia}
                onClick={() => tieneOcupacion && setDiaSeleccionado({ fecha: fechaClave, analisis })}
                style={{
                  height: '95px',
                  borderRadius: '10px',
                  padding: '6px',
                  boxSizing: 'border-box',
                  backgroundColor: analisis.hayConflicto
                    ? '#fee2e2'
                    : tieneOcupacion
                    ? '#fde8e8'
                    : '#f8fafc',
                  border: esSeleccionado
                    ? '2px solid #b3261e'
                    : analisis.hayConflicto
                    ? '2px solid #dc2626'
                    : tieneOcupacion
                    ? '1px solid #f87171'
                    : '1px solid #e2e8f0',
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
                    <span style={{
                      fontSize: '10px',
                      backgroundColor: analisis.hayConflicto ? '#b91c1c' : '#ef4444',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '1px 6px',
                      fontWeight: 'bold'
                    }}>
                      {analisis.hayConflicto ? '⚠️ Conflicto' : 'Ocupado'}
                    </span>
                  )}
                </div>

                {tieneOcupacion && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: '600' }}>
                      📌 {listaEventosDia.length} {listaEventosDia.length === 1 ? 'evento' : 'eventos'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#7f1d1d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {analisis.resumenCapacidad}
                    </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Eventos del {diaSeleccionado.fecha}</h3>
              <span style={{ fontSize: '0.8rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                {diaSeleccionado.analisis.resumenCapacidad}
              </span>
            </div>

            {/* Banner de alertas de cruce horario o capacidad excedida */}
            {diaSeleccionado.analisis.hayConflicto && (
              <div style={{
                backgroundColor: '#fdecea',
                border: '1px solid #c0392b',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: '10px',
                marginTop: '12px',
                fontSize: '0.85rem'
              }}>
                <strong>⚠️ Alerta de Coordinación Operativa:</strong>
                <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                  {[...diaSeleccionado.analisis.cruces, ...diaSeleccionado.analisis.alertasCapacidad].map((msg, idx) => (
                    <li key={idx} style={{ marginBottom: '2px' }}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto', margin: '1rem 0' }}>
              {diaSeleccionado.analisis.eventosEnriquecidos.map((ev, index) => {
                const max = ev.numPersonas || ev.capacidadMaxima || ev.aforoMaximo;
                const asis = ev.asistentesConfirmados ?? ev.asistentes ?? ev.asistentesEstimados ?? 0;
                const pct = calcularPorcentajeAforo(asis, max);

                return (
                  <div key={ev.idPE || ev.id || index} style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, color: '#523354' }}>📍 {ev.descripcion || `Evento #${ev.idPE || ev.id}`}</h4>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        backgroundColor: ev.esGrande ? '#fef3c7' : '#e0f2fe',
                        color: ev.esGrande ? '#92400e' : '#075985',
                        whiteSpace: 'nowrap'
                      }}>
                        {ev.esGrande ? 'Evento Grande' : 'Evento Pequeño'}
                      </span>
                    </div>

                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Lugar:</strong> {ev.lugar || 'No especificado'}</p>
                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Encargado/Personal:</strong> {ev.personal || 'Sin asignar'}</p>

                    {/* Franjas horarias y margen logístico */}
                    <div style={{ marginTop: '8px', padding: '8px 10px', backgroundColor: '#faf5ff', borderRadius: '6px', border: '1px solid #e9d5ff' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#3b0764' }}>
                        🕒 <strong>Horario del evento:</strong> {ev.bloque.textoEvento}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b21a8' }}>
                        🚚 <strong>Bloqueo operativo (±3h traslado/montaje/desmontaje):</strong> {ev.bloque.textoBloqueo}
                      </p>
                    </div>

                    {/* Aforo / Capacidad */}
                    <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>Capacidad y Aforo</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569' }}>
                        <span>Asistentes confirmados / Invitados:</span>
                        <strong>{max ? `${asis} / ${max} personas` : 'No especificado'}</strong>
                      </div>
                      {pct !== null && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1', fontSize: '0.8rem' }}>
                          <span>Ocupación confirmada:</span>
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
    maxWidth: '520px',
    width: '90%',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
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