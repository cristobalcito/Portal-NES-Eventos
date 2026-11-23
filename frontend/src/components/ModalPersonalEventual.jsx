import React, { useRef, useState } from 'react';

import { camposPago, leerPago } from './datosTransferencia';
import { obtenerCurriculumServicio } from '../servicios/personalExternoServicio.js';

const bancos = ['BancoEstado', 'Banco de Chile', 'Banco Santander', 'BCI', 'Banco Falabella', 'Scotiabank', 'Banco Itaú', 'Banco BICE', 'Banco Security', 'Banco Internacional'];
const tiposCuenta = ['Cuenta corriente', 'Cuenta vista', 'CuentaRUT', 'Cuenta de ahorro'];
const cargos = ['Garzón', 'DJ', 'Coordinador', 'Chofer', 'Técnico', 'Operativo'];
const estados = ['Disponible', 'No disponible', 'Por confirmar'];
const experiencias = ['Sí', 'No', 'Sin registro'];
const tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const licenciasDisponibles = ['Clase B', 'Clase A2', 'Clase A3', 'Clase A4', 'Clase A5', 'Clase D'];
const limiteCurriculum = 5 * 1024 * 1024;

export default function ModalPersonalEventual({ isOpen, personalSeleccionado, onClose, onGuardar }) {
  if (!isOpen || !personalSeleccionado) return null;
  return (
    <Ficha key={personalSeleccionado.rut} persona={personalSeleccionado}
      onClose={onClose} onGuardar={onGuardar} />
  );
}

function Ficha({ persona, onClose, onGuardar }) {
  const disponibilidadInicial = persona.disponibilidad ?? persona.estado ?? persona.Estado ?? '';
  const experienciaInicial = !persona.experiencia || persona.experiencia === 'Sin registrar'
    ? 'Sin registro'
    : persona.experiencia;
  const experienciaAnterior = experiencias.includes(experienciaInicial) ? '' : experienciaInicial;
  const [formulario, setFormulario] = useState(() => ({
    rol: persona.rol ?? '',
    disponibilidad: disponibilidadInicial,
    fono: persona.fono ?? persona.telefono ?? '',
    experiencia: experienciaAnterior ? '' : experienciaInicial,
    tallaDeRopa: persona.tallaDeRopa ?? ''
  }));
  const [licencias, setLicencias] = useState(() =>
    Array.isArray(persona.licencias) ? persona.licencias : []
  );
  const [pago, setPago] = useState(() => leerPago(persona.datosDePago, persona));
  const [pagoEditado, setPagoEditado] = useState(false);
  const [curriculum, setCurriculum] = useState(null);
  const [eliminarCurriculum, setEliminarCurriculum] = useState(false);
  const [errorAdjunto, setErrorAdjunto] = useState('');
  const [errorDescarga, setErrorDescarga] = useState('');
  const [descargando, setDescargando] = useState(false);
  const [otroBanco, setOtroBanco] = useState(Boolean(pago.banco && !bancos.includes(pago.banco)));
  const [otroCargo, setOtroCargo] = useState(Boolean(formulario.rol && !cargos.includes(formulario.rol)));
  const [guardando, setGuardando] = useState(false);
  const entradaCurriculum = useRef(null);
  const asignado = /^Asignado a Evento #/i.test(disponibilidadInicial);

  function alternarLicencia(licencia) {
    setLicencias(actual =>
      actual.includes(licencia)
        ? actual.filter(item => item !== licencia)
        : [...actual, licencia]
    );
  }

  function cambiarPago(campo, valor) {
    setPagoEditado(true);
    setPago(actual => ({ ...actual, [campo]: valor }));
  }

  async function descargarCurriculum() {
    setErrorDescarga('');
    setDescargando(true);
    try {
      const url = URL.createObjectURL(await obtenerCurriculumServicio(persona.rut));
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = 'curriculum.pdf';
      enlace.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      setErrorDescarga(error.message);
    } finally {
      setDescargando(false);
    }
  }

  function adjuntarCurriculum(evento) {
    const archivo = evento.target.files[0];
    let error = '';
    if (archivo && archivo.size > limiteCurriculum) {
      error = 'El PDF debe pesar hasta 5 MB.';
    } else if (archivo?.type && !['application/pdf', 'application/octet-stream'].includes(archivo.type)) {
      error = 'El currículum debe ser un PDF.';
    }
    evento.target.setCustomValidity(error);
    setErrorAdjunto(error);
    setCurriculum(error ? null : archivo ?? null);
  }

  function quitarAdjunto() {
    entradaCurriculum.current.value = '';
    entradaCurriculum.current.setCustomValidity('');
    setCurriculum(null);
    setErrorAdjunto('');
  }

  function marcarEliminacionCurriculum() {
    quitarAdjunto();
    setErrorDescarga('');
    setEliminarCurriculum(true);
  }

  function cambiar(evento) {
    const { name, value } = evento.target;
    setFormulario(actual => ({ ...actual, [name]: value }));
  }

  function cambiarCargo(evento) {
    const valor = evento.target.value;
    const otro = valor === '__otro__';
    setOtroCargo(otro);
    setFormulario(actual => ({ ...actual, rol: otro ? '' : valor }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    if (guardando || errorAdjunto || !onGuardar) return;
    setGuardando(true);
    try {
      const datos = { ...formulario, rol: formulario.rol.trim(), licencias };
      if (asignado || formulario.disponibilidad === disponibilidadInicial) delete datos.disponibilidad;
      if (!formulario.experiencia) delete datos.experiencia;
      if (pagoEditado) datos.datosDePago = JSON.stringify({ formato: 'transferencia-v1', ...pago });
      if (eliminarCurriculum) datos.eliminarCurriculum = true;
      await onGuardar(datos, curriculum);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={estilos.fondo}>
      <div style={estilos.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-ficha">
        <div style={estilos.encabezado}>
          <h2 id="titulo-ficha" style={{ margin: 0, color: '#523354' }}>Ficha laboral</h2>
          <button type="button" onClick={onClose} disabled={guardando} aria-label="Cerrar">×</button>
        </div>
        <form onSubmit={guardar} style={estilos.formulario} aria-busy={guardando}>
          <div style={estilos.columnas}>
            <Campo etiqueta="RUT" nombre="rut" valor={persona.rut ?? ''} soloLectura />
            <Campo etiqueta="Nombre completo" nombre="nombre" valor={persona.usuario?.nombre ?? persona.nombre ?? ''} soloLectura />
            <label style={estiloEtiqueta}>
              <strong>Rol / Cargo</strong>
              <select name="cargo" value={otroCargo ? '__otro__' : formulario.rol} onChange={cambiarCargo} style={estilos.input}>
                <option value="">Seleccionar cargo</option>
                {cargos.map(cargo => <option key={cargo}>{cargo}</option>)}
                <option value="__otro__">Otro</option>
              </select>
            </label>
            {otroCargo && (
              <label style={estiloEtiqueta}>
                <strong>Especifica el cargo</strong>
                <input name="rol" value={formulario.rol} onChange={cambiar} required pattern=".*\S.*" style={estilos.input} />
              </label>
            )}
            <Campo etiqueta="Teléfono" nombre="fono" valor={formulario.fono} onChange={cambiar} />
            <Selector etiqueta="Disponibilidad" nombre="disponibilidad" valor={formulario.disponibilidad}
              opciones={estados} onChange={cambiar} bloqueado={asignado} />
            <Selector etiqueta="Talla de uniforme" nombre="tallaDeRopa" valor={formulario.tallaDeRopa}
              opciones={tallas} onChange={cambiar} />
          </div>
          <Selector etiqueta="Experiencia (con la productora)" nombre="experiencia"
            valor={formulario.experiencia} opciones={experiencias} onChange={cambiar} opcionVacia={null} />
          {experienciaAnterior && !formulario.experiencia && (
            <small>Experiencia registrada anteriormente: {experienciaAnterior}</small>
          )}

          <fieldset>
            <legend>Licencias de conducir (opcional)</legend>
            <div style={estilos.gridLicencias}>
              {licenciasDisponibles.map(licencia => {
                const marcada = licencias.includes(licencia);
                return (
                  <label
                    key={licencia}
                    style={{
                      ...estilos.opcionLicencia,
                      borderColor: marcada ? '#8a5b96' : '#ccc',
                      backgroundColor: marcada ? '#f5eef7' : '#fff',
                      fontWeight: marcada ? 'bold' : 'normal'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={marcada}
                      onChange={() => alternarLicencia(licencia)}
                      disabled={guardando}
                    />
                    <span>{licencia}</span>
                  </label>
                );
              })}
            </div>
            <small style={{ color: '#555', display: 'block', marginTop: '8px' }}>
              {licencias.length > 0
                ? `Seleccionadas: ${licencias.join(', ')}`
                : 'Sin licencia de manejo seleccionada'}
            </small>
          </fieldset>

          <fieldset>
            <legend>Datos de transferencia</legend>
            <div style={estilos.columnas}>
              {Object.entries(camposPago).map(([campo, etiqueta]) => {
                if (campo === 'banco') return (
                  <label key={campo} style={estiloEtiqueta}>
                    <strong>{etiqueta}</strong>
                    <select value={otroBanco ? '__otro__' : pago.banco} style={estilos.input}
                      onChange={e => {
                        const otro = e.target.value === '__otro__';
                        setOtroBanco(otro);
                        cambiarPago(campo, otro ? '' : e.target.value);
                      }}>
                      <option value="">Seleccionar banco</option>
                      {bancos.map(banco => <option key={banco}>{banco}</option>)}
                      <option value="__otro__">Otro</option>
                    </select>
                    {otroBanco && <input aria-label="Nombre del banco" value={pago.banco} required
                      placeholder="Nombre del banco" style={estilos.input} onChange={e => cambiarPago(campo, e.target.value)} />}
                  </label>
                );
                if (campo === 'tipo') return (
                  <Selector key={campo} etiqueta={etiqueta} nombre={campo} valor={pago.tipo}
                    opciones={tiposCuenta} onChange={e => cambiarPago(campo, e.target.value)} />
                );
                return (
                  <label key={campo} style={estiloEtiqueta}>
                    <strong>{etiqueta}</strong>
                    <input type={campo === 'correo' ? 'email' : 'text'} value={pago[campo]}
                      inputMode={campo === 'numero' ? 'numeric' : undefined} style={estilos.input}
                      onChange={e => cambiarPago(campo, e.target.value)} />
                  </label>
                );
              })}
            </div>
            {pago.anterior && <p>Datos guardados anteriormente: {pago.anterior}</p>}
          </fieldset>
          <fieldset>
            <legend>Currículum (PDF)</legend>
            {eliminarCurriculum ? (
              <>
                <p role="status">El PDF se eliminará al guardar la ficha.</p>
                <button type="button" onClick={() => setEliminarCurriculum(false)} disabled={guardando}>Deshacer</button>
              </>
            ) : (
              <>
                {persona.curriculum && (
                  <div style={estilos.accionesCurriculum}>
                    <button type="button" onClick={marcarEliminacionCurriculum} disabled={descargando || guardando}>Eliminar PDF</button>
                    <button type="button" onClick={descargarCurriculum} disabled={descargando || guardando}>
                      {descargando ? 'Descargando…' : 'Descargar PDF actual'}
                    </button>
                  </div>
                )}
                <label style={estiloEtiqueta}>
                  {persona.curriculum ? 'Reemplazar PDF (opcional, hasta 5 MB)' : 'Adjuntar PDF (opcional, hasta 5 MB)'}
                  <input type="file" name="curriculum" accept="application/pdf,.pdf" ref={entradaCurriculum}
                    onChange={adjuntarCurriculum} disabled={guardando} />
                </label>
                {(curriculum || errorAdjunto) && (
                  <button type="button" onClick={quitarAdjunto} disabled={guardando}>Quitar selección</button>
                )}
                {errorAdjunto && <p role="alert">{errorAdjunto}</p>}
                {errorDescarga && <p role="alert">{errorDescarga}</p>}
              </>
            )}
          </fieldset>
          <div style={estilos.botones}>
            <button type="button" onClick={onClose} disabled={guardando}>Cancelar</button>
            <button type="submit" disabled={guardando || !onGuardar} style={estilos.guardar}>
              {guardando ? 'Guardando…' : 'Guardar ficha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const estiloEtiqueta = { display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px' };

function Selector({ etiqueta, nombre, valor, opciones, onChange, bloqueado = false, opcionVacia = 'Sin especificar' }) {
  return (
    <label style={estiloEtiqueta}>
      <strong>{etiqueta}</strong>
      <select name={nombre} value={valor} onChange={onChange} disabled={bloqueado} style={estilos.input}>
        {opcionVacia
          ? <option value="">{opcionVacia}</option>
          : !valor && <option value="" disabled hidden>Seleccionar</option>}
        {valor && !opciones.includes(valor) && <option value={valor}>{valor}</option>}
        {opciones.map(opcion => <option key={opcion}>{opcion}</option>)}
      </select>
    </label>
  );
}

function Campo({ etiqueta, nombre, valor, onChange, soloLectura = false }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <strong style={{ fontSize: '13px' }}>{etiqueta}</strong>

      <input
        type="text"
        name={nombre}
        value={valor}
        onChange={onChange}
        readOnly={soloLectura}
        style={{
          ...estilos.input,
          backgroundColor: soloLectura ? '#f0f0f0' : 'white',
          cursor: soloLectura ? 'not-allowed' : 'text'
        }}
      />
    </label>
  );
}

const estilos = {
  fondo: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '25px',
    width: '100%',
    maxWidth: '650px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxSizing: 'border-box'
  },
  encabezado: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  columnas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '15px'
  },
  gridLicencias: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px',
    marginTop: '6px'
  },
  opcionLicencia: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    userSelect: 'none'
  },
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '14px'
  },
  botones: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px'
  },
  accionesCurriculum: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '8px'
  },
  guardar: {
    padding: '10px 18px',
    backgroundColor: '#8a5b96',
    color: 'white',
    border: 'none',
    borderRadius: '8px'
  }
};