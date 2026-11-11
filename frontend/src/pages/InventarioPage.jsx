import { useState, useEffect } from 'react';

export default function InventarioPage() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  // Estados para modal RF8 (Verificacion y reserva)
  const [mostrarModalReserva, setMostrarModalReserva] = useState(false);
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('');
  const [cantidadInput, setCantidadInput] = useState(1);
  const [idPEInput, setIdPEInput] = useState('');
  const [alertaDeficit, setAlertaDeficit] = useState(null);
  const [mensajeExito, setMensajeExito] = useState('');
  const [procesandoReserva, setProcesandoReserva] = useState(false);

  // Estados para modal Agregar Producto
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaMarca, setNuevaMarca] = useState('');
  const [nuevoStock, setNuevoStock] = useState(1);
  const [guardandoProducto, setGuardandoProducto] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const cargarInventario = () => {
    fetch(`${API_URL}/api/inventario`)
      .then((res) => res.json())
      .then((data) => setProductos(Array.isArray(data) ? data : (data.datos || [])))
      .catch((err) => console.error("Error al cargar inventario:", err));
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  const productosFiltrados = (Array.isArray(productos) ? productos : []).filter((item) =>
    (item.producto || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleAbrirReserva = (item) => {
    setProductoSeleccionadoId(item ? item.id : '');
    setCantidadInput(1);
    setIdPEInput('');
    setAlertaDeficit(null);
    setMostrarModalReserva(true);
  };

  const handleVerificarYReservar = async (e) => {
    e.preventDefault();
    setAlertaDeficit(null);

    if (!productoSeleccionadoId || cantidadInput <= 0) {
      alert("Seleccione un articulo y especifique una cantidad valida.");
      return;
    }

    try {
      setProcesandoReserva(true);
      const res = await fetch(`${API_URL}/api/inventario/reservar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idInventario: productoSeleccionadoId,
          cantidadRequerida: Number(cantidadInput),
          idPE: idPEInput || null
        })
      });

      const data = await res.json();

      if (res.status === 409 && data.alertaDeficit) {
        setAlertaDeficit(data);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "No se pudo realizar la consulta de stock.");
      }

      setMensajeExito(data.mensaje);
      setTimeout(() => setMensajeExito(''), 4000);
      setMostrarModalReserva(false);
      cargarInventario();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcesandoReserva(false);
    }
  };

  const handleCrearProducto = async (e) => {
    e.preventDefault();

    if (!nuevoNombre.trim() || nuevoStock <= 0) {
      alert("Ingrese un nombre de producto y un stock inicial valido.");
      return;
    }

    try {
      setGuardandoProducto(true);
      const res = await fetch(`${API_URL}/api/inventario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto: nuevoNombre.trim(),
          marca: nuevaMarca.trim() || null,
          stock: Number(nuevoStock),
          disponible: Number(nuevoStock),
          ocupado: 0,
          mantencion: 0
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo ingresar el producto al inventario.");
      }

      setMensajeExito(`Producto "${data.producto}" ingresado exitosamente al inventario.`);
      setTimeout(() => setMensajeExito(''), 4000);

      setNuevoNombre('');
      setNuevaMarca('');
      setNuevoStock(1);
      setMostrarModalCrear(false);
      cargarInventario();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardandoProducto(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e9e7ec', fontFamily: 'sans-serif' }}>

      <main style={{ flex: 1, padding: '30px', boxSizing: 'border-box' }}>
        
        {mensajeExito && (
          <div style={{ backgroundColor: '#d1e7dd', color: '#0f5132', padding: '12px 20px', borderRadius: '12px', marginBottom: '16px', fontWeight: 'bold' }}>
            {mensajeExito}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ flex: 1, padding: '12px 20px', borderRadius: '30px', border: '1px solid #ccc', outline: 'none', fontSize: '15px' }}
          />
          <button 
            type="button"
            onClick={() => handleAbrirReserva(null)}
            style={{ backgroundColor: '#1e40af', color: 'white', border: 'none', padding: '12px 22px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Verificar stock
          </button>
          <button 
            type="button"
            onClick={() => setMostrarModalCrear(true)}
            style={{ backgroundColor: '#734b75', color: 'white', border: 'none', padding: '12px 22px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Agregar producto
          </button>
          <button style={{ backgroundColor: '#734b75', color: 'white', border: 'none', padding: '12px 22px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>
            Importar excel
          </button>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: '#734b75', color: 'white' }}>
                <th style={{ padding: '16px' }}>Producto</th>
                <th style={{ padding: '16px' }}>Marca</th>
                <th style={{ padding: '16px' }}>Stock Total</th>
                <th style={{ padding: '16px' }}>Disponible</th>
                <th style={{ padding: '16px' }}>Ocupado</th>
                <th style={{ padding: '16px' }}>Mantencion</th>
                <th style={{ padding: '16px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '14px', textAlign: 'left', paddingLeft: '32px', fontWeight: '500' }}>{item.producto}</td>
                  <td style={{ padding: '14px' }}>{item.marca || '-'}</td>
                  <td style={{ padding: '14px' }}>{item.stock}</td>
                  <td style={{ padding: '14px', color: item.disponible > 0 ? '#15803d' : '#b91c1c', fontWeight: 'bold' }}>
                    {item.disponible}
                  </td>
                  <td style={{ padding: '14px' }}>{item.ocupado}</td>
                  <td style={{ padding: '14px' }}>{item.mantencion}</td>
                  <td style={{ padding: '14px' }}>
                    <button 
                      onClick={() => handleAbrirReserva(item)}
                      style={{ backgroundColor: '#1e40af', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '13px', marginRight: '8px', fontWeight: 'bold' }} 
                      title="Verificar y reservar stock"
                    >
                      Reservar
                    </button>
                    <button style={{ backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '13px', marginRight: '8px' }}>
                      Editar
                    </button>
                    <button style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '13px' }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal Agregar Producto */}
      {mostrarModalCrear && (
        <div 
          onClick={() => !guardandoProducto && setMostrarModalCrear(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white', padding: '28px', borderRadius: '16px',
              maxWidth: '450px', width: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', color: '#734b75', fontSize: '20px' }}>
              Agregar Nuevo Producto al Inventario
            </h2>

            <form onSubmit={handleCrearProducto}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>
                  Nombre del Producto / Equipo:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Consola de Audio Yamah 16Ch"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>
                  Marca / Modelo (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej. Yamaha"
                  value={nuevaMarca}
                  onChange={(e) => setNuevaMarca(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>
                  Stock Inicial:
                </label>
                <input
                  type="number"
                  min="1"
                  value={nuevoStock}
                  onChange={(e) => setNuevoStock(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setMostrarModalCrear(false)}
                  disabled={guardandoProducto}
                  style={{ backgroundColor: '#64748b', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoProducto}
                  style={{
                    backgroundColor: '#734b75', color: 'white', border: 'none', padding: '10px 22px',
                    borderRadius: '20px', fontWeight: 'bold', cursor: guardandoProducto ? 'wait' : 'pointer',
                    opacity: guardandoProducto ? 0.7 : 1
                  }}
                >
                  {guardandoProducto ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Control Disponibilidad */}
      {mostrarModalReserva && (
        <div 
          onClick={() => !procesandoReserva && setMostrarModalReserva(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white', padding: '28px', borderRadius: '16px',
              maxWidth: '500px', width: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', color: '#1e40af', fontSize: '20px' }}>
              Control de Disponibilidad y Reserva
            </h2>

            {alertaDeficit && (
              <div style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', padding: '14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                <strong>Alerta de Deficit detectada:</strong>
                <p style={{ margin: '6px 0' }}>{alertaDeficit.mensaje}</p>
                <p style={{ margin: '0', fontSize: '13px', fontStyle: 'italic', color: '#7f1d1d' }}>
                  Recomendacion: {alertaDeficit.sugerencia}
                </p>
              </div>
            )}

            <form onSubmit={handleVerificarYReservar}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>
                  Seleccionar Producto / Equipo:
                </label>
                <select
                  value={productoSeleccionadoId}
                  onChange={(e) => setProductoSeleccionadoId(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                >
                  <option value="">-- Seleccionar articulo --</option>
                  {productos.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.producto} ({prod.marca || 'Sin marca'}) - Disponible: {prod.disponible}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>
                  Cantidad Requerida:
                </label>
                <input
                  type="number"
                  min="1"
                  value={cantidadInput}
                  onChange={(e) => setCantidadInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>
                  ID Evento (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej. 102"
                  value={idPEInput}
                  onChange={(e) => setIdPEInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setMostrarModalReserva(false)}
                  disabled={procesandoReserva}
                  style={{ backgroundColor: '#64748b', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesandoReserva}
                  style={{
                    backgroundColor: '#1e40af', color: 'white', border: 'none', padding: '10px 22px',
                    borderRadius: '20px', fontWeight: 'bold', cursor: procesandoReserva ? 'wait' : 'pointer',
                    opacity: procesandoReserva ? 0.7 : 1
                  }}
                >
                  {procesandoReserva ? 'Verificando...' : 'Verificar y Reservar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}