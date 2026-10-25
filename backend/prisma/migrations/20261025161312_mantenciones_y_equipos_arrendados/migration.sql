-- CreateTable
CREATE TABLE "mantencion" (
    "id" SERIAL NOT NULL,
    "inventarioId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "falla" TEXT NOT NULL,
    "taller" TEXT,
    "fechaEnvio" TIMESTAMP(3) NOT NULL,
    "fechaRetornoEstimada" TIMESTAMP(3) NOT NULL,
    "fechaRetornoReal" TIMESTAMP(3),
    "costoReparacion" DOUBLE PRECISION NOT NULL,
    "aprobadoPor" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'en mantención',
    "finalizadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mantencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedor" (
    "rut" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,

    CONSTRAINT "proveedor_pkey" PRIMARY KEY ("rut")
);

-- CreateTable
CREATE TABLE "equipo_arrendado" (
    "id" SERIAL NOT NULL,
    "nombreEquipo" TEXT NOT NULL,
    "codigoEquipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costo" DOUBLE PRECISION NOT NULL,
    "fechaRetiro" TIMESTAMP(3) NOT NULL,
    "fechaDevolucion" TIMESTAMP(3) NOT NULL,
    "fechaDevolucionReal" TIMESTAMP(3),
    "receptorBodega" TEXT NOT NULL,
    "garantiaArchivo" TEXT NOT NULL,
    "garantiaNombre" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'arrendado',
    "proveedorRut" TEXT NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipo_arrendado_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "mantencion" ADD CONSTRAINT "mantencion_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipo_arrendado" ADD CONSTRAINT "equipo_arrendado_proveedorRut_fkey" FOREIGN KEY ("proveedorRut") REFERENCES "proveedor"("rut") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipo_arrendado" ADD CONSTRAINT "equipo_arrendado_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "PlanEspecifico"("idPE") ON DELETE RESTRICT ON UPDATE CASCADE;
