import React, { useState, useEffect } from 'react';
import ModalRegistro from '../components/ModalRegistro'; // Ajusta la ruta si es necesario

export default function PersonalPagina() {
  const [personal, setPersonal] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [personalSeleccionado, setPersonalSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3000/api/personal', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    })
      .then(async (respuesta) => {
        const datos = await respuesta.json();
        if (!respuesta.ok) {
          throw new Error(datos.error || 'No se pudo cargar el personal.');
        }
        if (!Array.isArray(datos)) {
          throw new Error('La respuesta del servidor no tiene el formato esperado.');
        }
        return datos;
      })
      .then(datos => {
        setPersonal(datos);
        if (datos.length > 0) {
          setPersonalSeleccionado(datos[0]);
        }
      })
      .catch(errorCarga => {
        console.error("Error al cargar personal:", errorCarga);
        setError(errorCarga.message);
      })
      .finally(() => setCargando(false));
  }, []);

  const personalFiltrado = personal.filter(p => {
    const termino = busqueda.toLowerCase().trim();
    const nombre = (p.nombre || '').toLowerCase();
    const rol = (p.Rol || p.rol || '').toLowerCase();
    const rut = (p.Rut || p.rut || '').toLowerCase();

    return nombre.includes(termino) || rol.includes(termino) || rut.includes(termino);
  });

  const handleGuardarNuevoPersonal = (nuevo) => {
    setPersonal(prev => [nuevo, ...prev]);
    setPersonalSeleccionado(nuevo);
  };

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
            <span style={{ fontSize: '18px', marginRight: '10px' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Buscar persona..." 
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
            {busqueda ? (
              <span 
                onClick={() => setBusqueda('')} 
                style={{ fontSize: '16px', marginLeft: '10px', cursor: 'pointer', color: '#888' }}
              >
                ✖
              </span>
            ) : (
              <span style={{ fontSize: '20px', marginLeft: '10px', cursor: 'pointer' }}>⚲</span>
            )}
          </div>
          
<<<<<<< Updated upstream
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '20px' }}>
            <button style={{ 
              backgroundColor: '#8a5b96', color: 'white', border: 'none', 
              padding: '8px 18px', fontSize: '14px', borderRadius: '25px', 
=======
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginLeft: '20px' }}>
            <button style={{ 
              backgroundColor: '#8a5b96', color: 'white', border: 'none', 
              padding: '5px 18px', fontSize: '14px', borderRadius: '25px', 
>>>>>>> Stashed changes
              fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              Buscar personal
            </button>
            <button style={{ 
              backgroundColor: '#8a5b96', color: 'white', border: 'none', 
<<<<<<< Updated upstream
              padding: '8px 18px', fontSize: '14px', borderRadius: '25px', 
=======
              padding: '5px 18px', fontSize: '14px', borderRadius: '25px', 
>>>>>>> Stashed changes
              fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              Buscar clientes
            </button>
            <button 
              onClick={() => setMostrarModal(true)}
              style={{ 
                backgroundColor: '#8a5b96', color: 'white', border: 'none', 
<<<<<<< Updated upstream
                padding: '8px 18px', fontSize: '14px', borderRadius: '25px', 
=======
                padding: '5px 18px', fontSize: '14px', borderRadius: '25px', 
>>>>>>> Stashed changes
                fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              Agregar personal
            </button>
          </div>
        </div>

        {/* Lista de Personal */}
        <div style={{ 
          backgroundColor: '#8a5b96', 
          padding: '20px', 
          border: '3px solid black', 
          flex: 1, 
          overflowY: 'auto',
          marginBottom: '20px'
        }}>
          {cargando ? (
            <p style={{ color: 'white', textAlign: 'center', fontSize: '18px' }}>Cargando personal desde el servidor...</p>
          ) : error ? (
            <p role="alert" style={{ color: 'white', textAlign: 'center', fontSize: '18px' }}>{error}</p>
          ) : personalFiltrado.length === 0 ? (
            <p style={{ color: 'white', textAlign: 'center', fontSize: '18px' }}>
              {busqueda ? `No se encontraron resultados para "${busqueda}"` : 'No hay personal registrado.'}
            </p>
          ) : (
            personalFiltrado.map((p, index) => (
              <div 
                key={index} 
                onClick={() => setPersonalSeleccionado(p)}
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
                  {p.nombre} | {p.Rol || p.rol}
                </span>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>📝</button>
                  <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tarjeta inferior de Detalles (Teléfono reemplaza a "A cargo de") */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '15px', 
          padding: '20px 30px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          minHeight: '150px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {personalSeleccionado ? (
            <>
              <div>
                <h2 style={{ fontSize: '28px', margin: '0 0 15px 0' }}>{personalSeleccionado.nombre}</h2>
                <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
                  <p style={{ margin: '5px 0' }}>Rut: {personalSeleccionado.Rut || personalSeleccionado.rut || 'No especificado'}</p>
                  <p style={{ margin: '5px 0' }}>Rol: {personalSeleccionado.Rol || personalSeleccionado.rol || 'No especificado'}</p>
                  <p style={{ margin: '5px 0' }}>Fecha nacimiento: {personalSeleccionado.fechaNacimiento || 'xx/xx/xx'}</p>
                  <p style={{ margin: '5px 0' }}>Estado: {personalSeleccionado.Estado || personalSeleccionado.estado || 'No especificado'}</p>
                  <p style={{ margin: '5px 0' }}>Teléfono: {personalSeleccionado.telefono || personalSeleccionado.Telefono || 'No especificado'}</p>
                </div>
              </div>

              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                border: '3px solid black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '50px',
                marginRight: '20px'
              }}>
                👤
              </div>
            </>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>Selecciona una persona para ver sus detalles</p>
          )}
        </div>
        
      </main>

      <ModalRegistro 
        isOpen={mostrarModal}
        tipo="persona"
        onClose={() => setMostrarModal(false)}
        onGuardar={handleGuardarNuevoPersonal}
      />
    </div>
  );
}