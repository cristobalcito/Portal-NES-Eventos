import React, { useState, useEffect } from 'react';
import ModalEquipoArrendado from '../components/ModalEquipoArrendado.jsx';
import {
  API_URL, pedir, formatearFecha, formatearFechaHora, formatearPesos, estilos, Etiqueta
} from '../servicios/inventarioLogisticaServicio.jsx';

// RU-4: registrar equipamiento arrendado a terceros y vincularlo a un evento.
// Además destaca los equipos cuya devolución vence en menos de 24 horas o ya está atrasada.
export default function EquiposArrendadosPagina() {
  const [equipos, setEquipos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [filtro, setFiltro] = useState('activos');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState(null); // { tipo: 'devolver' | 'eliminar', equipo }
  const [procesando, setProcesando] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setErrorCarga('');
      const [listaEquipos, listaEventos] = await Promise.all([
        pedir('/api/equipos-arrendados'),
        pedir('/api/eventos')
      ]);
      setEquipos(Array.isArray(listaEquipos) ? listaEquipos : []);
      setEventos(Array.isArray(listaEventos) ? listaEventos : []);
    } catch (err) {
      setErrorCarga(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const mostrarMensaje = (texto) => {
    setMensajeExito(texto);
    setTimeout(() => setMensajeExito(''), 4000);
  };

  const registrarEquipo = async (formData) => {
    const nuevo = await pedir('/api/equipos-arrendados', { method: 'POST', body: formData });
    mostrarMensaje(
      `"${nuevo.nombreEquipo}" registrado y vinculado a "${nuevo.evento.descripcion}". ` +
      `Se sumaron ${formatearPesos(nuevo.costo)} al presupuesto del evento.`
    );
    await cargarDatos();
  };

  const confirmarAccion = async () => {
    const { tipo, equipo } = accionPendiente;
    try {
      setProcesando(true);
      setErrorAccion('');
      if (tipo === 'devolver') {
        await pedir(`/api/equipos-arrendados/${equipo.id}/devolver`, { method: 'PATCH' });
        mostrarMensaje(`"${equipo.nombreEquipo}" marcado como devuelto al proveedor.`);
      } else {
        await pedir(`/api/equipos-arrendados/${equipo.id}`, { method: 'DELETE' });
        mostrarMensaje(`Registro de "${equipo.nombreEquipo}" eliminado y costo descontado del evento.`);
      }
      setAccionPendiente(null);
      await cargarDatos();
    } catch (err) {
      setErrorAccion(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const porVencer = equipos.filter((e) => e.estadoPlazo === 'por vencer');
  const atrasados = equipos.filter((e) => e.estadoPlazo === 'atrasado');

  // Filtro por estado (botones) y por texto (buscador)
  const cumpleFiltro = (e) => {
    if (filtro === 'activos') return e.estado !== 'devuelto';
    if (filtro === 'devueltos') return e.estado === 'devuelto';
    return true; // "todos"
  };
  const cumpleBusqueda = (e) => {
    const texto = `${e.nombreEquipo} ${e.codigoEquipo} ${e.proveedor.nombre} ${e.evento.descripcion}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  };
  const visibles = equipos.filter((e) => cumpleFiltro(e) && cumpleBusqueda(e));

  const etiquetaPlazo = (e) => {
    switch (e.estadoPlazo) {
      case 'devuelto': return <Etiqueta color="verde">Devuelto</Etiqueta>;
      case 'atrasado': return <Etiqueta color="rojo">Atrasado</Etiqueta>;
      case 'por vencer': return <Etiqueta color="naranjo">Vence en &lt; 24 h</Etiqueta>;
      default: return <Etiqueta color="morado">Arrendado</Etiqueta>;
    }
  };

  const botonFiltro = (valor, etiqueta) => (
    <button
      onClick={() => setFiltro(valor)}
      style={{
        padding: '8px 16px', borderRadius: '20px', border: '1px solid #8a5b96', cursor: 'pointer', fontWeight: 'bold',
        backgroundColor: filtro === valor ? '#8a5b96' : 'white', color: filtro === valor ? 'white' : '#8a5b96'
      }}
    >
      {etiqueta}
    </button>
  );

  return (
    <div style={estilos.pagina}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, color: '#523354', fontSize: '28px' }}>Equipos arrendados a terceros</h1>
          <p style={{ margin: '4px 0 0', color: '#666' }}>Equipamiento externo subcontratado para eventos.</p>
        </div>
        <button onClick={() => setModalAbierto(true)} style={estilos.botonGrande}>Registrar equipo arrendado</button>
      </div>

      {atrasados.length > 0 && (
        <div style={{ ...estilos.alerta, backgroundColor: '#fdecea', color: '#b3261e', borderColor: '#f5b5ae' }}>
          Devolución atrasada: {atrasados.map((e) => `${e.nombreEquipo} (${e.proveedor.nombre})`).join(', ')}. Pueden aplicar multas del proveedor.
        </div>
      )}
      {porVencer.length > 0 && (
        <div style={estilos.alerta}>
          Vence en menos de 24 horas: {porVencer.map((e) => `${e.nombreEquipo} (${e.proveedor.nombre}, ${formatearFechaHora(e.fechaDevolucion)})`).join(', ')}.
        </div>
      )}

      {mensajeExito && <div style={estilos.exito}>{mensajeExito}</div>}

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
        {botonFiltro('activos', 'En arriendo')}
        {botonFiltro('devueltos', 'Devueltos')}
        {botonFiltro('todos', 'Todos')}
        <input
          type="text" placeholder="Buscar por equipo, proveedor o evento..." value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: '220px', padding: '10px 18px', borderRadius: '25px', border: '1px solid #ccc', outline: 'none', fontSize: '14px' }}
        />
      </div>

      <div style={estilos.contenedorTabla}>
        <table style={estilos.tabla}>
          <thead>
            <tr>
              <th style={estilos.th}>Equipo</th>
              <th style={estilos.th}>Cant.</th>
              <th style={estilos.th}>Proveedor</th>
              <th style={estilos.th}>Evento</th>
              <th style={estilos.th}>Retiro</th>
              <th style={estilos.th}>Devolución</th>
              <th style={estilos.th}>Costo</th>
              <th style={estilos.th}>Estado</th>
              <th style={estilos.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="9" style={estilos.td}>Cargando...</td></tr>
            ) : errorCarga ? (
              <tr><td colSpan="9" style={{ ...estilos.td, color: '#b3261e' }}>{errorCarga}</td></tr>
            ) : visibles.length === 0 ? (
              <tr><td colSpan="9" style={{ ...estilos.td, color: '#666' }}>No hay equipos arrendados para mostrar.</td></tr>
            ) : (
              visibles.map((e) => (
                <tr key={e.id} style={{
                  backgroundColor: e.estadoPlazo === 'atrasado' ? '#fff8f7' : e.estadoPlazo === 'por vencer' ? '#fffaf2' : 'white'
                }}>
                  <td style={{ ...estilos.td, textAlign: 'left' }}>
                    <strong>{e.nombreEquipo}</strong>
                    <div style={{ fontSize: '12px', color: '#888' }}>ID {e.codigoEquipo} · recibe {e.receptorBodega}</div>
                  </td>
                  <td style={estilos.td}>{e.cantidad}</td>
                  <td style={estilos.td}>
                    {e.proveedor.nombre}
                    <div style={{ fontSize: '12px', color: '#888' }}>{e.proveedor.rut} · {e.proveedor.contacto}</div>
                  </td>
                  <td style={estilos.td}>
                    {e.evento.descripcion}
                    <div style={{ fontSize: '12px', color: '#888' }}>{formatearFecha(e.evento.fecha)}</div>
                  </td>
                  <td style={estilos.td}>{formatearFechaHora(e.fechaRetiro)}</td>
                  <td style={estilos.td}>{formatearFechaHora(e.fechaDevolucion)}</td>
                  <td style={estilos.td}>{formatearPesos(e.costo)}</td>
                  <td style={estilos.td}>{etiquetaPlazo(e)}</td>
                  <td style={{ ...estilos.td, whiteSpace: 'nowrap' }}>
                    <a href={`${API_URL}/api/equipos-arrendados/${e.id}/garantia`} target="_blank" rel="noreferrer"
                      style={{ ...estilos.botonTabla, textDecoration: 'none', display: 'inline-block' }}>Garantía</a>
                    {e.estado !== 'devuelto' && (
                      <button style={{ ...estilos.botonTabla, marginLeft: '6px' }}
                        onClick={() => { setErrorAccion(''); setAccionPendiente({ tipo: 'devolver', equipo: e }); }}>Devuelto</button>
                    )}
                    <button style={{ ...estilos.botonTablaRojo, marginLeft: '6px' }}
                      onClick={() => { setErrorAccion(''); setAccionPendiente({ tipo: 'eliminar', equipo: e }); }}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ModalEquipoArrendado
        isOpen={modalAbierto}
        eventos={eventos}
        onClose={() => setModalAbierto(false)}
        onGuardar={registrarEquipo}
      />

      {/* Confirmación de devolver o eliminar */}
      {accionPendiente && (
        <div style={estilos.fondoModal} onClick={() => !procesando && setAccionPendiente(null)}>
          <div style={{ ...estilos.cajaModal, maxWidth: '430px' }} onClick={(ev) => ev.stopPropagation()}>
            <h2 style={{ ...estilos.tituloModal, marginBottom: '10px' }}>
              {accionPendiente.tipo === 'devolver' ? 'Confirmar devolución' : 'Eliminar registro'}
            </h2>
            <p style={{ margin: '0 0 15px', fontSize: '15px', lineHeight: 1.5 }}>
              {accionPendiente.tipo === 'devolver'
                ? <>¿Confirmas que <strong>{accionPendiente.equipo.nombreEquipo}</strong> fue devuelto a {accionPendiente.equipo.proveedor.nombre}?</>
                : <>¿Eliminar el registro de <strong>{accionPendiente.equipo.nombreEquipo}</strong>? Se descontarán {formatearPesos(accionPendiente.equipo.costo)} del presupuesto del evento.</>}
            </p>
            {errorAccion && <p style={{ ...estilos.error, marginBottom: '15px' }}>{errorAccion}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setAccionPendiente(null)} disabled={procesando} style={estilos.botonSecundario}>Cancelar</button>
              <button onClick={confirmarAccion} disabled={procesando}
                style={{ ...estilos.botonPrimario, backgroundColor: accionPendiente.tipo === 'eliminar' ? '#c0392b' : '#2e7d32', opacity: procesando ? 0.7 : 1 }}>
                {procesando ? 'Guardando...' : accionPendiente.tipo === 'devolver' ? 'Sí, devuelto' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
