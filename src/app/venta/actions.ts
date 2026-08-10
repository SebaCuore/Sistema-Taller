"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type LineaVenta = {
  id_item: number;
  id_item_medida: number | null;
  cantidad: number;
};

export async function confirmarVenta(lineas: LineaVenta[], id_metodo_pago: number) {
  if (lineas.length === 0) {
    throw new Error("El carrito está vacío.");
  }
  if (!id_metodo_pago) {
    throw new Error("Elegí un método de pago.");
  }

  const venta = await prisma.$transaction(async (tx) => {
    let monto_total = 0;
    const detalles: {
      id_item: number;
      id_item_medida: number | null;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
    }[] = [];

    for (const linea of lineas) {
      if (linea.cantidad <= 0) continue;

      if (linea.id_item_medida) {
        const itemMedida = await tx.itemMedida.findUnique({
          where: { id_item_medida: linea.id_item_medida },
          include: { item: true },
        });
        if (!itemMedida || !itemMedida.activo || itemMedida.id_item !== linea.id_item) {
          throw new Error("Uno de los ítems ya no está disponible.");
        }
        const actualizado = await tx.itemMedida.updateMany({
          where: { id_item_medida: linea.id_item_medida, stock: { gte: linea.cantidad } },
          data: { stock: { decrement: linea.cantidad } },
        });
        if (actualizado.count === 0) {
          throw new Error(`Sin stock suficiente de ${itemMedida.item.nombre}.`);
        }
        const precio_unitario = itemMedida.precio.toNumber();
        const subtotal = precio_unitario * linea.cantidad;
        monto_total += subtotal;
        detalles.push({
          id_item: linea.id_item,
          id_item_medida: linea.id_item_medida,
          cantidad: linea.cantidad,
          precio_unitario,
          subtotal,
        });
      } else {
        const item = await tx.item.findUnique({ where: { id_item: linea.id_item } });
        if (!item || !item.activo) {
          throw new Error("Uno de los ítems ya no está disponible.");
        }
        if (item.stock_actual !== null) {
          const actualizado = await tx.item.updateMany({
            where: { id_item: linea.id_item, stock_actual: { gte: linea.cantidad } },
            data: { stock_actual: { decrement: linea.cantidad } },
          });
          if (actualizado.count === 0) {
            throw new Error(`Sin stock suficiente de ${item.nombre}.`);
          }
        }
        const precio_unitario = item.precio_base?.toNumber() ?? 0;
        const subtotal = precio_unitario * linea.cantidad;
        monto_total += subtotal;
        detalles.push({
          id_item: linea.id_item,
          id_item_medida: null,
          cantidad: linea.cantidad,
          precio_unitario,
          subtotal,
        });
      }
    }

    if (detalles.length === 0) {
      throw new Error("El carrito está vacío.");
    }

    return tx.venta.create({
      data: {
        id_metodo_pago,
        monto_total,
        detalles: { create: detalles },
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/catalogo");

  return { id_venta: venta.id_venta, monto_total: venta.monto_total.toNumber() };
}
