import React, { useState, useEffect } from 'react';
import ModalPersonalEventual from '../components/ModalPersonalEventual';

export default function PersonalPagina() {
  const [personal, setPersonal] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [personalSeleccionado, setPersonalSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Helper para obtener el RUT sin importar la estructura devuelta
  const obtenerRut = (p) => {
    if (!p) return 'No especificado';
    return (
      p.rut ||
      p.Rut ||
      p.RUT ||
      p.rutPersona ||
      p.usuario?.rut ||
      p.usuario?.Rut ||
      'No especificado'
    );
  };

  // Helper para obtener el Rol
  const obtenerRol = (p) => {
    if (!p) return 'No especificado';
    return (
      p.rol ||
      p.Rol ||
      p.ROL ||
      p.tipoPersona ||
      p.usuario?.rol ||
      'No especificado'
    );
  };

  // Consultar personal a la Base de Datos
  const cargarPersonal = () => {
    setCargando(true);
    fetch(`${API_URL}/api/personal-externo`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    })
      .then(async (respuesta) => {
        const datos = await respuesta.json();
        if (!respuesta.ok) {
          throw new Error(datos.error || 'No se pudo cargar el personal.');
        }
        return Array.isArray(datos.datos) ? datos.datos : [];
      })
      .then((datos) => {
        setPersonal(datos);
        if (datos.length > 0) {
          setPersonalSeleccionado(datos[0]);
        }
      })
      .catch((errorCarga) => {
        console.error('Error al cargar personal:', errorCarga);
        setError(errorCarga.message);
        setPersonal([]);
      })
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarPersonal();
  }, []);

  const personalFiltrado = personal.filter((p) => {
    const termino = busqueda.toLowerCase().trim();
    const nombre = (p.nombre || p.Nombre || p.usuario?.nombre || '').toLowerCase();
    const rol = obtenerRol(p).toLowerCase();
    const rut = obtenerRut(p).toLowerCase();

    return nombre.includes(termino) || rol.includes(termino) || rut.includes(termino);
  });

  // ACCIÓN 1: Abrir modal para editar
  const handleEditar = (p) => {
    setPersonalSeleccionado(p);
    setMostrarModal(true);
  };

  // ACCIÓN 2: Eliminar de la Base de Datos
  const handleEliminar = async (p) => {
  const rutAEliminar = obtenerRut(p);
  const nombre = p.nombre || p.Nombre || p.usuario?.nombre || 'este trabajador';

  // Leer el RUT del usuario en sesión
  const usuarioSesion = JSON.parse(localStorage.getItem('usuario') || '{}');

  if (!window.confirm(`¿Está seguro de que desea eliminar a ${nombre} (RUT: ${rutAEliminar})?`)) {
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/api/usuarios/${encodeURIComponent(rutAEliminar)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'x-usuario-rut': usuarioSesion.rut || '' // Encabezado requerido por el middleware
      }
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok || (!resultado.exito && !resultado.success)) {
      throw new Error(resultado.mensaje || 'Error al eliminar el trabajador.');
    }

    alert('Trabajador eliminado correctamente de la base de datos.');

    // Actualizar lista en pantalla
    const nuevaLista = personal.filter((item) => obtenerRut(item) !== rutAEliminar);
    setPersonal(nuevaLista);

    if (personalSeleccionado && obtenerRut(personalSeleccionado) === rutAEliminar) {
      setPersonalSeleccionado(nuevaLista[0] || null);
    }

  } catch (err) {
    console.error('Error al eliminar personal:', err);
    alert(err.message);
  }


};


  // ACCIÓN 3: Guardar Edición en la Base de Datos
 const handleGuardarNuevoPersonal = async (formulario) => {
  try {
    const rutTrabajador = obtenerRut(personalSeleccionado);
    
    // Obtener el RUT del usuario que está logueado actualmente
    const usuarioSesion = JSON.parse(localStorage.getItem('usuario') || '{}');

    const respuesta = await fetch(
      `${API_URL}/api/personal-externo/${encodeURIComponent(rutTrabajador)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'x-usuario-rut': usuarioSesion.rut || '' // Se envía para ser validado por verificarGerenteGeneral
        },
        body: JSON.stringify(formulario)
      }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      // Muestra el mensaje retornado por el servidor ("Acceso denegado...")
      throw new Error(resultado.mensaje || 'Error al actualizar la ficha.');
    }

    alert('Ficha actualizada con éxito.');
    cargarPersonal();
    setMostrarModal(false);

  } catch (error) {
    alert(error.message); // Si no es Gerente, aquí muestra la alerta de acceso denegado
  }
};

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e5e5e5', fontFamily: 'sans-serif' }}>
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px' }}>
        
        {/* Barra superior de búsqueda y botón global de editar */}
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
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '20px' }}>
            <button 
              onClick={() => {
                if (personalSeleccionado) {
                  setMostrarModal(true);
                } else {
                  alert('Selecciona una persona de la lista primero.');
                }
              }}
              style={{ 
                backgroundColor: '#8a5b96', color: 'white', border: 'none', 
                padding: '8px 18px', fontSize: '14px', borderRadius: '25px', 
                fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              Completar ficha laboral 
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
            <p style={{ color: 'white', textAlign: 'center', fontSize: '18px' }}>Cargando personal desde la base de datos...</p>
          ) : error ? (
            <p role="alert" style={{ color: 'white', textAlign: 'center', fontSize: '18px' }}>{error}</p>
          ) : personalFiltrado.length === 0 ? (
            <p style={{ color: 'white', textAlign: 'center', fontSize: '18px' }}>
              {busqueda ? `No se encontraron resultados para "${busqueda}"` : 'No hay personal registrado.'}
            </p>
          ) : (
            personalFiltrado.map((p, index) => (
              <div 
                key={p.id || obtenerRut(p) || index} 
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
                  {p.nombre || p.Nombre || p.usuario?.nombre || 'Sin nombre'} | {obtenerRol(p)}
                </span>
                
                {/* Botones de acción siempre activos */}
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button 
                    title="Editar ficha"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditar(p);
                    }} 
                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                  >
                    📝
                  </button>
                  <button 
                    title="Eliminar usuario"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminar(p);
                    }} 
                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tarjeta inferior de Detalles */}
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
                <h2 style={{ fontSize: '28px', margin: '0 0 15px 0' }}>
                  {personalSeleccionado.nombre || personalSeleccionado.usuario?.nombre || 'Sin nombre'}
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '18px 30px',
                    fontSize: '16px',
                    lineHeight: '1.5'
                  }}
                >
                  <div>
                    <strong>RUT:</strong>
                    <div>{obtenerRut(personalSeleccionado)}</div>
                  </div>

                  <div>
                    <strong>Rol:</strong>
                    <div>{obtenerRol(personalSeleccionado)}</div>
                  </div>

                  <div>
                    <strong>Teléfono:</strong>
                    <div>{personalSeleccionado.fono || 'No especificado'}</div>
                  </div>

                  <div>
                    <strong>Disponibilidad:</strong>
                    <div>
                      {personalSeleccionado.disponibilidad || 'No especificada'}
                    </div>
                  </div>

                  <div>
                    <strong>Talla de uniforme:</strong>
                    <div>{personalSeleccionado.tallaDeRopa || 'No especificada'}</div>
                  </div>

                  <div>
                    <strong>Evaluación de desempeño:</strong>
                    <div>
                      {personalSeleccionado.evaluacionDesempeno || 'Sin calificar'}
                    </div>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Experiencia:</strong>
                    <div>{personalSeleccionado.experiencia || 'Sin registrar'}</div>
                  </div>
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

      <ModalPersonalEventual
        isOpen={mostrarModal}
        personalSeleccionado={personalSeleccionado}
        onClose={() => setMostrarModal(false)}
        onGuardar={handleGuardarNuevoPersonal}
      />
    </div>
  );
}