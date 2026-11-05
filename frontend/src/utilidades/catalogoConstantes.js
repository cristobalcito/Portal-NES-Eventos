// ==============================================================================
// 1. REGLAS DE INTERFAZ Y CATÁLOGO VISUAL
// Configuración para contadores de texto y visualización de planes en el frontend.
// ==============================================================================
export const CONFIG_CATALOGO = {
  MAX_CARACTERES_DESCRIPCION: 300,
  MAX_PLANES_VISIBLES: 3,
  PORCENTAJE_MAXIMO_VARIACION_PRECIO: 0.25 // 25% de variación máxima respecto al costo base
};

// ==============================================================================
// 2. REGLAS DE NEGOCIO Y PLAZOS PARA PLANES ESPECÍFICOS / EVENTOS
// Tiempos mínimos de antelación, recargos por modificación y reembolso por cancelación.
// ==============================================================================
export const CONFIG_PLAN_ESPECIFICO = {
  DIAS_MINIMOS_CREACION: 14,          // 2 semanas mínimo para poder crear un evento
  DIAS_MINIMOS_SIN_RECARGO: 14,      // 14 días o más: modificación gratuita sin penalización
  DIAS_LIMITE_CON_RECARGO: 7,         // Entre 7 y 13 días: aplica recargo por modificación
  PORCENTAJE_RECARGO_EDICION: 0.05,  // 5% de recargo sobre el precio por editar en ventana de 7-13 días
  PORCENTAJE_REEMBOLSO_CANCELAR: 0.50// 50% de reembolso si se cancela a menos de 7 días del evento
};

// ==============================================================================
// 3. CONTROL DE ACCESO BASADO EN ROLES (RBAC)
// Roles autorizados para crear, editar o eliminar planes específicos y eventos.
// ==============================================================================
export const ROLES_AUTORIZADOS_PLAN_ESPECIFICO = [
  'GERENTE_GENERAL',
  'ENCARGADO_COMERCIAL'
];