-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoVehiculo" AS ENUM ('MOTO', 'AUTO');

-- CreateEnum
CREATE TYPE "Rueda" AS ENUM ('DELANTERA', 'TRASERA');

-- CreateEnum
CREATE TYPE "Lado" AS ENUM ('DERECHA', 'IZQUIERDA');

-- CreateTable
CREATE TABLE "categorias" (
    "id_categoria" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "items" (
    "id_item" SERIAL NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagen_url" TEXT,
    "precio_base" DECIMAL(10,2),
    "stock_actual" INTEGER,
    "tipo_vehiculo" "TipoVehiculo",
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id_item")
);

-- CreateTable
CREATE TABLE "metodos_pago" (
    "id_metodo_pago" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "metodos_pago_pkey" PRIMARY KEY ("id_metodo_pago")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id_venta" SERIAL NOT NULL,
    "id_metodo_pago" INTEGER NOT NULL,
    "monto_total" DECIMAL(10,2) NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id_venta")
);

-- CreateTable
CREATE TABLE "detalles_venta" (
    "id_detalle" SERIAL NOT NULL,
    "id_venta" INTEGER NOT NULL,
    "id_item" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "patente" TEXT,
    "rueda" "Rueda",
    "lado" "Lado",

    CONSTRAINT "detalles_venta_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "metodos_pago_nombre_key" ON "metodos_pago"("nombre");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_id_metodo_pago_fkey" FOREIGN KEY ("id_metodo_pago") REFERENCES "metodos_pago"("id_metodo_pago") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_venta" ADD CONSTRAINT "detalles_venta_id_venta_fkey" FOREIGN KEY ("id_venta") REFERENCES "ventas"("id_venta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_venta" ADD CONSTRAINT "detalles_venta_id_item_fkey" FOREIGN KEY ("id_item") REFERENCES "items"("id_item") ON DELETE RESTRICT ON UPDATE CASCADE;

