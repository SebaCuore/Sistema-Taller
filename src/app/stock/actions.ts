"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function esCategoriaProducto(id_categoria: number) {
  const categoria = await prisma.categoria.findUnique({ where: { id_categoria } });
  return categoria?.nombre === "Producto";
}

function readBaseFields(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const id_categoria = Number(formData.get("id_categoria"));
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;

  if (!nombre || !id_categoria) {
    throw new Error("Nombre y categoría son obligatorios.");
  }

  return { nombre, id_categoria, descripcion };
}

async function readPrecioStock(formData: FormData, id_categoria: number) {
  const esProducto = await esCategoriaProducto(id_categoria);
  if (!esProducto) {
    return { precio_base: null, stock_actual: null };
  }

  const precio_base = Number(formData.get("precio_base"));
  const stock_actual = Number(formData.get("stock_actual"));
  if (Number.isNaN(precio_base) || Number.isNaN(stock_actual)) {
    throw new Error("Precio y stock son obligatorios para un producto.");
  }

  return { precio_base, stock_actual };
}

export async function createItem(formData: FormData) {
  const { nombre, id_categoria, descripcion } = readBaseFields(formData);
  const { precio_base, stock_actual } = await readPrecioStock(formData, id_categoria);

  await prisma.item.create({
    data: { nombre, id_categoria, descripcion, precio_base, stock_actual },
  });

  revalidatePath("/stock");
  revalidatePath("/");
  redirect("/stock");
}

export async function updateItem(id_item: number, formData: FormData) {
  const { nombre, id_categoria, descripcion } = readBaseFields(formData);
  const { precio_base, stock_actual } = await readPrecioStock(formData, id_categoria);

  await prisma.item.update({
    where: { id_item },
    data: { nombre, id_categoria, descripcion, precio_base, stock_actual },
  });

  revalidatePath("/stock");
  revalidatePath("/");
  redirect("/stock");
}

export async function setActivo(id_item: number, activo: boolean) {
  await prisma.item.update({ where: { id_item }, data: { activo } });
  revalidatePath("/stock");
  revalidatePath("/");
}
