import React from 'react';
import Login from './Login';
import { useState } from 'react';
import { useEffect } from 'react';

function App() {

    const [usuario, setUsuario] = useState(null);

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        const token = localStorage.getItem('token');

        if(usuarioGuardado && token){
            try{
                setUsuario(JSON.parse(usuarioGuardado))
            }catch(e){
                localStorage.removeItem('usuario');
                localStorage.removeItem('token');
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setUsuario(null);
    };

    if(!usuario){
        return <Login onLoginSuccess={(user) => setUsuario(user)} />;
    }

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '1rem',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Portal NES Eventos</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>
            Hola, <strong>{usuario.nombre}</strong>
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main>
        <h3>Sesión iniciada correctamente</h3>
        <p>RUT: {usuario.rut}</p>
        <p>Email: {usuario.email}</p>
      </main>
    </div>
    );
}
