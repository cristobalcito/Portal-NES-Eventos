var prisma = require('../lib/prisma');
var { normalizarPatente } = require('../servicios/patenteServicio');

var LICENCIAS_VALIDAS = [
  'Clase B',
  'Clase A2',
  'Clase A3',
  'Clase A4',
  'Clase A5',
  'Clase D'
];

// Regla de negocio: hasta 4 vehículos por evento sin costo adicional
var MAX_VEHICULOS_SIN_COSTO = 4;
var COSTO_VEHICULO_ADICIONAL = 50000;

var esDisponibilidadValida = (disponibilidad) => {
  var estado = String(disponibilidad || '').trim().toLowerCase();
  return (
    estado === '' ||
    estado === 'disponible' ||
    estado === 'no especificada' ||
    estado === 'no especificado'
  );
};

// Listar todos los vehículos con sus reservas activas
var obtenerVehiculos = async (req, res) => {
  try {
    var vehiculos = await prisma.vehiculo.findMany({
      orderBy: { creadoEn: 'desc' },
      include: {
        reservas: {
          where: { estado: 'RESERVADO' },
          include: {
            conductor: {
              select: { rut: true, nombre: true, email: true }
            },
            planEspecifico: {
              select: { idPE: true, descripcion: true, lugar: true, fecha: true, costoTotal: true }
            }
          },
          orderBy: { creadoEn: 'desc' }
        }
      }
    });

    return res.status(200).json({
      exito: true,
      datos: vehiculos
    });
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al obtener los vehículos.'
    });
  }
};

// Obtener conductores filtrados por licencia del vehículo y disponibilidad
var obtenerOpcionesReserva = async (req, res) => {
  try {
    var patenteQuery = req.query.patente ? normalizarPatente(req.query.patente) : null;
    var licenciaRequerida = null;

    if (patenteQuery) {
      var vehiculo = await prisma.vehiculo.findUnique({
        where: { patente: patenteQuery },
        select: { tipoLicencia: true }
      });
      if (vehiculo) {
        licenciaRequerida = vehiculo.tipoLicencia;
      }
    }

    var usuarios = await prisma.usuario.findMany({
      where: {
        personalEventual: {
          isNot: null
        }
      },
      include: {
        personalEventual: true
      },
      orderBy: { nombre: 'asc' }
    });

    var conductores = usuarios
      .filter((u) => {
        var pe = u.personalEventual;
        if (!pe) return false;

        // 1. Validar disponibilidad: "disponible" o "No especificada"
        if (!esDisponibilidadValida(pe.disponibilidad)) return false;

        // 2. Validar que tenga la licencia requerida por el vehículo
        if (licenciaRequerida) {
          var licenciasUsuario = Array.isArray(pe.licencias) ? pe.licencias : [];
          if (!licenciasUsuario.includes(licenciaRequerida)) return false;
        }

        return true;
      })
      .map((u) => ({
        rut: u.rut,
        nombre: u.nombre,
        rol: 'Personal Eventual',
        disponibilidad: u.personalEventual.disponibilidad || 'No especificada',
        licencias: u.personalEventual.licencias || []
      }));

    var eventosRaw = await prisma.planEspecifico.findMany({
      orderBy: { fecha: 'asc' },
      include: {
        reservasVehiculos: {
          where: { estado: 'RESERVADO' },
          select: { id: true }
        }
      }
    });

    var eventos = eventosRaw.map((ev) => ({
      idPE: ev.idPE,
      descripcion: ev.descripcion,
      lugar: ev.lugar,
      fecha: ev.fecha,
      costoTotal: ev.costoTotal,
      vehiculosReservados: ev.reservasVehiculos.length
    }));

    return res.status(200).json({
      exito: true,
      datos: {
        conductores,
        eventos,
        licenciaRequerida,
        maxVehiculosSinCosto: MAX_VEHICULOS_SIN_COSTO,
        costoVehiculoAdicional: COSTO_VEHICULO_ADICIONAL
      }
    });
  } catch (error) {
    console.error('Error al obtener opciones de reserva:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al cargar conductores y eventos.'
    });
  }
};

// Reservar vehículo, actualizar PersonalEventual a Chofer y sumar costo si supera 4 vehículos
var reservarVehiculo = async (req, res) => {
  try {
    var patenteValida = normalizarPatente(req.params.patente);
    var { conductorRut, planEspecificoId, costoAdicional } = req.body;

    if (!patenteValida) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Patente de vehículo no válida.'
      });
    }

    if (!conductorRut || !planEspecificoId) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe seleccionar el conductor y el evento.'
      });
    }

    var idEventoNum = Number(planEspecificoId);

    var vehiculo = await prisma.vehiculo.findUnique({
      where: { patente: patenteValida },
      include: {
        reservas: {
          where: { estado: 'RESERVADO' },
          include: { planEspecifico: true }
        }
      }
    });

    if (!vehiculo) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Vehículo no encontrado.'
      });
    }
    if (vehiculo.enMantencion) {
      return res.status(400).json({
        exito: false,
        mensaje: `El vehículo ${patenteValida} se encuentra en mantención y no puede ser reservado.`
      });
    }

    var conductor = await prisma.usuario.findUnique({
      where: { rut: String(conductorRut).trim() },
      include: {
        personalOperaciones: true,
        personalEventual: true
      }
    });

    if (!conductor) {
      return res.status(404).json({
        exito: false,
        mensaje: 'El conductor seleccionado no existe en la base de datos.'
      });
    }

    if (!conductor.personalEventual) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El conductor seleccionado debe pertenecer al Personal Eventual.'
      });
    }

    if (!esDisponibilidadValida(conductor.personalEventual.disponibilidad)) {
      return res.status(400).json({
        exito: false,
        mensaje: `El conductor ${conductor.nombre} no está disponible (estado actual: ${conductor.personalEventual.disponibilidad}).`
      });
    }

    var licenciasConductor = Array.isArray(conductor.personalEventual.licencias)
      ? conductor.personalEventual.licencias
      : [];

    if (!licenciasConductor.includes(vehiculo.tipoLicencia)) {
      return res.status(400).json({
        exito: false,
        mensaje: `${conductor.nombre} no posee la licencia ${vehiculo.tipoLicencia} requerida para este vehículo.`
      });
    }

    var evento = await prisma.planEspecifico.findUnique({
      where: { idPE: idEventoNum }
    });

    if (!evento) {
      return res.status(404).json({
        exito: false,
        mensaje: 'El evento seleccionado no existe en la base de datos.'
      });
    }

    // Verificar si este vehículo ya está reservado para el mismo evento
    var yaReservadoMismoEvento = vehiculo.reservas.some(
      (r) => r.planEspecificoId === idEventoNum
    );
    if (yaReservadoMismoEvento) {
      return res.status(400).json({
        exito: false,
        mensaje: `El vehículo ${patenteValida} ya se encuentra reservado para el evento #${idEventoNum} ("${evento.descripcion}").`
      });
    }

    // Verificar conflicto de fecha en otro evento el mismo día
    var fechaNuevoEvento = new Date(evento.fecha).toISOString().split('T')[0];
    var conflictoFecha = vehiculo.reservas.find((r) => {
      var fechaExistente = new Date(r.planEspecifico.fecha).toISOString().split('T')[0];
      return fechaExistente === fechaNuevoEvento;
    });

    if (conflictoFecha) {
      return res.status(400).json({
        exito: false,
        mensaje: `El vehículo ${patenteValida} ya está ocupado el ${fechaNuevoEvento} en el evento #${conflictoFecha.planEspecifico.idPE} ("${conflictoFecha.planEspecifico.descripcion}").`
      });
    }

    var resultado = await prisma.$transaction(async (tx) => {
      // 1. Contar cuántos vehículos tiene actualmente este evento
      var cantidadPreviaEnEvento = await tx.reservaVehiculo.count({
        where: {
          planEspecificoId: idEventoNum,
          estado: 'RESERVADO'
        }
      });

      // 2. Cambiar estado del Personal Eventual a "asignado a evento #" y rol "chofer"
      await tx.personalEventual.update({
        where: { rut: conductor.rut },
        data: {
          disponibilidad: `asignado a evento #${idEventoNum}`,
          rol: 'chofer'
        }
      });

      // 3. Si también pertenece a Personal Operaciones, vincular relación N:M
      if (conductor.personalOperaciones) {
        await tx.vehiculo.update({
          where: { patente: patenteValida },
          data: {
            personalOperaciones: {
              connect: { rut: conductor.rut }
            }
          }
        });
      }

      // 4. Si el evento ya tiene 4 o más vehículos, aumentar el costoTotal del evento
      var recargoAplicado = 0;
      if (cantidadPreviaEnEvento >= MAX_VEHICULOS_SIN_COSTO) {
        var montoExtra = Number(costoAdicional);
        recargoAplicado = !isNaN(montoExtra) && montoExtra > 0 ? montoExtra : COSTO_VEHICULO_ADICIONAL;

        await tx.planEspecifico.update({
          where: { idPE: idEventoNum },
          data: {
            costoTotal: {
              increment: recargoAplicado
            }
          }
        });
      }

      // 5. Crear la reserva
      var nuevaReserva = await tx.reservaVehiculo.create({
        data: {
          vehiculoPatente: patenteValida,
          conductorRut: conductor.rut,
          planEspecificoId: idEventoNum,
          estado: 'RESERVADO'
        },
        include: {
          conductor: { select: { rut: true, nombre: true } },
          planEspecifico: { select: { idPE: true, descripcion: true, fecha: true, costoTotal: true } }
        }
      });

      return {
        reserva: nuevaReserva,
        totalVehiculosEvento: cantidadPreviaEnEvento + 1,
        recargoAplicado
      };
    });

    var mensajeExito =
      resultado.recargoAplicado > 0
        ? `Vehículo ${patenteValida} reservado para el evento #${idEventoNum} (${resultado.totalVehiculosEvento}° vehículo). Se sumó $${resultado.recargoAplicado.toLocaleString('es-CL')} al costo total del evento.`
        : `Vehículo ${patenteValida} reservado para el evento #${idEventoNum} (${resultado.totalVehiculosEvento}/${MAX_VEHICULOS_SIN_COSTO} vehículos sin costo adicional).`;

    return res.status(201).json({
      exito: true,
      mensaje: mensajeExito,
      datos: resultado.reserva
    });
  } catch (error) {
    console.error('Error al reservar vehículo:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al procesar la reserva del vehículo.'
    });
  }
};

// Liberar / cancelar reserva (restaura disponibilidad del PersonalEventual y ajusta costoTotal si excedía 4)
var cancelarReservaVehiculo = async (req, res) => {
  try {
    var idReserva = Number(req.params.id);
    if (!idReserva) {
      return res.status(400).json({ exito: false, mensaje: 'ID de reserva inválido.' });
    }

    var reserva = await prisma.reservaVehiculo.findUnique({
      where: { id: idReserva },
      include: {
        conductor: {
          include: { personalEventual: true }
        },
        planEspecifico: true
      }
    });

    if (!reserva) {
      return res.status(404).json({ exito: false, mensaje: 'La reserva no existe.' });
    }

    await prisma.$transaction(async (tx) => {
      var totalAntesEnEvento = await tx.reservaVehiculo.count({
        where: {
          planEspecificoId: reserva.planEspecificoId,
          estado: 'RESERVADO'
        }
      });

      await tx.reservaVehiculo.delete({
        where: { id: idReserva }
      });

      if (totalAntesEnEvento > MAX_VEHICULOS_SIN_COSTO && reserva.planEspecifico) {
        var nuevoCosto = Math.max(0, reserva.planEspecifico.costoTotal - COSTO_VEHICULO_ADICIONAL);
        await tx.planEspecifico.update({
          where: { idPE: reserva.planEspecificoId },
          data: { costoTotal: nuevoCosto }
        });
      }

      if (reserva.conductor?.personalEventual) {
        var otrasReservas = await tx.reservaVehiculo.count({
          where: {
            conductorRut: reserva.conductorRut,
            estado: 'RESERVADO'
          }
        });

        if (otrasReservas === 0) {
          await tx.personalEventual.update({
            where: { rut: reserva.conductorRut },
            data: {
              disponibilidad: 'Disponible'
            }
          });
        }
      }
    });

    return res.status(200).json({
      exito: true,
      mensaje: 'Reserva liberada y estado actualizado correctamente.'
    });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al liberar la reserva.'
    });
  }
};

// Crear vehículo (Solo Gerente General)
var crearVehiculo = async (req, res) => {
  try {
    var { patente, tipoAuto, tipoLicencia } = req.body;

    var patenteValida = normalizarPatente(patente);
    if (!patenteValida) {
      return res.status(400).json({
        exito: false,
        mensaje: 'La patente ingresada no cumple con el formato chileno válido (ej: BCDF12 o AB1234).'
      });
    }

    if (!tipoAuto || !tipoAuto.trim()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El nombre del tipo de auto es obligatorio.'
      });
    }

    if (!tipoLicencia || !LICENCIAS_VALIDAS.includes(tipoLicencia)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe seleccionar un tipo de licencia chilena válido.'
      });
    }

    var existente = await prisma.vehiculo.findUnique({
      where: { patente: patenteValida }
    });

    if (existente) {
      return res.status(400).json({
        exito: false,
        mensaje: `Ya existe un vehículo registrado con la patente ${patenteValida}.`
      });
    }

    var rutaPermisoCirculacion = req.files?.permisoCirculacion?.[0]
      ? `/uploads/vehiculos/${req.files.permisoCirculacion[0].filename}`
      : null;

    var rutaRevision = req.files?.revisionTecnica?.[0]
      ? `/uploads/vehiculos/${req.files.revisionTecnica[0].filename}`
      : null;

    var rutaAntecedentes = req.files?.antecedentes?.[0]
      ? `/uploads/vehiculos/${req.files.antecedentes[0].filename}`
      : null;

    var nuevoVehiculo = await prisma.vehiculo.create({
      data: {
        patente: patenteValida,
        tipoAuto: tipoAuto.trim(),
        permisoCirculacion: rutaPermisoCirculacion,
        revisionTecnica: rutaRevision,
        antecedentes: rutaAntecedentes,
        tipoLicencia: tipoLicencia
      }
    });

    return res.status(201).json({
      exito: true,
      mensaje: 'Vehículo registrado correctamente.',
      datos: nuevoVehiculo
    });
  } catch (error) {
    console.error('Error al crear vehículo:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al registrar el vehículo.'
    });
  }
};

// Modificar vehículo (Solo Gerente General)
var modificarVehiculo = async (req, res) => {
  try {
    var patenteActual = normalizarPatente(req.params.patente);
    var { nuevaPatente, tipoAuto, tipoLicencia } = req.body;

    if (!patenteActual) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Patente de origen inválida.'
      });
    }

    var vehiculoActual = await prisma.vehiculo.findUnique({
      where: { patente: patenteActual }
    });

    if (!vehiculoActual) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Vehículo no encontrado.'
      });
    }

    var patenteFinal = patenteActual;
    if (nuevaPatente && nuevaPatente.trim() !== '') {
      patenteFinal = normalizarPatente(nuevaPatente);
      if (!patenteFinal) {
        return res.status(400).json({
          exito: false,
          mensaje: 'La nueva patente no cumple con las normas chilenas (ej: BCDF12 o AB1234).'
        });
      }

      if (patenteFinal !== patenteActual) {
        var colision = await prisma.vehiculo.findUnique({
          where: { patente: patenteFinal }
        });
        if (colision) {
          return res.status(400).json({
            exito: false,
            mensaje: `La patente ${patenteFinal} ya pertenece a otro vehículo.`
          });
        }
      }
    }

    if (tipoLicencia && !LICENCIAS_VALIDAS.includes(tipoLicencia)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Tipo de licencia no válido.'
      });
    }

    var rutaPermisoCirculacion = req.files?.permisoCirculacion?.[0]
      ? `/uploads/vehiculos/${req.files.permisoCirculacion[0].filename}`
      : vehiculoActual.permisoCirculacion;

    var rutaRevision = req.files?.revisionTecnica?.[0]
      ? `/uploads/vehiculos/${req.files.revisionTecnica[0].filename}`
      : vehiculoActual.revisionTecnica;

    var rutaAntecedentes = req.files?.antecedentes?.[0]
      ? `/uploads/vehiculos/${req.files.antecedentes[0].filename}`
      : vehiculoActual.antecedentes;

    var vehiculoActualizado = await prisma.vehiculo.update({
      where: { patente: patenteActual },
      data: {
        patente: patenteFinal,
        tipoAuto: tipoAuto ? tipoAuto.trim() : vehiculoActual.tipoAuto,
        permisoCirculacion: rutaPermisoCirculacion,
        revisionTecnica: rutaRevision,
        antecedentes: rutaAntecedentes,
        tipoLicencia: tipoLicencia || vehiculoActual.tipoLicencia
      }
    });

    return res.status(200).json({
      exito: true,
      mensaje: 'Vehículo actualizado correctamente.',
      datos: vehiculoActualizado
    });
  } catch (error) {
    console.error('Error al modificar vehículo:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al actualizar el vehículo.'
    });
  }
};

// Eliminar vehículo (Solo Gerente General)
var eliminarVehiculo = async (req, res) => {
  try {
    var patenteValida = normalizarPatente(req.params.patente);

    if (!patenteValida) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Formato de patente inválido.'
      });
    }

    var existente = await prisma.vehiculo.findUnique({
      where: { patente: patenteValida }
    });

    if (!existente) {
      return res.status(404).json({
        exito: false,
        mensaje: 'El vehículo no existe en la base de datos.'
      });
    }

    await prisma.vehiculo.delete({
      where: { patente: patenteValida }
    });

    return res.status(200).json({
      exito: true,
      mensaje: 'Vehículo eliminado correctamente.'
    });
  } catch (error) {
    console.error('Error al eliminar vehículo:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al eliminar el vehículo.'
    });
  }
};

// Activar o finalizar el estado de mantención de un vehículo
var cambiarEstadoMantencion = async (req, res) => {
  try {
    var patenteValida = normalizarPatente(req.params.patente);
    if (!patenteValida) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Formato de patente inválido.'
      });
    }

    var vehiculo = await prisma.vehiculo.findUnique({
      where: { patente: patenteValida },
      include: {
        reservas: {
          where: { estado: 'RESERVADO' },
          select: { id: true }
        }
      }
    });

    if (!vehiculo) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Vehículo no encontrado.'
      });
    }

    var nuevoEstado =
      typeof req.body.enMantencion === 'boolean'
        ? req.body.enMantencion
        : !vehiculo.enMantencion;

    if (nuevoEstado && vehiculo.reservas.length > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: `El vehículo ${patenteValida} tiene reservas activas. Libere sus reservas antes de enviarlo a mantención.`
      });
    }

    var actualizado = await prisma.vehiculo.update({
      where: { patente: patenteValida },
      data: { enMantencion: nuevoEstado }
    });

    return res.status(200).json({
      exito: true,
      mensaje: nuevoEstado
        ? `Vehículo ${patenteValida} marcado en mantención. No podrá ser reservado hasta finalizar.`
        : `Vehículo ${patenteValida} habilitado y disponible para reservas.`,
      datos: actualizado
    });
  } catch (error) {
    console.error('Error al cambiar estado de mantención:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al actualizar el estado de mantención.'
    });
  }
};

module.exports = {
  obtenerVehiculos,
  obtenerOpcionesReserva,
  reservarVehiculo,
  cancelarReservaVehiculo,
  cambiarEstadoMantencion,
  crearVehiculo,
  modificarVehiculo,
  eliminarVehiculo
};