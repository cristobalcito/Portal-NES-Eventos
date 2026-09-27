import React, { useState } from 'react';
import CampoTexto from '../componentes/ui/campoTexto.jsx';
import Boton from '../componentes/ui/boton.jsx';
import { useAutenticacion } from '../contextos/autenticacionContexto.jsx';

export default function LoginPagina() {
  const [formulario, setFormulario] = useState({ rut: '', password: '' });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAutenticacion();

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      await login(formulario);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesion');
    } finally {
      setCargando(false);
    }
  };

  const bannerError = error 
    ? React.createElement('div', { style: { color: 'red', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffe6e6', borderRadius: '4px' } }, error)
    : null;

  return React.createElement(
    'div',
    { style: { maxWidth: '400px', margin: '4rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '8px' } },
    React.createElement('h2', null, 'Iniciar Sesion'),
    bannerError,
    React.createElement(
      'form',
      { onSubmit: manejarEnvio },
      React.createElement(CampoTexto, {
        etiqueta: 'RUT',
        nombre: 'rut',
        placeholder: '12345678-9',
        valor: formulario.rut,
        onChange: manejarCambio,
        requerido: true
      }),
      React.createElement(CampoTexto, {
        etiqueta: 'Contrasena',
        tipo: 'password',
        nombre: 'password',
        placeholder: '••••••••',
        valor: formulario.password,
        onChange: manejarCambio,
        requerido: true
      }),
      React.createElement(Boton, {
        texto: 'Entrar al Sistema',
        tipo: 'submit',
        cargando: cargando
      })
    )
  );
}