// frontend/src/servicios/autenticacionServicio.jsx
import { clienteApi } from './api.js';

export async function iniciarSesionServicio(credenciales) {
  return await clienteApi.post('/auth/login', credenciales);
}