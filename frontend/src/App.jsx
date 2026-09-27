import React from 'react';
import { AutenticacionProveedor } from './contextos/autenticacionContexto.jsx';
import LoginPagina from './paginas/LoginPagina.jsx';

export default function App() {
  return (
    <AutenticacionProveedor>
      <LoginPagina />
    </AutenticacionProveedor>
  );
}
