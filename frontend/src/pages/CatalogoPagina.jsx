import React, { useState, useEffect } from 'react';
import TarjetaPlanComponente from '../components/tarjetaPlanComponente.jsx';
import BotonComponente from '../components/BotonComponente.jsx';
import VentanaEmergenteCatalogoComponente from '../components/ventanaEmergenteCatalogoComponente.jsx';

import { obtenerPlanesBaseServicio } from '../servicios/catalogoServicio.js';
import { crearPlanBaseServicio } from '../servicios/crearPlanBaseServicio.js';

export default function CatalogoPagina() {
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  // 1. Extraer los datos del usuario desde localStorage
  let esGerenteGeneral = false;
  try {
    const usuarioRaw = localStorage.getItem('usuario');
    if (usuarioRaw) {
      const usuario = JSON.parse(usuarioRaw);
      // Valida por nombre o email según lo registrado en la sesión
      const nombre = (usuario.nombre || '').toLowerCase();
      const email = (usuario.email || '').toLowerCase();

      esGerenteGeneral = nombre.includes('gerente') || email.includes('gerente');
    }
  } catch (e) {
    console.error('Error al leer sesión:', e);
  }

  useEffect(() => {
    obtenerPlanesBaseServicio()
      .then((datos) => {
        setPlanes(Array.isArray(datos) ? datos : []);
        setCargando(false);
      })
      .catch((err) => {
        console.error('Error al obtener planes:', err);
        setError('Error al cargar las experiencias del catálogo.');
        setCargando(false);
      });
  }, []);

  const manejarGuardarNuevoPlan = async (nuevoPlanDatos) => {
    try {
      const planCreado = await crearPlanBaseServicio(nuevoPlanDatos);
      setPlanes((planesPrevios) => [...planesPrevios, planCreado]);
    } catch (err) {
      console.error('Error al guardar el plan base:', err);
      alert('Ocurrió un error al guardar el plan base.');
    }
  };

  if (cargando) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#333' }}>
        <h3>Cargando catálogo...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <h3>{error}</h3>
      </div>
    );
  }

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '2.5rem',
      padding: '2rem',
      minHeight: '80vh',
      boxSizing: 'border-box'
    }}>
      {planes.length > 0 ? (
        planes.map((plan) => (
          <TarjetaPlanComponente
            key={plan.idPL || plan.id || Math.random()}
            titulo={`Plan Base #${plan.idPL || plan.id || ''}`}
            precio={plan.costoBase ? `$${Number(plan.costoBase).toLocaleString('es-CL')}` : '$0'}
            descripcion={plan.descripcion || 'Sin descripción'}
          />
        ))
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            No hay planes base registrados en la base de datos.
          </p>
        </div>
      )}

      {/* Renderiza el botón + si el usuario es Gerente */}
      {esGerenteGeneral && (
        <BotonComponente
          texto="+"
          variante="icono"
          onClick={() => setModalAbierto(true)}
        />
      )}

      <VentanaEmergenteCatalogoComponente
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        alGuardar={manejarGuardarNuevoPlan}
      />
    </main>
  );
}