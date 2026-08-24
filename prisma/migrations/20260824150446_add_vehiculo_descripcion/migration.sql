/*
  Warnings:

  - You are about to drop the column `patente` on the `detalles_venta` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "detalles_venta_patente_idx";

-- AlterTable
ALTER TABLE "detalles_venta" DROP COLUMN "patente",
ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "id_vehiculo" INTEGER;

-- CreateTable
CREATE TABLE "vehiculos" (
    "id_vehiculo" SERIAL NOT NULL,
    "patente" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id_vehiculo")
);

-- CreateIndex
CREATE INDEX "vehiculos_patente_idx" ON "vehiculos"("patente");

-- CreateIndex
CREATE INDEX "detalles_venta_id_vehiculo_idx" ON "detalles_venta"("id_vehiculo");

-- AddForeignKey
ALTER TABLE "detalles_venta" ADD CONSTRAINT "detalles_venta_id_vehiculo_fkey" FOREIGN KEY ("id_vehiculo") REFERENCES "vehiculos"("id_vehiculo") ON DELETE SET NULL ON UPDATE CASCADE;
