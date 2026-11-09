import React, { useEffect, useState } from 'react';
import { Calendario } from '../components/Calendario';

const HomePage = ({ usuario = {}, handleLogout }) => {
  const [stats, setStats] = useState({
    eventosActivos: 0,
    aforoPromedio: 0,
    recursosDisponibles: 0,
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        const respuesta = await fetch('http://localhost:3000/api/dashboard/stats');
        if (respuesta.ok) {
          const data = await respuesta.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error al conectar con la API de estadísticas:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarEstadisticas();
  }, []);

  const nombre = usuario.nombre || 'Usuario';
  const rut = usuario.rut || 'Sin RUT registrado';
  const email = usuario.email || 'Sin correo registrado';
  const rol = usuario.rol || usuario.role || 'CLIENTE';

  const formatearRol = (rolTexto) => {
    return rolTexto.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div style={styles.container}>
      {/* Banner de Bienvenida */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>¡Bienvenido de vuelta, {nombre}!</h1>
          <p style={styles.subtitle}>Portal de Gestión de Eventos y Recursos - NES</p>
        </div>
        <span style={styles.badge}>{formatearRol(rol)}</span>
      </header>

      {/* Grid de Estadísticas superior */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>
            {cargando ? '...' : stats.eventosActivos}
          </span>
          <span style={styles.statLabel}>Eventos Activos</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>
            {cargando ? '...' : `${stats.aforoPromedio}%`}
          </span>
          <span style={styles.statLabel}>Capacidad de Aforo</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>
            {cargando ? '...' : stats.recursosDisponibles}
          </span>
          <span style={styles.statLabel}>Recursos Disponibles</span>
        </div>
      </div>

      {/* Disposición Principal en 2 Columnas */}
      <div style={styles.layoutWrapper}>
        {/* Columna Izquierda: Calendario */}
        <section style={styles.columnaIzquierda}>
          <h2 style={styles.sectionTitle}>Calendario de Eventos</h2>
          <Calendario />
        </section>

        {/* Columna Derecha: Perfil y Estado */}
        <aside style={styles.columnaDerecha}>
          {/* Tarjeta de Perfil */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Información de Mi Perfil</h2>
            <div style={styles.profileInfo}>
              <div style={styles.infoRow}>
                <strong>RUT:</strong> <span>{rut}</span>
              </div>
              <div style={styles.infoRow}>
                <strong>Correo:</strong> <span>{email}</span>
              </div>
              <div style={styles.infoRow}>
                <strong>Rol asignado:</strong> <span>{formatearRol(rol)}</span>
              </div>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>

          {/* Tarjeta de Estado del Sistema */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Estado del Sistema</h2>
            <p style={styles.systemText}>
              Utiliza la barra lateral para navegar entre los módulos de gestión.
            </p>
            <div style={styles.statusBox}>
              <span style={styles.statusDot}></span>
              <span>Servidores y base de datos operativos.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '2rem', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', color: '#1e293b' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #e2e8f0' },
  title: { margin: 0, fontSize: '1.875rem', fontWeight: '700', color: '#0f172a' },
  subtitle: { margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' },
  badge: { backgroundColor: '#2563eb', color: '#ffffff', padding: '0.4rem 0.8rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '600' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' },
  statCard: { backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #e2e8f0' },
  statNumber: { fontSize: '2rem', fontWeight: '700', color: '#2563eb' },
  statLabel: { fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' },
  
  /* Layout de 2 columnas */
  layoutWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.5rem',
    alignItems: 'flex-start',
  },
  columnaIzquierda: {
    flex: '2 1 550px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  columnaDerecha: {
    flex: '1 1 300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: '#0f172a',
    margin: 0,
  },

  /* Tarjetas */
  card: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
  cardTitle: { margin: '0 0 1.25rem 0', fontSize: '1.2rem', fontWeight: '600', color: '#0f172a' },
  profileInfo: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' },
  infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' },
  logoutBtn: { width: '100%', padding: '0.75rem', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  systemText: { color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1rem' },
  statusBox: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.9rem', fontWeight: '500' },
  statusDot: { width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%' },
};

export default HomePage;