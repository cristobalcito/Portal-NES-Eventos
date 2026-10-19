import React, { useState, useEffect } from 'react';

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

export default function ModalAgregarEvento({ isOpen, onClose, onGuardar }) {
  const [formData, setFormData] = useState(estadoInicial);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Reiniciar el formulario cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData(estadoInicial);
      setError('');
      setGuardando(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validar = () => {
    if (!formData.descripcion.trim()) return 'La descripción es obligatoria.';
    if (!formData.lugar.trim()) return 'El lugar es obligatorio.';
    if (!formData.fecha) return 'La fecha es obligatoria.';

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (new Date(`${formData.fecha}T00:00:00`) < hoy) return 'La fecha no puede ser anterior a hoy.';

    const personas = Number(formData.numPersonas);
    if (!Number.isInteger(personas) || personas <= 0) return 'El N° de personas debe ser un entero mayor a 0.';

    const costo = Number(formData.costoTotal);
    if (formData.costoTotal === '' || Number.isNaN(costo) || costo < 0) return 'El costo total debe ser mayor o igual a 0.';

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
          <h2 style={{ margin: 0, color: '#523354', fontSize: '22px' }}>📅 Agregar evento</h2>
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
            <label style={labelStyle}>Nombre / Descripción del evento *</label>
            <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} style={inputStyle} placeholder="Ej: Matrimonio Pérez Soto" />
          </div>

          <div>
            <label style={labelStyle}>Lugar / Dirección *</label>
            <input type="text" name="lugar" value={formData.lugar} onChange={handleChange} style={inputStyle} placeholder="Ej: Centro de Eventos Los Robles" />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Fecha *</label>
              <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>N° de invitados *</label>
              <input type="number" min="1" name="numPersonas" value={formData.numPersonas} onChange={handleChange} style={inputStyle} placeholder="Ej: 150" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Costo total (CLP) *</label>
              <input type="number" min="0" name="costoTotal" value={formData.costoTotal} onChange={handleChange} style={inputStyle} placeholder="Ej: 2500000" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Organizador / Encargado</label>
              <input type="text" name="personal" value={formData.personal} onChange={handleChange} style={inputStyle} placeholder="Ej: Mateo González" />
            </div>
          </div>

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
              {guardando ? 'Guardando...' : 'Guardar'}
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
