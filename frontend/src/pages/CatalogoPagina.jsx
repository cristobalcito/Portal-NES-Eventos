// frontend/src/pages/CatalogoPagina.jsx

import React, { useState, useEffect } from 'react';
import TarjetaPlanComponente from '../components/tarjetaPlanComponente.jsx';
import BotonComponente from '../components/BotonComponente.jsx';
import ModalNuevoPlanBase from '../components/ModalNuevoPlanBase.jsx';

// Importación modular de servicios
import { obtenerPlanesBaseServicio } from '../servicios/catalogoServicio.js';
import { crearPlanBaseServicio } from '../servicios/crearPlanBaseServicio.js';

export default function CatalogoPagina() {
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Verificación de rol desde localStorage
  const rolUsuario = localStorage.getItem('rol'); 
  const esGerenteGeneral = rolUsuario === 'GERENTE_GENERAL' || rolUsuario === 'GERENTE';

  const cargarPlanes = () => {
    setCargando(true);
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
  };

  useEffect(() => {
    cargarPlanes();
  }, []);

  const manejarGuardarNuevoPlan = async (nuevoPlanDatos) => {
    // Llama al servicio independiente POST
    const planCreado = await crearPlanBaseServicio(nuevoPlanDatos);
    // Agrega el nuevo plan al estado para refrescar la lista al instante
    setPlanes((planesPrevios) => [...planesPrevios, planCreado]);
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

      {/* Tarjetas de Planes Base */}
      {planes.map((plan) => (
        <TarjetaPlanComponente
          key={plan.idPL}
          titulo={`Plan Base #${plan.idPL}`}
          precio={`$${plan.costoBase.toLocaleString('es-CL')}`}
          descripcion={plan.descripcion}
        />
      ))}

      {/* Botón flotante exclusivo para el Gerente General */}
      {esGerenteGeneral && (
        <BotonComponente
          texto="+"
          variante="icono"
          onClick={() => setModalAbierto(true)}
        />
      )}

      {/* Modal para crear un nuevo Plan Base */}
      <ModalNuevoPlanBase
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        alGuardar={manejarGuardarNuevoPlan}
      />
    </main>
  );
}