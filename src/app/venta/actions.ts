"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type LineaVenta = {
  id_item: number;
  cantidad: number;
  /** Solo para servicios: precio unitario cargado a mano al momento de la venta. */
  monto?: number;
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
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
    }[] = [];

    for (const linea of lineas) {
      if (linea.cantidad <= 0) continue;

      const item = await tx.item.findUnique({
        where: { id_item: linea.id_item },
        include: { categoria: true },
      });
      if (!item || !item.activo) {
        throw new Error("Uno de los ítems ya no está disponible.");
      }

      let precio_unitario: number;

      if (item.categoria.nombre === "Servicio") {
        if (!linea.monto || linea.monto <= 0) {
          throw new Error(`Ingresá un monto válido para ${item.nombre}.`);
        }
        precio_unitario = linea.monto;
      } else {
        precio_unitario = item.precio_base?.toNumber() ?? 0;
        // Los productos se pueden vender aunque el stock cargado en el sistema
        // sea 0 o insuficiente: puede haber stock físico sin actualizar todavía.
        // El stock puede quedar en negativo como señal de que hay que corregirlo.
        await tx.item.update({
          where: { id_item: linea.id_item },
          data: { stock_actual: (item.stock_actual ?? 0) - linea.cantidad },
        });
      }

      const subtotal = precio_unitario * linea.cantidad;
      monto_total += subtotal;
      detalles.push({
        id_item: linea.id_item,
        cantidad: linea.cantidad,
        precio_unitario,
        subtotal,
      });
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
  revalidatePath("/stock");

  return { id_venta: venta.id_venta, monto_total: venta.monto_total.toNumber() };
}
