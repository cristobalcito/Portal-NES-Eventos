const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const obtenerRolActivo = () => {
  const rolDirecto = localStorage.getItem('rol');
  if (rolDirecto) return rolDirecto;

  try {
    const usuarioRaw = localStorage.getItem('usuario');
    if (usuarioRaw) {
      const usuario = JSON.parse(usuarioRaw);
      if (usuario.rol) return usuario.rol;
      if (usuario.tipo) return usuario.tipo;
      if (usuario.cliente) return 'CLIENTE';
      if (usuario.personalEventual) return 'PERSONAL_EVENTUAL';
    }
  } catch {
    return '';
  }

  return '';
};

const obtenerHeaders = () => {
  const token = localStorage.getItem('token');
  const rol = obtenerRolActivo();
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (rol) {
    headers['x-user-role'] = rol;
  }

  return headers;
};

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