import React, { useState, useEffect } from 'react';

export default function ModalRegistro({ isOpen, tipo = 'persona', onClose, onGuardar }) {
  // Estado inicial sin el campo de disponibilidad en el estado editable
  const obtenerEstadoInicial = () => {
    return tipo === 'persona' 
      ? { nombre: '', rut: '', rol: '', fechaNacimiento: '', telefono: '' }
      : { descripcion: '', lugar: '', fecha: '', numPersonas: '', personal: '' };
  };

  const [formData, setFormData] = useState(obtenerEstadoInicial());

  // Reiniciar campos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setFormData(obtenerEstadoInicial());
    }
  }, [tipo, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Si es persona, se inyecta automáticamente 'Disponible'
    const datosFinales = tipo === 'persona' 
      ? { 
          ...formData, 
          estado: 'Disponible',
          Estado: 'Disponible' 
        }
      : formData;

    onGuardar(datosFinales);
    onClose();
  };

  const esPersona = tipo === 'persona';

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        width: '90%',
        maxWidth: '500px',
        padding: '25px 30px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        boxSizing: 'border-box'
      }}>
        {/* Encabezado */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #8a5b96',
          paddingBottom: '10px',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#523354', fontSize: '22px' }}>
            {esPersona ? '👤 Registrar Nuevo Personal' : '📅 Registrar Nuevo Evento'}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: '20px', 
              cursor: 'pointer', fontWeight: 'bold', color: '#888'
            }}
          >
            ✖
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {esPersona ? (
            <>
              <div>
                <label style={labelStyle}>Nombre Completo:</label>
<<<<<<< Updated upstream
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required style={inputStyle} placeholder="Ej: Juan Pérez" />
=======
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required style={inputStyle} placeholder="Ej: Leandro Flores" />
>>>>>>> Stashed changes
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>RUT:</label>
                  <input type="text" name="rut" value={formData.rut} onChange={handleChange} required style={inputStyle} placeholder="12.345.678-9" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Rol / Cargo:</label>
                  <input type="text" name="rol" value={formData.rol} onChange={handleChange} required style={inputStyle} placeholder="Ej: Garzón" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Fecha Nacimiento:</label>
                  <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Teléfono:</label>
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} style={inputStyle} placeholder="+56 9 1234 5678" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={labelStyle}>Nombre/Descripción del Evento:</label>
                <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} required style={inputStyle} placeholder="Ej: Matrimonio Civil" />
              </div>
              <div>
                <label style={labelStyle}>Lugar / Dirección:</label>
                <input type="text" name="lugar" value={formData.lugar} onChange={handleChange} required style={inputStyle} placeholder="Ej: Centro de Eventos" />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Fecha:</label>
                  <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>N° de Personas:</label>
                  <input type="number" name="numPersonas" value={formData.numPersonas} onChange={handleChange} required style={inputStyle} placeholder="Ej: 150" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Organizador / Encargado:</label>
                <input type="text" name="personal" value={formData.personal} onChange={handleChange} style={inputStyle} placeholder="Ej: Mateo González" />
              </div>
            </>
          )}

          {/* Botones de acción */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#aaa', color: 'white', border: 'none',
                padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                backgroundColor: '#8a5b96', color: 'white', border: 'none',
                padding: '10px 25px', borderRadius: '20px', cursor: 'pointer',
                fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              Guardar
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
<<<<<<< Updated upstream
};
=======
};

>>>>>>> Stashed changes
