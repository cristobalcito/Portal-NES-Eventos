ALTER TABLE "Alerta"
ADD COLUMN "claveIncidencia" TEXT,
ADD COLUMN "resueltaEn" TIMESTAMP(3);

CREATE INDEX "Alerta_tipo_resueltaEn_idx" ON "Alerta"("tipo", "resueltaEn");

-- Una sola incidencia activa por origen. Cada cierre conserva su fila en el historial.
CREATE UNIQUE INDEX "Alerta_incidencia_activa_key"
ON "Alerta"("tipo", "claveIncidencia")
WHERE "resueltaEn" IS NULL AND "claveIncidencia" IS NOT NULL;
