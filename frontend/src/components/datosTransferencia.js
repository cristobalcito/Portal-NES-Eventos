export const camposPago = {
  titular: 'Nombre del titular',
  rut: 'RUT del titular',
  banco: 'Banco',
  tipo: 'Tipo de cuenta',
  numero: 'Número de cuenta',
  correo: 'Correo para el comprobante',
};

export function leerPago(texto, persona = {}) {
  const inicial = {
    titular: persona.usuario?.nombre ?? persona.nombre ?? '',
    rut: persona.rut ?? '',
    banco: '', tipo: '', numero: '', correo: '', anterior: ''
  };
  if (!texto || texto === 'Pendiente') return inicial;
  try {
    const registro = JSON.parse(texto);
    if (registro?.formato === 'transferencia-v1') {
      for (const clave of Object.keys(inicial)) {
        if (typeof registro[clave] === 'string') inicial[clave] = registro[clave];
      }
      return inicial;
    }
  } catch {
    // Las fichas antiguas guardaban un texto libre.
  }
  return { ...inicial, anterior: texto };
}

export function mostrarPago(texto) {
  if (!texto || texto === 'Pendiente') return 'Sin registrar';
  const datos = leerPago(texto);
  return [...Object.entries(camposPago)
    .filter(([clave]) => datos[clave])
    .map(([clave, etiqueta]) => etiqueta + ': ' + datos[clave]), datos.anterior]
    .filter(Boolean).join('\n') || 'Sin registrar';
}
