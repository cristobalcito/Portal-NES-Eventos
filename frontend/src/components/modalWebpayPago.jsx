import React, { useState, useEffect } from 'react';

export default function ModalWebpayComponente({
  abierto,
  alCerrar,
  tipoPago,         // 'SUELDO' | 'EVENTO'
  monto,            // Número entero en CLP
  concepto,         // Ej: "Sueldo - Juan Pérez" o "Evento #12 - Matrimonio"
  alCompletarPago   // Callback opcional que recibe el comprobante simulado
}) {
  const [metodoPago, setMetodoPago] = useState('DEBITO'); // 'DEBITO' | 'CREDITO'
  const [banco, setBanco] = useState('Banco Estado');
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [cvv, setCvv] = useState('');
  const [cuotas, setCuotas] = useState(1);

  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [comprobante, setComprobante] = useState(null);

  // Leer usuario y rol desde localStorage
  let usuarioActual = null;
  try {
    const raw = localStorage.getItem('usuario');
    if (raw) usuarioActual = JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer usuario:', e);
  }

  const rol = (usuarioActual?.rol || '').toUpperCase();

  // Validar permiso según el tipo de pago
  const tienePermiso =
    tipoPago === 'SUELDO'
      ? rol === 'GERENTE_GENERAL' || rol === 'JEFE_OPERACIONES'
      : tipoPago === 'EVENTO'
      ? rol === 'CLIENTE'
      : false;

  useEffect(() => {
    if (abierto) {
      setMetodoPago('DEBITO');
      setBanco('Banco Estado');
      setNumeroTarjeta('');
      setVencimiento('');
      setCvv('');
      setCuotas(1);
      setProcesando(false);
      setError('');
      setComprobante(null);
    }
  }, [abierto]);

  if (!abierto) return null;

  const manejarCambioTarjeta = (e) => {
    const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formateado = soloNumeros.replace(/(\d{4})(?=\d)/g, '$1 ');
    setNumeroTarjeta(formateado);
  };

  const manejarCambioVencimiento = (e) => {
    const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (soloNumeros.length >= 3) {
      setVencimiento(`${soloNumeros.slice(0, 2)}/${soloNumeros.slice(2)}`);
    } else {
      setVencimiento(soloNumeros);
    }
  };

  const usarTarjetaPrueba = () => {
    setNumeroTarjeta('4532 0151 1283 0366');
    setVencimiento('12/28');
    setCvv('123');
  };

  const manejarPago = async (e) => {
    e.preventDefault();
    setError('');

    if (!tienePermiso) {
      setError('No tienes permisos para realizar este tipo de pago.');
      return;
    }

    const digitosTarjeta = numeroTarjeta.replace(/\s/g, '');
    if (digitosTarjeta.length < 16) {
      setError('Ingresa los 16 dígitos de la tarjeta.');
      return;
    }

    if (vencimiento.length < 5) {
      setError('Ingresa una fecha de vencimiento válida (MM/AA).');
      return;
    }

    if (cvv.length < 3) {
      setError('Ingresa el código de seguridad (CVV) de 3 dígitos.');
      return;
    }

    setProcesando(true);

    // Simular tiempo de respuesta del banco (1.2 segundos)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const comprobanteSimulado = {
      codigoAutorizacion: `WP-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`,
      tipoPago,
      monto: Number(monto || 0),
      metodoPago,
      banco: metodoPago === 'DEBITO' ? banco : 'Tarjeta Crédito',
      ultimos4Digitos: digitosTarjeta.slice(-4),
      cuotas: metodoPago === 'CREDITO' ? Number(cuotas) : 1,
      fechaPago: new Date().toISOString(),
      pagador: usuarioActual?.nombre || 'Usuario'
    };

    setProcesando(false);
    setComprobante(comprobanteSimulado);

    if (alCompletarPago) {
      alCompletarPago(comprobanteSimulado);
    }
  };

  return (
    <div
      onClick={procesando ? undefined : alCerrar}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        fontFamily: 'sans-serif'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          width: '92%',
          maxWidth: '450px',
          overflow: 'hidden',
          boxShadow: '0 20px 35px rgba(0,0,0,0.35)'
        }}
      >
        {/* Cabecera estilo Webpay Plus */}
        <div style={{
          background: 'linear-gradient(90deg, #6b1d5c 0%, #d9272e 100%)',
          color: '#ffffff',
          padding: '16px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '0.5px' }}>
              Webpay<span style={{ fontWeight: '300' }}>Plus</span>
            </span>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', opacity: 0.9 }}>
              NES Eventos • Simulador de Pagos
            </p>
          </div>
          {!procesando && (
            <button
              type="button"
              onClick={alCerrar}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Resumen del Comercio / Monto */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '14px 22px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {tipoPago === 'SUELDO' ? 'Pago de Sueldo' : 'Pago de Evento'}
            </span>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>
              {concepto || 'Transacción NES Eventos'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Monto a pagar</span>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#6b1d5c' }}>
              ${Number(monto || 0).toLocaleString('es-CL')}
            </p>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div style={{ padding: '20px 22px' }}>
          {!tienePermiso ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🚫</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>Acceso No Autorizado</h3>
              <p style={{ fontSize: '14px', color: '#475569', marginBottom: '18px' }}>
                {tipoPago === 'SUELDO'
                  ? 'Solo el Gerente General o el Jefe de Operaciones pueden pagar sueldos al personal.'
                  : 'Solo los usuarios con rol Cliente pueden pagar eventos.'}
              </p>
              <button
                type="button"
                onClick={alCerrar}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#475569',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Entendido
              </button>
            </div>
          ) : comprobante ? (
            /* Comprobante Aprobado */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                fontSize: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px'
              }}>
                ✓
              </div>
              <h3 style={{ margin: '0 0 4px 0', color: '#15803d' }}>¡Transacción Aprobada!</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                Comprobante generado correctamente
              </p>

              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Código Autorización:</span>
                  <strong>{comprobante.codigoAutorizacion}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Monto Pagado:</span>
                  <strong>${Number(comprobante.monto).toLocaleString('es-CL')} CLP</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Medio de Pago:</span>
                  <strong>{comprobante.metodoPago} (**** {comprobante.ultimos4Digitos})</strong>
                </div>
                {comprobante.metodoPago === 'CREDITO' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Cuotas:</span>
                    <strong>{comprobante.cuotas} cuota(s)</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Fecha:</span>
                  <strong>{new Date(comprobante.fechaPago).toLocaleString('es-CL')}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={alCerrar}
                style={{
                  width: '100%',
                  padding: '11px',
                  backgroundColor: '#6b1d5c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                Volver
              </button>
            </div>
          ) : (
            /* Formulario de Pago */
            <form onSubmit={manejarPago} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setMetodoPago('DEBITO')}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: metodoPago === 'DEBITO' ? '2px solid #6b1d5c' : '1px solid #cbd5e1',
                    backgroundColor: metodoPago === 'DEBITO' ? '#fdf4ff' : '#fff',
                    color: metodoPago === 'DEBITO' ? '#6b1d5c' : '#475569',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  💳 Redcompra / Débito
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('CREDITO')}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: metodoPago === 'CREDITO' ? '2px solid #6b1d5c' : '1px solid #cbd5e1',
                    backgroundColor: metodoPago === 'CREDITO' ? '#fdf4ff' : '#fff',
                    color: metodoPago === 'CREDITO' ? '#6b1d5c' : '#475569',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  💳 Tarjeta de Crédito
                </button>
              </div>

              {metodoPago === 'DEBITO' ? (
                <div>
                  <label style={labelStyle}>Selecciona tu Banco</label>
                  <select
                    value={banco}
                    onChange={(e) => setBanco(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="Banco Estado">BancoEstado</option>
                    <option value="Banco de Chile">Banco de Chile</option>
                    <option value="Banco Santander">Banco Santander</option>
                    <option value="Banco BCI">Banco BCI</option>
                    <option value="Scotiabank">Scotiabank</option>
                    <option value="Banco Itaú">Banco Itaú</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>Número de Cuotas</label>
                  <select
                    value={cuotas}
                    onChange={(e) => setCuotas(Number(e.target.value))}
                    style={inputStyle}
                  >
                    <option value={1}>Sin cuotas (1 cuota)</option>
                    <option value={3}>3 cuotas sin interés</option>
                    <option value={6}>6 cuotas sin interés</option>
                    <option value={12}>12 cuotas</option>
                  </select>
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={labelStyle}>Número de Tarjeta</label>
                  <button
                    type="button"
                    onClick={usarTarjetaPrueba}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6b1d5c',
                      fontSize: '11px',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Rellenar tarjeta de prueba
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="XXXX XXXX XXXX XXXX"
                  value={numeroTarjeta}
                  onChange={manejarCambioTarjeta}
                  style={{ ...inputStyle, letterSpacing: '1.5px', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Vencimiento (MM/AA)</label>
                  <input
                    type="text"
                    placeholder="12/28"
                    value={vencimiento}
                    onChange={manejarCambioVencimiento}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Código CVV</label>
                  <input
                    type="password"
                    placeholder="123"
                    maxLength={3}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    style={inputStyle}
                  />
                </div>
              </div>

              {error && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={procesando}
                style={{
                  marginTop: '4px',
                  padding: '12px',
                  backgroundColor: procesando ? '#94a3b8' : '#6b1d5c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  cursor: procesando ? 'wait' : 'pointer'
                }}
              >
                {procesando ? 'Procesando pago...' : `Pagar $${Number(monto || 0).toLocaleString('es-CL')}`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#334155',
  marginBottom: '4px'
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none'
};