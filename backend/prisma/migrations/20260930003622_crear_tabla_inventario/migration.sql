/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "inventario" (
    "id" SERIAL NOT NULL,
    "producto" VARCHAR(150) NOT NULL,
    "marca" VARCHAR(100),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "disponible" INTEGER NOT NULL DEFAULT 0,
    "ocupado" INTEGER NOT NULL DEFAULT 0,
    "mantencion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
