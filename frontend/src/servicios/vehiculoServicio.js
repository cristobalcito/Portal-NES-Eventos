const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const BASE_URL = RAW_API_URL.replace(/\/api.*$/, '').replace(/\/+$/, '');

const obtenerHeaders = (incluirJson = false) => {
  const token = localStorage.getItem('token') || '';
  const raw = JSON.parse(localStorage.getItem('usuario') || '{}');
  const u = raw.usuario || raw.user || raw;

  const candidatosRut = [u.rut, u.Rut, u.RUT, u.rutPersona, u.run, u.Run];
  const rutUsuario =
    candidatosRut.find((r) => r && r !== 'No especificado') || '';
  const emailUsuario = u.email || u.Email || '';

  const headers = {
    Authorization: `Bearer ${token}`,
    'x-usuario-rut': String(rutUsuario).trim(),
    'x-usuario-email': String(emailUsuario).trim()
  };

  if (incluirJson) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

const manejarRespuesta = async (respuesta) => {
  const data = await respuesta.json();
  if (!respuesta.ok) {
    const error = new Error(data?.mensaje || 'Error en la solicitud al servidor.');
    error.response = { data, status: respuesta.status };
    throw error;
  }
  return data;
};

export const verificarPermisoGerente = async () => {
  const res = await fetch(`${BASE_URL}/api/vehiculos/verificar-gerente`, {
    method: 'GET',
    headers: obtenerHeaders()
  });
  return manejarRespuesta(res);
};

export const obtenerVehiculos = async () => {
  const res = await fetch(`${BASE_URL}/api/vehiculos`, {
    method: 'GET',
    headers: obtenerHeaders()
  });
  return manejarRespuesta(res);
};

export const obtenerOpcionesReserva = async (patente = '') => {
  const query = patente ? `?patente=${encodeURIComponent(patente)}` : '';
  const res = await fetch(`${BASE_URL}/api/vehiculos/opciones-reserva${query}`, {
    method: 'GET',
    headers: obtenerHeaders()
  });
  return manejarRespuesta(res);
};

export const reservarVehiculo = async (patente, datosReserva) => {
  const res = await fetch(
    `${BASE_URL}/api/vehiculos/${encodeURIComponent(patente)}/reservar`,
    {
      method: 'POST',
      headers: obtenerHeaders(true),
      body: JSON.stringify(datosReserva)
    }
  );
  return manejarRespuesta(res);
};

export const cancelarReservaVehiculo = async (idReserva) => {
  const res = await fetch(`${BASE_URL}/api/vehiculos/reservas/${idReserva}`, {
    method: 'DELETE',
    headers: obtenerHeaders()
  });
  return manejarRespuesta(res);
};

export const crearVehiculo = async (datosFormulario) => {
  const formData = new FormData();
  formData.append('patente', datosFormulario.patente);
  formData.append('tipoAuto', datosFormulario.tipoAuto);
  formData.append('tipoLicencia', datosFormulario.tipoLicencia);

  if (datosFormulario.permisoCirculacion) {
    formData.append('permisoCirculacion', datosFormulario.permisoCirculacion);
  }

  if (datosFormulario.revisionTecnica) {
    formData.append('revisionTecnica', datosFormulario.revisionTecnica);
  }
  if (datosFormulario.antecedentes) {
    formData.append('antecedentes', datosFormulario.antecedentes);
  }

  const res = await fetch(`${BASE_URL}/api/vehiculos`, {
    method: 'POST',
    headers: obtenerHeaders(),
    body: formData
  });
  return manejarRespuesta(res);
};

export const modificarVehiculo = async (patenteOriginal, datosFormulario) => {
  const formData = new FormData();
  formData.append('nuevaPatente', datosFormulario.patente);
  formData.append('tipoAuto', datosFormulario.tipoAuto);
  formData.append('tipoLicencia', datosFormulario.tipoLicencia);

  if (datosFormulario.permisoCirculacion) {
    formData.append('permisoCirculacion', datosFormulario.permisoCirculacion);
  }

  if (datosFormulario.revisionTecnica) {
    formData.append('revisionTecnica', datosFormulario.revisionTecnica);
  }
  if (datosFormulario.antecedentes) {
    formData.append('antecedentes', datosFormulario.antecedentes);
  }

  const res = await fetch(
    `${BASE_URL}/api/vehiculos/${encodeURIComponent(patenteOriginal)}`,
    {
      method: 'PUT',
      headers: obtenerHeaders(),
      body: formData
    }
  );
  return manejarRespuesta(res);
};

export const eliminarVehiculo = async (patente) => {
  const res = await fetch(
    `${BASE_URL}/api/vehiculos/${encodeURIComponent(patente)}`,
    {
      method: 'DELETE',
      headers: obtenerHeaders()
    }
  );
  return manejarRespuesta(res);
};

export const cambiarMantencionVehiculo = async (patente, enMantencion) => {
  const res = await fetch(
    `${BASE_URL}/api/vehiculos/${encodeURIComponent(patente)}/mantencion`,
    {
      method: 'PATCH',
      headers: obtenerHeaders(true),
      body: JSON.stringify({ enMantencion })
    }
  );
  return manejarRespuesta(res);
};