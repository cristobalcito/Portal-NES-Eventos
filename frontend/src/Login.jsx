import { useEffect, useState } from 'react';

export default function Login({ onLoginSuccess, modoInicial = 'login', alVolverInicio }) {
  const [modo, setModo] = useState(modoInicial);
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');

  const [nombreRegistro, setNombreRegistro] = useState('');
  const [rutRegistro, setRutRegistro] = useState('');
  const [emailRegistro, setEmailRegistro] = useState('');
  const [fonoRegistro, setFonoRegistro] = useState('');
  const [passwordRegistro, setPasswordRegistro] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    setModo(modoInicial === 'registro' ? 'registro' : 'login');
    setError('');
  }, [modoInicial]);

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setError('');
  };

  const completarAutenticacion = (data, rutRespaldo = '') => {
    const usuarioFinal = {
      ...data.usuario,
      rut: data.usuario?.rut || data.usuario?.Rut || data.usuario?.RUT || rutRespaldo,
    };

    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(usuarioFinal));
    if (usuarioFinal.rol) {
      localStorage.setItem('rol', usuarioFinal.rol);
    }

    if (onLoginSuccess) {
      onLoginSuccess(usuarioFinal);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const respuesta = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: identificador,
          rut: identificador,
          password,
        }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.error || 'Ocurrió un error al iniciar sesión');
      }

      completarAutenticacion(data, identificador);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleRegistroSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (passwordRegistro !== confirmarPassword) {
      setError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch('http://localhost:3000/api/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombreRegistro,
          rut: rutRegistro,
          email: emailRegistro,
          fono: fonoRegistro,
          password: passwordRegistro,
        }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.error || 'Ocurrió un error al crear la cuenta');
      }

      completarAutenticacion(data, rutRegistro);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {alVolverInicio && (
          <button type="button" onClick={alVolverInicio} style={styles.btnVolver}>
            &lt; Volver al inicio
          </button>
        )}

        <img src="NES LOGO.png" alt="NES Eventos" style={styles.logo} />

        <div style={styles.tabs}>
          <button
            type="button"
            onClick={() => cambiarModo('login')}
            style={modo === 'login' ? styles.tabActiva : styles.tabInactiva}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => cambiarModo('registro')}
            style={modo === 'registro' ? styles.tabActiva : styles.tabInactiva}
          >
            Registrarme como Cliente
          </button>
        </div>

        <p style={styles.subtitulo}>
          {modo === 'login'
            ? 'Ingresa con tu correo electrónico o RUT'
            : 'Crea tu cuenta para consultar disponibilidad de fechas'}
        </p>

        {error && <div style={styles.error}>{error}</div>}

        {modo === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Correo Electrónico o RUT</label>
              <input
                type="text"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="ejemplo@nes-eventos.cl o 12345678-9"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={cargando} style={styles.boton}>
              {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>

            <div style={styles.pieFormulario}>
              <span>¿Aún no tienes cuenta de cliente? </span>
              <button
                type="button"
                onClick={() => cambiarModo('registro')}
                style={styles.enlaceCambio}
              >
                Regístrate aquí
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegistroSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nombre Completo</label>
              <input
                type="text"
                value={nombreRegistro}
                onChange={(e) => setNombreRegistro(e.target.value)}
                placeholder="Ej: Camila Soto"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.filaDoble}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>RUT</label>
                <input
                  type="text"
                  value={rutRegistro}
                  onChange={(e) => setRutRegistro(e.target.value)}
                  placeholder="12345678-9"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Teléfono</label>
                <input
                  type="tel"
                  value={fonoRegistro}
                  onChange={(e) => setFonoRegistro(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Correo Electrónico</label>
              <input
                type="email"
                value={emailRegistro}
                onChange={(e) => setEmailRegistro(e.target.value)}
                placeholder="cliente@correo.cl"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.filaDoble}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Contraseña</label>
                <input
                  type="password"
                  value={passwordRegistro}
                  onChange={(e) => setPasswordRegistro(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirmar Contraseña</label>
                <input
                  type="password"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" disabled={cargando} style={styles.boton}>
              {cargando ? 'Creando cuenta...' : 'Crear Cuenta de Cliente'}
            </button>

            <div style={styles.pieFormulario}>
              <span>¿Ya tienes una cuenta registrada? </span>
              <button
                type="button"
                onClick={() => cambiarModo('login')}
                style={styles.enlaceCambio}
              >
                Inicia sesión
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f3e8ff 0%, #f1f5f9 50%, #e2e8f0 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '1.5rem',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '2.25rem',
    borderRadius: '16px',
    boxShadow: '0 12px 30px rgba(82, 51, 84, 0.12)',
    border: '1px solid #e9d5ff',
    width: '100%',
    maxWidth: '460px',
  },
  btnVolver: {
    background: 'none',
    border: 'none',
    color: '#734b75',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '0.75rem',
  },
  logo: {
    width: '100%',
    maxWidth: '210px',
    height: 'auto',
    display: 'block',
    margin: '0 auto 1.25rem auto',
  },
  tabs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    backgroundColor: '#f8fafc',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    marginBottom: '1rem',
  },
  tabActiva: {
    backgroundColor: '#523354',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.6rem 0.5rem',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  tabInactiva: {
    backgroundColor: 'transparent',
    color: '#64748b',
    border: 'none',
    borderRadius: '8px',
    padding: '0.6rem 0.5rem',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  subtitulo: {
    marginTop: '0.25rem',
    marginBottom: '1.25rem',
    fontSize: '0.86rem',
    color: '#64748b',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  filaDoble: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
    gap: '0.85rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    padding: '0.7rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.88rem',
    outline: 'none',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  boton: {
    padding: '0.8rem',
    backgroundColor: '#523354',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.92rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '0.35rem',
    boxShadow: '0 4px 10px rgba(82, 51, 84, 0.25)',
  },
  pieFormulario: {
    textAlign: 'center',
    fontSize: '0.83rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  enlaceCambio: {
    background: 'none',
    border: 'none',
    color: '#734b75',
    fontWeight: '700',
    cursor: 'pointer',
    padding: 0,
    fontSize: '0.83rem',
    textDecoration: 'underline',
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: '0.75rem',
    borderRadius: '8px',
    fontSize: '0.84rem',
    marginBottom: '1rem',
    border: '1px solid #fecaca',
  },
};