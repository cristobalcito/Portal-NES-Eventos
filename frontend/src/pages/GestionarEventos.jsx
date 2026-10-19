import React, { useState, useEffect } from 'react';
import ModalAgregarEvento from '../components/ModalAgregarEvento.jsx';

export default function GestionarEventos() {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

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
    setMensajeExito(`Evento "${datos.descripcion}" creado correctamente.`);
    setTimeout(() => setMensajeExito(''), 3000);
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
            <button onClick={() => setModalAbierto(true)} style={{ 
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
                  <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>📝</button>
                  <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>🗑️</button>
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
        onClose={() => setModalAbierto(false)}
        onGuardar={crearEvento}
      />
    </div>
  );
}