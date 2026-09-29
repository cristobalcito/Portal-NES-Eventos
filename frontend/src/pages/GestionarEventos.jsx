import React, { useState, useEffect } from 'react';

export default function GestionarEventos() {
  // 1. Estado para la lista completa y el evento seleccionado
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState({
    descripcion: 'Cargando...',
    personal: '',
    lugar: '',
    numPersonas: ''
  });
  
  // CAMBIO 1: Estado para lo que el usuario escribe en el buscador
  const [busqueda, setBusqueda] = useState('');

  // 2. Conexión al backend al cargar la página
  useEffect(() => {
    fetch('http://localhost:3000/api/eventos')
      .then(respuesta => respuesta.json())
      .then(datos => {
        setEventos(datos);
        // Si hay datos, mostramos el primero automáticamente en la tarjeta
        if (datos.length > 0) {
          setEventoSeleccionado(datos[0]);
        }
      })
      .catch(error => console.error("Error al cargar eventos:", error));
  }, []);

  // CAMBIO 2: Filtro en tiempo real
  const eventosFiltrados = eventos.filter((evento) =>
    evento.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e5e5e5', fontFamily: 'sans-serif' }}>
      
      {/* Contenido Principal */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px' }}>
        
        {/* Barra superior: Búsqueda y Botones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          
          {/* Barra de búsqueda */}
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
            
            {/* CAMBIO 3: Conectar el input con el estado de búsqueda */}
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
                color: '#888',
                fontSize: '16px'
              }} 
            />
            <span style={{ fontSize: '20px', marginLeft: '10px', cursor: 'pointer' }}>⚲</span>
          </div>
          
          {/* Botones de acción */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '20px' }}>
            <button style={{ 
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

        {/* Contenedor de la Lista de Eventos */}
        <div style={{ 
          backgroundColor: '#8a5b96', padding: '20px', border: '3px solid black', 
          flex: 1, overflowY: 'auto', marginBottom: '20px'
        }}>
          {eventos.length === 0 ? (
            <p style={{ color: 'white', textAlign: 'center', fontSize: '18px' }}>Cargando eventos desde el servidor...</p>
          ) : (
            // CAMBIO 4: Mapear 'eventosFiltrados' en lugar de 'eventos'
            eventosFiltrados.map((evento, index) => (
              <div 
                key={index} 
                onClick={() => setEventoSeleccionado(evento)}
                style={{ 
                  backgroundColor: '#d499a7', borderRadius: '30px', padding: '15px 25px', 
                  marginBottom: '15px', display: 'flex', justifyContent: 'space-between', 
                  alignItems: 'center', border: '1px solid black', boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                  cursor: 'pointer' 
                }}
              >
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', flex: 1, textAlign: 'center' }}>
                  {new Date(evento.fecha).toLocaleDateString()} : {evento.descripcion} | {evento.lugar}
                </span>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>📝</button>
                  <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tarjeta inferior de Detalles */}
        <div style={{ 
          backgroundColor: 'white', borderRadius: '15px', padding: '20px 30px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', minHeight: '150px'
        }}>
          <h2 style={{ fontSize: '28px', margin: '0 0 15px 0' }}>{eventoSeleccionado.descripcion}</h2>
          <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
            <p style={{ margin: '5px 0' }}>Organizador(a): {eventoSeleccionado.personal}</p>
            <p style={{ margin: '5px 0' }}>A petición de: {eventoSeleccionado.lugar}</p>
            <p style={{ margin: '5px 0' }}>Invitados: <span style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>[{eventoSeleccionado.numPersonas} personas]</span></p>
          </div>
        </div>
        
      </main>
    </div>
  );
}
