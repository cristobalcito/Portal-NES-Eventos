// frontend/src/components/SidebarComponente.jsx
// frontend/src/components/SidebarComponente.jsx
import React from 'react';
import { obtenerEstiloBoton } from '../servicios/sidebarServicio.js';

export default function Sidebar({ rutaActiva = '/catalogo', alSeleccionar, usuario }) {
  // Lista base de opciones para todos los usuarios
  const menuItems = [
    { nombre: 'Home', ruta: '/home' },
    { nombre: 'Gestionar eventos', ruta: '/eventos' },
    { nombre: 'Personal', ruta: '/personal' },
    { nombre: 'Inventario', ruta: '/inventario' },
    { nombre: 'Catálogo', ruta: '/catalogo' },
  ];

  // Si el usuario logueado es GERENTE_GENERAL, agregamos la opción exclusiva
  if (usuario?.rol === 'GERENTE_GENERAL') {
    menuItems.push({ nombre: 'Gestión de usuarios', ruta: '/usuarios' });
  }

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
      {/* Icono e información de usuario */}
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
        <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>
          {usuario?.nombre || '[Nombre de usuario]'}
        </p>
        {usuario?.rol && (
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
            {usuario.rol}
          </p>
        )}
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
                alSeleccionar(item.ruta);
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