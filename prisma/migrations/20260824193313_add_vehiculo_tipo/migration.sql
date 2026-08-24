/*
  Warnings:

  - Added the required column `tipo_vehiculo` to the `vehiculos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "vehiculos" ADD COLUMN     "tipo_vehiculo" "TipoVehiculo" NOT NULL;
