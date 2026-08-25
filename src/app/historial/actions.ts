"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";

export async function borrarVenta(id_venta: number) {
  await verifySession();

  await prisma.$transaction(async (tx) => {
    const detalles = await tx.detalleVenta.findMany({
      where: { id_venta },
      select: { id_vehiculo: true },
    });

    const idsVehiculo = Array.from(
      new Set(detalles.map((d) => d.id_vehiculo).filter((id): id is number => id !== null))
    );

    await tx.detalleVenta.deleteMany({ where: { id_venta } });
    await tx.venta.delete({ where: { id_venta } });

    // Un vehículo se crea junto con la venta que lo usa (no es un catálogo
    // reutilizable): si borrar esta venta lo deja sin ningún detalle, no
    // tiene sentido conservarlo.
    if (idsVehiculo.length > 0) {
      await tx.vehiculo.deleteMany({
        where: { id_vehiculo: { in: idsVehiculo }, detalles: { none: {} } },
      });
    }
  });

  revalidatePath("/historial");
  revalidatePath("/");
}
