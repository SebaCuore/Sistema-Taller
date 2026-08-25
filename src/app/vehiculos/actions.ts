"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";

export type LineaServicio = {
  id_item: number;
  cantidad: number;
  /** Monto cargado a mano al momento de la venta. */
  monto: number;
  descripcion?: string;
  rueda?: "DELANTERA" | "TRASERA";
  lado?: "DERECHA" | "IZQUIERDA";
};

export async function cobrarVehiculo(
  patente: string | undefined,
  tipo_vehiculo: "MOTO" | "AUTO",
  lineas: LineaServicio[],
  id_metodo_pago: number
) {
  await verifySession();

  if (tipo_vehiculo !== "MOTO" && tipo_vehiculo !== "AUTO") {
    throw new Error("Elegí si el vehículo es Moto o Auto.");
  }

  const lineasValidas = lineas.filter((l) => l.cantidad > 0);
  if (lineasValidas.length === 0) {
    throw new Error("Agregá al menos un servicio antes de cobrar.");
  }
  if (lineasValidas.length > 100) {
    throw new Error("Demasiadas líneas en la venta.");
  }
  if (!id_metodo_pago) {
    throw new Error("Elegí un método de pago.");
  }

  const venta = await prisma.$transaction(async (tx) => {
    const vehiculo = await tx.vehiculo.create({
      data: {
        patente: patente?.trim().toUpperCase().slice(0, 12) || null,
        tipo_vehiculo,
      },
    });

    let monto_total = 0;
    const detalles: {
      id_item: number;
      id_vehiculo: number;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
      descripcion: string | null;
      rueda: "DELANTERA" | "TRASERA" | null;
      lado: "DERECHA" | "IZQUIERDA" | null;
    }[] = [];

    for (const linea of lineasValidas) {
      const item = await tx.item.findUnique({
        where: { id_item: linea.id_item },
        include: { categoria: true },
      });
      if (!item || !item.activo || item.categoria.nombre !== "Servicio") {
        throw new Error("Uno de los servicios ya no está disponible.");
      }
      if (!linea.monto || linea.monto <= 0) {
        throw new Error(`Ingresá un monto válido para ${item.nombre}.`);
      }

      const subtotal = linea.monto * linea.cantidad;
      monto_total += subtotal;
      detalles.push({
        id_item: linea.id_item,
        id_vehiculo: vehiculo.id_vehiculo,
        cantidad: linea.cantidad,
        precio_unitario: linea.monto,
        subtotal,
        descripcion: linea.descripcion?.trim() || null,
        rueda: linea.rueda ?? null,
        lado: linea.lado ?? null,
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

  revalidatePath("/");
  revalidatePath("/historial");

  return { id_venta: venta.id_venta, monto_total: venta.monto_total.toNumber() };
}

export async function crearServicio(nombre: string) {
  await verifySession();

  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) {
    throw new Error("El nombre del servicio es obligatorio.");
  }

  const categoria = await prisma.categoria.findUniqueOrThrow({
    where: { nombre: "Servicio" },
  });

  const item = await prisma.item.create({
    data: { nombre: nombreLimpio, id_categoria: categoria.id_categoria },
  });

  revalidatePath("/");

  return { id_item: item.id_item, nombre: item.nombre };
}

export async function borrarServicio(id_item: number) {
  await verifySession();

  const item = await prisma.item.findUnique({
    where: { id_item },
    include: { categoria: true },
  });
  if (!item || item.categoria.nombre !== "Servicio") {
    throw new Error("El ítem no es un servicio válido.");
  }

  await prisma.item.update({ where: { id_item }, data: { activo: false } });

  revalidatePath("/");
}
