const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==============================================================================
// CONFIGURACIONES GLOBALES (Fácilmente modificables)
// ==============================================================================
const CONFIG_PLAN_ESPECIFICO = {
  DIAS_MINIMOS_CREACION: 14,          // 2 semanas mínimo para crear
  DIAS_MINIMOS_SIN_RECARGO: 14,      // Más de 14 días: sin costo extra por edición
  DIAS_LIMITE_CON_RECARGO: 7,         // Entre 7 y 13 días: aplica recargo por edición
  PORCENTAJE_RECARGO_EDICION: 0.05,  // 5% de recargo por modificar entre 1 y 2 semanas
  PORCENTAJE_REEMBOLSO_CANCELAR: 0.50// 50% de reembolso si se cancela a 1 semana
};

// Función auxiliar para calcular diferencia en días entre dos fechas
const obtenerDiferenciaDias = (fechaObjetivo) => {
  const hoy = new Date();
  const fechaEvento = new Date(fechaObjetivo);
  const diferenciaMS = fechaEvento.getTime() - hoy.getTime();
  return Math.ceil(diferenciaMS / (1000 * 60 * 60 * 24));
};

// ==============================================================================
// 1. CREAR PLAN ESPECÍFICO
// ==============================================================================
const crearPlanEspecifico = async (req, res) => {
  try {
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
      equipamientos // Arreglo: [{ productoId: 1, cantidad: 2 }]
    } = req.body;

    // A. Validación de costo (Entero positivo, no decimales, no negativo)
    const costoNumerico = Number(costoTotal);
    if (isNaN(costoNumerico) || costoNumerico < 0 || !Number.isInteger(costoNumerico)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El costo total debe ser un número entero positivo (sin decimales ni negativos).'
      });
    }

    // B. Validación de fecha (Mínimo 2 semanas en el futuro)
    const diasAntelacion = obtenerDiferenciaDias(fecha);
    if (diasAntelacion < CONFIG_PLAN_ESPECIFICO.DIAS_MINIMOS_CREACION) {
      return res.status(400).json({
        exito: false,
        mensaje: `Los planes específicos deben programarse con un mínimo de ${CONFIG_PLAN_ESPECIFICO.DIAS_MINIMOS_CREACION} días (2 semanas) de antelación.`
      });
    }

    // C. Validación de inventario (Descuento de stock)
    let tieneStockSuficiente = true;
    const itemsAProcesar = [];

    if (Array.isArray(equipamientos) && equipamientos.length > 0) {
      for (const item of equipamientos) {
        const productoInv = await prisma.inventario.findUnique({
          where: { id: parseInt(item.productoId, 10) }
        });

        if (!productoInv || productoInv.disponible < item.cantidad) {
          tieneStockSuficiente = false;
        }

        itemsAProcesar.push({
          id: parseInt(item.productoId, 10),
          cantidad: parseInt(item.cantidad, 10)
        });
      }
    }

    const estadoPlan = tieneStockSuficiente ? 'CONFIRMADO' : 'PENDIENTE';

    // D. Transacción en Base de Datos
    const resultado = await prisma.$transaction(async (tx) => {
      const nuevoPlan = await tx.planEspecifico.create({
        data: {
          costoTotal: costoNumerico,
          descripcion: descripcion ? descripcion.trim() : '',
          lugar: lugar ? lugar.trim() : '',
          numPersonas: parseInt(numPersonas, 10),
          personal: personal ? personal.trim() : '',
          fecha: new Date(fecha),
          planBaseId: planBaseId ? parseInt(planBaseId, 10) : null
        }
      });

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

      // Descontar inventario solo si hay stock suficiente
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
        ? 'Plan específico creado y reservado con éxito.'
        : 'Plan específico creado en estado PENDIENTE por falta de equipamiento en inventario.',
      estado: estadoPlan,
      datos: resultado
    });

  } catch (error) {
    console.error('Error al crear plan específico:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al crear el plan específico.',
      detalles: error.message
    });
  }
};

// ==============================================================================
// 2. MODIFICAR PLAN ESPECÍFICO (Con reglas de recargo por fecha)
// ==============================================================================
const modificarPlanEspecifico = async (req, res) => {
  try {
    const { idPE } = req.params;
    const { costoTotal, descripcion, lugar, numPersonas, personal, fecha } = req.body;

    const planExistente = await prisma.planEspecifico.findUnique({
      where: { idPE: parseInt(idPE, 10) }
    });

    if (!planExistente) {
      return res.status(404).json({ exito: false, mensaje: 'El plan específico no existe.' });
    }

    const diasAntelacion = obtenerDiferenciaDias(planExistente.fecha);

    // Regla 1: No se puede modificar a menos de 1 semana (7 días)
    if (diasAntelacion < CONFIG_PLAN_ESPECIFICO.DIAS_LIMITE_CON_RECARGO) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se pueden realizar modificaciones a menos de 1 semana (7 días) de la fecha del evento.'
      });
    }

    let nuevoCosto = costoTotal ? Number(costoTotal) : planExistente.costoTotal;
    let recargoAplicado = 0;

    // Regla 2: Modificar entre 1 y 2 semanas (7 a 13 días) aplica recargo del 5%
    if (diasAntelacion >= CONFIG_PLAN_ESPECIFICO.DIAS_LIMITE_CON_RECARGO && 
        diasAntelacion < CONFIG_PLAN_ESPECIFICO.DIAS_MINIMOS_SIN_RECARGO) {
      recargoAplicado = nuevoCosto * CONFIG_PLAN_ESPECIFICO.PORCENTAJE_RECARGO_EDICION;
      nuevoCosto = Math.round(nuevoCosto + recargoAplicado); // Redondeo a entero sin decimales
    }

    // Validar entero y positivo
    if (isNaN(nuevoCosto) || nuevoCosto < 0 || !Number.isInteger(nuevoCosto)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El costo total resultante debe ser un entero positivo.'
      });
    }

    const planActualizado = await prisma.planEspecifico.update({
      where: { idPE: parseInt(idPE, 10) },
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
        : 'Plan modificado con éxito sin costo adicional.',
      datos: planActualizado
    });

  } catch (error) {
    console.error('Error al modificar plan específico:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error al modificar el plan específico.' });
  }
};

const eliminarPlanEspecifico = async (req, res) => {
  try {
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

    // Determinar si aplica penalización del 50%
    const menosDeUnaSemana = diasAntelacion < CONFIG_PLAN_ESPECIFICO.DIAS_LIMITE_CON_RECARGO;
    const montoReembolso = menosDeUnaSemana
      ? Math.round(planExistente.costoTotal * CONFIG_PLAN_ESPECIFICO.PORCENTAJE_REEMBOLSO_CANCELAR)
      : planExistente.costoTotal;

    // Ejecutar en transacción (Eliminar el plan o cancelar y restaurar stock en inventario)
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar horario asociado si existe
      await tx.horario.deleteMany({
        where: { planEspecificoId: idNumerico }
      });

      // 2. Eliminar el plan específico
      await tx.planEspecifico.delete({
        where: { idPE: idNumerico }
      });

      // Nota: Si mantienes una tabla intermedia de relacion Equipamiento-PlanEspecifico, 
      // aquí se iteran sus ítems para devolver el stock (incrementar 'disponible' y decrementar 'ocupado').
    });

    return res.status(200).json({
      exito: true,
      mensaje: menosDeUnaSemana
        ? `Plan cancelado a menos de 1 semana. Aplica penalización: Reembolso del 50% ($${montoReembolso}).`
        : `Plan específico eliminado y cancelado exitosamente. Reembolso total ($${montoReembolso}).`,
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
  eliminarPlanEspecifico,
  CONFIG_PLAN_ESPECIFICO
};
