import React, { useState, useEffect } from 'react';
import ModalPersonalEventual from '../components/ModalPersonalEventual';

export default function PersonalPagina() {
  const [personal, setPersonal] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [personalSeleccionado, setPersonalSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  // Estados modal asignacion
  const [mostrarModalAsignar, setMostrarModalAsignar] = useState(false);
  const [eventoSeleccionadoId, setEventoSeleccionadoId] = useState('');
  const [rolAsignadoInput, setRolAsignadoInput] = useState('Operativo');
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

  const cargarPersonal = () => {
    setCargando(true);
    fetch(`${API_URL}/api/personal`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    })
      .then(async (respuesta) => {
        const datos = await respuesta.json();
        if (!respuesta.ok) {
          throw new Error(datos.error || 'No se pudo cargar el personal.');
        }
        return Array.isArray(datos) ? datos : (datos.datos || []);
      })
      .then((datos) => {
        setPersonal(datos);
        if (datos.length > 0 && !personalSeleccionado) {
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

  const cargarEventos = () => {
    fetch(`${API_URL}/api/eventos`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data.datos || []);
      })
      .then((lista) => setEventos(lista))
      .catch(() => setEventos([]));
  };

  useEffect(() => {
    cargarPersonal();
    cargarEventos();
  }, []);

  const personalFiltrado = personal.filter((p) => {
    const termino = busqueda.toLowerCase().trim();
    const nombre = (p.nombre || p.Nombre || p.usuario?.nombre || '').toLowerCase();
    const rol = obtenerRol(p).toLowerCase();
    const rut = obtenerRut(p).toLowerCase();

    return nombre.includes(termino) || rol.includes(termino) || rut.includes(termino);
  });

  const handleEditar = (p) => {
    setPersonalSeleccionado(p);
    setMostrarModal(true);
  };

  const handleAbrirAsignar = (p) => {
    setPersonalSeleccionado(p);
    setRolAsignadoInput(p.rol || 'Operativo');
    setEventoSeleccionadoId('');
    setMostrarModalAsignar(true);
  };

  const handleConfirmarAsignacion = async (e) => {
    e.preventDefault();
    if (!personalSeleccionado || !eventoSeleccionadoId) {
      alert('Selecciona un evento para realizar la asignacion.');
      return;
    }

    try {
      setGuardandoAsignacion(true);
      const rutTrabajador = obtenerRut(personalSeleccionado);
      const respuesta = await fetch(`${API_URL}/api/personal/asignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          rut: rutTrabajador,
          idPE: eventoSeleccionadoId,
          rolAsignado: rolAsignadoInput
        })
      });

      const resultado = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(resultado.error || resultado.mensaje || 'Error al asignar el personal.');
      }

      setMensajeExito(resultado.mensaje || 'Personal asignado correctamente.');
      setTimeout(() => setMensajeExito(''), 4000);
      setMostrarModalAsignar(false);
      cargarPersonal();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardandoAsignacion(false);
    }
  };

  const handleEliminar = async (p) => {
    const rutAEliminar = obtenerRut(p);
    const nombre = p.nombre || p.Nombre || p.usuario?.nombre || 'este trabajador';
    const usuarioSesion = JSON.parse(localStorage.getItem('usuario') || '{}');

    if (!window.confirm(`Esta seguro de que desea eliminar a ${nombre} (RUT: ${rutAEliminar})?`)) {
      return;
    }

    try {
      const respuesta = await fetch(`${API_URL}/api/usuarios/${encodeURIComponent(rutAEliminar)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'x-usuario-rut': usuarioSesion.rut || ''
        }
      });

      const resultado = await respuesta.json();
      if (!respuesta.ok || (!resultado.exito && !resultado.success)) {
        throw new Error(resultado.mensaje || 'Error al eliminar el trabajador.');
      }

      alert('Trabajador eliminado correctamente de la base de datos.');
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

  const handleGuardarNuevoPersonal = async (formulario) => {
    if (!personalSeleccionado) {
      alert('Primero debes seleccionar un trabajador.');
      return;
    }

    try {
      const rutTrabajador = obtenerRut(personalSeleccionado);
      const usuarioSesion = JSON.parse(localStorage.getItem('usuario') || '{}');

      const respuesta = await fetch(
        `${API_URL}/api/personal-externo/${encodeURIComponent(rutTrabajador)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'x-usuario-rut': usuarioSesion.rut || ''
          },
          body: JSON.stringify(formulario)
        }
      );

      const resultado = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || resultado.error || 'Error al actualizar la ficha.');
      }

      alert('Ficha actualizada con exito.');
      cargarPersonal();
      setMostrarModal(false);
    } catch (error) {
      console.error('Error al actualizar personal eventual:', error);
      alert(error.message);
    }
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
            {busqueda && (
              <button 
                type="button"
                onClick={() => setBusqueda('')} 
                style={{ background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', color: '#888' }}
              >
                Limpiar
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
            <button 
              type="button"
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

        {mensajeExito && (
          <div style={{ backgroundColor: '#d1e7dd', color: '#0f5132', padding: '12px 20px', borderRadius: '15px', marginBottom: '15px', fontWeight: 'bold' }}>
            {mensajeExito}
          </div>
        )}

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
                  {p.nombre || p.Nombre || p.usuario?.nombre || 'Sin nombre'} | {obtenerRol(p)} | {p.estado || p.disponibilidad || 'Disponible'}
                </span>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    title="Asignar a evento"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAbrirAsignar(p);
                    }} 
                    style={{ backgroundColor: 'white', color: '#1e40af', border: 'none', borderRadius: '15px', padding: '5px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Asignar a Evento
                  </button>
                  <button 
                    title="Editar ficha"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditar(p);
                    }} 
                    style={{ backgroundColor: 'white', color: '#523354', border: 'none', borderRadius: '15px', padding: '5px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Editar
                  </button>
                  <button 
                    title="Eliminar usuario"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminar(p);
                    }} 
                    style={{ backgroundColor: 'white', color: '#c0392b', border: 'none', borderRadius: '15px', padding: '5px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Eliminar
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
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '28px', margin: '0 0 15px 0' }}>
                  {personalSeleccionado.nombre || personalSeleccionado.Nombre || personalSeleccionado.usuario?.nombre || 'Sin nombre'}
                </h2>
                <button
                  type="button"
                  onClick={() => handleAbrirAsignar(personalSeleccionado)}
                  style={{ backgroundColor: '#1e40af', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Asignar a Evento
                </button>
              </div>

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
                  <strong>Rol Base:</strong>
                  <div>{obtenerRol(personalSeleccionado)}</div>
                </div>

                <div>
                  <strong>Telefono:</strong>
                  <div>{personalSeleccionado.fono || personalSeleccionado.telefono || 'No especificado'}</div>
                </div>

                <div>
                  <strong>Estado / Disponibilidad:</strong>
                  <div>
                    {personalSeleccionado.estado || personalSeleccionado.disponibilidad || 'No especificada'}
                  </div>
                </div>

                <div>
                  <strong>Talla de uniforme:</strong>
                  <div>{personalSeleccionado.tallaDeRopa || 'No especificada'}</div>
                </div>

                <div>
                  <strong>Evaluacion de desempeno:</strong>
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

      {/* Modal Asignar a Evento */}
      {mostrarModalAsignar && personalSeleccionado && (
        <div
          onClick={() => !guardandoAsignacion && setMostrarModalAsignar(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '450px',
              padding: '25px 30px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', boxSizing: 'border-box'
            }}
          >
            <h2 style={{ margin: '0 0 10px 0', color: '#1e40af', fontSize: '22px' }}>Asignar a Evento</h2>
            <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>
              Trabajador: <strong>{personalSeleccionado.nombre || obtenerRut(personalSeleccionado)}</strong>
            </p>

            <form onSubmit={handleConfirmarAsignacion}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                  Seleccionar Evento:
                </label>
                <select
                  value={eventoSeleccionadoId}
                  onChange={(e) => setEventoSeleccionadoId(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                >
                  <option value="">-- Selecciona un evento --</option>
                  {eventos.map((ev) => (
                    <option key={ev.idPE || ev.id} value={ev.idPE || ev.id}>
                      {ev.descripcion} ({ev.fecha ? new Date(ev.fecha).toLocaleDateString() : 'Sin fecha'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                  Rol en el Evento:
                </label>
                <input
                  type="text"
                  value={rolAsignadoInput}
                  onChange={(e) => setRolAsignadoInput(e.target.value)}
                  placeholder="Ej. Garzon, Chofer, Tecnico"
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMostrarModalAsignar(false)}
                  disabled={guardandoAsignacion}
                  style={{ backgroundColor: '#aaa', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoAsignacion}
                  style={{
                    backgroundColor: '#1e40af', color: 'white', border: 'none', padding: '10px 25px',
                    borderRadius: '20px', fontWeight: 'bold', cursor: guardandoAsignacion ? 'wait' : 'pointer',
                    opacity: guardandoAsignacion ? 0.7 : 1
                  }}
                >
                  {guardandoAsignacion ? 'Asignando...' : 'Confirmar Asignacion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}