import React, { useState, useEffect } from 'react';
import {
  pedir, encabezadoAutorizacion, formatearFecha, estilos, Etiqueta
} from '../servicios/inventarioLogisticaServicio.jsx';

// RU-1: consultar el catálogo de equipos con la cantidad en cada estado
// (disponible, ocupado o en mantención) y filtrar por estado.
export default function EstadoEquiposPagina() {
  const [equipos, setEquipos] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // Cargar los equipos al abrir la página (se envía el token para verificar permisos)
  useEffect(() => {
    pedir('/api/estado-equipos', { headers: encabezadoAutorizacion() })
      .then((datos) => setEquipos(Array.isArray(datos) ? datos : []))
      .catch((err) => setErrorCarga(err.message))
      .finally(() => setCargando(false));
  }, []);

  // Totales para las tarjetas de resumen
  const sumar = (campo) => equipos.reduce((total, e) => total + e[campo], 0);
  const totales = {
    stock: sumar('stock'),
    disponible: sumar('disponible'),
    ocupado: sumar('ocupado'),
    mantencion: sumar('mantencion')
  };

  // Filtro por estado (botones) y por texto (buscador)
  const cumpleFiltro = (e) => {
    if (filtro === 'disponible') return e.disponible > 0;
    if (filtro === 'ocupado') return e.ocupado > 0;
    if (filtro === 'mantencion') return e.mantencion > 0;
    return true; // "todos"
  };
  const cumpleBusqueda = (e) => {
    const texto = `${e.codigo} ${e.producto} ${e.marca || ''}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  };
  const visibles = equipos.filter((e) => cumpleFiltro(e) && cumpleBusqueda(e));

  // Etiqueta que resume la situación de cada equipo
  const etiquetaEstado = (e) => {
    if (e.stock > 0 && e.disponible === 0) return <Etiqueta color="rojo">Sin unidades disponibles</Etiqueta>;
    if (e.mantencion > 0) return <Etiqueta color="naranjo">Con unidades en mantención</Etiqueta>;
    if (e.ocupado > 0) return <Etiqueta color="morado">Parcialmente ocupado</Etiqueta>;
    return <Etiqueta color="verde">Disponible</Etiqueta>;
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

  const tarjeta = (titulo, valor, color) => (
    <div style={{
      flex: 1, minWidth: '150px', backgroundColor: 'white', borderRadius: '15px', padding: '16px 20px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)', borderLeft: `6px solid ${color}`
    }}>
      <div style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>{titulo}</div>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginTop: '4px' }}>{valor}</div>
    </div>
  );

  return (
    <div style={estilos.pagina}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#523354', fontSize: '28px' }}>Estado de equipos</h1>
        <p style={{ margin: '4px 0 0', color: '#666' }}>Disponibilidad del inventario de la empresa.</p>
      </div>

      {/* Resumen de unidades */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tarjeta('Unidades totales', totales.stock, '#734b75')}
        {tarjeta('Disponibles', totales.disponible, '#2e7d32')}
        {tarjeta('Ocupadas', totales.ocupado, '#8a5b96')}
        {tarjeta('En mantención', totales.mantencion, '#e08a00')}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
        {botonFiltro('todos', 'Todos')}
        {botonFiltro('disponible', 'Disponibles')}
        {botonFiltro('ocupado', 'Ocupados')}
        {botonFiltro('mantencion', 'En mantención')}
        <input
          type="text" placeholder="Buscar por código, producto o marca..." value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: '220px', padding: '10px 18px', borderRadius: '25px', border: '1px solid #ccc', outline: 'none', fontSize: '14px' }}
        />
      </div>

      {/* Tabla de equipos */}
      <div style={estilos.contenedorTabla}>
        <table style={estilos.tabla}>
          <thead>
            <tr>
              <th style={estilos.th}>Código</th>
              <th style={estilos.th}>Producto</th>
              <th style={estilos.th}>Marca</th>
              <th style={estilos.th}>Stock</th>
              <th style={estilos.th}>Disponible</th>
              <th style={estilos.th}>Ocupado</th>
              <th style={estilos.th}>En mantención</th>
              <th style={estilos.th}>Estado</th>
              <th style={estilos.th}>Vuelve de mantención</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="9" style={estilos.td}>Cargando...</td></tr>
            ) : errorCarga ? (
              <tr><td colSpan="9" style={{ ...estilos.td, color: '#b3261e' }}>{errorCarga}</td></tr>
            ) : visibles.length === 0 ? (
              <tr><td colSpan="9" style={{ ...estilos.td, color: '#666' }}>No hay equipos para mostrar.</td></tr>
            ) : (
              visibles.map((e) => (
                <tr key={e.id}>
                  <td style={{ ...estilos.td, color: '#666', fontFamily: 'monospace' }}>{e.codigo}</td>
                  <td style={{ ...estilos.td, textAlign: 'left', fontWeight: 'bold' }}>{e.producto}</td>
                  <td style={estilos.td}>{e.marca || '-'}</td>
                  <td style={estilos.td}>{e.stock}</td>
                  <td style={{ ...estilos.td, color: '#2e7d32', fontWeight: 'bold' }}>{e.disponible}</td>
                  <td style={estilos.td}>{e.ocupado}</td>
                  <td style={{ ...estilos.td, color: e.mantencion > 0 ? '#8a4b00' : 'inherit' }}>{e.mantencion}</td>
                  <td style={estilos.td}>{etiquetaEstado(e)}</td>
                  <td style={estilos.td}>{e.proximoRetorno ? formatearFecha(e.proximoRetorno) : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
