CREATE TABLE "CurriculumPersonal" (
    "rut" TEXT NOT NULL,
    "contenido" BYTEA NOT NULL,

    CONSTRAINT "CurriculumPersonal_pkey" PRIMARY KEY ("rut")
);

ALTER TABLE "CurriculumPersonal" ADD CONSTRAINT "CurriculumPersonal_rut_fkey" FOREIGN KEY ("rut") REFERENCES "PersonalEventual"("rut") ON DELETE CASCADE ON UPDATE CASCADE;
