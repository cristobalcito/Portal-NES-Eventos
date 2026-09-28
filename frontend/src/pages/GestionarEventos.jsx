import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

export default function GestionarEventos() {
  const [eventoSeleccionado, setEventoSeleccionado] = useState({
    nombre: 'Matrimonio de Jessica Pérez',
    organizador: 'XXXXXX',
    peticion: 'XXXXXXX',
    invitados: '[VER]'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e5e5e5', fontFamily: 'sans-serif' }}>
      
      {/* Barra Lateral importada */}
      <Sidebar />

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
            <input 
              type="text" 
              placeholder="Buscar eventos..." 
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
              backgroundColor: '#8a5b96', 
              color: 'white', 
              border: 'none', 
              padding: '12px 30px', 
              borderRadius: '25px', 
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              Agregar evento
            </button>
            <button style={{ 
              backgroundColor: '#8a5b96', 
              color: 'white', 
              border: 'none', 
              padding: '12px 30px', 
              borderRadius: '25px', 
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              Importar evento
            </button>
          </div>
        </div>

        {/* Contenedor de la Lista de Eventos */}
        <div style={{ 
          backgroundColor: '#8a5b96', 
          padding: '20px', 
          border: '3px solid black', 
          flex: 1, 
          overflowY: 'auto',
          marginBottom: '20px'
        }}>
          {[
            "15/05/2030: Matrimonio de Jessica Pérez | 19:30 | Plaza de Armas",
            "21/11/2030: Licenciatura de Alberto Gonzales | 12:00",
            "07/12/2030: Recaudación de fondos"
          ].map((evento, index) => (
            <div key={index} style={{ 
              backgroundColor: '#d499a7', 
              borderRadius: '30px', 
              padding: '15px 25px', 
              marginBottom: '15px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              border: '1px solid black',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', flex: 1, textAlign: 'center' }}>
                {evento}
              </span>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>📝</button>
                <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>

        {/* Tarjeta inferior de Detalles */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '15px', 
          padding: '20px 30px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          minHeight: '150px'
        }}>
          <h2 style={{ fontSize: '28px', margin: '0 0 15px 0' }}>{eventoSeleccionado.nombre}</h2>
          <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
            <p style={{ margin: '5px 0' }}>Organizador(a): {eventoSeleccionado.organizador}</p>
            <p style={{ margin: '5px 0' }}>A petición de: {eventoSeleccionado.peticion}</p>
            <p style={{ margin: '5px 0' }}>Invitados: <span style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>{eventoSeleccionado.invitados}</span></p>
          </div>
        </div>
        
      </main>
    </div>
  );
}