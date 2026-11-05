import React, { useState, useEffect } from 'react';
import { estilos, aFechaInput } from '../servicios/inventarioLogisticaServicio.jsx';

const estadoInicial = {
  inventarioId: '',
  cantidad: '1',
  falla: '',
  taller: '',
  fechaEnvio: '',
  fechaRetornoEstimada: '',
  costoReparacion: '',
  aprobadoPor: ''
};

// Formulario para enviar un equipo a mantención o editar los datos del servicio técnico.
// Si recibe "mantencion" funciona en modo edición (no se puede cambiar el equipo ni la cantidad).
export default function ModalMantencion({ isOpen, onClose, onGuardar, equipos = [], mantencion = null }) {
  const esEdicion = Boolean(mantencion);
  const [formData, setFormData] = useState(estadoInicial);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setGuardando(false);
    setFormData(
      mantencion
        ? {
            inventarioId: String(mantencion.inventarioId),
            cantidad: String(mantencion.cantidad),
            falla: mantencion.falla || '',
            taller: mantencion.taller || '',
            fechaEnvio: aFechaInput(mantencion.fechaEnvio),
            fechaRetornoEstimada: aFechaInput(mantencion.fechaRetornoEstimada),
            costoReparacion: String(mantencion.costoReparacion ?? ''),
            aprobadoPor: mantencion.aprobadoPor || ''
          }
        : { ...estadoInicial, fechaEnvio: aFechaInput(new Date()) }
    );
  }, [isOpen, mantencion]);

  if (!isOpen) return null;

  const equipoElegido = equipos.find((e) => String(e.id) === formData.inventarioId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validar = () => {
    if (!formData.inventarioId) return 'Debes seleccionar un equipo.';
    const cantidad = Number(formData.cantidad);
    if (!Number.isInteger(cantidad) || cantidad <= 0) return 'La cantidad debe ser un entero mayor a 0.';
    if (!esEdicion && equipoElegido && cantidad > equipoElegido.disponible) {
      return `Solo hay ${equipoElegido.disponible} unidad(es) disponible(s) de este equipo.`;
    }
    if (!formData.falla.trim()) return 'Describe la falla reportada.';
    if (!formData.fechaEnvio) return 'La fecha de envío es obligatoria.';
    if (!formData.fechaRetornoEstimada) return 'La fecha de retorno estimada es obligatoria.';
    if (formData.fechaRetornoEstimada < formData.fechaEnvio) return 'El retorno no puede ser antes del envío.';
    const costo = Number(formData.costoReparacion);
    if (formData.costoReparacion === '' || Number.isNaN(costo) || costo < 0) return 'El costo debe ser mayor o igual a 0.';
    if (!formData.aprobadoPor.trim()) return 'Indica quién aprobó el gasto.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mensaje = validar();
    if (mensaje) {
      setError(mensaje);
      return;
    }

    const datos = {
      inventarioId: Number(formData.inventarioId),
      cantidad: Number(formData.cantidad),
      falla: formData.falla.trim(),
      taller: formData.taller.trim(),
      // El envío se guarda al mediodía y el retorno al final del día (hora local)
      fechaEnvio: new Date(`${formData.fechaEnvio}T12:00:00`).toISOString(),
      fechaRetornoEstimada: new Date(`${formData.fechaRetornoEstimada}T23:59:59`).toISOString(),
      costoReparacion: Number(formData.costoReparacion),
      aprobadoPor: formData.aprobadoPor.trim()
    };

    try {
      setGuardando(true);
      setError('');
      await onGuardar(datos);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const equiposConStock = equipos.filter((e) => e.disponible > 0);

  return (
    <div style={estilos.fondoModal} onClick={onClose}>
      <div style={estilos.cajaModal} onClick={(e) => e.stopPropagation()}>
        <div style={estilos.encabezadoModal}>
          <h2 style={estilos.tituloModal}>{esEdicion ? 'Editar mantención' : 'Enviar equipo a mantención'}</h2>
          <button type="button" onClick={onClose} style={estilos.botonCerrar}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={estilos.fila}>
            <div style={{ flex: 3 }}>
              <label style={estilos.label}>Equipo *</label>
              {esEdicion ? (
                <input style={{ ...estilos.input, backgroundColor: '#f3f3f3' }} disabled
                  value={mantencion.inventario ? mantencion.inventario.producto : ''} />
              ) : (
                <select name="inventarioId" value={formData.inventarioId} onChange={handleChange} style={estilos.input}>
                  <option value="">Selecciona un equipo…</option>
                  {equiposConStock.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.producto}{e.marca ? ` (${e.marca})` : ''} · {e.disponible} disponible(s)
                    </option>
                  ))}
                </select>
              )}
              {!esEdicion && equiposConStock.length === 0 && (
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#b3261e' }}>No hay equipos con unidades disponibles en el inventario.</p>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={estilos.label}>Cantidad *</label>
              <input type="number" min="1" name="cantidad" value={formData.cantidad} onChange={handleChange}
                disabled={esEdicion} style={{ ...estilos.input, ...(esEdicion && { backgroundColor: '#f3f3f3' }) }} />
            </div>
          </div>

          <div>
            <label style={estilos.label}>Falla reportada *</label>
            <textarea name="falla" rows="3" value={formData.falla} onChange={handleChange} style={{ ...estilos.input, resize: 'vertical' }}
              placeholder="Ej: El parlante no enciende después del último evento" />
          </div>

          <div>
            <label style={estilos.label}>Servicio técnico / taller</label>
            <input type="text" name="taller" value={formData.taller} onChange={handleChange} style={estilos.input}
              placeholder="Ej: Audio Service Concepción" />
          </div>

          <div style={estilos.fila}>
            <div style={{ flex: 1 }}>
              <label style={estilos.label}>Fecha de envío *</label>
              <input type="date" name="fechaEnvio" value={formData.fechaEnvio} onChange={handleChange} style={estilos.input} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={estilos.label}>Retorno estimado *</label>
              <input type="date" name="fechaRetornoEstimada" value={formData.fechaRetornoEstimada} onChange={handleChange} style={estilos.input} />
            </div>
          </div>

          <div style={estilos.fila}>
            <div style={{ flex: 1 }}>
              <label style={estilos.label}>Costo de reparación (CLP) *</label>
              <input type="number" min="0" name="costoReparacion" value={formData.costoReparacion} onChange={handleChange}
                style={estilos.input} placeholder="Ej: 85000" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={estilos.label}>Gasto aprobado por *</label>
              <input type="text" name="aprobadoPor" value={formData.aprobadoPor} onChange={handleChange}
                style={estilos.input} placeholder="Ej: Gerente General" />
            </div>
          </div>

          {error && <p style={estilos.error}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} style={estilos.botonSecundario}>Cancelar</button>
            <button type="submit" disabled={guardando}
              style={{ ...estilos.botonPrimario, opacity: guardando ? 0.7 : 1, cursor: guardando ? 'wait' : 'pointer' }}>
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Enviar a mantención'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
