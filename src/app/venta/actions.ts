"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";

export type LineaProducto = {
  id_item: number;
  cantidad: number;
  descripcion?: string;
};

export async function confirmarVenta(productos: LineaProducto[], id_metodo_pago: number) {
  await verifySession();

  if (productos.length === 0) {
    throw new Error("El carrito está vacío.");
  }
  if (productos.length > 100) {
    throw new Error("Demasiadas líneas en la venta.");
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
      descripcion: string | null;
    }[] = [];

    for (const linea of productos) {
      if (linea.cantidad <= 0) continue;

      const item = await tx.item.findUnique({
        where: { id_item: linea.id_item },
        include: { categoria: true },
      });
      if (!item || !item.activo || item.categoria.nombre !== "Producto") {
        throw new Error("Uno de los productos ya no está disponible.");
      }

      const precio_unitario = item.precio_base?.toNumber() ?? 0;
      // Los productos se pueden vender aunque el stock cargado en el sistema
      // sea 0 o insuficiente: puede haber stock físico sin actualizar todavía.
      // El stock puede quedar en negativo como señal de que hay que corregirlo.
      await tx.item.update({
        where: { id_item: linea.id_item },
        data: { stock_actual: (item.stock_actual ?? 0) - linea.cantidad },
      });

      const subtotal = precio_unitario * linea.cantidad;
      monto_total += subtotal;
      detalles.push({
        id_item: linea.id_item,
        cantidad: linea.cantidad,
        precio_unitario,
        subtotal,
        descripcion: linea.descripcion?.trim() || null,
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
