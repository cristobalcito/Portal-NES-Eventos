/*
  Warnings:

  - A unique constraint covering the columns `[planEspecificoId,tipo]` on the table `Alerta` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Alerta" ADD COLUMN     "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "leida" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "planEspecificoId" INTEGER,
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'GENERAL';

-- CreateIndex
CREATE UNIQUE INDEX "Alerta_planEspecificoId_tipo_key" ON "Alerta"("planEspecificoId", "tipo");

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_planEspecificoId_fkey" FOREIGN KEY ("planEspecificoId") REFERENCES "PlanEspecifico"("idPE") ON DELETE CASCADE ON UPDATE CASCADE;
