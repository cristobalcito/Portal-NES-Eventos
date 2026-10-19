// src/servicios/usuarioServicio.js

const API_URL = 'http://localhost:3000/api/usuarios'; // Ajusta a tu URL backend

// Función auxiliar para obtener el header con el RUT del Gerente General
const obtenerHeaders = () => {
  const usuarioGuardado = localStorage.getItem('usuario');
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  return {
    'Content-Type': 'application/json',
    'x-usuario-rut': usuario?.rut || ''
  };
};

export const obtenerUsuarios = async () => {
  const res = await fetch(API_URL, {
    method: 'GET',
    headers: obtenerHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw { response: { data } };
  return data;
};

export const crearUsuario = async (datosUsuario) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: obtenerHeaders(),
    body: JSON.stringify(datosUsuario)
  });
  const data = await res.json();
  if (!res.ok) throw { response: { data } };
  return data;
};

export const modificarUsuario = async (rut, datosActualizar) => {
  const res = await fetch(`${API_URL}/${rut}`, {
    method: 'PUT',
    headers: obtenerHeaders(),
    body: JSON.stringify(datosActualizar)
  });
  const data = await res.json();
  if (!res.ok) throw { response: { data } };
  return data;
};

export const eliminarUsuario = async (rut) => {
  const res = await fetch(`${API_URL}/${rut}`, {
    method: 'DELETE',
    headers: obtenerHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw { response: { data } };
  return data;
};