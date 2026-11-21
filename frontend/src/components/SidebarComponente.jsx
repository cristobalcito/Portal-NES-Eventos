import React from 'react';
import { obtenerEstiloBoton } from '../servicios/sidebarServicio.js';

const ETIQUETAS_ROL = {
  GERENTE_GENERAL: 'Gerente General',
  PERSONAL_OPERACIONES: 'Personal de Operaciones',
  PERSONAL_EVENTUAL: 'Personal Eventual',
  CLIENTE: 'Cliente',
};

export default function Sidebar({ rutaActiva = '/home', alSeleccionar, usuario }) {
  const esCliente = usuario?.rol === 'CLIENTE';

  const menuItems = esCliente
    ? [
        { nombre: 'Home', ruta: '/home' },
        { nombre: 'Catálogo', ruta: '/catalogo' },
      ]
    : [
        { nombre: 'Home', ruta: '/home' },
        { nombre: 'Gestionar eventos', ruta: '/eventos' },
        { nombre: 'Personal', ruta: '/personal' },
        { nombre: 'Inventario', ruta: '/inventario' },
        { nombre: 'Estado de equipos', ruta: '/estado-equipos' },
        { nombre: 'Mantenciones', ruta: '/mantenciones' },
        { nombre: 'Equipos arrendados', ruta: '/arrendados' },
        { nombre: 'Catálogo', ruta: '/catalogo' },
      ];

  if (usuario?.rol === 'GERENTE_GENERAL') {
    menuItems.push({ nombre: 'Gestión de usuarios', ruta: '/usuarios' });
  }

  const inicialUsuario = (usuario?.nombre || 'U').charAt(0).toUpperCase();
  const etiquetaRol = ETIQUETAS_ROL[usuario?.rol] || usuario?.rol || '';

  return (
    <aside style={{
      width: '250px',
      background: 'linear-gradient(180deg, #523354 0%, #734b75 100%)',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      boxSizing: 'border-box',
      boxShadow: '4px 0 16px rgba(15, 23, 42, 0.08)'
    }}>
      <div style={{ textAlign: 'center', padding: '0 20px 22px', borderBottom: '1px solid rgba(255,255,255,0.16)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.14)',
          border: '2px solid rgba(255,255,255,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
          fontSize: '26px',
          fontWeight: 'bold',
          letterSpacing: '0.02em'
        }}>
          {inicialUsuario}
        </div>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>
          {usuario?.nombre || 'Usuario'}
        </p>
        {etiquetaRol && (
          <span style={{
            display: 'inline-block',
            marginTop: '6px',
            padding: '3px 10px',
            borderRadius: '999px',
            backgroundColor: 'rgba(255,255,255,0.16)',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.02em'
          }}>
            {etiquetaRol}
          </span>
        )}
      </div>

      <nav style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
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