// ==============================================================================
// REGLAS DE NEGOCIO Y AUTENTICACIÓN PARA PLANES ESPECÍFICOS (BACKEND)
// ==============================================================================

const CONFIG_PLAN_ESPECIFICO = {
  DIAS_MINIMOS_CREACION: 14,          // 2 semanas mínimo para crear evento
  DIAS_MINIMOS_SIN_RECARGO: 14,      // 14+ días: sin costo extra por modificación
  DIAS_LIMITE_CON_RECARGO: 7,         // 7 a 13 días: aplica recargo por modificación
  PORCENTAJE_RECARGO_EDICION: 0.05,  // 5% de recargo sobre costo total
  PORCENTAJE_REEMBOLSO_CANCELAR: 0.50,// 50% de reembolso a menos de 7 días
  PORCENTAJE_MAXIMO_VARIACION_PRECIO: 0.25 // 25% tope de variación respecto al Plan Base
};

const ROLES_AUTORIZADOS_PLAN_ESPECIFICO = [
  'GERENTE_GENERAL',
  'ENCARGADO_COMERCIAL'
];

module.exports = {
  CONFIG_PLAN_ESPECIFICO,
  ROLES_AUTORIZADOS_PLAN_ESPECIFICO
};