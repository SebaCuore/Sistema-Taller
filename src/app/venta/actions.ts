"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";

export type LineaProducto = {
  id_item: number;
  cantidad: number;
  /** Monto unitario cargado a mano al momento de la venta. */
  monto: number;
  descripcion?: string;
};

export async function confirmarVenta(productos: LineaProducto[], id_metodo_pago: number) {
  await verifySession();

  const lineasValidas = productos.filter((l) => l.cantidad > 0);
  if (lineasValidas.length === 0) {
    throw new Error("Agregá al menos un producto antes de registrar la venta.");
  }
  if (lineasValidas.length > 100) {
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

    for (const linea of lineasValidas) {
      const item = await tx.item.findUnique({
        where: { id_item: linea.id_item },
        include: { categoria: true },
      });
      if (!item || !item.activo || item.categoria.nombre !== "Producto") {
        throw new Error("Uno de los productos ya no está disponible.");
      }
      if (!linea.monto || linea.monto <= 0) {
        throw new Error(`Ingresá un precio válido para ${item.nombre}.`);
      }

      const subtotal = linea.monto * linea.cantidad;
      monto_total += subtotal;
      detalles.push({
        id_item: linea.id_item,
        cantidad: linea.cantidad,
        precio_unitario: linea.monto,
        subtotal,
        descripcion: linea.descripcion?.trim() || null,
      });
    }

    return tx.venta.create({
      data: {
        id_metodo_pago,
        monto_total,
        detalles: { create: detalles },
      },
    });
  });

  revalidatePath("/venta");
  revalidatePath("/historial");

  return { id_venta: venta.id_venta, monto_total: venta.monto_total.toNumber() };
}
