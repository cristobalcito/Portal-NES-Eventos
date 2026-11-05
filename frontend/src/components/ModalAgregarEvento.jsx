import React, { useState, useEffect } from 'react';
import { CONFIG_CATALOGO } from '../utilidades/catalogoConstantes.js';

const estadoInicial = {
  descripcion: '',
  lugar: '',
  fecha: '',
  numPersonas: '',
  costoTotal: '',
  personal: '',
  horaSalida: '',
  horaLlegada: '',
  horaVuelta: ''
};

// Une una fecha (YYYY-MM-DD) con una hora (HH:MM) en hora local y la pasa a ISO
const unirFechaHora = (fecha, hora) => new Date(`${fecha}T${hora}:00`).toISOString();

const dosDigitos = (n) => String(n).padStart(2, '0');

// Pasa una fecha guardada a formato YYYY-MM-DD (hora local) para el input date
const aFechaInput = (valor) => {
  const d = new Date(valor);
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
};

// Pasa una fecha guardada a formato HH:MM (hora local) para el input time
const aHoraInput = (valor) => {
  const d = new Date(valor);
  return `${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`;
};

// Arma el estado del formulario a partir de un evento existente
const estadoDesdeEvento = (evento) => ({
  descripcion: evento.descripcion || '',
  lugar: evento.lugar || '',
  fecha: evento.fecha ? aFechaInput(evento.fecha) : '',
  numPersonas: evento.numPersonas != null ? String(evento.numPersonas) : '',
  costoTotal: evento.costoTotal != null ? String(Math.round(evento.costoTotal)) : '',
  personal: evento.personal && evento.personal !== 'No asignado' ? evento.personal : '',
  horaSalida: evento.horario ? aHoraInput(evento.horario.horaSalida) : '',
  horaLlegada: evento.horario ? aHoraInput(evento.horario.horaLlegada) : '',
  horaVuelta: evento.horario ? aHoraInput(evento.horario.horaVuelta) : ''
});

// Si recibe "eventoInicial" funciona en modo edición; si no, en modo agregar
export default function ModalAgregarEvento({ isOpen, onClose, onGuardar, eventoInicial = null }) {
  const esEdicion = Boolean(eventoInicial);
  const [formData, setFormData] = useState(estadoInicial);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [alertaRegla, setAlertaRegla] = useState('');

  // Límite de caracteres global
  const MAX_CARACTERES = CONFIG_CATALOGO.MAX_CARACTERES_DESCRIPCION || 300;

  // Equipamiento de inventario
  const [listaInventario, setListaInventario] = useState([]);
  const [equipamientoSeleccionado, setEquipamientoSeleccionado] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Calcular la fecha mínima para creación (Hoy + 14 días)
  const obtenerFechaMinima = () => {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 14);
    return aFechaInput(hoy);
  };

  // Cargar lista de inventario al abrir
  useEffect(() => {
    if (isOpen) {
      fetch(`${API_URL}/api/inventario`)
        .then((res) => res.json())
        .then((data) => setListaInventario(Array.isArray(data) ? data : (data.datos || [])))
        .catch((err) => console.error("Error al cargar inventario:", err));
    }
  }, [isOpen, API_URL]);

  // Reiniciar (o precargar en modo edición) el formulario cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData(eventoInicial ? estadoDesdeEvento(eventoInicial) : {
        ...estadoInicial,
        fecha: obtenerFechaMinima()
      });
      setEquipamientoSeleccionado([]);
      setError('');
      setGuardando(false);
      setAlertaRegla('');
    }
  }, [isOpen, eventoInicial]);

  if (!isOpen) return null;

  const validarReglasEnTiempoReal = async (nombreCampo, valorNuevo) => {
    if (!esEdicion || !eventoInicial) return;

    // A) Validar regla de cambio de fecha
    if (nombreCampo === 'fecha' && valorNuevo) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const nuevaFecha = new Date(`${valorNuevo}T00:00:00`);
      const diffTiempo = nuevaFecha - hoy;
      const diasRestantes = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

      try {
        const res = await fetch(`${API_URL}/api/reglas-eventos/validar-fecha`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ diasRestantes })
        });
        const data = await res.json();
        setAlertaRegla(data.mensaje || '');
      } catch (err) {
        console.error('Error al validar regla de fecha:', err);
      }
    }

    // B) Validar regla de cambio de invitados (RF-FC-03)
    if (nombreCampo === 'numPersonas' && valorNuevo) {
      const fechaEvento = new Date(formData.fecha || eventoInicial.fecha);
      const hoy = new Date();
      const diasRestantes = Math.ceil((fechaEvento - hoy) / (1000 * 60 * 60 * 24));

      try {
        const res = await fetch(`${API_URL}/api/reglas-eventos/validar-invitados`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            diasRestantes,
            cantidadActual: Number(eventoInicial.numPersonas || 0),
            cantidadNueva: Number(valorNuevo)
          })
        });
        const data = await res.json();
        setAlertaRegla(data.mensaje || '');
      } catch (err) {
        console.error('Error al validar regla de invitados:', err);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validación en tiempo real para costoTotal (Solo números enteros positivos)
    if (name === 'costoTotal') {
      if (value !== '' && (!/^\d+$/.test(value) || parseInt(value, 10) < 0)) {
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    validarReglasEnTiempoReal(name, value);
  };

  const agregarEquipamiento = (idProducto) => {
    if (!idProducto) return;
    const prodId = parseInt(idProducto, 10);
    if (equipamientoSeleccionado.some((item) => item.productoId === prodId)) return;

    setEquipamientoSeleccionado([
      ...equipamientoSeleccionado,
      { productoId: prodId, cantidad: 1 }
    ]);
  };

  const cambiarCantidadEquipamiento = (idProducto, cantidad) => {
    const cantNum = Math.max(1, parseInt(cantidad, 10) || 1);
    setEquipamientoSeleccionado((prev) =>
      prev.map((item) => (item.productoId === idProducto ? { ...item, cantidad: cantNum } : item))
    );
  };

  const removerEquipamiento = (idProducto) => {
    setEquipamientoSeleccionado((prev) => prev.filter((item) => item.productoId !== idProducto));
  };

  const validar = () => {
    if (!formData.descripcion.trim()) return 'La descripción es obligatoria.';
    if (formData.descripcion.length > MAX_CARACTERES) return `La descripción no puede superar los ${MAX_CARACTERES} caracteres.`;
    if (!formData.lugar.trim()) return 'El lugar es obligatorio.';
    if (!formData.fecha) return 'La fecha es obligatoria.';

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Validación de 14 días mínimos para la creación de planes
    if (!esEdicion) {
      const fechaMinimaPermitida = new Date();
      fechaMinimaPermitida.setDate(fechaMinimaPermitida.getDate() + 14);
      fechaMinimaPermitida.setHours(0, 0, 0, 0);

      if (new Date(`${formData.fecha}T00:00:00`) < fechaMinimaPermitida) {
        return 'Los planes específicos deben crearse con al menos 14 días (2 semanas) de anticipación.';
      }
    } else {
      const fechaCambio = formData.fecha !== aFechaInput(eventoInicial.fecha);
      if (fechaCambio && new Date(`${formData.fecha}T00:00:00`) < hoy) return 'La fecha no puede ser anterior a hoy.';
    }

    const personas = Number(formData.numPersonas);
    if (!Number.isInteger(personas) || personas <= 0) return 'El N° de personas debe ser un entero mayor a 0.';

    const costo = Number(formData.costoTotal);
    if (formData.costoTotal === '' || Number.isNaN(costo) || costo < 0 || !Number.isInteger(costo)) {
      return 'El costo total debe ser un número entero positivo (sin decimales ni negativos).';
    }

    const horas = [formData.horaSalida, formData.horaLlegada, formData.horaVuelta];
    const horasLlenas = horas.filter(Boolean).length;
    if (horasLlenas > 0 && horasLlenas < 3) return 'Si ingresas horario, completa las tres horas.';

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mensajeError = validar();
    if (mensajeError) {
      setError(mensajeError);
      return;
    }

    const tieneHorario = formData.horaSalida && formData.horaLlegada && formData.horaVuelta;

    const datosEvento = {
      descripcion: formData.descripcion.trim(),
      lugar: formData.lugar.trim(),
      // Se guarda al mediodía para que la zona horaria no cambie el día
      fecha: unirFechaHora(formData.fecha, '12:00'),
      numPersonas: Number(formData.numPersonas),
      costoTotal: Number(formData.costoTotal),
      personal: formData.personal.trim(),
      equipamientos: equipamientoSeleccionado,
      horario: tieneHorario
        ? {
            horaSalida: unirFechaHora(formData.fecha, formData.horaSalida),
            horaLlegada: unirFechaHora(formData.fecha, formData.horaLlegada),
            horaVuelta: unirFechaHora(formData.fecha, formData.horaVuelta)
          }
        : null
    };

    try {
      setGuardando(true);
      setError('');
      await onGuardar(datosEvento);
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el evento.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white', borderRadius: '20px',
          width: '90%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
          padding: '25px 30px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          boxSizing: 'border-box', fontFamily: 'sans-serif'
        }}
      >
        {/* Encabezado */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '2px solid #8a5b96', paddingBottom: '10px', marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#523354', fontSize: '22px' }}>
            {esEdicion ? '✏️ Editar evento' : '📅 Agregar evento'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold', color: '#888' }}
          >
            ✖
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={labelStyle}>Nombre / Descripción del evento *</label>
              <span style={{ fontSize: '11px', color: formData.descripcion.length >= MAX_CARACTERES ? '#b3261e' : '#666' }}>
                {formData.descripcion.length} / {MAX_CARACTERES}
              </span>
            </div>
            <input
              type="text"
              name="descripcion"
              maxLength={MAX_CARACTERES}
              value={formData.descripcion}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Ej: Matrimonio Pérez Soto"
            />
          </div>

          <div>
            <label style={labelStyle}>Lugar / Dirección *</label>
            <input type="text" name="lugar" value={formData.lugar} onChange={handleChange} style={inputStyle} placeholder="Ej: Centro de Eventos Los Robles" />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Fecha (Mínimo 14 días) *</label>
              <input
                type="date"
                name="fecha"
                min={!esEdicion ? obtenerFechaMinima() : undefined}
                value={formData.fecha}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>N° de invitados *</label>
              <input type="number" min="1" name="numPersonas" value={formData.numPersonas} onChange={handleChange} style={inputStyle} placeholder="Ej: 150" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Costo total (CLP Entero) *</label>
              <input
                type="text"
                name="costoTotal"
                value={formData.costoTotal}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Ej: 2500000"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Organizador / Encargado</label>
              <input type="text" name="personal" value={formData.personal} onChange={handleChange} style={inputStyle} placeholder="Ej: Mateo González" />
            </div>
          </div>

          {/* Pre-asignación de Equipamiento de Inventario */}
          {!esEdicion && (
            <fieldset style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '10px 15px', backgroundColor: '#fafafa' }}>
              <legend style={{ ...labelStyle, padding: '0 5px', marginBottom: 0 }}>📦 Asignar Equipamiento (Inventario)</legend>
              <select
                onChange={(e) => {
                  agregarEquipamiento(e.target.value);
                  e.target.value = '';
                }}
                style={{ ...inputStyle, marginBottom: '8px', fontSize: '13px' }}
              >
                <option value="">-- Seleccionar producto --</option>
                {listaInventario.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.producto} (Disponibles: {item.disponible})
                  </option>
                ))}
              </select>

              {equipamientoSeleccionado.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {equipamientoSeleccionado.map((eq) => {
                    const prod = listaInventario.find((i) => i.id === eq.productoId);
                    return (
                      <div key={eq.productoId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', backgroundColor: '#fff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #eee' }}>
                        <span>{prod ? prod.producto : `Producto #${eq.productoId}`}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            min="1"
                            value={eq.cantidad}
                            onChange={(e) => cambiarCantidadEquipamiento(eq.productoId, e.target.value)}
                            style={{ width: '45px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #ccc' }}
                          />
                          <button
                            type="button"
                            onClick={() => removerEquipamiento(eq.productoId)}
                            style={{ backgroundColor: '#b3261e', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </fieldset>
          )}

          <fieldset style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '10px 15px' }}>
            <legend style={{ ...labelStyle, padding: '0 5px', marginBottom: 0 }}>Horario (opcional)</legend>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Salida</label>
                <input type="time" name="horaSalida" value={formData.horaSalida} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Llegada</label>
                <input type="time" name="horaLlegada" value={formData.horaLlegada} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Vuelta</label>
                <input type="time" name="horaVuelta" value={formData.horaVuelta} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </fieldset>

          {esEdicion && (
            <p style={{ margin: 0, color: '#555', fontSize: '12px' }}>
              Los cambios de fecha e invitados siguen las reglas de anticipación de la empresa
              (pueden tener recargo o no estar permitidos cerca del evento).
            </p>
          )}

          {alertaRegla && (
            <div style={{
              backgroundColor: '#fff3cd',
              color: '#856404',
              border: '1px solid #ffeeba',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 'bold',
              margin: '5px 0'
            }}>
              ⚠️ Regla de negocio: {alertaRegla}
            </div>
          )}

          {error && (
            <p style={{ margin: 0, color: '#b3261e', backgroundColor: '#fdecea', padding: '8px 12px', borderRadius: '10px', fontSize: '14px' }}>
              {error}
            </p>
          )}

          {/* Botones de acción */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '5px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: '#aaa', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              style={{
                backgroundColor: '#8a5b96', color: 'white', border: 'none',
                padding: '10px 25px', borderRadius: '20px', fontWeight: 'bold',
                cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.7 : 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 'bold',
  marginBottom: '4px',
  color: '#333'
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '10px',
  border: '1px solid #ccc',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none'
};