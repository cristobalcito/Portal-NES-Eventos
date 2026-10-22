import React, { useState, useEffect } from 'react';

const formularioInicial = {
  rut: '',
  nombre: '',
  rol: '',
  disponibilidad: '',
  fono: '',
  experiencia: '',
  datosDePago: '',
  tallaDeRopa: ''
};

export default function ModalPersonalEventual({
  isOpen,
  onClose,
  onGuardar
}) {
  const [formulario, setFormulario] = useState(formularioInicial);

  const [vistaPrevia, setVistaPrevia] = useState(false);

useEffect(() => {
  if (isOpen) {
    setFormulario({ ...formularioInicial });
    setVistaPrevia(false);
  }
}, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      
      [name]: value
    }));
    setVistaPrevia(false);
  };

  const handleSubmit = (e) => {
  e.preventDefault();

  // Los campos requeridos son validados por el formulario HTML.
  // Por ahora no enviamos información al backend.
  setVistaPrevia(true);
};

  return (
    <div style={estilos.fondo}>
      <div style={estilos.modal}>
        <div style={estilos.encabezado}>
          <h2 style={{ margin: 0, color: '#523354' }}>
            Registrar Personal Eventual
          </h2>

          <button type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={estilos.formulario}>
          <div style={estilos.columnas}>
            <Campo
              etiqueta="RUT"
              nombre="rut"
              valor={formulario.rut}
              onChange={handleChange}
            />

            <Campo
              etiqueta="Nombre completo"
              nombre="nombre"
              valor={formulario.nombre}
              onChange={handleChange}
            />

            <Campo
              etiqueta="Rol / Cargo"
              nombre="rol"
              valor={formulario.rol}
              onChange={handleChange}
            />

            <Campo
              etiqueta="Teléfono"
              nombre="fono"
              valor={formulario.fono}
              onChange={handleChange}
            />

            <Campo
              etiqueta="Disponibilidad"
              nombre="disponibilidad"
              valor={formulario.disponibilidad}
              onChange={handleChange}
            />

            <Campo
              etiqueta="Talla de uniforme"
              nombre="tallaDeRopa"
              valor={formulario.tallaDeRopa}
              onChange={handleChange}
            />
          </div>

          <Campo
            etiqueta="Experiencia"
            nombre="experiencia"
            valor={formulario.experiencia}
            onChange={handleChange}
          />

          <Campo
            etiqueta="Datos de pago"
            nombre="datosDePago"
            valor={formulario.datosDePago}
            onChange={handleChange}
          />

          {vistaPrevia && (
  <div
    role="status"
    style={{
      backgroundColor: '#f5eef7',
      padding: '16px',
      borderRadius: '10px',
      border: '1px solid #8a5b96'
    }}
  >
    <h3 style={{ marginTop: 0, color: '#523354' }}>
      Vista previa del personal
    </h3>

    <p><strong>Nombre:</strong> {formulario.nombre}</p>
    <p><strong>RUT:</strong> {formulario.rut}</p>
    <p><strong>Cargo:</strong> {formulario.rol}</p>
    <p><strong>Teléfono:</strong> {formulario.fono}</p>
    <p><strong>Disponibilidad:</strong> {formulario.disponibilidad}</p>
    <p><strong>Experiencia:</strong> {formulario.experiencia}</p>
    <p><strong>Talla:</strong> {formulario.tallaDeRopa}</p>

    <p style={{ color: '#80508a', fontSize: '13px' }}>
      Esta información todavía no se ha guardado.
    </p>
  </div>
)}

          <div style={estilos.botones}>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>

            <button type="submit" style={estilos.guardar}>
                Revisar datos
            </button>
          </div>

          <p style={{ fontSize: '12px', color: '#666' }}>
            El registro estará disponible cuando terminemos
            la integración segura con el backend.
          </p>
        </form>
      </div>
    </div>
  );
}

function Campo({ etiqueta, nombre, valor, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <strong style={{ fontSize: '13px' }}>{etiqueta}</strong>

      <input
        type="text"
        name={nombre}
        value={valor}
        onChange={onChange}
        required
        style={estilos.input}
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
  guardar: {
    padding: '10px 18px',
    backgroundColor: '#8a5b96',
    color: 'white',
    border: 'none',
    borderRadius: '8px'
  }
};