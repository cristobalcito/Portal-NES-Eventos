import React, { useState, useEffect } from 'react';
import ModalAgregarEvento from '../components/ModalAgregarEvento.jsx';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetch(`${API_URL}/api/eventos`)
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error('Respuesta no válida del servidor');
        }
        return respuesta.json();
      })
      .then((datos) => {
        if (Array.isArray(datos)) {
          setEventos(datos);
          if (datos.length > 0) {
            setEventoSeleccionado(datos[0]);
          } else {
            setEventoSeleccionado(null);
          }
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
  }, [API_URL]);

  // Envía el nuevo evento al backend. Si falla, lanza el error para que el modal lo muestre.
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

    // Se agrega a la lista manteniendo el orden por fecha y se deja seleccionado
    setEventos((anteriores) =>
      [...anteriores, datos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    );
    setEventoSeleccionado(datos);
    setBusqueda('');
    mostrarMensaje(`Evento "${datos.descripcion}" creado correctamente.`);
  };

  // Muestra un mensaje verde por unos segundos
  const mostrarMensaje = (texto, duracion = 3000) => {
    setMensajeExito(texto);
    setTimeout(() => setMensajeExito(''), duracion);
  };

  // Envía los cambios de un evento. El backend aplica las reglas de fecha e invitados.
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

    const editado = datos.evento;
    setEventos((anteriores) =>
      anteriores
        .map((e) => ((e.idPE || e.id) === (editado.idPE || editado.id) ? editado : e))
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    );
    setEventoSeleccionado(editado);

    const avisos = Array.isArray(datos.avisos) && datos.avisos.length > 0 ? ` ${datos.avisos.join(' ')}` : '';
    mostrarMensaje(`Evento "${editado.descripcion}" actualizado.${avisos}`, avisos ? 6000 : 3000);
  };

  // Elimina el evento confirmado en el cuadro de diálogo
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
      mostrarMensaje(`Evento "${eventoAEliminar.descripcion}" eliminado.`);
      setEventoAEliminar(null);
    } catch (err) {
      setErrorEliminar(err.message);
    } finally {
      setEliminando(false);
    }
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

  // El buscador revisa descripción, lugar y encargado
  const textoBusqueda = busqueda.toLowerCase();
  const eventosFiltrados = listaEventos.filter((evento) =>
    [evento.descripcion, evento.lugar, evento.personal].some((campo) =>
      (campo || '').toLowerCase().includes(textoBusqueda)
    )
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e5e5e5', fontFamily: 'sans-serif' }}>
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px' }}>
        
        {/* Barra superior de Búsqueda y Botones */}
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
            <span style={{ fontSize: '18px', marginRight: '10px' }}>🔍</span>
            
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
            <span style={{ fontSize: '20px', marginLeft: '10px', cursor: 'pointer' }}>⚲</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '20px' }}>
            <button onClick={abrirAgregar} style={{ 
              backgroundColor: '#8a5b96', color: 'white', border: 'none', 
              padding: '12px 30px', borderRadius: '25px', fontWeight: 'bold',
              cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              Agregar evento
            </button>
            <button style={{ 
              backgroundColor: '#8a5b96', color: 'white', border: 'none', 
              padding: '12px 30px', borderRadius: '25px', fontWeight: 'bold',
              cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              Importar evento
            </button>
          </div>
        </div>

        {mensajeExito && (
          <div style={{
            backgroundColor: '#e6f4ea', color: '#1e6b34', padding: '10px 20px',
            borderRadius: '15px', marginBottom: '15px', fontWeight: 'bold', textAlign: 'center'
          }}>
            ✅ {mensajeExito}
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
            eventosFiltrados.map((evento, index) => (
              <div 
                key={evento.idPE || evento.id || index} 
                onClick={() => setEventoSeleccionado(evento)}
                style={{ 
                  backgroundColor: '#d499a7', borderRadius: '30px', padding: '15px 25px', 
                  marginBottom: '15px', display: 'flex', justifyContent: 'space-between', 
                  alignItems: 'center', border: '1px solid black', boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                  cursor: 'pointer' 
                }}
              >
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', flex: 1, textAlign: 'center' }}>
                  {evento.fecha ? new Date(evento.fecha).toLocaleDateString() : 'Sin fecha'} : {evento.descripcion} | {evento.lugar || 'Sin lugar'}
                </span>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button
                    title="Editar evento"
                    onClick={(e) => { e.stopPropagation(); abrirEditar(evento); }}
                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                  >📝</button>
                  <button
                    title="Eliminar evento"
                    onClick={(e) => { e.stopPropagation(); setErrorEliminar(''); setEventoAEliminar(evento); }}
                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                  >🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tarjeta de Detalles del Evento Seleccionado */}
        <div style={{ 
          backgroundColor: 'white', borderRadius: '15px', padding: '20px 30px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', minHeight: '150px'
        }}>
          {eventoSeleccionado ? (
            <>
              <h2 style={{ fontSize: '28px', margin: '0 0 15px 0' }}>{eventoSeleccionado.descripcion}</h2>
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
                  Invitados: <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>
                    [{eventoSeleccionado.numPersonas || 0} personas]
                  </span>
                </p>
              </div>
            </>
          ) : (
            <p style={{ color: '#666' }}>Selecciona un evento de la lista para ver sus detalles.</p>
          )}
        </div>
        
      </main>

      <ModalAgregarEvento
        isOpen={modalAbierto}
        eventoInicial={eventoEditando}
        onClose={cerrarModal}
        onGuardar={eventoEditando ? editarEvento : crearEvento}
      />

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
            <h2 style={{ margin: '0 0 10px 0', color: '#523354', fontSize: '22px' }}>🗑️ Eliminar evento</h2>
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