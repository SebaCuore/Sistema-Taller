"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function borrarVenta(id_venta: number) {
  await prisma.$transaction(async (tx) => {
    const detalles = await tx.detalleVenta.findMany({
      where: { id_venta },
      include: { item: { include: { categoria: true } } },
    });

    for (const detalle of detalles) {
      if (detalle.item.categoria.nombre === "Producto") {
        await tx.item.update({
          where: { id_item: detalle.id_item },
          data: { stock_actual: (detalle.item.stock_actual ?? 0) + detalle.cantidad },
        });
      }
    }

    await tx.detalleVenta.deleteMany({ where: { id_venta } });
    await tx.venta.delete({ where: { id_venta } });
  });

  revalidatePath("/historial");
  revalidatePath("/stock");
  revalidatePath("/");
}
