import React, { useState, useEffect } from 'react';
import ModalPersonalEventual from '../components/ModalPersonalEventual';
import ModalWebpayComponente from '../components/ModalWebpayComponente.jsx';

export default function PersonalPagina() {
  const [personal, setPersonal] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [personalSeleccionado, setPersonalSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  // Estados modal asignacion
  const [mostrarModalAsignar, setMostrarModalAsignar] = useState(false);
  const [eventoSeleccionadoId, setEventoSeleccionadoId] = useState('');
  const [rolAsignadoInput, setRolAsignadoInput] = useState('Operativo');
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  // Estados para pago individual de sueldo
  const [trabajadorAPagar, setTrabajadorAPagar] = useState(null);
  const [montoSueldoInput, setMontoSueldoInput] = useState('450000');

  // Estados para pago masivo ("Pagar a todos")
  const [modalPagoMasivoAbierto, setModalPagoMasivoAbierto] = useState(false);
  const [simularFechaHabilitada, setSimularFechaHabilitada] = useState(false);
  const [sueldosBaseMasivos, setSueldosBaseMasivos] = useState({}); // { [rut]: 450000 }

  // Estado compartido para Webpay
  const [modalWebpayAbierto, setModalWebpayAbierto] = useState(false);
  const [configWebpay, setConfigWebpay] = useState({
    modo: 'INDIVIDUAL', // 'INDIVIDUAL' | 'MASIVO'
    monto: 0,
    concepto: ''
  });
  const [sueldosPagados, setSueldosPagados] = useState({}); // { [rut]: { comprobante, detalle } }

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Validar si el usuario logueado es Gerente General o Jefe de Operaciones
  let puedePagarSueldos = false;
  try {
    const usuarioRaw = localStorage.getItem('usuario');
    if (usuarioRaw) {
      const usuario = JSON.parse(usuarioRaw);
      const rol = (usuario.rol || '').toUpperCase();
      const nombre = (usuario.nombre || '').toLowerCase();
      puedePagarSueldos =
        rol === 'GERENTE_GENERAL' ||
        rol === 'JEFE_OPERACIONES' ||
        rol === 'PERSONAL_OPERACIONES' ||
        nombre.includes('gerente') ||
        nombre.includes('jefe');
    }
  } catch (e) {
    console.error('Error al leer rol de sesión:', e);
  }

  // Verificar si hoy es principio (días 1-5) o fin de mes (últimos 5 días del mes)
  const verificarPeriodoPago = () => {
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();

    const esPrincipioDeMes = diaActual >= 1 && diaActual <= 5;
    const esFinDeMes = diaActual >= ultimoDiaMes - 4;

    return {
      habilitado: esPrincipioDeMes || esFinDeMes || simularFechaHabilitada,
      diaActual,
      ultimoDiaMes,
      fechaTexto: hoy.toLocaleDateString('es-CL')
    };
  };

  const obtenerRut = (p) => {
    if (!p) return 'No especificado';
    return (
      p.rut ||
      p.Rut ||
      p.RUT ||
      p.rutPersona ||
      p.usuario?.rut ||
      p.usuario?.Rut ||
      'No especificado'
    );
  };

  const obtenerNombre = (p) => {
    if (!p) return 'Sin nombre';
    return p.nombre || p.Nombre || p.usuario?.nombre || 'Sin nombre';
  };

  const obtenerRol = (p) => {
    if (!p) return 'No especificado';
    return (
      p.rol ||
      p.Rol ||
      p.ROL ||
      p.tipoPersona ||
      p.usuario?.rol ||
      'No especificado'
    );
  };

  // Calcular en cuántos eventos participó un trabajador
  const contarEventosParticipados = (trabajador) => {
    if (!trabajador) return 0;

    // Si el backend ya devuelve un arreglo de eventos o asignaciones en el objeto del trabajador
    if (Array.isArray(trabajador.eventos)) return trabajador.eventos.length;
    if (Array.isArray(trabajador.asignaciones)) return trabajador.asignaciones.length;

    const nombreTrabajador = obtenerNombre(trabajador).toLowerCase().trim();
    const rutTrabajador = obtenerRut(trabajador).toLowerCase().trim();

    if (!Array.isArray(eventos) || eventos.length === 0) return 0;

    return eventos.filter((ev) => {
      const campoPersonal = (ev.personal || '').toLowerCase();
      const coincideTexto =
        (nombreTrabajador && nombreTrabajador !== 'sin nombre' && campoPersonal.includes(nombreTrabajador)) ||
        (rutTrabajador && rutTrabajador !== 'no especificado' && campoPersonal.includes(rutTrabajador));

      const coincideLista =
        Array.isArray(ev.trabajadores) &&
        ev.trabajadores.some((t) => (t.rut || t).toString().toLowerCase() === rutTrabajador);

      return coincideTexto || coincideLista;
    }).length;
  };

  // Calcular sueldo base + bono del 3% por cada evento participado
  const calcularLiquidacion = (trabajador, sueldoBaseRaw) => {
    const sueldoBase = Math.max(0, Number(sueldoBaseRaw) || 0);
    const cantEventos = contarEventosParticipados(trabajador);
    const porcentajeBono = cantEventos * 3; // 3% por evento
    const montoBono = Math.round(sueldoBase * (porcentajeBono / 100));
    const totalAPagar = sueldoBase + montoBono;

    return {
      sueldoBase,
      cantEventos,
      porcentajeBono,
      montoBono,
      totalAPagar
    };
  };

  const cargarPersonal = () => {
    setCargando(true);
    fetch(`${API_URL}/api/personal`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    })
      .then(async (respuesta) => {
        const datos = await respuesta.json();
        if (!respuesta.ok) {
          throw new Error(datos.error || 'No se pudo cargar el personal.');
        }
        return Array.isArray(datos) ? datos : (datos.datos || []);
      })
      .then((datos) => {
        setPersonal(datos);
        if (datos.length > 0 && !personalSeleccionado) {
          setPersonalSeleccionado(datos[0]);
        }
      })
      .catch((errorCarga) => {
        console.error('Error al cargar personal:', errorCarga);
        setError(errorCarga.message);
        setPersonal([]);
      })
      .finally(() => setCargando(false));
  };

  const cargarEventos = () => {
    fetch(`${API_URL}/api/eventos`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data.datos || []);
      })
      .then((lista) => setEventos(lista))
      .catch(() => setEventos([]));
  };

  useEffect(() => {
    cargarPersonal();
    cargarEventos();
  }, []);

  const personalFiltrado = personal.filter((p) => {
    const termino = busqueda.toLowerCase().trim();
    const nombre = obtenerNombre(p).toLowerCase();
    const rol = obtenerRol(p).toLowerCase();
    const rut = obtenerRut(p).toLowerCase();

    return nombre.includes(termino) || rol.includes(termino) || rut.includes(termino);
  });

  const handleEditar = (p) => {
    setPersonalSeleccionado(p);
    setMostrarModal(true);
  };

  const handleAbrirAsignar = (p) => {
    setPersonalSeleccionado(p);
    setRolAsignadoInput(p.rol || 'Operativo');
    setEventoSeleccionadoId('');
    setMostrarModalAsignar(true);
  };

  // --- PAGO INDIVIDUAL ---
  const handleAbrirPagoSueldo = (p) => {
    if (!puedePagarSueldos) {
      alert('Acceso denegado: Solo el Gerente General o el Jefe de Operaciones pueden pagar sueldos.');
      return;
    }
    setPersonalSeleccionado(p);
    setTrabajadorAPagar(p);
    setMontoSueldoInput('450000');
  };

  const handleConfirmarMontoIndividualYWebpay = (e) => {
    e.preventDefault();
    if (!trabajadorAPagar) return;

    const liq = calcularLiquidacion(trabajadorAPagar, montoSueldoInput);
    if (liq.totalAPagar <= 0) {
      alert('Ingresa un monto de sueldo válido mayor a $0.');
      return;
    }

    setConfigWebpay({
      modo: 'INDIVIDUAL',
      monto: liq.totalAPagar,
      concepto: `Sueldo + Bono (${liq.cantEventos} ev.) - ${obtenerNombre(trabajadorAPagar)}`
    });
    setModalWebpayAbierto(true);
  };

  // --- PAGO MASIVO ("PAGAR A TODOS") ---
  const handleAbrirPagoMasivo = () => {
    if (!puedePagarSueldos) {
      alert('Acceso denegado: Solo el Gerente General o el Jefe de Operaciones pueden pagar sueldos.');
      return;
    }
    if (personal.length === 0) {
      alert('No hay trabajadores registrados para procesar el pago.');
      return;
    }

    // Inicializar sueldos base por defecto ($450.000) para cada trabajador
    const iniciales = {};
    personal.forEach((p) => {
      const rut = obtenerRut(p);
      iniciales[rut] = sueldosBaseMasivos[rut] ?? 450000;
    });
    setSueldosBaseMasivos(iniciales);
    setModalPagoMasivoAbierto(true);
  };

  const handleCambiarSueldoBaseMasivo = (rut, valor) => {
    setSueldosBaseMasivos((prev) => ({
      ...prev,
      [rut]: valor
    }));
  };

  const planillaMasiva = personal.map((p) => {
    const rut = obtenerRut(p);
    const nombre = obtenerNombre(p);
    const liq = calcularLiquidacion(p, sueldosBaseMasivos[rut] ?? 450000);
    return {
      trabajador: p,
      rut,
      nombre,
      ...liq
    };
  });

  const granTotalMasivo = planillaMasiva.reduce((acc, item) => acc + item.totalAPagar, 0);

  const handleConfirmarPagoMasivoYWebpay = () => {
    const estadoFecha = verificarPeriodoPago();
    if (!estadoFecha.habilitado) {
      alert(
        `El pago masivo ("Pagar a todos") solo está permitido a principios de mes (días 1 al 5) o a fin de mes (días ${estadoFecha.ultimoDiaMes - 4} al ${estadoFecha.ultimoDiaMes}).`
      );
      return;
    }

    if (granTotalMasivo <= 0) {
      alert('El monto total de la planilla debe ser mayor a $0.');
      return;
    }

    setConfigWebpay({
      modo: 'MASIVO',
      monto: granTotalMasivo,
      concepto: `Pago Planilla Mensual (${planillaMasiva.length} trabajadores + Bonos 3%/evento)`
    });
    setModalWebpayAbierto(true);
  };

  // --- CALLBACK AL COMPLETAR WEBPAY ---
  const handlePagoCompletado = (comprobante) => {
    if (configWebpay.modo === 'INDIVIDUAL' && trabajadorAPagar) {
      const rut = obtenerRut(trabajadorAPagar);
      const nombre = obtenerNombre(trabajadorAPagar);
      const liq = calcularLiquidacion(trabajadorAPagar, montoSueldoInput);

      setSueldosPagados((prev) => ({
        ...prev,
        [rut]: { comprobante, detalle: liq }
      }));

      setMensajeExito(
        `✅ Sueldo pagado a ${nombre}: Base $${liq.sueldoBase.toLocaleString('es-CL')} + Bono ${liq.porcentajeBono}% ($${liq.montoBono.toLocaleString('es-CL')} por ${liq.cantEventos} evento(s)) = $${liq.totalAPagar.toLocaleString('es-CL')} (Cód: ${comprobante.codigoAutorizacion}).`
      );
      setTimeout(() => setMensajeExito(''), 7000);
    } else if (configWebpay.modo === 'MASIVO') {
      const nuevosPagados = { ...sueldosPagados };
      planillaMasiva.forEach((item) => {
        nuevosPagados[item.rut] = {
          comprobante,
          detalle: item
        };
      });
      setSueldosPagados(nuevosPagados);

      setMensajeExito(
        `✅ Pago masivo aprobado para ${planillaMasiva.length} trabajadores por un total de $${granTotalMasivo.toLocaleString('es-CL')} CLP (incluye bonos del 3% por evento). Cód: ${comprobante.codigoAutorizacion}.`
      );
      setTimeout(() => setMensajeExito(''), 8000);
    }
  };

  const handleConfirmarAsignacion = async (e) => {
    e.preventDefault();
    if (!personalSeleccionado || !eventoSeleccionadoId) {
      alert('Selecciona un evento para realizar la asignacion.');
      return;
    }

    try {
      setGuardandoAsignacion(true);
      const rutTrabajador = obtenerRut(personalSeleccionado);
      const respuesta = await fetch(`${API_URL}/api/personal/asignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          rut: rutTrabajador,
          idPE: eventoSeleccionadoId,
          rolAsignado: rolAsignadoInput
        })
      });

      const resultado = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(resultado.error || resultado.mensaje || 'Error al asignar el personal.');
      }

      setMensajeExito(resultado.mensaje || 'Personal asignado correctamente.');
      setTimeout(() => setMensajeExito(''), 4000);
      setMostrarModalAsignar(false);
      cargarPersonal();
      cargarEventos();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardandoAsignacion(false);
    }
  };

  const handleEliminar = async (p) => {
    const rutAEliminar = obtenerRut(p);
    const nombre = obtenerNombre(p);
    const usuarioSesion = JSON.parse(localStorage.getItem('usuario') || '{}');

    if (!window.confirm(`Esta seguro de que desea eliminar a ${nombre} (RUT: ${rutAEliminar})?`)) {
      return;
    }

    try {
      const respuesta = await fetch(`${API_URL}/api/usuarios/${encodeURIComponent(rutAEliminar)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'x-usuario-rut': usuarioSesion.rut || ''
        }
      });

      const resultado = await respuesta.json();
      if (!respuesta.ok || (!resultado.exito && !resultado.success)) {
        throw new Error(resultado.mensaje || 'Error al eliminar el trabajador.');
      }

      alert('Trabajador eliminado correctamente de la base de datos.');
      const nuevaLista = personal.filter((item) => obtenerRut(item) !== rutAEliminar);
      setPersonal(nuevaLista);

      if (personalSeleccionado && obtenerRut(personalSeleccionado) === rutAEliminar) {
        setPersonalSeleccionado(nuevaLista[0] || null);
      }
    } catch (err) {
      console.error('Error al eliminar personal:', err);
      alert(err.message);
    }
  };

  const handleGuardarNuevoPersonal = async (formulario) => {
    if (!personalSeleccionado) {
      alert('Primero debes seleccionar un trabajador.');
      return;
    }

    try {
      const rutTrabajador = obtenerRut(personalSeleccionado);
      const usuarioSesion = JSON.parse(localStorage.getItem('usuario') || '{}');

      const respuesta = await fetch(
        `${API_URL}/api/personal-externo/${encodeURIComponent(rutTrabajador)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'x-usuario-rut': usuarioSesion.rut || ''
          },
          body: JSON.stringify(formulario)
        }
      );

      const resultado = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || resultado.error || 'Error al actualizar la ficha.');
      }

      alert('Ficha actualizada con exito.');
      cargarPersonal();
      setMostrarModal(false);
    } catch (error) {
      console.error('Error al actualizar personal eventual:', error);
      alert(error.message);
    }
  };

  const estadoFechaActual = verificarPeriodoPago();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e5e5e5', fontFamily: 'sans-serif' }}>
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px' }}>
        
        {/* Barra superior */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          
          <div style={{ 
            flex: 1, 
            minWidth: '250px',
            maxWidth: '600px', 
            backgroundColor: 'white', 
            borderRadius: '25px', 
            display: 'flex', 
            alignItems: 'center', 
            padding: '10px 20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <input 
              type="text" 
              placeholder="Buscar persona..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ 
                flex: 1, 
                border: 'none', 
                outline: 'none', 
                textAlign: 'center', 
                fontStyle: 'italic', 
                color: '#333',
                fontSize: '16px'
              }} 
            />
            {busqueda && (
              <button 
                type="button"
                onClick={() => setBusqueda('')} 
                style={{ background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', color: '#888' }}
              >
                Limpiar
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {puedePagarSueldos && (
              <button 
                type="button"
                onClick={handleAbrirPagoMasivo}
                style={{ 
                  backgroundColor: '#15803d', color: 'white', border: 'none', 
                  padding: '10px 20px', fontSize: '14px', borderRadius: '25px', 
                  fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                💳 Pagar a todos (Fin/Principio de mes)
              </button>
            )}

            <button 
              type="button"
              onClick={() => {
                if (personalSeleccionado) {
                  setMostrarModal(true);
                } else {
                  alert('Selecciona una persona de la lista primero.');
                }
              }}
              style={{ 
                backgroundColor: '#8a5b96', color: 'white', border: 'none', 
                padding: '10px 18px', fontSize: '14px', borderRadius: '25px', 
                fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              Completar ficha laboral
            </button>
          </div>
        </div>

        {mensajeExito && (
          <div style={{ backgroundColor: '#d1e7dd', color: '#0f5132', padding: '12px 20px', borderRadius: '15px', marginBottom: '15px', fontWeight: 'bold' }}>
            {mensajeExito}
          </div>
        )}

        {/* Lista de Personal */}
        <div style={{ 
          backgroundColor: '#8a5b96', 
          padding: '20px', 
          border: '3px solid black', 
          flex: 1, 
          overflowY: 'auto',
          marginBottom: '20px'
        }}>
          {cargando ? (
            <p style={{ color: 'white', textAlign: 'center', fontSize: '18px' }}>Cargando personal desde la base de datos...</p>
          ) : error ? (
            <p role="alert" style={{ color: 'white', textAlign: 'center', fontSize: '18px' }}>{error}</p>
          ) : personalFiltrado.length === 0 ? (
            <p style={{ color: 'white', textAlign: 'center', fontSize: '18px' }}>
              {busqueda ? `No se encontraron resultados para "${busqueda}"` : 'No hay personal registrado.'}
            </p>
          ) : (
            personalFiltrado.map((p, index) => {
              const rutActual = obtenerRut(p);
              const registroPago = sueldosPagados[rutActual];
              const cantEventos = contarEventosParticipados(p);

              return (
                <div 
                  key={p.id || rutActual || index} 
                  onClick={() => setPersonalSeleccionado(p)}
                  style={{ 
                    backgroundColor: '#d499a7', 
                    borderRadius: '30px', 
                    padding: '15px 25px', 
                    marginBottom: '15px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    border: '1px solid black',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '17px', flex: 1, textAlign: 'center' }}>
                    {obtenerNombre(p)} | {obtenerRol(p)} | Eventos: {cantEventos} (+{cantEventos * 3}% bono)
                    {registroPago && (
                      <span style={{
                        marginLeft: '10px',
                        backgroundColor: '#15803d',
                        color: 'white',
                        fontSize: '12px',
                        padding: '3px 10px',
                        borderRadius: '12px'
                      }}>
                        ✓ Pagado (${Number(registroPago.detalle.totalAPagar).toLocaleString('es-CL')})
                      </span>
                    )}
                  </span>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {puedePagarSueldos && (
                      <button 
                        title="Pagar sueldo vía Webpay"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAbrirPagoSueldo(p);
                        }} 
                        style={{ backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '15px', padding: '5px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        💳 Pagar Sueldo
                      </button>
                    )}
                    <button 
                      title="Asignar a evento"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAbrirAsignar(p);
                      }} 
                      style={{ backgroundColor: 'white', color: '#1e40af', border: 'none', borderRadius: '15px', padding: '5px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Asignar a Evento
                    </button>
                    <button 
                      title="Editar ficha"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditar(p);
                      }} 
                      style={{ backgroundColor: 'white', color: '#523354', border: 'none', borderRadius: '15px', padding: '5px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Editar
                    </button>
                    <button 
                      title="Eliminar usuario"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminar(p);
                      }} 
                      style={{ backgroundColor: 'white', color: '#c0392b', border: 'none', borderRadius: '15px', padding: '5px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tarjeta inferior de Detalles */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '15px', 
          padding: '20px 30px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          minHeight: '150px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {personalSeleccionado ? (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '28px', margin: '0 0 15px 0' }}>
                  {obtenerNombre(personalSeleccionado)}
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {puedePagarSueldos && (
                    <button
                      type="button"
                      onClick={() => handleAbrirPagoSueldo(personalSeleccionado)}
                      style={{ backgroundColor: '#15803d', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      💳 Pagar Sueldo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAbrirAsignar(personalSeleccionado)}
                    style={{ backgroundColor: '#1e40af', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Asignar a Evento
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '18px 30px',
                  fontSize: '16px',
                  lineHeight: '1.5'
                }}
              >
                <div>
                  <strong>RUT:</strong>
                  <div>{obtenerRut(personalSeleccionado)}</div>
                </div>

                <div>
                  <strong>Rol Base:</strong>
                  <div>{obtenerRol(personalSeleccionado)}</div>
                </div>

                <div>
                  <strong>Eventos participados (Bono acumulado):</strong>
                  <div>
                    {contarEventosParticipados(personalSeleccionado)} evento(s) — Bono del{' '}
                    <span style={{ color: '#15803d', fontWeight: 'bold' }}>
                      {contarEventosParticipados(personalSeleccionado) * 3}%
                    </span>{' '}
                    sobre sueldo base
                  </div>
                </div>

                <div>
                  <strong>Estado / Disponibilidad:</strong>
                  <div>
                    {personalSeleccionado.estado || personalSeleccionado.disponibilidad || 'No especificada'}
                  </div>
                </div>

                <div>
                  <strong>Datos bancarios / de pago:</strong>
                  <div>{personalSeleccionado.datosDePago || 'No registrados'}</div>
                </div>

                <div>
                  <strong>Evaluacion de desempeno:</strong>
                  <div>
                    {personalSeleccionado.evaluacionDesempeno || 'Sin calificar'}
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Experiencia:</strong>
                  <div>{personalSeleccionado.experiencia || 'Sin registrar'}</div>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>Selecciona una persona para ver sus detalles</p>
          )}
        </div>
        
      </main>

      <ModalPersonalEventual
        isOpen={mostrarModal}
        personalSeleccionado={personalSeleccionado}
        onClose={() => setMostrarModal(false)}
        onGuardar={handleGuardarNuevoPersonal}
      />

      {/* Modal Pago Individual de Sueldo (con cálculo de bono 3% por evento) */}
      {trabajadorAPagar && !modalWebpayAbierto && (() => {
        const liqIndividual = calcularLiquidacion(trabajadorAPagar, montoSueldoInput);
        return (
          <div
            onClick={() => setTrabajadorAPagar(null)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '440px',
                padding: '25px 30px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', boxSizing: 'border-box'
              }}
            >
              <h2 style={{ margin: '0 0 8px 0', color: '#15803d', fontSize: '22px' }}>💳 Pagar Sueldo Individual</h2>
              <p style={{ margin: '0 0 14px 0', fontSize: '14px', color: '#555' }}>
                Trabajador: <strong>{obtenerNombre(trabajadorAPagar)}</strong> ({obtenerRut(trabajadorAPagar)})
              </p>

              <form onSubmit={handleConfirmarMontoIndividualYWebpay}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>
                    Sueldo Base (CLP):
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={montoSueldoInput}
                    onChange={(e) => setMontoSueldoInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                {/* Desglose Bono 3% por evento */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 15px',
                  marginBottom: '18px',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Eventos participados:</span>
                    <strong>{liqIndividual.cantEventos} evento(s)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d' }}>
                    <span>Bono ({liqIndividual.porcentajeBono}% = 3% × evento):</span>
                    <strong>+ ${liqIndividual.montoBono.toLocaleString('es-CL')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', fontSize: '15px', color: '#523354' }}>
                    <strong>Total a transferir:</strong>
                    <strong>${liqIndividual.totalAPagar.toLocaleString('es-CL')} CLP</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setTrabajadorAPagar(null)}
                    style={{ backgroundColor: '#aaa', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: '#6b1d5c', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Ir a Webpay →
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal Pago Masivo ("Pagar a todos" - Solo principio o fin de mes + Bono 3%/evento) */}
      {modalPagoMasivoAbierto && !modalWebpayAbierto && (
        <div
          onClick={() => setModalPagoMasivoAbierto(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white', borderRadius: '20px', width: '94%', maxWidth: '720px',
              maxHeight: '90vh', overflowY: 'auto', padding: '25px 30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)', boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ margin: 0, color: '#523354', fontSize: '22px' }}>
                💳 Pago Masivo de Remuneraciones ("Pagar a todos")
              </h2>
              <button
                type="button"
                onClick={() => setModalPagoMasivoAbierto(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}
              >
                ×
              </button>
            </div>

            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#555' }}>
              Regla aplicada: <strong>Bono del 3% sobre el sueldo base por cada evento participado</strong>. Solo habilitado a principios (días 1–5) o fin de mes (días {estadoFechaActual.ultimoDiaMes - 4}–{estadoFechaActual.ultimoDiaMes}).
            </p>

            {/* Validación de fecha actual */}
            {!estadoFechaActual.habilitado ? (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '12px 16px',
                borderRadius: '12px',
                marginBottom: '15px',
                fontSize: '13px'
              }}>
                <strong>⚠️ Fuera de fecha de pago masivo:</strong> Hoy es <strong>{estadoFechaActual.fechaTexto}</strong>. El pago masivo a todo el personal solo puede ejecutarse a principios o fin de mes.
                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#523354', fontWeight: 'bold' }}>
                    <input
                      type="checkbox"
                      checked={simularFechaHabilitada}
                      onChange={(e) => setSimularFechaHabilitada(e.target.checked)}
                    />
                    Simular fecha de fin de mes para probar el flujo ahora
                  </label>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                padding: '10px 14px',
                borderRadius: '10px',
                marginBottom: '15px',
                fontSize: '13px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>✅ Periodo válido para pago masivo de sueldos ({estadoFechaActual.fechaTexto}).</span>
                {simularFechaHabilitada && (
                  <button
                    type="button"
                    onClick={() => setSimularFechaHabilitada(false)}
                    style={{ background: 'none', border: 'none', color: '#166534', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Volver a fecha real
                  </button>
                )}
              </div>
            )}

            {/* Tabla de liquidación por trabajador */}
            <div style={{ overflowX: 'auto', marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#523354', color: 'white' }}>
                    <th style={{ padding: '10px 12px' }}>Trabajador</th>
                    <th style={{ padding: '10px 12px' }}>Sueldo Base (CLP)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Eventos</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Bono (3%/ev.)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total a Pagar</th>
                  </tr>
                </thead>
                <tbody>
                  {planillaMasiva.map((item, idx) => (
                    <tr key={item.rut || idx} style={{ borderBottom: '1px solid #eee', backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <strong>{item.nombre}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{item.rut}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={sueldosBaseMasivos[item.rut] ?? 450000}
                          onChange={(e) => handleCambiarSueldoBaseMasivo(item.rut, e.target.value)}
                          style={{ width: '110px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 'bold' }}>
                        {item.cantEventos}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#15803d', fontWeight: '600' }}>
                        +${item.montoBono.toLocaleString('es-CL')} ({item.porcentajeBono}%)
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', color: '#1e293b' }}>
                        ${item.totalAPagar.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total General y Botones */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fdf4ff',
              border: '1px solid #e9d5ff',
              padding: '12px 18px',
              borderRadius: '12px',
              marginBottom: '18px'
            }}>
              <span style={{ fontWeight: 'bold', color: '#523354', fontSize: '15px' }}>
                Total Planilla ({planillaMasiva.length} trabajadores):
              </span>
              <span style={{ fontWeight: '800', color: '#6b1d5c', fontSize: '20px' }}>
                ${granTotalMasivo.toLocaleString('es-CL')} CLP
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setModalPagoMasivoAbierto(false)}
                style={{ backgroundColor: '#aaa', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!estadoFechaActual.habilitado}
                onClick={handleConfirmarPagoMasivoYWebpay}
                style={{
                  backgroundColor: estadoFechaActual.habilitado ? '#6b1d5c' : '#cbd5e1',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  cursor: estadoFechaActual.habilitado ? 'pointer' : 'not-allowed'
                }}
              >
                Pagar Planilla en Webpay →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulador Webpay (compartido para pago individual y masivo) */}
      <ModalWebpayComponente
        abierto={modalWebpayAbierto}
        alCerrar={() => {
          setModalWebpayAbierto(false);
          setTrabajadorAPagar(null);
          setModalPagoMasivoAbierto(false);
        }}
        tipoPago="SUELDO"
        monto={configWebpay.monto}
        concepto={configWebpay.concepto}
        alCompletarPago={handlePagoCompletado}
      />

      {/* Modal Asignar a Evento */}
      {mostrarModalAsignar && personalSeleccionado && (
        <div
          onClick={() => !guardandoAsignacion && setMostrarModalAsignar(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '450px',
              padding: '25px 30px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', boxSizing: 'border-box'
            }}
          >
            <h2 style={{ margin: '0 0 10px 0', color: '#1e40af', fontSize: '22px' }}>Asignar a Evento</h2>
            <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>
              Trabajador: <strong>{obtenerNombre(personalSeleccionado)}</strong>
            </p>

            <form onSubmit={handleConfirmarAsignacion}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                  Seleccionar Evento:
                </label>
                <select
                  value={eventoSeleccionadoId}
                  onChange={(e) => setEventoSeleccionadoId(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                >
                  <option value="">-- Selecciona un evento --</option>
                  {eventos.map((ev) => (
                    <option key={ev.idPE || ev.id} value={ev.idPE || ev.id}>
                      {ev.descripcion} ({ev.fecha ? new Date(ev.fecha).toLocaleDateString() : 'Sin fecha'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                  Rol en el Evento:
                </label>
                <input
                  type="text"
                  value={rolAsignadoInput}
                  onChange={(e) => setRolAsignadoInput(e.target.value)}
                  placeholder="Ej. Garzon, Chofer, Tecnico"
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMostrarModalAsignar(false)}
                  disabled={guardandoAsignacion}
                  style={{ backgroundColor: '#aaa', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoAsignacion}
                  style={{
                    backgroundColor: '#1e40af', color: 'white', border: 'none', padding: '10px 25px',
                    borderRadius: '20px', fontWeight: 'bold', cursor: guardandoAsignacion ? 'wait' : 'pointer',
                    opacity: guardandoAsignacion ? 0.7 : 1
                  }}
                >
                  {guardandoAsignacion ? 'Asignando...' : 'Confirmar Asignacion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}