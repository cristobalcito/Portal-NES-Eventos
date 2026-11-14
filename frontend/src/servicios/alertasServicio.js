
import { clienteApi } from './api.js';

// Obtener las alertas logísticas del sistema
export async function obtenerAlertasServicio() {
  return await clienteApi.get('/alertas');
}

// Marcar una alerta como leída
export async function marcarAlertaLeidaServicio(idAlerta) {
  return await clienteApi.patch(`/alertas/${idAlerta}/leida`);
}
