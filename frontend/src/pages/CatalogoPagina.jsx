import React from 'react';
import SideBarComponente from '../components/SidebarComponente';
import TarjetaExperiencia from '../components/tarjetaPlanComponente';

const EXPERIENCIAS_MOCK = [
  {
    id: 1,
    titulo: 'Experiencia Íntima',
    precio: 'Lorem ipsum...',
    descripcion: 'Lorem ipsum dolor sit amet consectetur adipiscing elit auctor cras et, cursus semper id viverra interdum netus potenti condimentum mattis vitae, sollicitudin dictumst montes aliquet hac blandit egestas sociis nisi. Mus facilisis vulputate curae suscipit aenean rhoncus vehicula.'
  },
  {
    id: 2,
    titulo: 'Experiencia Premium',
    precio: 'Lorem ipsum...',
    descripcion: 'Lorem ipsum dolor sit amet consectetur adipiscing elit auctor cras et, cursus semper id viverra interdum netus potenti condimentum mattis vitae, sollicitudin dictumst montes aliquet hac blandit egestas sociis nisi. Mus facilisis vulputate curae suscipit aenean rhoncus vehicula.'
  },
  {
    id: 3,
    titulo: 'Experiencia Estelar',
    precio: 'Lorem ipsum...',
    descripcion: 'Lorem ipsum dolor sit amet consectetur adipiscing elit auctor cras et, cursus semper id viverra interdum netus potenti condimentum mattis vitae, sollicitudin dictumst montes aliquet hac blandit egestas sociis nisi. Mus facilisis vulputate curae suscipit aenean rhoncus vehicula.'
  }
];

export default function CatalogoPagina() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e2e8f0' }}>
      <SideBarComponente />

      <main style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '2.5rem',
        padding: '2rem',
        flexWrap: 'wrap'
      }}>
        {EXPERIENCIAS_MOCK.map((exp) => (
          <TarjetaExperiencia
            key={exp.id}
            titulo={exp.titulo}
            precio={exp.precio}
            descripcion={exp.descripcion}
          />
        ))}
      </main>
    </div>
  );
}