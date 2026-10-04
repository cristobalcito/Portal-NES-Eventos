import React, { useState, useEffect } from 'react';
import TarjetaPlanComponente from '../components/tarjetaPlanComponente.jsx';
import BotonComponente from '../components/BotonComponente.jsx'; // Nuevo componente
import { obtenerPlanesBaseServicio } from '../servicios/catalogoServicio.js';

export default function CatalogoPagina() {
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const rolUsuario = localStorage.getItem('rol'); 
  const esGerenteGeneral = rolUsuario === 'GERENTE_GENERAL' || rolUsuario === 'GERENTE';

  useEffect(() => {
    obtenerPlanesBaseServicio()
      .then((datos) => {
        setPlanes(datos);
        setCargando(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Error al cargar las experiencias del catálogo.');
        setCargando(false);
      });
  }, []);

  const manejarNuevoPlan = () => {
    alert('Abrir modal/formulario para crear un nuevo Plan Base');
  };

  if (cargando) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Cargando catálogo de experiencias...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '2.5rem',
      padding: '2rem',
      overflowX: 'auto',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>

      {/* Tarjetas del Catálogo */}
      {planes.map((plan) => (
        <TarjetaPlanComponente
          key={plan.idPL}
          titulo={`Plan Base #${plan.idPL}`}
          precio={`$${plan.costoBase.toLocaleString('es-CL')}`}
          descripcion={plan.descripcion}
        />
      ))}

      {/* Botón flotante/circular usando BotonComponente */}
      {esGerenteGeneral && (
        <BotonComponente
          texto="+"
          variante="icono"
          onClick={manejarNuevoPlan}
        />
      )}
    </main>
  );
}