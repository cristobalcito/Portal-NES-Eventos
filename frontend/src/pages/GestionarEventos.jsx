import React, { useState, useEffect } from 'react';
import ModalAgregarEvento from '../components/ModalAgregarEvento.jsx';
import ModalImportarEventos from '../components/ModalImportarEventos.jsx';

export default function GestionarEventos() {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [eventoEditando, setEventoEditando] = useState(null);
  const [eventoAEliminar, setEventoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');
  const [importarAbierto, setImportarAbierto] = useState(false);

  // Estado para el modal de Asistencia
  const [eventoAsistencia, setEventoAsistencia] = useState(null);
  const [confirmadosInput, setConfirmadosInput] = useState(0);
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false);
  const [errorAsistencia, setErrorAsistencia] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const cargarEventos = () => {
    fetch(`${API_URL}/api/eventos`)
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error('Respuesta no válida del servidor');
        }
        return respuesta.json();
      })
      .then((datos) => {
        const lista = Array.isArray(datos) ? datos : (datos.datos || []);
        if (Array.isArray(lista)) {
          setEventos(lista);
          setEventoSeleccionado((actual) => {
            if (!actual) return lista[0] || null;
            return lista.find((e) => (e.idPE || e.id) === (actual.idPE || actual.id)) || lista[0] || null;
          });
        } else {
          setEventos([]);
          setEventoSeleccionado(null);
        }
      })
      .catch((error) => {
        console.error("Error al cargar eventos:", error);
        setEventos([]);
        setEventoSeleccionado(null);
      });
  };

  useEffect(() => {
    cargarEventos();
  }, [API_URL]);

  const crearEvento = async (datosEvento) => {
    const respuesta = await fetch(`${API_URL}/api/eventos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosEvento)
    });

    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(datos.mensaje || 'No se pudo crear el evento');
    }

    const nuevo = datos.datos || datos;
    setEventos((anteriores) =>
      [...anteriores, nuevo].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    );
    setEventoSeleccionado(nuevo);
    setBusqueda('');
    mostrarMensaje(datos.mensaje || `Evento "${nuevo.descripcion}" creado correctamente.`);
  };

  const mostrarMensaje = (texto, duracion = 3000) => {
    setMensajeExito(texto);
    setTimeout(() => setMensajeExito(''), duracion);
  };

  const editarEvento = async (datosEvento) => {
    const id = eventoEditando.idPE || eventoEditando.id;
    const respuesta = await fetch(`${API_URL}/api/eventos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosEvento)
    });

    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(datos.mensaje || 'No se pudo editar el evento');
    }

    const editado = datos.evento || datos.datos || datos;
    setEventos((anteriores) =>
      anteriores
        .map((e) => ((e.idPE || e.id) === (editado.idPE || editado.id) ? editado : e))
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    );
    setEventoSeleccionado(editado);

    const avisos = Array.isArray(datos.avisos) && datos.avisos.length > 0 ? ` ${datos.avisos.join(' ')}` : '';
    mostrarMensaje(datos.mensaje || `Evento "${editado.descripcion}" actualizado.${avisos}`, avisos ? 6000 : 3000);
  };

  const handleAbrirAsistencia = (evento) => {
    setErrorAsistencia('');
    setEventoAsistencia(evento);
    setConfirmadosInput(evento.asistentesConfirmados || 0);
  };

  const handleGuardarAsistencia = async (e) => {
    e.preventDefault();
    if (!eventoAsistencia) return;

    const id = eventoAsistencia.idPE || eventoAsistencia.id;
    try {
      setGuardandoAsistencia(true);
      setErrorAsistencia('');
      const res = await fetch(`${API_URL}/api/eventos/${id}/asistencia`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asistentesConfirmados: Number(confirmadosInput) })
      });

      const datos = await res.json();
      if (!res.ok) throw new Error(datos.mensaje || 'Error al actualizar asistencia');

      const eventoActualizado = datos.evento || datos;
      setEventos((anteriores) =>
        anteriores.map((e) => ((e.idPE || e.id) === id ? eventoActualizado : e))
      );
      setEventoSeleccionado(eventoActualizado);
      setEventoAsistencia(null);
      mostrarMensaje(`Asistencia de "${eventoActualizado.descripcion}" actualizada.`);
    } catch (err) {
      setErrorAsistencia(err.message);
    } finally {
      setGuardandoAsistencia(false);
    }
  };

  const confirmarEliminar = async () => {
    const id = eventoAEliminar.idPE || eventoAEliminar.id;
    try {
      setEliminando(true);
      setErrorEliminar('');
      const respuesta = await fetch(`${API_URL}/api/eventos/${id}`, { method: 'DELETE' });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        throw new Error(datos.mensaje || 'No se pudo eliminar el evento');
      }

      const restantes = eventos.filter((e) => (e.idPE || e.id) !== id);
      setEventos(restantes);
      if (eventoSeleccionado && (eventoSeleccionado.idPE || eventoSeleccionado.id) === id) {
        setEventoSeleccionado(restantes[0] || null);
      }
      mostrarMensaje(datos.mensaje || `Evento "${eventoAEliminar.descripcion}" eliminado.`);
      setEventoAEliminar(null);
    } catch (err) {
      setErrorEliminar(err.message);
    } finally {
      setEliminando(false);
    }
  };

  const importarEventos = async (eventosAImportar) => {
    const respuesta = await fetch(`${API_URL}/api/eventos/importar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventos: eventosAImportar })
    });

    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(datos.mensaje || 'No se pudieron importar los eventos');
    }

    setEventos((anteriores) =>
      [...anteriores, ...datos.creados].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    );

    const rechazados = datos.errores.length > 0 ? ` ${datos.errores.length} fila(s) no se importaron por errores.` : '';
    mostrarMensaje(`Se importaron ${datos.creados.length} evento(s).${rechazados}`, 5000);
  };

  const abrirAgregar = () => {
    setEventoEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (evento) => {
    setEventoEditando(evento);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEventoEditando(null);
  };

  const formatearHora = (fechaHora) =>
    new Date(fechaHora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

  const listaEventos = Array.isArray(eventos) ? eventos : [];
  const textoBusqueda = busqueda.toLowerCase();
  const eventosFiltrados = listaEventos.filter((evento) =>
    [evento.descripcion, evento.lugar, evento.personal].some((campo) =>
      (campo || '').toLowerCase().includes(textoBusqueda)
    )
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e5e5e5', fontFamily: 'sans-serif' }}>
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px' }}>
        
        {/* Barra superior */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>

          <div style={{ 
            flex: 1, 
            maxWidth: '700px', 
            backgroundColor: 'white', 
            borderRadius: '25px', 
            display: 'flex', 
            alignItems: 'center', 
            padding: '10px 20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <input 
              type="text" 
              placeholder="Buscar eventos..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ 
                flex: 1, 
                border: 'none', 
                outline: 'none', 
                textAlign: 'center', 
                fontStyle: 'italic', 
                color: '#333',
                fontSize: '16px'
              }} 
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '20px' }}>
            <button onClick={abrirAgregar} style={{ 
              backgroundColor: '#8a5b96', color: 'white', border: 'none', 
              padding: '12px 30px', borderRadius: '25px', fontWeight: 'bold',
              cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              Agregar evento
            </button>
            <button onClick={() => setImportarAbierto(true)} style={{ 
              backgroundColor: '#8a5b96', color: 'white', border: 'none', 
              padding: '12px 30px', borderRadius: '25px', fontWeight: 'bold',
              cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              Importar eventos
            </button>
          </div>
        </div>

        {mensajeExito && (
          <div style={{
            backgroundColor: '#e6f4ea', color: '#1e6b34', padding: '10px 20px',
            borderRadius: '15px', marginBottom: '15px', fontWeight: 'bold', textAlign: 'center'
          }}>
            {mensajeExito}
          </div>
        )}

        {/* Lista de Eventos */}
        <div style={{ 
          backgroundColor: '#8a5b96', padding: '20px', border: '3px solid black', 
          flex: 1, overflowY: 'auto', marginBottom: '20px'
        }}>
          {listaEventos.length === 0 ? (
            <p style={{ color: 'white', textAlign: 'center', fontSize: '18px' }}>
              No hay eventos registrados.
            </p>
          ) : eventosFiltrados.length === 0 ? (
            <p style={{ color: 'white', textAlign: 'center', fontSize: '18px' }}>
              No hay eventos que coincidan con "{busqueda}".
            </p>
          ) : (
            eventosFiltrados.map((evento, index) => {
              const invitados = evento.numPersonas || 0;
              const confirmados = evento.asistentesConfirmados || 0;
              return (
                <div 
                  key={evento.idPE || evento.id || index} 
                  onClick={() => setEventoSeleccionado(evento)}
                  style={{ 
                    backgroundColor: evento.estado === 'PENDIENTE' ? '#d97706' : '#d499a7', borderRadius: '30px', padding: '15px 25px', 
                    marginBottom: '15px', display: 'flex', justifyContent: 'space-between', 
                    alignItems: 'center', border: '1px solid black', boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                    cursor: 'pointer' 
                  }}
                >
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', flex: 1, textAlign: 'center' }}>
                    {evento.estado === 'PENDIENTE' ? '[PENDIENTE] ' : ''}
                    {evento.fecha ? new Date(evento.fecha).toLocaleDateString() : 'Sin fecha'} : {evento.descripcion} | {evento.lugar || 'Sin lugar'} | Asistencia: {confirmados} / {invitados}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      title="Controlar asistencia"
                      onClick={(e) => { e.stopPropagation(); handleAbrirAsistencia(evento); }}
                      style={{ backgroundColor: 'white', color: '#1e40af', border: '1px solid #1e40af', borderRadius: '15px', padding: '5px 12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Asistencia
                    </button>
                    <button
                      title="Editar evento"
                      onClick={(e) => { e.stopPropagation(); abrirEditar(evento); }}
                      style={{ backgroundColor: 'white', color: '#523354', border: '1px solid #8a5b96', borderRadius: '15px', padding: '5px 12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Editar
                    </button>
                    <button
                      title="Eliminar evento"
                      onClick={(e) => { e.stopPropagation(); setErrorEliminar(''); setEventoAEliminar(evento); }}
                      style={{ backgroundColor: 'white', color: '#c0392b', border: '1px solid #c0392b', borderRadius: '15px', padding: '5px 12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tarjeta de Detalles */}
        <div style={{ 
          backgroundColor: 'white', borderRadius: '15px', padding: '20px 30px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', minHeight: '150px'
        }}>
          {eventoSeleccionado ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '28px', margin: '0 0 15px 0' }}>
                  {eventoSeleccionado.descripcion}
                  {eventoSeleccionado.estado && (
                    <span style={{ fontSize: '14px', marginLeft: '10px', color: eventoSeleccionado.estado === 'PENDIENTE' ? '#d97706' : '#15803d' }}>
                      ({eventoSeleccionado.estado})
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => handleAbrirAsistencia(eventoSeleccionado)}
                  style={{ backgroundColor: '#1e40af', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Registrar Asistencia Confirmada
                </button>
              </div>

              <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
                <p style={{ margin: '5px 0' }}>Organizador(a) / Personal: {eventoSeleccionado.personal || 'No asignado'}</p>
                <p style={{ margin: '5px 0' }}>Ubicación: {eventoSeleccionado.lugar || 'No especificado'}</p>
                <p style={{ margin: '5px 0' }}>
                  Fecha: {eventoSeleccionado.fecha ? new Date(eventoSeleccionado.fecha).toLocaleDateString() : 'Sin fecha'}
                </p>
                {eventoSeleccionado.horario && (
                  <p style={{ margin: '5px 0' }}>
                    Horario: salida {formatearHora(eventoSeleccionado.horario.horaSalida)} · llegada {formatearHora(eventoSeleccionado.horario.horaLlegada)} · vuelta {formatearHora(eventoSeleccionado.horario.horaVuelta)}
                  </p>
                )}
                <p style={{ margin: '5px 0' }}>
                  Costo total: {eventoSeleccionado.costoTotal != null
                    ? `$${Number(eventoSeleccionado.costoTotal).toLocaleString('es-CL')}`
                    : 'No especificado'}
                </p>
                <p style={{ margin: '5px 0' }}>
                  Invitados Totales: <span style={{ fontWeight: 'bold' }}>{eventoSeleccionado.numPersonas || 0} personas</span>
                </p>
                <p style={{ margin: '5px 0' }}>
                  Asistentes Confirmados: <span style={{ fontWeight: 'bold', color: '#15803d' }}>{eventoSeleccionado.asistentesConfirmados || 0} personas</span>
                  {eventoSeleccionado.numPersonas > 0 && (
                    <span style={{ fontSize: '14px', marginLeft: '8px', color: '#666' }}>
                      ({Math.round(((eventoSeleccionado.asistentesConfirmados || 0) / eventoSeleccionado.numPersonas) * 100)}% de asistencia)
                    </span>
                  )}
                </p>
              </div>
            </>
          ) : (
            <p style={{ color: '#666' }}>Selecciona un evento de la lista para ver sus detalles.</p>
          )}
        </div>
        
      </main>

      <ModalImportarEventos
        isOpen={importarAbierto}
        onClose={() => setImportarAbierto(false)}
        onImportar={importarEventos}
      />

      <ModalAgregarEvento
        isOpen={modalAbierto}
        eventoInicial={eventoEditando}
        onClose={cerrarModal}
        onGuardar={eventoEditando ? editarEvento : crearEvento}
      />

      {/* Modal Control Asistencia Confirmada */}
      {eventoAsistencia && (
        <div
          onClick={() => !guardandoAsistencia && setEventoAsistencia(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white', padding: '25px 30px', borderRadius: '20px',
              maxWidth: '420px', width: '90%', boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}
          >
            <h2 style={{ margin: '0 0 10px 0', color: '#1e40af', fontSize: '22px' }}>Confirmación de Asistencia</h2>
            <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>
              Evento: <strong>{eventoAsistencia.descripcion}</strong>
            </p>

            <form onSubmit={handleGuardarAsistencia}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>
                  Invitados Programados:
                </label>
                <input
                  type="text"
                  value={`${eventoAsistencia.numPersonas || 0} personas`}
                  disabled
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ccc', backgroundColor: '#f3f4f6', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>
                  Asistentes Confirmados / Reales:
                </label>
                <input
                  type="number"
                  min="0"
                  max={eventoAsistencia.numPersonas || 0}
                  value={confirmadosInput}
                  onChange={(e) => setConfirmadosInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {errorAsistencia && (
                <p style={{ margin: '0 0 15px 0', color: '#b3261e', backgroundColor: '#fdecea', padding: '8px 12px', borderRadius: '10px', fontSize: '14px' }}>
                  {errorAsistencia}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEventoAsistencia(null)}
                  disabled={guardandoAsistencia}
                  style={{ backgroundColor: '#aaa', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoAsistencia}
                  style={{
                    backgroundColor: '#1e40af', color: 'white', border: 'none', padding: '10px 25px',
                    borderRadius: '20px', fontWeight: 'bold', cursor: guardandoAsistencia ? 'wait' : 'pointer',
                    opacity: guardandoAsistencia ? 0.7 : 1
                  }}
                >
                  {guardandoAsistencia ? 'Guardando...' : 'Guardar Asistencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación para eliminar */}
      {eventoAEliminar && (
        <div
          onClick={() => !eliminando && setEventoAEliminar(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '420px',
              padding: '25px 30px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', boxSizing: 'border-box'
            }}
          >
            <h2 style={{ margin: '0 0 10px 0', color: '#523354', fontSize: '22px' }}>Eliminar evento</h2>
            <p style={{ margin: '0 0 15px 0', fontSize: '15px', lineHeight: 1.5 }}>
              ¿Seguro que quieres eliminar <strong>"{eventoAEliminar.descripcion}"</strong>? Esta acción no se puede deshacer.
            </p>

            {errorEliminar && (
              <p style={{ margin: '0 0 15px 0', color: '#b3261e', backgroundColor: '#fdecea', padding: '8px 12px', borderRadius: '10px', fontSize: '14px' }}>
                {errorEliminar}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setEventoAEliminar(null)}
                disabled={eliminando}
                style={{ backgroundColor: '#aaa', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminar}
                disabled={eliminando}
                style={{
                  backgroundColor: '#c0392b', color: 'white', border: 'none', padding: '10px 25px',
                  borderRadius: '20px', fontWeight: 'bold', cursor: eliminando ? 'wait' : 'pointer',
                  opacity: eliminando ? 0.7 : 1
                }}
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}