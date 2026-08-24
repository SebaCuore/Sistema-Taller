"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";

function readTipoVehiculo(formData: FormData): "MOTO" | "AUTO" {
  const tipo = String(formData.get("tipo_vehiculo") ?? "");
  if (tipo !== "MOTO" && tipo !== "AUTO") {
    throw new Error("Elegí si el producto es para Moto o Auto.");
  }
  return tipo;
}

function readFields(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const precio_base = Number(formData.get("precio_base"));
  const stock_actual = Number(formData.get("stock_actual"));
  const tipo_vehiculo = readTipoVehiculo(formData);

  if (!nombre) {
    throw new Error("El nombre es obligatorio.");
  }
  if (Number.isNaN(precio_base) || Number.isNaN(stock_actual)) {
    throw new Error("Precio y cantidad son obligatorios.");
  }

  return { nombre, precio_base, stock_actual, tipo_vehiculo };
}

export async function createItem(formData: FormData) {
  await verifySession();

  const { nombre, precio_base, stock_actual, tipo_vehiculo } = readFields(formData);
  const categoria = await prisma.categoria.findUniqueOrThrow({ where: { nombre: "Producto" } });

  await prisma.item.create({
    data: {
      nombre,
      precio_base,
      stock_actual,
      tipo_vehiculo,
      id_categoria: categoria.id_categoria,
    },
  });

  revalidatePath("/stock");
  revalidatePath("/");
  redirect("/stock");
}

export async function updateItem(id_item: number, formData: FormData) {
  await verifySession();

  const { nombre, precio_base, stock_actual, tipo_vehiculo } = readFields(formData);

  await prisma.item.update({
    where: { id_item },
    data: { nombre, precio_base, stock_actual, tipo_vehiculo },
  });

  revalidatePath("/stock");
  revalidatePath("/");
  redirect("/stock");
}

export async function setActivo(id_item: number, activo: boolean) {
  await verifySession();

  await prisma.item.update({ where: { id_item }, data: { activo } });
  revalidatePath("/stock");
  revalidatePath("/");
}

export async function actualizarStock(id_item: number, cantidad: number) {
  await verifySession();

  if (!Number.isFinite(cantidad)) {
    throw new Error("Cantidad inválida.");
  }
  await prisma.item.update({ where: { id_item }, data: { stock_actual: cantidad } });
  revalidatePath("/stock");
  revalidatePath("/");
}
