const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function asegurarTresPlanes() {
  try {
    const cantidadActual = await prisma.planBase.count();
    console.log(`Planes actuales en BD: ${cantidadActual}`);

    // Planes por defecto para completar el catálogo de 3
    const planesPorDefecto = [
      {
        costoBase: 150000,
        descripcion: 'Plan Esencial: Cobertura básica ideal para eventos o grupos pequeños.'
      },
      {
        costoBase: 300000,
        descripcion: 'Plan Estándar: Cobertura intermedia con equipamiento completo y soporte.'
      },
      {
        costoBase: 600000,
        descripcion: 'Plan Premium: Cobertura integral con personal dedicado y producción completa.'
      }
    ];

    // Si faltan planes para llegar a 3, agregamos solo los requeridos
    if (cantidadActual < 3) {
      const faltantes = planesPorDefecto.slice(cantidadActual, 3);
      await prisma.planBase.createMany({
        data: faltantes
      });
      console.log(`Se agregaron ${faltantes.length} plan(es) base nuevo(s). Total: 3.`);
    } else {
      console.log('El catálogo ya cuenta con 3 o más planes base registrados.');
    }
  } catch (error) {
    console.error('Error al inicializar los 3 planes base:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar función
asegurarTresPlanes();