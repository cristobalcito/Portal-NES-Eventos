import React, { useState, useEffect } from 'react';
import ModalMantencion from '../components/ModalMantencion.jsx';
import {
  pedir, encabezadoAutorizacion, obtenerUsuarioSesion,
  formatearFecha, formatearPesos, estilos, Etiqueta
} from '../servicios/inventarioLogisticaServicio.jsx';

// RU-2: consultar y gestionar la mantención de equipos.
// RU-3: el Gerente General o el Jefe de Operaciones marcan el equipo reparado como disponible.
export default function MantencionesPagina() {
  const [mantenciones, setMantenciones] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [filtro, setFiltro] = useState('activas');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [mantencionEditando, setMantencionEditando] = useState(null);
  const [fichaAbierta, setFichaAbierta] = useState(null);
  const [errorFicha, setErrorFicha] = useState('');
  const [confirmandoRetorno, setConfirmandoRetorno] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  const usuario = obtenerUsuarioSesion();
  const rol = usuario && usuario.rol;
  // El botón se muestra a Gerente y Personal de Operaciones; el backend verifica que sea el Jefe de Operaciones
  const puedeVerBotonRetorno = rol === 'GERENTE_GENERAL' || rol === 'PERSONAL_OPERACIONES';

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setErrorCarga('');
      const [listaMantenciones, listaEquipos] = await Promise.all([
        pedir('/api/mantenciones'),
        pedir('/api/inventario')
      ]);
      setMantenciones(Array.isArray(listaMantenciones) ? listaMantenciones : []);
      setEquipos(Array.isArray(listaEquipos) ? listaEquipos : []);
    } catch (err) {
      setErrorCarga(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const mostrarMensaje = (texto) => {
    setMensajeExito(texto);
    setTimeout(() => setMensajeExito(''), 3500);
  };

  // Registrar o editar (según si hay una mantención en edición)
  const guardarMantencion = async (datos) => {
    if (mantencionEditando) {
      await pedir(`/api/mantenciones/${mantencionEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      mostrarMensaje('Mantención actualizada.');
    } else {
      const nueva = await pedir('/api/mantenciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      mostrarMensaje(`"${nueva.inventario.producto}" enviado a mantención (${nueva.cantidad} unidad/es).`);
    }
    await cargarDatos();
  };

  const finalizarMantencion = async () => {
    try {
      setFinalizando(true);
      setErrorFicha('');
      const finalizada = await pedir(`/api/mantenciones/${fichaAbierta.id}/finalizar`, {
        method: 'PATCH',
        headers: encabezadoAutorizacion()
      });
      setFichaAbierta(null);
      setConfirmandoRetorno(false);
      mostrarMensaje(`"${finalizada.inventario.producto}" vuelve a estar disponible en el inventario.`);
      await cargarDatos();
    } catch (err) {
      setErrorFicha(err.message);
      setConfirmandoRetorno(false);
    } finally {
      setFinalizando(false);
    }
  };

  const abrirRegistrar = () => {
    setMantencionEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (m) => {
    setFichaAbierta(null);
    setMantencionEditando(m);
    setModalAbierto(true);
  };

  const abrirFicha = (m) => {
    setErrorFicha('');
    setConfirmandoRetorno(false);
    setFichaAbierta(m);
  };

  const atrasadas = mantenciones.filter((m) => m.atrasada);

  // Filtro por estado (botones) y por texto (buscador)
  const cumpleFiltro = (m) => {
    if (filtro === 'activas') return m.estado === 'en mantención';
    if (filtro === 'finalizadas') return m.estado === 'finalizada';
    return true; // "todas"
  };
  const cumpleBusqueda = (m) => {
    const texto = `${m.inventario.producto} ${m.falla} ${m.taller || ''}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  };
  const visibles = mantenciones.filter((m) => cumpleFiltro(m) && cumpleBusqueda(m));

  const etiquetaEstado = (m) => {
    if (m.estado === 'finalizada') return <Etiqueta color="verde">Disponible</Etiqueta>;
    if (m.atrasada) return <Etiqueta color="rojo">Atrasada</Etiqueta>;
    return <Etiqueta color="naranjo">En mantención</Etiqueta>;
  };

  const botonFiltro = (valor, etiqueta) => (
    <button
      onClick={() => setFiltro(valor)}
      style={{
        padding: '8px 16px', borderRadius: '20px', border: '1px solid #8a5b96', cursor: 'pointer', fontWeight: 'bold',
        backgroundColor: filtro === valor ? '#8a5b96' : 'white', color: filtro === valor ? 'white' : '#8a5b96'
      }}
    >
      {etiqueta}
    </button>
  );

  return (
    <div style={estilos.pagina}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, color: '#523354', fontSize: '28px' }}>Mantención de equipos</h1>
          <p style={{ margin: '4px 0 0', color: '#666' }}>Equipos enviados a servicio técnico y su historial.</p>
        </div>
        <button onClick={abrirRegistrar} style={estilos.botonGrande}>Enviar equipo a mantención</button>
      </div>

      {atrasadas.length > 0 && (
        <div style={estilos.alerta}>
          {atrasadas.length === 1 ? 'Hay 1 equipo' : `Hay ${atrasadas.length} equipos`} con la mantención atrasada
          (ya pasó la fecha de retorno): {atrasadas.map((m) => m.inventario.producto).join(', ')}.
        </div>
      )}

      {mensajeExito && <div style={estilos.exito}>{mensajeExito}</div>}

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
        {botonFiltro('activas', 'En mantención')}
        {botonFiltro('finalizadas', 'Finalizadas')}
        {botonFiltro('todas', 'Todas')}
        <input
          type="text" placeholder="Buscar por equipo, falla o taller..." value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: '220px', padding: '10px 18px', borderRadius: '25px', border: '1px solid #ccc', outline: 'none', fontSize: '14px' }}
        />
      </div>

      <div style={estilos.contenedorTabla}>
        <table style={estilos.tabla}>
          <thead>
            <tr>
              <th style={estilos.th}>Equipo</th>
              <th style={estilos.th}>Cant.</th>
              <th style={estilos.th}>Falla</th>
              <th style={estilos.th}>Envío</th>
              <th style={estilos.th}>Retorno estimado</th>
              <th style={estilos.th}>Costo</th>
              <th style={estilos.th}>Estado</th>
              <th style={estilos.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="8" style={estilos.td}>Cargando...</td></tr>
            ) : errorCarga ? (
              <tr><td colSpan="8" style={{ ...estilos.td, color: '#b3261e' }}>{errorCarga}</td></tr>
            ) : visibles.length === 0 ? (
              <tr><td colSpan="8" style={{ ...estilos.td, color: '#666' }}>No hay mantenciones para mostrar.</td></tr>
            ) : (
              visibles.map((m) => (
                <tr key={m.id} onClick={() => abrirFicha(m)}
                  style={{ cursor: 'pointer', backgroundColor: m.atrasada ? '#fff8f7' : 'white' }}>
                  <td style={{ ...estilos.td, textAlign: 'left', fontWeight: 'bold' }}>
                    {m.inventario.producto}
                    {m.inventario.marca && <span style={{ color: '#888', fontWeight: 'normal' }}> · {m.inventario.marca}</span>}
                  </td>
                  <td style={estilos.td}>{m.cantidad}</td>
                  <td style={{ ...estilos.td, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.falla}</td>
                  <td style={estilos.td}>{formatearFecha(m.fechaEnvio)}</td>
                  <td style={estilos.td}>{formatearFecha(m.fechaRetornoEstimada)}</td>
                  <td style={estilos.td}>{formatearPesos(m.costoReparacion)}</td>
                  <td style={estilos.td}>{etiquetaEstado(m)}</td>
                  <td style={{ ...estilos.td, whiteSpace: 'nowrap' }}>
                    <button onClick={(e) => { e.stopPropagation(); abrirFicha(m); }}
                      style={estilos.botonTabla}>Ver ficha</button>
                    {m.estado === 'en mantención' && (
                      <button onClick={(e) => { e.stopPropagation(); abrirEditar(m); }}
                        style={{ ...estilos.botonTabla, marginLeft: '6px' }}>Editar</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ModalMantencion
        isOpen={modalAbierto}
        equipos={equipos}
        mantencion={mantencionEditando}
        onClose={() => { setModalAbierto(false); setMantencionEditando(null); }}
        onGuardar={guardarMantencion}
      />

      {/* Ficha técnica de la mantención (RU-2) */}
      {fichaAbierta && (
        <div style={estilos.fondoModal} onClick={() => !finalizando && setFichaAbierta(null)}>
          <div style={estilos.cajaModal} onClick={(e) => e.stopPropagation()}>
            <div style={estilos.encabezadoModal}>
              <h2 style={estilos.tituloModal}>Ficha de mantención</h2>
              <button type="button" onClick={() => setFichaAbierta(null)} style={estilos.botonCerrar}>×</button>
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: '20px' }}>
              {fichaAbierta.inventario.producto}
              {fichaAbierta.inventario.marca && <span style={{ color: '#888', fontWeight: 'normal' }}> · {fichaAbierta.inventario.marca}</span>}
            </h3>
            <div style={{ marginBottom: '15px' }}>{etiquetaEstado(fichaAbierta)}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '14px', lineHeight: 1.5 }}>
              <Dato titulo="Unidades en mantención" valor={fichaAbierta.cantidad} />
              <Dato titulo="Servicio técnico" valor={fichaAbierta.taller || 'No especificado'} />
              <Dato titulo="Fecha de envío" valor={formatearFecha(fichaAbierta.fechaEnvio)} />
              <Dato titulo="Retorno estimado" valor={formatearFecha(fichaAbierta.fechaRetornoEstimada)} />
              <Dato titulo="Costo de reparación" valor={formatearPesos(fichaAbierta.costoReparacion)} />
              <Dato titulo="Gasto aprobado por" valor={fichaAbierta.aprobadoPor} />
              {fichaAbierta.estado === 'finalizada' && (
                <>
                  <Dato titulo="Retornó el" valor={formatearFecha(fichaAbierta.fechaRetornoReal)} />
                  <Dato titulo="Marcado disponible por" valor={fichaAbierta.finalizadoPor || '-'} />
                </>
              )}
            </div>
            <div style={{ marginTop: '12px', fontSize: '14px' }}>
              <span style={{ fontWeight: 'bold', color: '#555' }}>Falla reportada</span>
              <p style={{ margin: '4px 0 0', backgroundColor: '#f7f4f8', padding: '10px 12px', borderRadius: '10px' }}>{fichaAbierta.falla}</p>
            </div>

            {fichaAbierta.atrasada && (
              <p style={{ ...estilos.error, marginTop: '15px' }}>
                Este equipo debía volver el {formatearFecha(fichaAbierta.fechaRetornoEstimada)} y aún no ha sido marcado como disponible.
              </p>
            )}
            {errorFicha && <p style={{ ...estilos.error, marginTop: '15px' }}>{errorFicha}</p>}

            {fichaAbierta.estado === 'en mantención' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button onClick={() => abrirEditar(fichaAbierta)} style={estilos.botonSecundario}>Editar datos</button>
                {puedeVerBotonRetorno && !confirmandoRetorno && (
                  <button onClick={() => setConfirmandoRetorno(true)} style={{ ...estilos.botonPrimario, backgroundColor: '#2e7d32' }}>
                    Marcar como disponible
                  </button>
                )}
                {confirmandoRetorno && (
                  <>
                    <span style={{ alignSelf: 'center', fontSize: '14px' }}>¿El equipo ya fue reparado y devuelto?</span>
                    <button onClick={() => setConfirmandoRetorno(false)} disabled={finalizando} style={estilos.botonSecundario}>No</button>
                    <button onClick={finalizarMantencion} disabled={finalizando}
                      style={{ ...estilos.botonPrimario, backgroundColor: '#2e7d32', opacity: finalizando ? 0.7 : 1 }}>
                      {finalizando ? 'Guardando...' : 'Sí, marcar disponible'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Dato({ titulo, valor }) {
  return (
    <div>
      <div style={{ fontWeight: 'bold', color: '#555', fontSize: '12px' }}>{titulo}</div>
      <div>{valor}</div>
    </div>
  );
}
