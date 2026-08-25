"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";

function readNombre(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();

  if (!nombre) {
    throw new Error("El nombre es obligatorio.");
  }

  return nombre;
}

// Un Producto guarda solo su nombre: el precio se escribe a mano en cada venta
// y por ahora no se lleva control de cantidad. Las columnas precio_base y
// stock_actual quedan en null (ver Documentation/03-modelo-de-datos.md).
export async function createItem(formData: FormData) {
  await verifySession();

  const nombre = readNombre(formData);
  const categoria = await prisma.categoria.findUniqueOrThrow({ where: { nombre: "Producto" } });

  await prisma.item.create({
    data: { nombre, id_categoria: categoria.id_categoria },
  });

  revalidatePath("/productos");
  revalidatePath("/venta");
  redirect("/productos");
}

export async function updateItem(id_item: number, formData: FormData) {
  await verifySession();

  const nombre = readNombre(formData);

  await prisma.item.update({ where: { id_item }, data: { nombre } });

  revalidatePath("/productos");
  revalidatePath("/venta");
  redirect("/productos");
}

export async function setActivo(id_item: number, activo: boolean) {
  await verifySession();

  await prisma.item.update({ where: { id_item }, data: { activo } });
  revalidatePath("/productos");
  revalidatePath("/venta");
}
