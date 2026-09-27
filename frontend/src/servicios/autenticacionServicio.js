import { clienteApi } from './api.js';

export async function iniciarSesionServicio(credenciales) {
  // credenciales enviará { rut, password }
  return await clienteApi('/auth/login', {
    method: 'POST',
    body: credenciales,
  });
}