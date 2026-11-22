import React, { useState, useEffect } from 'react';
import { obtenerPlanesEspecificosServicio } from '../servicios/planEspecificoServicio.js';

const HORAS_MARGEN_OPERATIVO = 3;
const UMBRAL_EVENTO_GRANDE = 100;
const FLOTA_TOTAL_VEHICULOS = 4;

const CATALOGO_ESTADOS = {
  COTIZADO: { etiqueta: 'Cotizado', bg: '#f1f5f9', color: '#475569' },
  CONFIRMADO: { etiqueta: 'Confirmado', bg: '#dcfce7', color: '#166534' },
  EN_PREPARACION: { etiqueta: 'En preparación', bg: '#fef3c7', color: '#92400e' },
  EN_EJECUCION: { etiqueta: 'En ejecución', bg: '#dbeafe', color: '#1e40af' },
  FINALIZADO: { etiqueta: 'Finalizado', bg: '#f3e8ff', color: '#6b21a8' },
};

const obtenerDatosEstado = (evento) => {
  const raw = evento.estado || evento.estadoEvento || evento.etapa || 'CONFIRMADO';
  const clave = String(raw)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');

  return CATALOGO_ESTADOS[clave] || { etiqueta: raw, bg: '#e2e8f0', color: '#334155' };
};

const extraerFechaClave = (valorFecha) => {
  if (!valorFecha) return null;
  if (typeof valorFecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valorFecha)) {
    return valorFecha.slice(0, 10);
  }
  const d = new Date(valorFecha);
  if (Number.isNaN(d.getTime())) return null;
  const anoEv = d.getFullYear();
  const mesEv = String(d.getMonth() + 1).padStart(2, '0');
  const diaEv = String(d.getDate()).padStart(2, '0');
  return `${anoEv}-${mesEv}-${diaEv}`;
};

const formatearFechaLegible = (fechaClave) => {
  if (!fechaClave || !/^\d{4}-\d{2}-\d{2}$/.test(fechaClave)) return fechaClave || '';
  const [anio, mes, dia] = fechaClave.split('-');
  return `${dia}/${mes}/${anio}`;
};

const extraerListaPersonal = (texto) => {
  if (!texto) return [];
  return String(texto)
    .split(/[,;/]+/)
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length > 0 && p !== 'sin asignar' && p !== 'no especificado');
};

const obtenerSesionUsuario = () => {
  try {
    const usuarioRaw = localStorage.getItem('usuario');
    let usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;

    const token = localStorage.getItem('token');
    if (!usuario && token) {
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        usuario = JSON.parse(atob(payloadBase64));
      }
    }

    if (!usuario) return { rol: 'INTERNO', nombre: '', rut: '' };

    let rolDetectado = 'INTERNO';
    const rolTexto = (usuario.rol || usuario.tipo || '').toUpperCase();

    if (rolTexto === 'CLIENTE' || usuario.cliente) {
      rolDetectado = 'CLIENTE';
    } else if (rolTexto === 'PERSONAL_EVENTUAL' || usuario.personalEventual) {
      rolDetectado = 'PERSONAL_EVENTUAL';
    } else if (
      rolTexto === 'GERENTE_GENERAL' ||
      rolTexto === 'PERSONAL_OPERACIONES' ||
      usuario.gerenteGeneral ||
      usuario.personalOperaciones
    ) {
      rolDetectado = 'INTERNO';
    }

    return {
      rol: rolDetectado,
      nombre: (usuario.nombre || '').toLowerCase().trim(),
      rut: (usuario.rut || '').toLowerCase().trim(),
    };
  } catch {
    return { rol: 'INTERNO', nombre: '', rut: '' };
  }
};

export default function HorarioCompartidoPagina() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorApi, setErrorApi] = useState(false);

  const [fechaActual, setFechaActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [avisoCliente, setAvisoCliente] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  const sesion = obtenerSesionUsuario();
  const esCliente = sesion.rol === 'CLIENTE';
  const esPersonalEventual = sesion.rol === 'PERSONAL_EVENTUAL';
  const esEquipoInterno = sesion.rol === 'INTERNO';

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setErrorApi(false);
        const respuesta = await obtenerPlanesEspecificosServicio();
        const lista = respuesta.datos || respuesta;
        setEventos(Array.isArray(lista) ? lista : []);
      } catch (err) {
        console.warn('No se pudieron obtener los datos de la API:', err);
        setErrorApi(true);
        setEventos([]);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  const mesAnterior = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
    setDiaSeleccionado(null);
    setAvisoCliente('');
  };

  const mesSiguiente = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
    setDiaSeleccionado(null);
    setAvisoCliente('');
  };

  const irAHoy = () => {
    const ahora = new Date();
    setFechaActual(new Date(ahora.getFullYear(), ahora.getMonth(), 1));
    setDiaSeleccionado(null);
    setAvisoCliente('');
  };

  const eventosVisibles = Array.isArray(eventos)
    ? eventos.filter((ev) => {
        if (esPersonalEventual) {
          const personalTexto = (ev.personal || '').toLowerCase();
          const rutAsignado = (ev.rutPersonal || ev.personalRut || '').toLowerCase();
          const coincidePersonal =
            (!sesion.nombre && !sesion.rut) ||
            (sesion.nombre && personalTexto.includes(sesion.nombre)) ||
            (sesion.rut && rutAsignado === sesion.rut);
          if (!coincidePersonal) return false;
        }

        if (esEquipoInterno && filtroEstado !== 'TODOS') {
          const raw = ev.estado || ev.estadoEvento || ev.etapa || 'CONFIRMADO';
          const claveEstado = String(raw)
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_');
          if (claveEstado !== filtroEstado) return false;
        }

        return true;
      })
    : [];

  const hoy = new Date();
  const claveHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  const ano = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();
  const estaEnMesActual = ano === hoy.getFullYear() && mes === hoy.getMonth();

  const primerDiaMes = new Date(ano, mes, 1).getDay();
  const diaInicioSemana = primerDiaMes === 0 ? 6 : primerDiaMes - 1;
  const diasEnMes = new Date(ano, mes + 1, 0).getDate();

  const eventosPorFecha = {};
  eventosVisibles.forEach((ev) => {
    const fechaClave = extraerFechaClave(ev.fecha);
    if (fechaClave) {
      if (!eventosPorFecha[fechaClave]) {
        eventosPorFecha[fechaClave] = [];
      }
      eventosPorFecha[fechaClave].push(ev);
    }
  });

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const calcularPorcentajeAforo = (asistentes, maximo) => {
    if (!maximo || maximo <= 0) return null;
    const pct = Math.round(((asistentes || 0) / maximo) * 100);
    return pct > 100 ? 100 : pct;
  };

  const calcularBloqueOperativo = (evento) => {
    const fechaBaseStr = extraerFechaClave(evento.fecha) || '2026-01-01';
    const [anio, mesBase, diaBase] = fechaBaseStr.split('-').map(Number);

    const salidaRaw = evento.horario?.horaSalida;
    const vueltaRaw = evento.horario?.horaVuelta || evento.horario?.horaLlegada;

    let inicioBase;
    let finBase;

    if (salidaRaw && vueltaRaw) {
      inicioBase = new Date(salidaRaw);
      finBase = new Date(vueltaRaw);
    } else {
      inicioBase = new Date(anio, mesBase - 1, diaBase, 8, 0, 0, 0);
      finBase = new Date(anio, mesBase - 1, diaBase, 16, 0, 0, 0);
    }

    if (inicioBase.getTime() === finBase.getTime()) {
      inicioBase = new Date(anio, mesBase - 1, diaBase, 8, 0, 0, 0);
      finBase = new Date(anio, mesBase - 1, diaBase, 16, 0, 0, 0);
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

  const analizarDiaOperativo = (eventosDelDia) => {
    if (!eventosDelDia || eventosDelDia.length === 0) {
      return {
        eventosEnriquecidos: [],
        cruces: [],
        alertasCapacidad: [],
        hayConflicto: false,
        resumenCapacidad: 'Libre',
        espaciosReservados: [],
        vehiculosComprometidos: 0,
        vehiculosDisponibles: FLOTA_TOTAL_VEHICULOS,
      };
    }

    const conBloques = eventosDelDia.map((ev) => {
      const capacidad = ev.numPersonas || ev.capacidadMaxima || ev.aforoMaximo || 0;
      const esGrande = capacidad >= UMBRAL_EVENTO_GRANDE;
      return {
        ...ev,
        bloque: calcularBloqueOperativo(ev),
        esGrande,
        infoEstado: obtenerDatosEstado(ev),
        listaPersonal: extraerListaPersonal(ev.personal),
      };
    });

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

          const personalRepetido = a.listaPersonal.filter((p) => b.listaPersonal.includes(p));
          if (personalRepetido.length > 0) {
            cruces.push(
              `Personal duplicado en horario solapado: ${personalRepetido.join(', ')} asignado simultáneamente a "${a.descripcion || 'Evento 1'}" y "${b.descripcion || 'Evento 2'}".`
            );
          }
        }
      }
    }

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

    const vehiculosComprometidos = conBloques.reduce((acc, ev) => {
      if (ev.infoEstado.etiqueta === 'Finalizado') return acc;
      const asignados = Number(ev.vehiculosAsignados);
      if (!Number.isNaN(asignados) && asignados > 0) return acc + asignados;
      return acc + (ev.esGrande ? 2 : 1);
    }, 0);

    const vehiculosDisponibles = Math.max(0, FLOTA_TOTAL_VEHICULOS - vehiculosComprometidos);

    if (vehiculosComprometidos > FLOTA_TOTAL_VEHICULOS) {
      alertasCapacidad.push(
        `Flota insuficiente: se requieren ${vehiculosComprometidos} vehículos y la empresa dispone de ${FLOTA_TOTAL_VEHICULOS}.`
      );
    }

    const espaciosReservados = [
      ...new Set(
        conBloques
          .map((ev) => (ev.lugar || '').trim())
          .filter((lugar) => lugar.length > 0 && lugar.toLowerCase() !== 'no especificado')
      ),
    ];

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
      espaciosReservados,
      vehiculosComprometidos,
      vehiculosDisponibles,
    };
  };

  const manejarClicDia = (fechaClave, tieneOcupacion, analisis) => {
    if (esCliente) {
      const fechaTexto = formatearFechaLegible(fechaClave);
      setAvisoCliente(
        tieneOcupacion
          ? `El día ${fechaTexto} ya se encuentra reservado. Selecciona una fecha marcada como Disponible.`
          : `El día ${fechaTexto} está disponible para agendar tu evento.`
      );
      return;
    }

    if (tieneOcupacion) {
      setDiaSeleccionado({ fecha: fechaClave, analisis });
    }
  };

  const prefijoMesActual = `${ano}-${String(mes + 1).padStart(2, '0')}`;
  const eventosDelMesOrdenados = eventosVisibles
    .map((ev) => ({
      ...ev,
      fechaClave: extraerFechaClave(ev.fecha),
      bloque: calcularBloqueOperativo(ev),
      infoEstado: obtenerDatosEstado(ev),
    }))
    .filter((ev) => ev.fechaClave && ev.fechaClave.startsWith(prefijoMesActual))
    .sort((a, b) => {
      if (a.fechaClave !== b.fechaClave) {
        return a.fechaClave.localeCompare(b.fechaClave);
      }
      return a.bloque.inicioBase.getTime() - b.bloque.inicioBase.getTime();
    });

  const fechasReservadasMes = [...new Set(eventosDelMesOrdenados.map((ev) => ev.fechaClave))];

  const itemsLeyenda = esCliente
    ? [
        { etiqueta: 'Disponible', bg: '#f0fdf4', border: '#bbf7d0' },
        { etiqueta: 'Reservado', bg: '#fde8e8', border: '#f87171' },
        { etiqueta: 'Día actual', bg: '#523354', border: '#523354' },
      ]
    : esPersonalEventual
    ? [
        { etiqueta: 'Sin asignación', bg: '#f8fafc', border: '#e2e8f0' },
        { etiqueta: 'Evento asignado', bg: '#fde8e8', border: '#f87171' },
        { etiqueta: 'Día actual', bg: '#523354', border: '#523354' },
      ]
    : [
        { etiqueta: 'Sin eventos', bg: '#f8fafc', border: '#e2e8f0' },
        { etiqueta: 'Ocupado sin conflictos', bg: '#fde8e8', border: '#f87171' },
        { etiqueta: 'Conflicto operativo o capacidad', bg: '#fee2e2', border: '#dc2626' },
        { etiqueta: 'Día actual', bg: '#523354', border: '#523354' },
      ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ color: '#523354', margin: 0, fontSize: '1.8rem' }}>Horario Compartido</h1>
            <span style={{
              fontSize: '0.75rem',
              padding: '3px 10px',
              borderRadius: '12px',
              fontWeight: 'bold',
              backgroundColor: esCliente ? '#e0f2fe' : esPersonalEventual ? '#fef3c7' : '#f3e8ff',
              color: esCliente ? '#0369a1' : esPersonalEventual ? '#92400e' : '#6b21a8'
            }}>
              {esCliente ? 'Vista Cliente' : esPersonalEventual ? 'Mis Eventos Asignados' : 'Vista Operativa'}
            </span>
          </div>
          <p style={{ color: '#666', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            {esCliente
              ? 'Consulta qué fechas están disponibles u ocupadas para tu próximo evento.'
              : esPersonalEventual
              ? 'Revisa las fechas, horarios y ubicaciones de los eventos donde estás asignado.'
              : 'Consulta la ocupación, bloques operativos (±3h), estado de eventos y disponibilidad de flota.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {cargando && <span style={{ fontSize: '0.85rem', color: '#734b75', fontWeight: 'bold' }}>Cargando ocupación...</span>}
          {esEquipoInterno && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="filtro-estado-evento" style={{ fontSize: '0.82rem', fontWeight: '600', color: '#475569' }}>
                Etapa:
              </label>
              <select
                id="filtro-estado-evento"
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setDiaSeleccionado(null);
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  color: '#334155',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="TODOS">Todas las etapas</option>
                <option value="COTIZADO">Cotizado</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="EN_PREPARACION">En preparación</option>
                <option value="EN_EJECUCION">En ejecución</option>
                <option value="FINALIZADO">Finalizado</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {esCliente && avisoCliente && (
        <div style={{
          backgroundColor: '#f0f9ff',
          color: '#0c4a6e',
          border: '1px solid #bae6fd',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{avisoCliente}</span>
          <button
            type="button"
            onClick={() => setAvisoCliente('')}
            style={{ background: 'none', border: 'none', color: '#0369a1', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Cerrar
          </button>
        </div>
      )}

      {errorApi && (
        <div style={{ backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba', padding: '0.8rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
          Conexión en modo sin datos: No se pudo sincronizar la lista de eventos desde la API.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', backgroundColor: '#fff', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '8px' }}>
        <button type="button" onClick={mesAnterior} style={btnNavStyle}>&lt; Mes Anterior</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, color: '#523354', fontSize: '1.2rem' }}>
            {nombresMeses[mes]} {ano}
          </h2>
          <button
            type="button"
            onClick={irAHoy}
            disabled={estaEnMesActual}
            style={{
              backgroundColor: estaEnMesActual ? '#f1f5f9' : '#f3e8ff',
              color: estaEnMesActual ? '#94a3b8' : '#523354',
              border: estaEnMesActual ? '1px solid #e2e8f0' : '1px solid #d8b4fe',
              padding: '5px 12px',
              borderRadius: '8px',
              cursor: estaEnMesActual ? 'default' : 'pointer',
              fontWeight: 'bold',
              fontSize: '0.8rem'
            }}
          >
            Hoy
          </button>
        </div>
        <button type="button" onClick={mesSiguiente} style={btnNavStyle}>Mes Siguiente &gt;</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', marginBottom: '0.75rem', padding: '8px 14px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', fontSize: '0.8rem', color: '#475569' }}>
        <span style={{ fontWeight: '600', color: '#334155' }}>Referencias:</span>
        {itemsLeyenda.map((item) => (
          <div key={item.etiqueta} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              borderRadius: '4px',
              backgroundColor: item.bg,
              border: `1.5px solid ${item.border}`
            }} />
            <span>{item.etiqueta}</span>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 'bold', color: '#734b75', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
          {diasSemana.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginTop: '10px' }}>
          {Array.from({ length: diaInicioSemana }).map((_, i) => (
            <div key={`vacio-${i}`} style={{ height: '95px', backgroundColor: '#f9fafb', borderRadius: '8px' }} />
          ))}

          {Array.from({ length: diasEnMes }).map((_, i) => {
            const numeroDia = i + 1;
            const mesStr = String(mes + 1).padStart(2, '0');
            const diaStr = String(numeroDia).padStart(2, '0');
            const fechaClave = `${ano}-${mesStr}-${diaStr}`;
            const esHoy = fechaClave === claveHoy;

            const listaEventosDia = eventosPorFecha[fechaClave] || [];
            const tieneOcupacion = listaEventosDia.length > 0;
            const analisis = analizarDiaOperativo(listaEventosDia);
            const esSeleccionado = diaSeleccionado?.fecha === fechaClave;
            const mostrarAlertaConflicto = esEquipoInterno && analisis.hayConflicto;

            return (
              <div
                key={numeroDia}
                onClick={() => manejarClicDia(fechaClave, tieneOcupacion, analisis)}
                style={{
                  height: '95px',
                  borderRadius: '10px',
                  padding: '6px',
                  boxSizing: 'border-box',
                  backgroundColor: mostrarAlertaConflicto
                    ? '#fee2e2'
                    : tieneOcupacion
                    ? '#fde8e8'
                    : esCliente
                    ? '#f0fdf4'
                    : '#f8fafc',
                  border: esSeleccionado
                    ? '2px solid #b3261e'
                    : mostrarAlertaConflicto
                    ? '2px solid #dc2626'
                    : tieneOcupacion
                    ? '1px solid #f87171'
                    : esCliente
                    ? '1px solid #bbf7d0'
                    : '1px solid #e2e8f0',
                  outline: esHoy ? '2px solid #523354' : 'none',
                  outlineOffset: '1px',
                  cursor: tieneOcupacion || esCliente ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    width: esHoy ? '24px' : 'auto',
                    height: esHoy ? '24px' : 'auto',
                    borderRadius: esHoy ? '50%' : '0',
                    backgroundColor: esHoy ? '#523354' : 'transparent',
                    color: esHoy ? '#ffffff' : tieneOcupacion ? '#991b1b' : esCliente ? '#166534' : '#334155',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {numeroDia}
                  </span>

                  {tieneOcupacion ? (
                    <span style={{
                      fontSize: '10px',
                      backgroundColor: mostrarAlertaConflicto ? '#b91c1c' : '#ef4444',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '1px 6px',
                      fontWeight: 'bold'
                    }}>
                      {mostrarAlertaConflicto
                        ? 'Conflicto'
                        : esPersonalEventual
                        ? 'Asignado'
                        : 'Ocupado'}
                    </span>
                  ) : (
                    esCliente && (
                      <span style={{
                        fontSize: '10px',
                        backgroundColor: '#22c55e',
                        color: '#fff',
                        borderRadius: '10px',
                        padding: '1px 6px',
                        fontWeight: 'bold'
                      }}>
                        Disponible
                      </span>
                    )
                  )}
                </div>

                {tieneOcupacion && !esCliente && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: '600' }}>
                      {listaEventosDia.length} {listaEventosDia.length === 1 ? 'evento' : 'eventos'}
                    </div>
                    {esEquipoInterno && (
                      <div style={{ fontSize: '10px', color: '#7f1d1d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {analisis.resumenCapacidad}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '1.25rem', backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
          <h3 style={{ margin: 0, color: '#523354', fontSize: '1.05rem' }}>
            {esCliente
              ? `Fechas reservadas en ${nombresMeses[mes]} ${ano}`
              : `Compromisos de ${nombresMeses[mes]} ${ano}`}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
            {esCliente
              ? `${fechasReservadasMes.length} ${fechasReservadasMes.length === 1 ? 'fecha ocupada' : 'fechas ocupadas'}`
              : `${eventosDelMesOrdenados.length} ${eventosDelMesOrdenados.length === 1 ? 'evento' : 'eventos'}`}
          </span>
        </div>

        {esCliente ? (
          fechasReservadasMes.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
              Todas las fechas de este mes se encuentran disponibles.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {fechasReservadasMes.map((fechaRes) => (
                <span
                  key={fechaRes}
                  style={{
                    backgroundColor: '#fef2f2',
                    color: '#991b1b',
                    border: '1px solid #fecaca',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}
                >
                  {formatearFechaLegible(fechaRes)} - Reservado
                </span>
              ))}
            </div>
          )
        ) : eventosDelMesOrdenados.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
            {esPersonalEventual
              ? 'No tienes eventos asignados durante este mes.'
              : 'No hay eventos registrados para el filtro seleccionado en este mes.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {eventosDelMesOrdenados.map((ev, idx) => {
              const listaDia = eventosPorFecha[ev.fechaClave] || [];
              const analisisDia = analizarDiaOperativo(listaDia);
              const tieneConflictoDia = esEquipoInterno && analisisDia.hayConflicto;

              return (
                <div
                  key={ev.idPE || ev.id || `${ev.fechaClave}-${idx}`}
                  onClick={() => setDiaSeleccionado({ fecha: ev.fechaClave, analisis: analisisDia })}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                    border: tieneConflictoDia ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{
                      backgroundColor: ev.fechaClave === claveHoy ? '#523354' : '#f3e8ff',
                      color: ev.fechaClave === claveHoy ? '#fff' : '#523354',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '0.82rem'
                    }}>
                      {formatearFechaLegible(ev.fechaClave)}
                    </span>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.92rem' }}>
                        {ev.descripcion || `Evento #${ev.idPE || ev.id}`}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        Horario: {ev.bloque.textoEvento} | Lugar: {ev.lugar || 'No especificado'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {tieneConflictoDia && (
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c'
                      }}>
                        Conflicto en jornada
                      </span>
                    )}
                    <span style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      backgroundColor: ev.infoEstado.bg,
                      color: ev.infoEstado.color
                    }}>
                      {ev.infoEstado.etiqueta}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {diaSeleccionado && !esCliente && (
        <div style={styles.modalOverlay} onClick={() => setDiaSeleccionado(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Eventos del {formatearFechaLegible(diaSeleccionado.fecha)}</h3>
              {esEquipoInterno && (
                <span style={{ fontSize: '0.8rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                  {diaSeleccionado.analisis.resumenCapacidad}
                </span>
              )}
            </div>

            {esEquipoInterno && (
              <div style={{
                marginTop: '12px',
                padding: '10px 12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: '#334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>Flota vehicular disponible:</strong></span>
                  <span style={{
                    fontWeight: 'bold',
                    color: diaSeleccionado.analisis.vehiculosDisponibles === 0 ? '#b91c1c' : '#166534'
                  }}>
                    {diaSeleccionado.analisis.vehiculosDisponibles} de {FLOTA_TOTAL_VEHICULOS} vehículos ({diaSeleccionado.analisis.vehiculosComprometidos} comprometidos)
                  </span>
                </div>
                <div>
                  <strong>Espacios reservados:</strong>{' '}
                  {diaSeleccionado.analisis.espaciosReservados.length > 0
                    ? diaSeleccionado.analisis.espaciosReservados.join(', ')
                    : 'Sin recintos especificados'}
                </div>
              </div>
            )}

            {esEquipoInterno && diaSeleccionado.analisis.hayConflicto && (
              <div style={{
                backgroundColor: '#fdecea',
                border: '1px solid #c0392b',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: '10px',
                marginTop: '12px',
                fontSize: '0.85rem'
              }}>
                <strong>Alerta de Coordinación Operativa:</strong>
                <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                  {[...diaSeleccionado.analisis.cruces, ...diaSeleccionado.analisis.alertasCapacidad].map((msg, idx) => (
                    <li key={idx} style={{ marginBottom: '2px' }}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '380px', overflowY: 'auto', margin: '1rem 0' }}>
              {diaSeleccionado.analisis.eventosEnriquecidos.map((ev, index) => {
                const max = ev.numPersonas || ev.capacidadMaxima || ev.aforoMaximo;
                const asis = ev.asistentesConfirmados ?? ev.asistentes ?? ev.asistentesEstimados ?? 0;
                const pct = calcularPorcentajeAforo(asis, max);

                return (
                  <div key={ev.idPE || ev.id || index} style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, color: '#523354' }}>{ev.descripcion || `Evento #${ev.idPE || ev.id}`}</h4>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          backgroundColor: ev.infoEstado.bg,
                          color: ev.infoEstado.color,
                          whiteSpace: 'nowrap'
                        }}>
                          {ev.infoEstado.etiqueta}
                        </span>
                        {esEquipoInterno && (
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
                        )}
                      </div>
                    </div>

                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Lugar:</strong> {ev.lugar || 'No especificado'}</p>
                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Encargado/Personal:</strong> {ev.personal || 'Sin asignar'}</p>

                    <div style={{ marginTop: '8px', padding: '8px 10px', backgroundColor: '#faf5ff', borderRadius: '6px', border: '1px solid #e9d5ff' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#3b0764' }}>
                        <strong>Horario del evento:</strong> {ev.bloque.textoEvento}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b21a8' }}>
                        <strong>Bloqueo operativo (±3h traslado/montaje/desmontaje):</strong> {ev.bloque.textoBloqueo}
                      </p>
                    </div>

                    {esEquipoInterno && (
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
                    )}
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
    maxWidth: '540px',
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