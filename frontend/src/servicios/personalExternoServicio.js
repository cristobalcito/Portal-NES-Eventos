const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function obtenerCurriculumServicio(rut, vista = false) {
  const consulta = vista ? '?vista=1' : '';
  const respuesta = await fetch(`${API_URL}/api/personal-externo/${encodeURIComponent(rut)}/curriculum${consulta}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
  });

  if (!respuesta.ok) {
    throw new Error(vista ? 'No se pudo abrir el currículum.' : 'No se pudo descargar el currículum.');
  }

  return respuesta.blob();
}
