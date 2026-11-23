// Valida y normaliza una Placa Patente Única (PPU) chilena al formato "BBBB12" o "AB1234".
// Si no cumple la norma chilena, devuelve null.
var normalizarPatente = (patente) => {
  if (typeof patente !== 'string') return null;

  // Quitar espacios, puntos y guiones: "ab-cd-12" -> "ABCD12"
  var limpia = patente.replace(/[\s.-]/g, '').toUpperCase();

  // Formato antiguo (1985-2007): 2 letras + 4 dígitos (ej: AB1234)
  var formatoAntiguo = /^[A-Z]{2}\d{4}$/;

  // Formato actual (2007-presente): 4 consonantes autorizadas + 2 dígitos (ej: BCDF12)
  var formatoNuevo = /^[BCDFGHJKLPRSTVWXYZ]{4}\d{2}$/;

  if (formatoAntiguo.test(limpia) || formatoNuevo.test(limpia)) {
    return limpia;
  }

  return null;
};

module.exports = { normalizarPatente };