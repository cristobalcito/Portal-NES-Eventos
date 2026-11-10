const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Función para obtener headers con autenticación/rol (RBAC)
const obtenerHeaders = () => {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol') || 'GERENTE_GENERAL'; // Rol por defecto de prueba
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'x-user-role': rol
  };
};

// 1. Obtener todos los planes específicos / eventos del horario compartido
export const obtenerPlanesEspecificosServicio = async () => {
  const res = await fetch(`${API_URL}/api/planes-especificos`, {
    headers: obtenerHeaders()
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.mensaje || 'Error al obtener los planes específicos.');
  }
  return await res.json();
};

// 2. Modificar un plan específico (Aplica recargo del 5% entre 7 y 13 días)
export const modificarPlanEspecificoServicio = async (idPE, datos) => {
  const res = await fetch(`${API_URL}/api/planes-especificos/${idPE}`, {
    method: 'PUT',
    headers: obtenerHeaders(),
    body: JSON.stringify(datos)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.mensaje || 'Error al modificar el plan específico.');
  }
  return await res.json();
};

// 3. Eliminar / Cancelar un plan específico (Aplica reembolso del 50% si es < 7 días)
export const eliminarPlanEspecificoServicio = async (idPE) => {
  const res = await fetch(`${API_URL}/api/planes-especificos/${idPE}`, {
    method: 'DELETE',
    headers: obtenerHeaders()
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.mensaje || 'Error al cancelar el plan específico.');
  }
  return await res.json();
};

// 4. Ajustar asistentes con reglas temporales (RF4)
export const ajustarAsistentesServicio = async (idPE, nuevosAsistentes) => {
  const res = await fetch(`${API_URL}/api/planes-especificos/${idPE}/ajustar-asistentes`, {
    method: 'PUT',
    headers: obtenerHeaders(),
    body: JSON.stringify({ nuevosAsistentes })
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(datos.mensaje || 'No se pudo realizar el ajuste de asistentes.');
  }
  return datos;
};

// 5. Reprogramar fecha con reglas temporales (RF5)
export const reprogramarFechaServicio = async (idPE, nuevaFecha) => {
  const res = await fetch(`${API_URL}/api/planes-especificos/${idPE}/reprogramar-fecha`, {
    method: 'PUT',
    headers: obtenerHeaders(),
    body: JSON.stringify({ nuevaFecha })
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(datos.mensaje || 'No se pudo reprogramar la fecha del evento.');
  }
  return datos;
};