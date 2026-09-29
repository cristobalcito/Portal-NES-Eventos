// frontend/src/pages/InventarioPage.jsx
import { useState } from 'react';
import SidebarComponente from '../components/SidebarComponente';

// Datos de prueba basados en el boceto
const PRODUCTOS_INICIALES = [
  { id: 1, producto: 'Mesa', marca: '', stock: 60, disponible: 40, ocupado: 18, mantencion: 2 },
  { id: 2, producto: 'Silla', marca: '', stock: 120, disponible: 100, ocupado: 20, mantencion: 0 },
  { id: 3, producto: 'Parlante', marca: 'JBL', stock: 15, disponible: 10, ocupado: 5, mantencion: 0 },
  { id: 4, producto: 'Copa', marca: '', stock: 200, disponible: 150, ocupado: 50, mantencion: 0 },
  { id: 5, producto: 'Plato', marca: '', stock: 180, disponible: 140, ocupado: 35, mantencion: 5 },
];

export default function InventarioPage() {
  const [productos] = useState(PRODUCTOS_INICIALES);
  const [busqueda, setBusqueda] = useState('');

  // Filtro de búsqueda en tiempo real
  const productosFiltrados = productos.filter((item) =>
    item.producto.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e9e7ec', fontFamily: 'sans-serif' }}>
      {/* 1. Barra Lateral Reutilizable */}
      <SidebarComponente />

      {/* 2. Contenido Principal */}
      <main style={{ flex: 1, padding: '30px', boxSizing: 'border-box' }}>
        
        {/* Barra Superior: Buscador y Botones de Acción */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '30px',
              border: '1px solid #ccc',
              outline: 'none',
              fontSize: '15px'
            }}
          />
          <button style={{ backgroundColor: '#734b75', color: 'white', border: 'none', padding: '12px 22px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>
            Agregar producto
          </button>
          <button style={{ backgroundColor: '#734b75', color: 'white', border: 'none', padding: '12px 22px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>
            Importar excel
          </button>
        </div>

        {/* Tabla de Productos */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: '#734b75', color: 'white' }}>
                <th style={{ padding: '16px' }}>Producto</th>
                <th style={{ padding: '16px' }}>Marca</th>
                <th style={{ padding: '16px' }}>Stock</th>
                <th style={{ padding: '16px' }}>Disponible</th>
                <th style={{ padding: '16px' }}>Ocupado</th>
                <th style={{ padding: '16px' }}>Mantención</th>
                <th style={{ padding: '16px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '14px', textAlign: 'left', paddingLeft: '32px', fontWeight: '500' }}>{item.producto}</td>
                  <td style={{ padding: '14px' }}>{item.marca || '-'}</td>
                  <td style={{ padding: '14px' }}>{item.stock}</td>
                  <td style={{ padding: '14px' }}>{item.disponible}</td>
                  <td style={{ padding: '14px' }}>{item.ocupado}</td>
                  <td style={{ padding: '14px' }}>{item.mantencion}</td>
                  <td style={{ padding: '14px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', marginRight: '10px' }} title="Editar">📝</button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Eliminar">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
