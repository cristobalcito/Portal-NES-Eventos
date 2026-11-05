import React, { useState, useEffect } from 'react';
import TarjetaPlanComponente from '../components/tarjetaPlanComponente.jsx';
import VentanaEmergenteCatalogoComponente from '../components/ventanaEmergenteCatalogoComponente.jsx';

import { obtenerPlanesBaseServicio, modificarPlanBaseServicio } from '../servicios/catalogoServicio.js';

export default function CatalogoPagina() {
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  // Modificado: Ahora controlamos la edición de un plan específico
  const [modalAbierto, setModalAbierto] = useState(false);
  const [planAEditar, setPlanAEditar] = useState(null);

  // 1. Extraer los datos del usuario desde localStorage
  let esGerenteGeneral = false;
  try {
    const usuarioRaw = localStorage.getItem('usuario');
    if (usuarioRaw) {
      const usuario = JSON.parse(usuarioRaw);
      const nombre = (usuario.nombre || '').toLowerCase();
      const email = (usuario.email || '').toLowerCase();
      const rol = (usuario.rol || '').toUpperCase();

      esGerenteGeneral = rol === 'GERENTE_GENERAL' || nombre.includes('gerente') || email.includes('gerente');
    }
  } catch (e) {
    console.error('Error al leer sesión:', e);
  }

  useEffect(() => {
    obtenerPlanesBaseServicio()
      .then((respuesta) => {
        // Soporta respuesta en array directo o con wrapper { datos: [] }
        const lista = respuesta.datos || respuesta;
        setPlanes(Array.isArray(lista) ? lista.slice(0, 3) : []);
        setCargando(false);
      })
      .catch((err) => {
        console.error('Error al obtener planes:', err);
        setError('Error al cargar las experiencias del catálogo.');
        setCargando(false);
      });
  }, []);

  const abrirModalEditar = (plan) => {
    setPlanAEditar(plan);
    setModalAbierto(true);
  };

  const manejarGuardarEdicion = async (datosActualizados) => {
    if (!planAEditar) return;

    try {
      const idPlan = planAEditar.idPL || planAEditar.id;
      const respuesta = await modificarPlanBaseServicio(idPlan, datosActualizados);
      
      const planModificado = respuesta.datos || respuesta;

      // Actualiza la tarjeta correspondiente en el estado local
      setPlanes((planesPrevios) =>
        planesPrevios.map((p) =>
          (p.idPL || p.id) === idPlan ? { ...p, ...planModificado } : p
        )
      );

      setModalAbierto(false);
      setPlanAEditar(null);
    } catch (err) {
      console.error('Error al guardar las modificaciones:', err);
      alert('Ocurrió un error al actualizar el plan base.');
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
      alignItems: 'stretch',
      gap: '2.5rem',
      padding: '2rem',
      minHeight: '80vh',
      boxSizing: 'border-box'
    }}>
      {planes.length > 0 ? (
        planes.map((plan, index) => (
          <div 
            key={plan.idPL || plan.id || index}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <TarjetaPlanComponente
              titulo={`Plan Base #${plan.idPL || plan.id || (index + 1)}`}
              precio={plan.costoBase ? `$${Number(plan.costoBase).toLocaleString('es-CL')}` : '$0'}
              descripcion={plan.descripcion || 'Sin descripción'}
            />

            {/* El botón de editar solo es visible para el Gerente General */}
            {esGerenteGeneral && (
              <button
                onClick={() => abrirModalEditar(plan)}
                style={{
                  marginTop: '1rem',
                  padding: '0.6rem 1.2rem',
                  backgroundColor: '#734b75',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Editar Plan #{index + 1}
              </button>
            )}
          </div>
        ))
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            No hay planes base registrados en la base de datos.
          </p>
        </div>
      )}

      {/* Modal para editar el plan base seleccionado */}
      <VentanaEmergenteCatalogoComponente
        abierto={modalAbierto}
        planActual={planAEditar}
        alCerrar={() => {
          setModalAbierto(false);
          setPlanAEditar(null);
        }}
        alGuardar={manejarGuardarEdicion}
      />
    </main>
  );
}