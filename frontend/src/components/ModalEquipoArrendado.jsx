import React, { useState, useEffect } from 'react';
import { estilos, esRutValido, formatearFecha, obtenerUsuarioSesion } from '../servicios/inventarioLogisticaServicio.jsx';

const estadoInicial = {
  proveedorNombre: '',
  proveedorRut: '',
  proveedorContacto: '',
  nombreEquipo: '',
  codigoEquipo: '',
  cantidad: '1',
  costo: '',
  fechaRetiro: '',
  fechaDevolucion: '',
  eventoId: '',
  receptorBodega: ''
};

const TIPOS_GARANTIA = ['application/pdf', 'image/jpeg', 'image/png'];

// RU-4: formulario de "Ingreso de equipos subcontratados".
// No deja guardar sin RUT de proveedor válido, garantía adjunta y evento programado.
export default function ModalEquipoArrendado({ isOpen, onClose, onGuardar, eventos = [] }) {
  const [formData, setFormData] = useState(estadoInicial);
  const [garantia, setGarantia] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const usuario = obtenerUsuarioSesion();
    setFormData({ ...estadoInicial, receptorBodega: (usuario && usuario.nombre) || '' });
    setGarantia(null);
    setError('');
    setGuardando(false);
  }, [isOpen]);

  if (!isOpen) return null;

  // Solo eventos que todavía no se realizan
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const eventosProgramados = eventos.filter((e) => new Date(e.fecha) >= hoy);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArchivo = (e) => {
    const archivo = e.target.files[0] || null;
    setGarantia(archivo);
  };

  const rutInvalido = formData.proveedorRut.trim() !== '' && !esRutValido(formData.proveedorRut);

  const validar = () => {
    if (!formData.proveedorNombre.trim()) return 'Ingresa el nombre del proveedor.';
    if (!esRutValido(formData.proveedorRut)) return 'El RUT del proveedor no es válido.';
    if (!formData.proveedorContacto.trim()) return 'Ingresa un contacto del proveedor.';
    if (!formData.nombreEquipo.trim()) return 'Ingresa el nombre del equipo.';
    if (!formData.codigoEquipo.trim()) return 'Ingresa el ID del equipo.';
    const cantidad = Number(formData.cantidad);
    if (!Number.isInteger(cantidad) || cantidad <= 0) return 'La cantidad debe ser un entero mayor a 0.';
    const costo = Number(formData.costo);
    if (formData.costo === '' || Number.isNaN(costo) || costo < 0) return 'El costo debe ser mayor o igual a 0.';
    if (!formData.fechaRetiro || !formData.fechaDevolucion) return 'Completa las fechas de retiro y devolución.';
    if (new Date(formData.fechaDevolucion) < new Date(formData.fechaRetiro)) return 'La devolución no puede ser antes del retiro.';
    if (!formData.eventoId) return 'Debes vincular el equipo a un evento programado.';
    if (!formData.receptorBodega.trim()) return 'Indica quién recibe el equipo en bodega.';
    if (!garantia) return 'Debes adjuntar el documento de garantía.';
    if (!TIPOS_GARANTIA.includes(garantia.type)) return 'La garantía debe ser un PDF, JPG o PNG.';
    if (garantia.size > 5 * 1024 * 1024) return 'La garantía no puede pesar más de 5 MB.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mensaje = validar();
    if (mensaje) {
      setError(mensaje);
      return;
    }

    // Se envía como FormData porque incluye un archivo
    const datos = new FormData();
    Object.entries(formData).forEach(([clave, valor]) => datos.append(clave, String(valor).trim()));
    datos.set('fechaRetiro', new Date(formData.fechaRetiro).toISOString());
    datos.set('fechaDevolucion', new Date(formData.fechaDevolucion).toISOString());
    datos.append('garantia', garantia);

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

  const seccion = (titulo) => (
    <h3 style={{ margin: '5px 0 0', fontSize: '14px', color: '#8a5b96', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{titulo}</h3>
  );

  return (
    <div style={estilos.fondoModal} onClick={onClose}>
      <div style={{ ...estilos.cajaModal, maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
        <div style={estilos.encabezadoModal}>
          <h2 style={estilos.tituloModal}>Ingreso de equipo subcontratado</h2>
          <button type="button" onClick={onClose} style={estilos.botonCerrar}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
          {seccion('Proveedor')}
          <div style={estilos.fila}>
            <div style={{ flex: 2 }}>
              <label style={estilos.label}>Nombre del proveedor *</label>
              <input name="proveedorNombre" value={formData.proveedorNombre} onChange={handleChange} style={estilos.input} placeholder="Ej: Rental Sur SpA" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={estilos.label}>RUT *</label>
              <input name="proveedorRut" value={formData.proveedorRut} onChange={handleChange} placeholder="76.123.456-7"
                style={{ ...estilos.input, ...(rutInvalido && { borderColor: '#b3261e' }) }} />
              {rutInvalido && <span style={{ fontSize: '11px', color: '#b3261e' }}>RUT no válido</span>}
            </div>
          </div>
          <div>
            <label style={estilos.label}>Contacto (teléfono o correo) *</label>
            <input name="proveedorContacto" value={formData.proveedorContacto} onChange={handleChange} style={estilos.input} placeholder="Ej: +56 9 8765 4321 / ventas@rentalsur.cl" />
          </div>

          {seccion('Equipo')}
          <div style={estilos.fila}>
            <div style={{ flex: 2 }}>
              <label style={estilos.label}>Nombre del equipo *</label>
              <input name="nombreEquipo" value={formData.nombreEquipo} onChange={handleChange} style={estilos.input} placeholder="Ej: Generador eléctrico 20 kVA" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={estilos.label}>ID del equipo *</label>
              <input name="codigoEquipo" value={formData.codigoEquipo} onChange={handleChange} style={estilos.input} placeholder="Ej: GEN-020" />
            </div>
          </div>
          <div style={estilos.fila}>
            <div style={{ flex: 1 }}>
              <label style={estilos.label}>Cantidad *</label>
              <input type="number" min="1" name="cantidad" value={formData.cantidad} onChange={handleChange} style={estilos.input} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={estilos.label}>Costo total del arriendo (CLP) *</label>
              <input type="number" min="0" name="costo" value={formData.costo} onChange={handleChange} style={estilos.input} placeholder="Ej: 350000" />
            </div>
          </div>
          <div style={estilos.fila}>
            <div style={{ flex: 1 }}>
              <label style={estilos.label}>Retiro *</label>
              <input type="datetime-local" name="fechaRetiro" value={formData.fechaRetiro} onChange={handleChange} style={estilos.input} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={estilos.label}>Devolución (fecha límite) *</label>
              <input type="datetime-local" name="fechaDevolucion" value={formData.fechaDevolucion} onChange={handleChange} style={estilos.input} />
            </div>
          </div>
          <div>
            <label style={estilos.label}>Documento de garantía * (PDF, JPG o PNG, máx. 5 MB)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleArchivo} style={{ ...estilos.input, padding: '6px' }} />
          </div>

          {seccion('Uso')}
          <div>
            <label style={estilos.label}>Evento asociado *</label>
            <select name="eventoId" value={formData.eventoId} onChange={handleChange} style={estilos.input}>
              <option value="">Selecciona un evento programado…</option>
              {eventosProgramados.map((e) => (
                <option key={e.idPE} value={e.idPE}>{formatearFecha(e.fecha)} · {e.descripcion}</option>
              ))}
            </select>
            {eventosProgramados.length === 0 && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#b3261e' }}>No hay eventos programados. Crea uno en "Gestionar eventos".</p>
            )}
          </div>
          <div>
            <label style={estilos.label}>Recibido en bodega por *</label>
            <input name="receptorBodega" value={formData.receptorBodega} onChange={handleChange} style={estilos.input} />
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>
            El costo del arriendo se sumará automáticamente al presupuesto del evento seleccionado.
          </p>

          {error && <p style={estilos.error}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} style={estilos.botonSecundario}>Cancelar</button>
            <button type="submit" disabled={guardando}
              style={{ ...estilos.botonPrimario, opacity: guardando ? 0.7 : 1, cursor: guardando ? 'wait' : 'pointer' }}>
              {guardando ? 'Guardando...' : 'Registrar equipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
