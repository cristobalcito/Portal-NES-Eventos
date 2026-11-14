import React, { useState, useEffect, useRef } from 'react';
import TarjetaPlanComponente from '../components/tarjetaPlanComponente.jsx';
import VentanaEmergenteCatalogoComponente from '../components/ventanaEmergenteCatalogoComponente.jsx';

import {
  obtenerPlanesBaseServicio,
  crearPlanBaseServicio,
  modificarPlanBaseServicio,
  eliminarPlanBaseServicio
} from '../servicios/catalogoServicio.js';

export default function CatalogoPagina() {
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [planAEditar, setPlanAEditar] = useState(null);

  // Referencia a la caja deslizante de planes
  const contenedorCarruselRef = useRef(null);

  // Extraer datos del usuario desde localStorage para validar rol
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

  const cargarPlanes = () => {
    setCargando(true);
    obtenerPlanesBaseServicio()
      .then((respuesta) => {
        const lista = respuesta.datos || respuesta;
        setPlanes(Array.isArray(lista) ? lista : []);
        setCargando(false);
      })
      .catch((err) => {
        console.error('Error al obtener planes:', err);
        setError('Error al cargar las experiencias del catálogo.');
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarPlanes();
  }, []);

  // Control de desplazamiento horizontal suave
  const desplazarCarrusel = (direccion) => {
    if (!contenedorCarruselRef.current) return;
    const distancia = 350;
    contenedorCarruselRef.current.scrollBy({
      left: direccion === 'izquierda' ? -distancia : distancia,
      behavior: 'smooth'
    });
  };

  const abrirModalCrear = () => {
    setPlanAEditar(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (plan) => {
    setPlanAEditar(plan);
    setModalAbierto(true);
  };

  const manejarGuardar = async (datosFormulario) => {
    if (planAEditar) {
      const idPlan = planAEditar.idPL || planAEditar.id;
      const respuesta = await modificarPlanBaseServicio(idPlan, datosFormulario);
      const planModificado = respuesta.datos || respuesta;

      setPlanes((planesPrevios) =>
        planesPrevios.map((p) =>
          (p.idPL || p.id) === idPlan ? { ...p, ...planModificado } : p
        )
      );
    } else {
      const respuesta = await crearPlanBaseServicio(datosFormulario);
      const nuevoPlan = respuesta.datos || respuesta;
      setPlanes((planesPrevios) => [...planesPrevios, nuevoPlan]);

      // Desplazar automáticamente al final para ver el plan recién creado
      setTimeout(() => {
        if (contenedorCarruselRef.current) {
          contenedorCarruselRef.current.scrollTo({
            left: contenedorCarruselRef.current.scrollWidth,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  const manejarEliminar = async (plan) => {
    const idPlan = plan.idPL || plan.id;
    if (!window.confirm(`¿Estás seguro de eliminar el Plan Base #${idPlan}?`)) return;

    try {
      await eliminarPlanBaseServicio(idPlan);
      setPlanes((planesPrevios) =>
        planesPrevios.filter((p) => (p.idPL || p.id) !== idPlan)
      );
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el plan base.');
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
      width: '100%',
      padding: '2rem',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh'
    }}>
      {/* Encabezado y Botón Agregar */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#523354', fontSize: '1.8rem' }}>Catálogo de Planes Base</h1>
          <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            {planes.length} {planes.length === 1 ? 'plan disponible' : 'planes disponibles'}
          </span>
        </div>
        
        {esGerenteGeneral && (
          <button
            onClick={abrirModalCrear}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#523354',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.95rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
          >
            + Agregar Nuevo Plan
          </button>
        )}
      </div>

      {/* Caja Contenedora con Botones Deslizantes */}
      {planes.length > 0 ? (
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1200px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.5rem 3.5rem',
          boxSizing: 'border-box',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)'
        }}>
          {/* Botón Deslizar Izquierda */}
          <button
            type="button"
            onClick={() => desplazarCarrusel('izquierda')}
            aria-label="Deslizar planes a la izquierda"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#523354',
              color: '#ffffff',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ◀
          </button>

          {/* Pista Horizontal Deslizable */}
          <div
            ref={contenedorCarruselRef}
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              alignItems: 'stretch',
              gap: '2rem',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              paddingBottom: '0.75rem'
            }}
          >
            {planes.map((plan, index) => {
              const idPlan = plan.idPL || plan.id || (index + 1);
              return (
                <div 
                  key={idPlan}
                  style={{ 
                    flex: '0 0 auto',
                    width: 'fit-content',
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between'
                  }}
                >
                  <TarjetaPlanComponente
                    titulo={`Plan Base #${idPlan}`}
                    precio={plan.costoBase !== undefined ? `$${Number(plan.costoBase).toLocaleString('es-CL')}` : '$0'}
                    descripcion={plan.descripcion || 'Sin descripción'}
                  />

                  {esGerenteGeneral && (
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem', 
                      marginTop: '0.75rem',
                      width: '100%'
                    }}>
                      <button
                        onClick={() => abrirModalEditar(plan)}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.25rem',
                          backgroundColor: '#734b75',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => manejarEliminar(plan)}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.25rem',
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botón Deslizar Derecha */}
          <button
            type="button"
            onClick={() => desplazarCarrusel('derecha')}
            aria-label="Deslizar planes a la derecha"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#523354',
              color: '#ffffff',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ▶
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px' }}>
          <p style={{ color: '#666', fontSize: '1.1rem', margin: 0 }}>
            No hay planes base registrados en la base de datos.
          </p>
        </div>
      )}

      <VentanaEmergenteCatalogoComponente
        abierto={modalAbierto}
        planActual={planAEditar}
        alCerrar={() => {
          setModalAbierto(false);
          setPlanAEditar(null);
        }}
        alGuardar={manejarGuardar}
      />
    </main>
  );
}