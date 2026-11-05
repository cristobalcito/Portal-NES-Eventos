const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Importación centralizada de constantes de negocio y roles
const {
  CONFIG_CATALOGO,
  CONFIG_PLAN_ESPECIFICO,
  ROLES_AUTORIZADOS_PLAN_ESPECIFICO
} = require('../constants/catalogoConstantes.js');

/**
 * Función auxiliar para verificar si el usuario tiene rol permitido (RBAC).
 */
const verificarRolAutorizado = (req) => {
  const rolUsuario = req.usuario?.rol || req.headers['x-user-role'];
  return ROLES_AUTORIZADOS_PLAN_ESPECIFICO.includes(rolUsuario);
};

/**
 * Función auxiliar para calcular diferencia en días entre la fecha del evento y la fecha actual.
 */
const obtenerDiferenciaDias = (fechaObjetivo) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaEvento = new Date(fechaObjetivo);
  fechaEvento.setHours(0, 0, 0, 0);
  const diferenciaMS = fechaEvento.getTime() - hoy.getTime();
  return Math.ceil(diferenciaMS / (1000 * 60 * 60 * 24));
};

// ==============================================================================
// 1. CREAR PLAN ESPECÍFICO / EVENTO
// ==============================================================================
const crearPlanEspecifico = async (req, res) => {
  try {
    // A. Control de acceso por rol (RBAC)
    if (!verificarRolAutorizado(req)) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Acceso denegado: Solo el Gerente General y el Encargado Comercial pueden crear planes específicos.'
      });
    }

    const {
      planBaseId,
      costoTotal,
      descripcion,
      lugar,
      numPersonas,
      personal,
      fecha,
      horaSalida,
      horaLlegada,
      horaVuelta,
      equipamientos // Arreglo: [{ productoId: 1, cantidad: 2 }, ...]
    } = req.body;

    // B. Validación de costo (Entero positivo, no decimales, no negativo)
    const costoNumerico = Number(costoTotal);
    if (isNaN(costoNumerico) || costoNumerico < 0 || !Number.isInteger(costoNumerico)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El costo total debe ser un número entero positivo (sin decimales ni números negativos).'
      });
    }

    // C. Validación de límite de variación del 25% respecto al Plan Base (si aplica)
    if (planBaseId) {
      const planBaseOriginal = await prisma.planBase.findUnique({
        where: { idPL: parseInt(planBaseId, 10) }
      });

      if (planBaseOriginal && planBaseOriginal.costoBase) {
        const costoBase = Number(planBaseOriginal.costoBase);
        const limiteVariacion = CONFIG_CATALOGO.PORCENTAJE_MAXIMO_VARIACION_PRECIO || 0.25;

        const precioMinimo = Math.round(costoBase * (1 - limiteVariacion));
        const precioMaximo = Math.round(costoBase * (1 + limiteVariacion));

        if (costoNumerico < precioMinimo || costoNumerico > precioMaximo) {
          return res.status(400).json({
            exito: false,
            mensaje: `El precio no puede variar más de un ${(limiteVariacion * 100)}% respecto al plan base ($${costoBase.toLocaleString('es-CL')} CLP). Rango permitido: $${precioMinimo.toLocaleString('es-CL')} - $${precioMaximo.toLocaleString('es-CL')} CLP.`
          });
        }
      }
    }

    // D. Validación de fecha (Mínimo 14 días de antelación)
    const diasAntelacion = obtenerDiferenciaDias(fecha);
    if (diasAntelacion < CONFIG_PLAN_ESPECIFICO.DIAS_MINIMOS_CREACION) {
      return res.status(400).json({
        exito: false,
        mensaje: `Los planes específicos deben programarse con un mínimo de ${CONFIG_PLAN_ESPECIFICO.DIAS_MINIMOS_CREACION} días (2 semanas) de antelación.`
      });
    }

    // E. Verificación de stock disponible en inventario
    let tieneStockSuficiente = true;
    const itemsAProcesar = [];

    if (Array.isArray(equipamientos) && equipamientos.length > 0) {
      for (const item of equipamientos) {
        const prodId = parseInt(item.productoId, 10);
        const cantRequerida = parseInt(item.cantidad, 10);

        const productoInv = await prisma.inventario.findUnique({
          where: { id: prodId }
        });

        if (!productoInv || productoInv.disponible < cantRequerida) {
          tieneStockSuficiente = false;
        }

        itemsAProcesar.push({
          id: prodId,
          cantidad: cantRequerida
        });
      }
    }

    const estadoPlan = tieneStockSuficiente ? 'CONFIRMADO' : 'PENDIENTE';

    // F. Transacción en Base de Datos
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear el Plan Específico
      const nuevoPlan = await tx.planEspecifico.create({
        data: {
          costoTotal: costoNumerico,
          descripcion: descripcion ? descripcion.trim() : '',
          lugar: lugar ? lugar.trim() : '',
          numPersonas: parseInt(numPersonas, 10),
          personal: personal ? personal.trim() : '',
          fecha: new Date(fecha),
          estado: estadoPlan,
          planBaseId: planBaseId ? parseInt(planBaseId, 10) : null
        }
      });

      // 2. Crear Horario si fue enviado
      if (horaSalida && horaLlegada && horaVuelta) {
        await tx.horario.create({
          data: {
            horaSalida: new Date(horaSalida),
            horaLlegada: new Date(horaLlegada),
            horaVuelta: new Date(horaVuelta),
            planEspecificoId: nuevoPlan.idPE
          }
        });
      }

      // 3. Si hubo stock suficiente, actualizar inventario
      if (tieneStockSuficiente && itemsAProcesar.length > 0) {
        for (const item of itemsAProcesar) {
          await tx.inventario.update({
            where: { id: item.id },
            data: {
              disponible: { decrement: item.cantidad },
              ocupado: { increment: item.cantidad }
            }
          });
        }
      }

      return nuevoPlan;
    });

    return res.status(201).json({
      exito: true,
      mensaje: tieneStockSuficiente
        ? 'Plan específico creado y equipamiento reservado exitosamente.'
        : 'Plan específico creado en estado PENDIENTE por falta de stock suficiente en inventario.',
      estado: estadoPlan,
      datos: resultado
    });

  } catch (error) {
    console.error('Error al crear plan específico:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al crear el plan específico.',
      detalles: error.message
    });
  }
};

// ==============================================================================
// 2. MODIFICAR PLAN ESPECÍFICO (Con recargo por fecha)
// ==============================================================================
const modificarPlanEspecifico = async (req, res) => {
  try {
    // A. Control de acceso por rol (RBAC)
    if (!verificarRolAutorizado(req)) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Acceso denegado: Solo el Gerente General y el Encargado Comercial pueden modificar planes específicos.'
      });
    }

    const { idPE } = req.params;
    const { costoTotal, descripcion, lugar, numPersonas, personal, fecha } = req.body;
    const idNumerico = parseInt(idPE, 10);

    const planExistente = await prisma.planEspecifico.findUnique({
      where: { idPE: idNumerico }
    });

    if (!planExistente) {
      return res.status(404).json({
        exito: false,
        mensaje: 'El plan específico no existe.'
      });
    }

    const diasAntelacion = obtenerDiferenciaDias(planExistente.fecha);

    // Regla 1: No se permite modificar a menos de 1 semana (7 días)
    if (diasAntelacion < CONFIG_PLAN_ESPECIFICO.DIAS_LIMITE_CON_RECARGO) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se permiten modificaciones a menos de 1 semana (7 días) de la fecha del evento.'
      });
    }

    let nuevoCosto = costoTotal ? Number(costoTotal) : planExistente.costoTotal;
    let recargoAplicado = 0;

    // Regla 2: Modificar entre 1 y 2 semanas (7 a 13 días) aplica recargo del 5%
    if (diasAntelacion >= CONFIG_PLAN_ESPECIFICO.DIAS_LIMITE_CON_RECARGO && 
        diasAntelacion < CONFIG_PLAN_ESPECIFICO.DIAS_MINIMOS_SIN_RECARGO) {
      recargoAplicado = nuevoCosto * CONFIG_PLAN_ESPECIFICO.PORCENTAJE_RECARGO_EDICION;
      nuevoCosto = Math.round(nuevoCosto + recargoAplicado);
    }

    // Validar entero positivo
    if (isNaN(nuevoCosto) || nuevoCosto < 0 || !Number.isInteger(nuevoCosto)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El costo total resultante debe ser un número entero positivo.'
      });
    }

    const planActualizado = await prisma.planEspecifico.update({
      where: { idPE: idNumerico },
      data: {
        costoTotal: nuevoCosto,
        descripcion: descripcion ? descripcion.trim() : planExistente.descripcion,
        lugar: lugar ? lugar.trim() : planExistente.lugar,
        numPersonas: numPersonas ? parseInt(numPersonas, 10) : planExistente.numPersonas,
        personal: personal ? personal.trim() : planExistente.personal,
        fecha: fecha ? new Date(fecha) : planExistente.fecha
      }
    });

    return res.status(200).json({
      exito: true,
      mensaje: recargoAplicado > 0
        ? `Plan modificado con éxito. Se aplicó un recargo del ${CONFIG_PLAN_ESPECIFICO.PORCENTAJE_RECARGO_EDICION * 100}% ($${recargoAplicado}) por modificar entre 1 y 2 semanas antes.`
        : 'Plan modificado exitosamente sin recargos.',
      datos: planActualizado
    });

  } catch (error) {
    console.error('Error al modificar plan específico:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al modificar el plan específico.'
    });
  }
};

// ==============================================================================
// 3. ELIMINAR / CANCELAR PLAN ESPECÍFICO (Con penalizaciones de reembolso)
// ==============================================================================
const eliminarPlanEspecifico = async (req, res) => {
  try {
    // A. Control de acceso por rol (RBAC)
    if (!verificarRolAutorizado(req)) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Acceso denegado: Solo el Gerente General y el Encargado Comercial pueden eliminar planes específicos.'
      });
    }

    const { idPE } = req.params;
    const idNumerico = parseInt(idPE, 10);

    const planExistente = await prisma.planEspecifico.findUnique({
      where: { idPE: idNumerico }
    });

    if (!planExistente) {
      return res.status(404).json({
        exito: false,
        mensaje: 'El plan específico no existe.'
      });
    }

    const diasAntelacion = obtenerDiferenciaDias(planExistente.fecha);

    // Cancelar a menos de 1 semana devuelve solo el 50%
    const menosDeUnaSemana = diasAntelacion < CONFIG_PLAN_ESPECIFICO.DIAS_LIMITE_CON_RECARGO;
    const montoReembolso = menosDeUnaSemana
      ? Math.round(planExistente.costoTotal * CONFIG_PLAN_ESPECIFICO.PORCENTAJE_REEMBOLSO_CANCELAR)
      : planExistente.costoTotal;

    await prisma.$transaction(async (tx) => {
      await tx.horario.deleteMany({
        where: { planEspecificoId: idNumerico }
      });

      await tx.planEspecifico.delete({
        where: { idPE: idNumerico }
      });
    });

    return res.status(200).json({
      exito: true,
      mensaje: menosDeUnaSemana
        ? `Plan cancelado a menos de 1 semana de antelación. Aplica penalización: Reembolso del 50% ($${montoReembolso} CLP).`
        : `Plan específico cancelado exitosamente. Reembolso completo ($${montoReembolso} CLP).`,
      montoReembolso
    });

  } catch (error) {
    console.error('Error al eliminar plan específico:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al eliminar el plan específico.',
      detalles: error.message
    });
  }
};

module.exports = {
  crearPlanEspecifico,
  modificarPlanEspecifico,
  eliminarPlanEspecifico
};
