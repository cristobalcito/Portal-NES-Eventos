import React, { useEffect, useState } from 'react';
import {
  obtenerUsuarios,
  crearUsuario,
  modificarUsuario,
  eliminarUsuario
} from '../servicios/usuarioServicio';

const ROLES_DISPONIBLES = [
  { clave: 'GERENTE_GENERAL', etiqueta: 'Gerente General' },
  { clave: 'PERSONAL_OPERACIONES', etiqueta: 'Personal Operaciones' },
  { clave: 'CLIENTE', etiqueta: 'Cliente' },
  { clave: 'PERSONAL_EVENTUAL', etiqueta: 'Personal Eventual' }
];

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estado del formulario
  const [modoEdicion, setModoEdicion] = useState(false);
  const [rutEditar, setRutEditar] = useState(null);
  const [formulario, setFormulario] = useState({
    rut: '',
    nombre: '',
    email: '',
    password: '',
    rol: 'PERSONAL_OPERACIONES'
  });

  const cargarListaUsuarios = async () => {
    setCargando(true);
    try {
      const res = await obtenerUsuarios();
      if (res.exito) {
        setUsuarios(res.datos);
      }
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.mensaje || 'Error al cargar los usuarios.'
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarListaUsuarios();
  }, []);

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const limpiarFormulario = () => {
    setFormulario({
      rut: '',
      nombre: '',
      email: '',
      password: '',
      rol: 'PERSONAL_OPERACIONES'
    });
    setModoEdicion(false);
    setRutEditar(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    try {
      if (modoEdicion) {
        // Al modificar, enviamos el RUT original en la URL y los nuevos valores en el body
        const datosActualizar = {
          nombre: formulario.nombre,
          email: formulario.email,
          nuevoRut: formulario.rut, // Permite actualizar el RUT en la base de datos
          nuevoRol: formulario.rol
        };
        if (formulario.password) {
          datosActualizar.password = formulario.password;
        }

        const res = await modificarUsuario(rutEditar, datosActualizar);
        if (res.exito) {
          // Si el usuario editado es el mismo que inició sesión, actualizamos localStorage
          const usuarioSesion = JSON.parse(localStorage.getItem('usuario') || '{}');
          if (usuarioSesion.rut === rutEditar && res.datos) {
            localStorage.setItem('usuario', JSON.stringify(res.datos));
          }

          setMensaje({ tipo: 'exito', texto: 'Usuario actualizado con éxito.' });
          limpiarFormulario();
          cargarListaUsuarios();
        }
      } else {
        // Al crear requerimos todos los datos
        const res = await crearUsuario(formulario);
        if (res.exito) {
          setMensaje({ tipo: 'exito', texto: 'Usuario creado correctamente.' });
          limpiarFormulario();
          cargarListaUsuarios();
        }
      }
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.mensaje || 'Ocurrió un error al procesar la solicitud.'
      });
    }
  };

  const iniciarEdicion = (usuario) => {
    setModoEdicion(true);
    setRutEditar(usuario.rut);
    setFormulario({
      rut: usuario.rut, // El RUT ahora es totalmente editable
      nombre: usuario.nombre,
      email: usuario.email,
      password: '', // Se deja vacío a menos que se desee cambiar la clave
      rol: usuario.rol
    });
  };

  const handleEliminar = async (rut) => {
    if (!window.confirm(`¿Está seguro de eliminar al usuario con RUT: ${rut}?`)) {
      return;
    }

    try {
      const res = await eliminarUsuario(rut);
      if (res.exito) {
        setMensaje({ tipo: 'exito', texto: 'Usuario eliminado correctamente.' });
        cargarListaUsuarios();
      }
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.mensaje || 'Error al eliminar usuario.'
      });
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h2>Gestión de Cuentas y Usuarios</h2>
      <p style={{ color: '#666', marginTop: '-10px' }}>
        <em>Panel exclusivo de administración para Gerente General</em>
      </p>

      {mensaje.texto && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          backgroundColor: mensaje.tipo === 'error' ? '#f8d7da' : '#d4edda',
          color: mensaje.tipo === 'error' ? '#721c24' : '#155724',
          borderRadius: '6px',
          border: `1px solid ${mensaje.tipo === 'error' ? '#f5c6cb' : '#c3e6cb'}`
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Formulario de Creación / Edición */}
      <form onSubmit={handleSubmit} style={{
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h3 style={{ marginTop: 0 }}>
          {modoEdicion ? `Editar Usuario (RUT Actual: ${rutEditar})` : 'Crear Nuevo Usuario'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>RUT:</label>
            <input
              type="text"
              name="rut"
              value={formulario.rut}
              onChange={handleChange}
              required
              placeholder="12345678-9"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Nombre:</label>
            <input
              type="text"
              name="nombre"
              value={formulario.nombre}
              onChange={handleChange}
              required
              placeholder="Nombre completo"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Email:</label>
            <input
              type="email"
              name="email"
              value={formulario.email}
              onChange={handleChange}
              required
              placeholder="correo@ejemplo.com"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
              Contraseña {modoEdicion && <span style={{ fontWeight: 'normal', fontSize: '12px' }}>(dejar en blanco para no cambiar)</span>}:
            </label>
            <input
              type="password"
              name="password"
              value={formulario.password}
              onChange={handleChange}
              required={!modoEdicion}
              placeholder="******"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Rol asignado:</label>
            <select
              name="rol"
              value={formulario.rol}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            >
              {ROLES_DISPONIBLES.map((r) => (
                <option key={r.clave} value={r.clave}>
                  {r.etiqueta}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#734b75',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {modoEdicion ? 'Guardar Cambios' : 'Crear Usuario'}
          </button>
          {modoEdicion && (
            <button
              type="button"
              onClick={limpiarFormulario}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Tabla de Listado de Usuarios */}
      <h3>Usuarios Registrados</h3>
      {cargando ? (
        <p>Cargando lista de usuarios...</p>
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#523354', color: '#ffffff' }}>
                <th style={{ padding: '12px 16px' }}>RUT</th>
                <th style={{ padding: '12px 16px' }}>Nombre</th>
                <th style={{ padding: '12px 16px' }}>Email</th>
                <th style={{ padding: '12px 16px' }}>Rol</th>
                <th style={{ padding: '12px 16px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                usuarios.map((u, index) => (
                  <tr
                    key={u.rut}
                    style={{
                      borderBottom: '1px solid #eee',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>{u.rut}</td>
                    <td style={{ padding: '12px 16px' }}>{u.nombre}</td>
                    <td style={{ padding: '12px 16px' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: u.rol === 'GERENTE_GENERAL' ? '#d4edda' : '#e2e8f0',
                        color: u.rol === 'GERENTE_GENERAL' ? '#155724' : '#333333'
                      }}>
                        {u.rol}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => iniciarEdicion(u)}
                        style={{
                          marginRight: '8px',
                          padding: '6px 12px',
                          backgroundColor: '#ffc107',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(u.rut)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;