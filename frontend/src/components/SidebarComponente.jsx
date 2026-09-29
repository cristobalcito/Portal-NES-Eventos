// frontend/src/components/SidebarComponente.jsx
import React from 'react';
import { obtenerEstiloBoton } from '../servicios/sidebarServicio.js';

export default function Sidebar({ rutaActiva = '/catalogo', alSeleccionar }) {
  const menuItems = [
    { nombre: 'Home', ruta: '/home' },
    { nombre: 'Gestionar eventos', ruta: '/eventos' },
    { nombre: 'Personal', ruta: '/personal' },
    { nombre: 'Inventario', ruta: '/inventario' },
    { nombre: 'Catálogo', ruta: '/catalogo' },
  ];

  return (
    <aside style={{
      width: '240px',
      backgroundColor: '#734b75',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      boxSizing: 'border-box'
    }}>
      {/* Icono de usuario */}
      <div style={{ textAlign: 'center', padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#523354',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
          fontSize: '34px'
        }}>

          👤
        </div>
        <p style={{ margin: 0, fontSize: '15px' }}>[Nombre de usuario]</p>
      </div>

      {/* Menú de navegación */}
      <nav style={{ marginTop: '16px', display: 'flex', flexDirection: 'column' }}>
        {menuItems.map((item) => (
          <a
            key={item.nombre}
            href={item.ruta}
            onClick={(e) => {
              if (alSeleccionar) {
                e.preventDefault();
                alSeleccionar(item.nombre);
              }
            }}
            style={obtenerEstiloBoton(item.ruta, rutaActiva)}
          >
            {item.nombre}
          </a>
        ))}
      </nav>
    </aside>
  );
}