// frontend/src/pages/PersonalPagina.jsx
import { useState, useEffect } from 'react';

export default function PersonalPagina() {
  const [personalList, setPersonalList] = useState([]);
  const [personalSeleccionado, setPersonalSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetch(`${API_URL}/api/personal`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener el personal');
        return res.json();
      })
      .then((datos) => {
        if (Array.isArray(datos)) {
          setPersonalList(datos);
          if (datos.length > 0) {
            setPersonalSeleccionado(datos[0]);
          }
        } else {
          setPersonalList([]);
        }
      })
      .catch((err) => {
        console.error('Error al cargar personal:', err);
        setPersonalList([]);
      });
  }, [API_URL]);

  const personalFiltrado = personalList.filter((persona) => {
    const termino = busqueda.toLowerCase();
    const nombre = persona.nombre || persona.Nombre || '';
    const rol = persona.rol || persona.cargo || '';
    const rut = persona.rut || '';

    return (
      nombre.toLowerCase().includes(termino) ||
      rol.toLowerCase().includes(termino) ||
      rut.toLowerCase().includes(termino)
    );
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e5e5e5', fontFamily: 'sans-serif' }}>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px' }}>
        
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
              placeholder="Buscar por nombre, rol o RUT..." 
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
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '20px' }}>
            <button style={{ 
              backgroundColor: '#8a5b96', color: 'white', border: 'none', 
              padding: '10px 24px', borderRadius: '25px', fontWeight: 'bold',
              cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              Agregar Personal
            </button>
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#8a5b96', 
          padding: '20px', 
          border: '3px solid black', 
          flex: 1, 
          overflowY: 'auto',
          marginBottom: '20px'
        }}>
          {personalList.length === 0 ? (
            <p style={{ color: 'white', textAlign: 'center', fontSize: '18px' }}>
              No hay personal registrado.
            </p>
          ) : (
            personalFiltrado.map((persona) => (
              <div 
                key={persona.id || persona.rut} 
                onClick={() => setPersonalSeleccionado(persona)}
                style={{ 
                  backgroundColor: '#d499a7', 
                  borderRadius: '30px', 
                  padding: '15px 25px', 
                  marginBottom: '15px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  border: '1px solid black',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                  cursor: 'pointer'
                }}
              >
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', flex: 1, textAlign: 'center' }}>
                  {persona.nombre || persona.Nombre} | {persona.rol || persona.cargo || 'Sin Rol'} | RUT: {persona.rut || 'N/A'}
                </span>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>📝</button>
                  <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '15px', 
          padding: '20px 30px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          minHeight: '150px'
        }}>
          {personalSeleccionado ? (
            <>
              <h2 style={{ fontSize: '28px', margin: '0 0 15px 0' }}>
                {personalSeleccionado.nombre || personalSeleccionado.Nombre}
              </h2>
              <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
                <p style={{ margin: '5px 0' }}>RUT: <strong>{personalSeleccionado.rut || 'Sin registrar'}</strong></p>
                <p style={{ margin: '5px 0' }}>Rol / Cargo: <strong>{personalSeleccionado.rol || personalSeleccionado.cargo || 'General'}</strong></p>
                <p style={{ margin: '5px 0' }}>
                  Fecha de nacimiento: {personalSeleccionado.fechaNacimiento ? new Date(personalSeleccionado.fechaNacimiento).toLocaleDateString() : 'No especificada'}
                </p>
                <p style={{ margin: '5px 0' }}>
                  Estado: <span style={{ fontWeight: 'bold', color: personalSeleccionado.estado === 'Inactivo' ? 'red' : 'green' }}>
                    {personalSeleccionado.estado || 'Activo'}
                  </span>
                </p>
              </div>
            </>
          ) : (
            <p style={{ color: '#666' }}>Selecciona a un miembro del personal de la lista para ver sus detalles.</p>
          )}
        </div>
        
      </main>
    </div>
  );
}