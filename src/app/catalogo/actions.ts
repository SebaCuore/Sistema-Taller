"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type MedidaInput = { id_medida: number; precio: number; stock: number };

function parseMedidas(formData: FormData): MedidaInput[] {
  const medidas: MedidaInput[] = [];
  for (const [key, value] of formData.entries()) {
    const match = key.match(/^medida_(\d+)_enabled$/);
    if (match && value === "on") {
      const id_medida = Number(match[1]);
      const precio = Number(formData.get(`medida_${id_medida}_precio`));
      const stock = Number(formData.get(`medida_${id_medida}_stock`));
      if (!Number.isNaN(precio) && !Number.isNaN(stock)) {
        medidas.push({ id_medida, precio, stock });
      }
    }
  }
  return medidas;
}

function readBaseFields(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const id_categoria = Number(formData.get("id_categoria"));
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const tiene_medida = formData.get("tiene_medida") === "on";

  if (!nombre || !id_categoria) {
    throw new Error("Nombre y categoría son obligatorios.");
  }

  return { nombre, id_categoria, descripcion, tiene_medida };
}

export async function createItem(formData: FormData) {
  const { nombre, id_categoria, descripcion, tiene_medida } = readBaseFields(formData);

  if (tiene_medida) {
    const medidas = parseMedidas(formData);
    if (medidas.length === 0) {
      throw new Error("Marcá al menos una medida y su precio.");
    }
    await prisma.item.create({
      data: {
        nombre,
        id_categoria,
        descripcion,
        tiene_medida: true,
        item_medidas: {
          create: medidas.map((m) => ({
            id_medida: m.id_medida,
            precio: m.precio,
            stock: m.stock,
          })),
        },
      },
    });
  } else {
    const precio_base = Number(formData.get("precio_base"));
    const stockRaw = formData.get("stock_actual");
    const stock_actual = stockRaw ? Number(stockRaw) : null;
    if (Number.isNaN(precio_base)) {
      throw new Error("El precio no es válido.");
    }
    await prisma.item.create({
      data: { nombre, id_categoria, descripcion, tiene_medida: false, precio_base, stock_actual },
    });
  }

  revalidatePath("/catalogo");
  revalidatePath("/");
  redirect("/catalogo");
}

export async function updateItem(id_item: number, formData: FormData) {
  const { nombre, id_categoria, descripcion, tiene_medida } = readBaseFields(formData);

  if (tiene_medida) {
    const medidas = parseMedidas(formData);
    if (medidas.length === 0) {
      throw new Error("Marcá al menos una medida y su precio.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.item.update({
        where: { id_item },
        data: {
          nombre,
          id_categoria,
          descripcion,
          tiene_medida: true,
          precio_base: null,
          stock_actual: null,
        },
      });

      const todasMedidas = await tx.medida.findMany();
      const seleccionadas = new Map(medidas.map((m) => [m.id_medida, m]));

      for (const medida of todasMedidas) {
        const seleccionada = seleccionadas.get(medida.id_medida);
        if (seleccionada) {
          await tx.itemMedida.upsert({
            where: { id_item_id_medida: { id_item, id_medida: medida.id_medida } },
            update: { precio: seleccionada.precio, stock: seleccionada.stock, activo: true },
            create: {
              id_item,
              id_medida: medida.id_medida,
              precio: seleccionada.precio,
              stock: seleccionada.stock,
            },
          });
        } else {
          await tx.itemMedida.updateMany({
            where: { id_item, id_medida: medida.id_medida },
            data: { activo: false },
          });
        }
      }
    });
  } else {
    const precio_base = Number(formData.get("precio_base"));
    const stockRaw = formData.get("stock_actual");
    const stock_actual = stockRaw ? Number(stockRaw) : null;
    if (Number.isNaN(precio_base)) {
      throw new Error("El precio no es válido.");
    }

    await prisma.$transaction([
      prisma.item.update({
        where: { id_item },
        data: { nombre, id_categoria, descripcion, tiene_medida: false, precio_base, stock_actual },
      }),
      prisma.itemMedida.updateMany({ where: { id_item }, data: { activo: false } }),
    ]);
  }

  revalidatePath("/catalogo");
  revalidatePath("/");
  redirect("/catalogo");
}

export async function setActivo(id_item: number, activo: boolean) {
  await prisma.item.update({ where: { id_item }, data: { activo } });
  revalidatePath("/catalogo");
  revalidatePath("/");
}
