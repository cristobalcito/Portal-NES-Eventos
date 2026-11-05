// Valida un RUT chileno revisando su dígito verificador (algoritmo "módulo 11").
// Si es válido lo devuelve con formato "12345678-9"; si no, devuelve null.
const normalizarRut = (rut) => {
  if (typeof rut !== 'string') return null;

  // 1. Quitar puntos, guion y espacios: "76.123.456-0" -> "761234560"
  const limpio = rut.replace(/[.\s-]/g, '').toUpperCase();

  // 2. Debe tener 7 u 8 números más el dígito verificador (número o K)
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return null;

  const numero = limpio.slice(0, -1);   // "76123456"
  const digito = limpio.slice(-1);      // "0"

  // 3. Multiplicar cada número, de derecha a izquierda, por 2, 3, 4, 5, 6, 7, 2, 3...
  let suma = 0;
  let multiplicador = 2;
  for (let i = numero.length - 1; i >= 0; i--) {
    suma += Number(numero[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  // 4. Calcular el dígito esperado: 11 - (suma % 11). Si da 11 es "0" y si da 10 es "K"
  const resultado = 11 - (suma % 11);
  let digitoEsperado = String(resultado);
  if (resultado === 11) digitoEsperado = '0';
  if (resultado === 10) digitoEsperado = 'K';

  // 5. Comparar con el dígito que escribió el usuario
  return digito === digitoEsperado ? `${numero}-${digito}` : null;
};

module.exports = { normalizarRut };
