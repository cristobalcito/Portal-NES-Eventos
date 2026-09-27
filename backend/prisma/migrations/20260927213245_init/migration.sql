-- CreateTable
CREATE TABLE "Usuario" (
    "rut" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("rut")
);

-- CreateTable
CREATE TABLE "GerenteGeneral" (
    "rut" TEXT NOT NULL,
    "planBaseId" INTEGER,

    CONSTRAINT "GerenteGeneral_pkey" PRIMARY KEY ("rut")
);

-- CreateTable
CREATE TABLE "PersonalOperaciones" (
    "rut" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "fono" TEXT NOT NULL,

    CONSTRAINT "PersonalOperaciones_pkey" PRIMARY KEY ("rut")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "rut" TEXT NOT NULL,
    "fono" TEXT NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("rut")
);

-- CreateTable
CREATE TABLE "PersonalEventual" (
    "rut" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "disponibilidad" TEXT NOT NULL,
    "fono" TEXT NOT NULL,
    "experiencia" TEXT NOT NULL,
    "evaluacionDesempeno" TEXT NOT NULL,
    "datosDePago" TEXT NOT NULL,
    "tallaDeRopa" TEXT NOT NULL,
    "notaFinal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PersonalEventual_pkey" PRIMARY KEY ("rut")
);

-- CreateTable
CREATE TABLE "Vehiculo" (
    "matricula" TEXT NOT NULL,
    "conductor" TEXT NOT NULL,
    "especificaciones" TEXT NOT NULL,

    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("matricula")
);

-- CreateTable
CREATE TABLE "Equipamiento" (
    "idEQ" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "gerenteGeneralId" TEXT,

    CONSTRAINT "Equipamiento_pkey" PRIMARY KEY ("idEQ")
);

-- CreateTable
CREATE TABLE "Arriendo" (
    "idAR" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "equipamiento" TEXT NOT NULL,
    "gerenteGeneralId" TEXT,

    CONSTRAINT "Arriendo_pkey" PRIMARY KEY ("idAR")
);

-- CreateTable
CREATE TABLE "PlanBase" (
    "idPL" SERIAL NOT NULL,
    "costoBase" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "PlanBase_pkey" PRIMARY KEY ("idPL")
);

-- CreateTable
CREATE TABLE "PlanEspecifico" (
    "idPE" SERIAL NOT NULL,
    "costoTotal" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT NOT NULL,
    "lugar" TEXT NOT NULL,
    "numPersonas" INTEGER NOT NULL,
    "personal" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "planBaseId" INTEGER,

    CONSTRAINT "PlanEspecifico_pkey" PRIMARY KEY ("idPE")
);

-- CreateTable
CREATE TABLE "Horario" (
    "idHO" SERIAL NOT NULL,
    "horaSalida" TIMESTAMP(3) NOT NULL,
    "horaLlegada" TIMESTAMP(3) NOT NULL,
    "horaVuelta" TIMESTAMP(3) NOT NULL,
    "planEspecificoId" INTEGER NOT NULL,

    CONSTRAINT "Horario_pkey" PRIMARY KEY ("idHO")
);

-- CreateTable
CREATE TABLE "EncuestaSatisfaccion" (
    "idES" SERIAL NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT NOT NULL,
    "clienteRut" TEXT,

    CONSTRAINT "EncuestaSatisfaccion_pkey" PRIMARY KEY ("idES")
);

-- CreateTable
CREATE TABLE "Alerta" (
    "idAL" SERIAL NOT NULL,
    "razon" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "clienteRut" TEXT,

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("idAL")
);

-- CreateTable
CREATE TABLE "_PersonalOperacionesToVehiculo" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_EquipamientoToPersonalOperaciones" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Horario_planEspecificoId_key" ON "Horario"("planEspecificoId");

-- CreateIndex
CREATE UNIQUE INDEX "_PersonalOperacionesToVehiculo_AB_unique" ON "_PersonalOperacionesToVehiculo"("A", "B");

-- CreateIndex
CREATE INDEX "_PersonalOperacionesToVehiculo_B_index" ON "_PersonalOperacionesToVehiculo"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EquipamientoToPersonalOperaciones_AB_unique" ON "_EquipamientoToPersonalOperaciones"("A", "B");

-- CreateIndex
CREATE INDEX "_EquipamientoToPersonalOperaciones_B_index" ON "_EquipamientoToPersonalOperaciones"("B");

-- AddForeignKey
ALTER TABLE "GerenteGeneral" ADD CONSTRAINT "GerenteGeneral_rut_fkey" FOREIGN KEY ("rut") REFERENCES "Usuario"("rut") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GerenteGeneral" ADD CONSTRAINT "GerenteGeneral_planBaseId_fkey" FOREIGN KEY ("planBaseId") REFERENCES "PlanBase"("idPL") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalOperaciones" ADD CONSTRAINT "PersonalOperaciones_rut_fkey" FOREIGN KEY ("rut") REFERENCES "Usuario"("rut") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_rut_fkey" FOREIGN KEY ("rut") REFERENCES "Usuario"("rut") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalEventual" ADD CONSTRAINT "PersonalEventual_rut_fkey" FOREIGN KEY ("rut") REFERENCES "Usuario"("rut") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipamiento" ADD CONSTRAINT "Equipamiento_gerenteGeneralId_fkey" FOREIGN KEY ("gerenteGeneralId") REFERENCES "GerenteGeneral"("rut") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arriendo" ADD CONSTRAINT "Arriendo_gerenteGeneralId_fkey" FOREIGN KEY ("gerenteGeneralId") REFERENCES "GerenteGeneral"("rut") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanEspecifico" ADD CONSTRAINT "PlanEspecifico_planBaseId_fkey" FOREIGN KEY ("planBaseId") REFERENCES "PlanBase"("idPL") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horario" ADD CONSTRAINT "Horario_planEspecificoId_fkey" FOREIGN KEY ("planEspecificoId") REFERENCES "PlanEspecifico"("idPE") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncuestaSatisfaccion" ADD CONSTRAINT "EncuestaSatisfaccion_clienteRut_fkey" FOREIGN KEY ("clienteRut") REFERENCES "Cliente"("rut") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_clienteRut_fkey" FOREIGN KEY ("clienteRut") REFERENCES "Cliente"("rut") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonalOperacionesToVehiculo" ADD CONSTRAINT "_PersonalOperacionesToVehiculo_A_fkey" FOREIGN KEY ("A") REFERENCES "PersonalOperaciones"("rut") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonalOperacionesToVehiculo" ADD CONSTRAINT "_PersonalOperacionesToVehiculo_B_fkey" FOREIGN KEY ("B") REFERENCES "Vehiculo"("matricula") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipamientoToPersonalOperaciones" ADD CONSTRAINT "_EquipamientoToPersonalOperaciones_A_fkey" FOREIGN KEY ("A") REFERENCES "Equipamiento"("idEQ") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipamientoToPersonalOperaciones" ADD CONSTRAINT "_EquipamientoToPersonalOperaciones_B_fkey" FOREIGN KEY ("B") REFERENCES "PersonalOperaciones"("rut") ON DELETE CASCADE ON UPDATE CASCADE;
