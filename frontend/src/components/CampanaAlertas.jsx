
import { useEffect, useState } from 'react';
import {
  obtenerAlertasServicio,
  marcarAlertaLeidaServicio
} from '../servicios/alertasServicio.js';

export default function CampanaAlertas() {
  const [alertas, setAlertas] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [actualizandoId, setActualizandoId] = useState(null);

  const cargarAlertas = async () => {
    setCargando(true);
    setError('');

    try {
      const respuesta = await obtenerAlertasServicio();
      setAlertas(respuesta.datos || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las alertas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAlertas();
  }, []);

  const marcarLeida = async (id) => {
    setActualizandoId(id);
    setError('');

    try {
      await marcarAlertaLeidaServicio(id);

      setAlertas((anteriores) =>
        anteriores.map((alerta) =>
          alerta.idAL === id
            ? { ...alerta, leida: true }
            : alerta
        )
      );
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la alerta.');
    } finally {
      setActualizandoId(null);
    }
  };

  const pendientes = alertas.filter((alerta) => !alerta.leida).length;

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';

    return new Date(fecha).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Santiago'
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '12px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'relative',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      <button
        type="button"
        onClick={() => {
          setAbierto((anterior) => !anterior);
        }}
        aria-expanded={abierto}
        aria-label={`Notificaciones: ${pendientes} pendientes`}
        style={{
          padding: '10px 14px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600
        }}
      >
        🔔 Alertas {pendientes > 0 ? `(${pendientes})` : ''}
      </button>

      {abierto && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: '16px',
            width: 'min(390px, calc(100vw - 32px))',
            maxHeight: '440px',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            zIndex: 100,
            padding: '16px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}
          >
            <strong>Notificaciones</strong>

            <button
              type="button"
              onClick={cargarAlertas}
              disabled={cargando}
              style={{ cursor: 'pointer' }}
            >
              Actualizar
            </button>
          </div>

          {error && (
            <p role="alert" style={{ color: '#b91c1c' }}>
              {error}
            </p>
          )}

          {cargando ? (
            <p>Cargando alertas...</p>
          ) : alertas.length === 0 ? (
            <p style={{ color: '#64748b' }}>
              No tienes alertas logísticas registradas.
            </p>
          ) : (
            alertas.map((alerta) => (
              <div
                key={alerta.idAL}
                style={{
                  padding: '12px',
                  marginBottom: '10px',
                  backgroundColor: alerta.leida ? '#f8fafc' : '#eff6ff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              >
                <strong>{alerta.razon}</strong>

                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  {alerta.contenido}
                </p>

                {alerta.planEspecifico && (
                  <small style={{ color: '#64748b' }}>
                    Evento: {formatearFecha(alerta.planEspecifico.fecha)}
                  </small>
                )}

                <div style={{ marginTop: '10px' }}>
                  {alerta.leida ? (
                    <small style={{ color: '#64748b' }}>
                      ✓ Leída
                    </small>
                  ) : (
                    <button
                      type="button"
                      disabled={actualizandoId === alerta.idAL}
                      onClick={() => marcarLeida(alerta.idAL)}
                      style={{
                        cursor: 'pointer',
                        padding: '6px 10px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px'
                      }}
                    >
                      {actualizandoId === alerta.idAL
                        ? 'Guardando...'
                        : 'Marcar como leída'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
