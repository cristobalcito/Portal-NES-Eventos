
import { clienteApi } from './api.js';

export const EVENTO_AVISOS_ACTUALIZADOS = 'avisos-operativos-actualizados';

export function notificarCambioAlertas() {
  window.dispatchEvent(new Event(EVENTO_AVISOS_ACTUALIZADOS));
}

// Obtener los recordatorios y avisos operativos
export async function obtenerAlertasServicio() {
  return await clienteApi.get('/alertas');
}

// Marcar una alerta como leída
export async function marcarAlertaLeidaServicio(idAlerta) {
  return await clienteApi.patch(`/alertas/${idAlerta}/leida`);
}
