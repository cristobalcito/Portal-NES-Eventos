import React, { useEffect, useState } from 'react';
import {
  BASE_URL,
  verificarPermisoGerente,
  obtenerVehiculos,
  obtenerOpcionesReserva,
  reservarVehiculo,
  cancelarReservaVehiculo,
  cambiarMantencionVehiculo,
  crearVehiculo,
  modificarVehiculo,
  eliminarVehiculo
} from '../servicios/vehiculoServicio';

const TIPOS_LICENCIA = [
  'Clase B',
  'Clase A2',
  'Clase A3',
  'Clase A4',
  'Clase A5',
  'Clase D'
];

const VehiculoPagina = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [esGerente, setEsGerente] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estados modal Crear / Editar vehículo
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [patenteOriginal, setPatenteOriginal] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [formulario, setFormulario] = useState({
    patente: '',
    tipoAuto: '',
    tipoLicencia: 'Clase B',
    revisionTecnica: null,
    antecedentes: null,
    permisoCirculacion: null
  });

  // Estados modal Reserva de vehículo
  const [mostrarModalReserva, setMostrarModalReserva] = useState(false);
  const [vehiculoAReservar, setVehiculoAReservar] = useState(null);
  const [conductores, setConductores] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [maxSinCosto, setMaxSinCosto] = useState(4);
  const [cargandoOpciones, setCargandoOpciones] = useState(false);
  const [enviandoReserva, setEnviandoReserva] = useState(false);
  const [formReserva, setFormReserva] = useState({
    conductorRut: '',
    planEspecificoId: '',
    costoAdicional: 50000
  });

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const resVehiculos = await obtenerVehiculos();
      if (resVehiculos.exito) {
        setVehiculos(resVehiculos.datos || []);
      }

      try {
        const resPermiso = await verificarPermisoGerente();
        setEsGerente(Boolean(resPermiso?.esGerente));
      } catch (_) {
        setEsGerente(false);
      }
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.mensaje || 'Error al cargar la flota de vehículos.'
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // --- Modal Crear / Editar Vehículo ---
  const abrirModalCrear = () => {
    setModoEdicion(false);
    setPatenteOriginal('');
    setFormulario({
      patente: '',
      tipoAuto: '',
      tipoLicencia: 'Clase B',
      revisionTecnica: null,
      antecedentes: null,
      permisoCirculacion: null
    });
    setMostrarModal(true);
  };

  const abrirModalEditar = (vehiculo) => {
    setModoEdicion(true);
    setPatenteOriginal(vehiculo.patente);
    setFormulario({
      patente: vehiculo.patente,
      tipoAuto: vehiculo.tipoAuto,
      tipoLicencia: vehiculo.tipoLicencia,
      revisionTecnica: null,
      antecedentes: null,
      permisoCirculacion: null
    });
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEnviando(false);
  };

  const handleGuardarVehiculo = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    setEnviando(true);

    try {
      if (modoEdicion) {
        const res = await modificarVehiculo(patenteOriginal, formulario);
        if (res.exito) {
          setMensaje({ tipo: 'exito', texto: 'Vehículo actualizado correctamente.' });
          cerrarModal();
          cargarDatos();
        }
      } else {
        const res = await crearVehiculo(formulario);
        if (res.exito) {
          setMensaje({ tipo: 'exito', texto: 'Vehículo registrado correctamente.' });
          cerrarModal();
          cargarDatos();
        }
      }
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.mensaje || 'No se pudo guardar el vehículo.'
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (patente) => {
    if (!window.confirm(`¿Estás seguro de eliminar el vehículo patente ${patente}?`)) {
      return;
    }

    try {
      const res = await eliminarVehiculo(patente);
      if (res.exito) {
        setMensaje({ tipo: 'exito', texto: 'Vehículo eliminado correctamente.' });
        cargarDatos();
      }
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.mensaje || 'Error al eliminar el vehículo.'
      });
    }
  };

  // --- Mantención de Vehículo ---
  const handleToggleMantencion = async (vehiculo) => {
    const accionTexto = vehiculo.enMantencion
      ? `¿Finalizar la mantención del vehículo ${vehiculo.patente} y habilitarlo para reservas?`
      : `¿Enviar el vehículo ${vehiculo.patente} a mantención? Mientras esté en mantención no se podrá reservar.`;

    if (!window.confirm(accionTexto)) return;

    setMensaje({ tipo: '', texto: '' });
    try {
      const res = await cambiarMantencionVehiculo(vehiculo.patente, !vehiculo.enMantencion);
      if (res.exito) {
        setMensaje({ tipo: 'exito', texto: res.mensaje });
        cargarDatos();
      }
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.mensaje || 'No se pudo cambiar el estado de mantención.'
      });
    }
  };

  // --- Modal Reservar Vehículo ---
  const abrirModalReserva = async (vehiculo) => {
    if (vehiculo.enMantencion) {
      setMensaje({
        tipo: 'error',
        texto: `El vehículo ${vehiculo.patente} se encuentra en mantención y no puede ser reservado.`
      });
      return;
    }

    setVehiculoAReservar(vehiculo);
    setMostrarModalReserva(true);
    setCargandoOpciones(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const res = await obtenerOpcionesReserva(vehiculo.patente);
      if (res.exito) {
        const listaConductores = res.datos.conductores || [];
        const listaEventos = res.datos.eventos || [];
        const limiteGratis = res.datos.maxVehiculosSinCosto || 4;
        const costoBaseExtra = res.datos.costoVehiculoAdicional || 50000;

        setMaxSinCosto(limiteGratis);
        setConductores(listaConductores);
        setEventos(listaEventos);
        setFormReserva({
          conductorRut: listaConductores[0]?.rut || '',
          planEspecificoId: listaEventos[0]?.idPE ? String(listaEventos[0].idPE) : '',
          costoAdicional: costoBaseExtra
        });
      }
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.mensaje || 'Error al cargar conductores y eventos.'
      });
    } finally {
      setCargandoOpciones(false);
    }
  };

  const cerrarModalReserva = () => {
    setMostrarModalReserva(false);
    setVehiculoAReservar(null);
    setEnviandoReserva(false);
  };

  const eventoSeleccionadoObj = eventos.find(
    (ev) => String(ev.idPE) === String(formReserva.planEspecificoId)
  );
  const superaLimiteGratuito =
    (eventoSeleccionadoObj?.vehiculosReservados || 0) >= maxSinCosto;

  const handleConfirmarReserva = async (e) => {
    e.preventDefault();
    if (!vehiculoAReservar) return;

    setEnviandoReserva(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const res = await reservarVehiculo(vehiculoAReservar.patente, {
        conductorRut: formReserva.conductorRut,
        planEspecificoId: Number(formReserva.planEspecificoId),
        costoAdicional: superaLimiteGratuito ? Number(formReserva.costoAdicional) : 0
      });

      if (res.exito) {
        setMensaje({
          tipo: 'exito',
          texto: res.mensaje || 'Vehículo reservado correctamente.'
        });
        cerrarModalReserva();
        cargarDatos();
      }
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.mensaje || 'No se pudo realizar la reserva.'
      });
    } finally {
      setEnviandoReserva(false);
    }
  };

  const handleLiberarReserva = async (reserva) => {
    if (
      !window.confirm(
        `¿Liberar la reserva del evento #${reserva.planEspecifico?.idPE} ("${reserva.planEspecifico?.descripcion}") asignada a ${reserva.conductor?.nombre}?`
      )
    ) {
      return;
    }

    try {
      const res = await cancelarReservaVehiculo(reserva.id);
      if (res.exito) {
        setMensaje({ tipo: 'exito', texto: res.mensaje || 'Reserva liberada correctamente.' });
        cargarDatos();
      }
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.mensaje || 'Error al liberar la reserva.'
      });
    }
  };

  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return '';
    return new Date(fechaIso).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const btnPillBase = {
    border: 'none',
    borderRadius: '9999px',
    padding: '7px 16px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.15s ease'
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: '#523354', margin: 0, fontSize: '1.8rem' }}>Gestión de Vehículos</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.95rem' }}>
            Control de flota, documentación y reservas para eventos (hasta {maxSinCosto} vehículos sin costo por evento)
          </p>
        </div>

        {esGerente && (
          <button
            onClick={abrirModalCrear}
            style={{
              backgroundColor: '#523354',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '9999px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(82, 51, 84, 0.25)'
            }}
          >
            + Agregar Vehículo
          </button>
        )}
      </div>

      {/* Alertas */}
      {mensaje.texto && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '1.25rem',
            borderRadius: '10px',
            backgroundColor: mensaje.tipo === 'error' ? '#fee2e2' : '#dcfce7',
            color: mensaje.tipo === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${mensaje.tipo === 'error' ? '#fecaca' : '#bbf7d0'}`,
            fontWeight: '500'
          }}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Tabla de vehículos */}
      {cargando ? (
        <p style={{ color: '#475569' }}>Cargando flota de vehículos...</p>
      ) : (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
            overflowX: 'auto'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: '#684369', color: '#ffffff' }}>
                <th style={{ padding: '15px 16px', fontWeight: '700' }}>Patente</th>
                <th style={{ padding: '15px 16px', fontWeight: '700' }}>Tipo de Auto</th>
                <th style={{ padding: '15px 16px', fontWeight: '700' }}>Licencia</th>
                <th style={{ padding: '15px 16px', fontWeight: '700' }}>Estado / Reservas</th>
                <th style={{ padding: '15px 16px', fontWeight: '700' }}>Documentos</th>
                <th style={{ padding: '15px 16px', fontWeight: '700' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', color: '#64748b' }}>
                    No hay vehículos registrados en la flota.
                  </td>
                </tr>
              ) : (
                vehiculos.map((v) => {
                  const reservasActivas = v.reservas || [];
                  return (
                    <tr
                      key={v.patente}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: v.enMantencion ? '#fffbeb' : '#ffffff'
                      }}
                    >
                      <td style={{ padding: '16px', fontWeight: '700', color: '#1e293b' }}>
                        {v.patente}
                      </td>
                      <td style={{ padding: '16px', color: '#334155' }}>{v.tipoAuto}</td>
                      <td style={{ padding: '16px', color: '#334155' }}>{v.tipoLicencia}</td>
                      <td style={{ padding: '16px' }}>
                        {v.enMantencion ? (
                          <span
                            style={{
                              backgroundColor: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontSize: '0.82rem',
                              fontWeight: '700',
                              display: 'inline-block'
                            }}
                          >
                            En Mantención
                          </span>
                        ) : reservasActivas.length === 0 ? (
                          <span style={{ color: '#16a34a', fontWeight: '700' }}>Disponible</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                            {reservasActivas.map((r) => (
                              <div
                                key={r.id}
                                style={{
                                  backgroundColor: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  color: '#1e40af',
                                  borderRadius: '8px',
                                  padding: '4px 10px',
                                  fontSize: '0.8rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>
                                  <strong>Evento #{r.planEspecifico?.idPE} - {r.planEspecifico?.descripcion}</strong> ({formatearFecha(r.planEspecifico?.fecha)}) — Chofer: <strong>{r.conductor?.nombre}</strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleLiberarReserva(r)}
                                  title="Liberar reserva"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#dc2626',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    padding: '0 4px'
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
                          {v.revisionTecnica ? (
                            <a
                              href={`${BASE_URL}${v.revisionTecnica}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#1d4ed8', fontWeight: '600', textDecoration: 'none' }}
                            >
                              Rev. Técnica
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Sin Rev.</span>
                          )}
                          <span style={{ color: '#cbd5e1' }}>|</span>
                          {v.antecedentes ? (
                            <a
                              href={`${BASE_URL}${v.antecedentes}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#1d4ed8', fontWeight: '600', textDecoration: 'none' }}
                            >
                              Antecedentes
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Sin Antec.</span>
                          )}
                          <span style={{ color: '#cbd5e1' }}>|</span>
                          {v.permisoCirculacion ? (
                            <a
                              href={`${BASE_URL}${v.permisoCirculacion}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#1d4ed8', fontWeight: '600', textDecoration: 'none' }}
                            >
                              Permiso Circ.
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Sin Permiso</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            disabled={v.enMantencion}
                            onClick={() => abrirModalReserva(v)}
                            title={v.enMantencion ? 'Vehículo en mantención: no disponible para reservar' : 'Reservar vehículo'}
                            style={{
                              ...btnPillBase,
                              backgroundColor: v.enMantencion ? '#cbd5e1' : '#1d4ed8',
                              color: v.enMantencion ? '#64748b' : '#ffffff',
                              cursor: v.enMantencion ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Reservar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleMantencion(v)}
                            style={{
                              ...btnPillBase,
                              backgroundColor: v.enMantencion ? '#dcfce7' : '#fef3c7',
                              color: v.enMantencion ? '#166534' : '#b45309'
                            }}
                          >
                            {v.enMantencion ? 'Finalizar Mant.' : 'Mantención'}
                          </button>

                          {esGerente && (
                            <>
                              <button
                                type="button"
                                onClick={() => abrirModalEditar(v)}
                                style={{
                                  ...btnPillBase,
                                  backgroundColor: '#e2e8f0',
                                  color: '#334155'
                                }}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminar(v.patente)}
                                style={{
                                  ...btnPillBase,
                                  backgroundColor: '#fee2e2',
                                  color: '#b91c1c'
                                }}
                              >
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: Reservar Vehículo */}
      {mostrarModalReserva && vehiculoAReservar && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              padding: '28px 32px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 20px 35px rgba(0, 0, 0, 0.2)'
            }}
          >
            <h2 style={{ color: '#1d4ed8', margin: '0 0 20px 0', fontSize: '1.45rem', fontWeight: '700' }}>
              Control de Disponibilidad y Reserva
            </h2>

            {cargandoOpciones ? (
              <p style={{ color: '#475569' }}>Cargando conductores y eventos disponibles...</p>
            ) : (
              <form onSubmit={handleConfirmarReserva}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontWeight: '700', color: '#0f172a', marginBottom: '8px', fontSize: '0.95rem' }}>
                    Seleccionar Persona a Conducir:
                  </label>
                  <select
                    value={formReserva.conductorRut}
                    onChange={(e) => setFormReserva({ ...formReserva, conductorRut: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      backgroundColor: '#ffffff',
                      color: '#1e293b',
                      boxSizing: 'border-box'
                    }}
                  >
                    {conductores.length === 0 ? (
                      <option value="">
                        No hay personal disponible con licencia {vehiculoAReservar.tipoLicencia}
                      </option>
                    ) : (
                      conductores.map((c) => (
                        <option key={c.rut} value={c.rut}>
                          {c.nombre} ({c.rut}) — Licencias: {c.licencias.join(', ')}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '700', color: '#0f172a', marginBottom: '8px', fontSize: '0.95rem' }}>
                    Seleccionar Evento:
                  </label>
                  <select
                    value={formReserva.planEspecificoId}
                    onChange={(e) => setFormReserva({ ...formReserva, planEspecificoId: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      backgroundColor: '#ffffff',
                      color: '#1e293b',
                      boxSizing: 'border-box'
                    }}
                  >
                    {eventos.length === 0 ? (
                      <option value="">No hay eventos disponibles</option>
                    ) : (
                      eventos.map((ev) => (
                        <option key={ev.idPE} value={ev.idPE}>
                          #{ev.idPE} - {ev.descripcion} ({formatearFecha(ev.fecha)}) [{ev.vehiculosReservados}/{maxSinCosto} vehículos sin costo]
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {superaLimiteGratuito && (
                  <div
                    style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      marginBottom: '22px'
                    }}
                  >
                    <p style={{ margin: '0 0 8px 0', color: '#92400e', fontSize: '0.88rem', fontWeight: '600' }}>
                      Este evento ya tiene {eventoSeleccionadoObj.vehiculosReservados} vehículos asignados (límite gratuito: {maxSinCosto}). Añadir este vehículo aumentará el costo total del evento:
                    </p>
                    <label style={{ display: 'block', fontWeight: '700', color: '#78350f', fontSize: '0.85rem', marginBottom: '4px' }}>
                      Monto adicional a sumar al evento ($):
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={formReserva.costoAdicional}
                      onChange={(e) => setFormReserva({ ...formReserva, costoAdicional: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #f59e0b',
                        fontSize: '0.95rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={cerrarModalReserva}
                    style={{
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '10px 22px',
                      backgroundColor: '#64748b',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviandoReserva || conductores.length === 0 || eventos.length === 0}
                    style={{
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '10px 24px',
                      backgroundColor: '#1d4ed8',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      opacity: enviandoReserva ? 0.7 : 1
                    }}
                  >
                    {enviandoReserva ? 'Reservando...' : 'Verificar y Reservar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Crear / Editar Vehículo */}
      {mostrarModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 35px rgba(0, 0, 0, 0.2)'
            }}
          >
            <h2 style={{ color: '#523354', margin: '0 0 18px 0' }}>
              {modoEdicion ? `Editar Vehículo (${patenteOriginal})` : 'Registrar Nuevo Vehículo'}
            </h2>

            <form onSubmit={handleGuardarVehiculo}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px' }}>Patente:</label>
                <input
                  type="text"
                  value={formulario.patente}
                  onChange={(e) => setFormulario({ ...formulario, patente: e.target.value.toUpperCase() })}
                  placeholder="Ej: BCDF12 o AB1234"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px' }}>Tipo de Auto:</label>
                <input
                  type="text"
                  value={formulario.tipoAuto}
                  onChange={(e) => setFormulario({ ...formulario, tipoAuto: e.target.value })}
                  placeholder="Ej: Camioneta, Furgón, Camión 3/4"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px' }}>Tipo de Licencia Requerida:</label>
                <select
                  value={formulario.tipoLicencia}
                  onChange={(e) => setFormulario({ ...formulario, tipoLicencia: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                >
                  {TIPOS_LICENCIA.map((lic) => (
                    <option key={lic} value={lic}>
                      {lic}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px' }}>
                  Revisión Técnica (PDF o Imagen):
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setFormulario({ ...formulario, revisionTecnica: e.target.files[0] || null })}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px' }}>
                  Antecedentes / Padrón (PDF o Imagen):
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setFormulario({ ...formulario, antecedentes: e.target.files[0] || null })}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px' }}>
                  Permiso de Circulación (PDF o Imagen):
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setFormulario({ ...formulario, permisoCirculacion: e.target.files[0] || null })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={cerrarModal}
                  style={{
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '10px 20px',
                    backgroundColor: '#64748b',
                    color: '#ffffff',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  style={{
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '10px 22px',
                    backgroundColor: '#523354',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {enviando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiculoPagina;