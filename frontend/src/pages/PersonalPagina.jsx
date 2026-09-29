// frontend/src/pages/PersonalPagina.jsx
import { useState } from 'react';
import Sidebar from '../components/SidebarComponente.jsx';


export default function Personal({ rutaActiva = '/personal', alSeleccionar }) {
  const [PersonalSeleccionado, setPersonalSeleccionado] = useState({
    Nombre: 'José Pérez',
    rut: 'XXXXXXX-X',
    rol: 'XXXXXX',
    fechaNacimiento: 'XX/XX/XXXX',
    estado: 'XXXXXXX'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e5e5e5', fontFamily: 'sans-serif' }}>
      
      {/* Barra Lateral importada */}
      <Sidebar rutaActiva={rutaActiva} alSeleccionar={alSeleccionar} />

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
              placeholder="Buscar personal..." 
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginLeft: '20px' }}>
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
              Buscar Personal
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
              Buscar clientes
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
              Agregar Personal
            </button>

          </div>
        </div>

        {/* Contenedor de la Lista personal */}
        <div style={{ 
          backgroundColor: '#8a5b96', 
          padding: '20px', 
          border: '3px solid black', 
          flex: 1, 
          overflowY: 'auto',
          marginBottom: '20px'
        }}>
          {[
            "José Pérez | controlador de luces |",
            " Mateo Gonzales| garzón |",
            " Marcela Retamal | contabilidad |",
          ].map((personal, index) => (
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
                {personal}
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
          <h2 style={{ fontSize: '28px', margin: '0 0 15px 0' }}>{PersonalSeleccionado.Nombre}</h2>
          <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
            <p style={{ margin: '5px 0' }}>Rol: {PersonalSeleccionado.rol}</p>
            <p style={{ margin: '5px 0' }}>Fecha de nacimiento: {PersonalSeleccionado.fechaNacimiento}</p>
            <p style={{ margin: '5px 0' }}>Estado: <span style={{ fontWeight: 'bold' }}>{PersonalSeleccionado.estado}</span></p>


          </div>
        </div>
        
      </main>
    </div>
  );
}