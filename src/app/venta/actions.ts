"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";

export type LineaVenta = {
  id_item: number;
  cantidad: number;
  /** Solo para servicios: precio unitario cargado a mano al momento de la venta. */
  monto?: number;
  /** Datos opcionales del vehículo atendido, para productos o servicios. */
  patente?: string;
  rueda?: "DELANTERA" | "TRASERA";
  lado?: "DERECHA" | "IZQUIERDA";
};

export async function confirmarVenta(lineas: LineaVenta[], id_metodo_pago: number) {
  await verifySession();

  if (lineas.length === 0) {
    throw new Error("El carrito está vacío.");
  }
  if (lineas.length > 100) {
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
      patente: string | null;
      rueda: "DELANTERA" | "TRASERA" | null;
      lado: "DERECHA" | "IZQUIERDA" | null;
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

      const esServicio = item.categoria.nombre === "Servicio";
      let precio_unitario: number;

      if (esServicio) {
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
        patente: linea.patente?.trim().toUpperCase().slice(0, 12) || null,
        rueda: linea.rueda ?? null,
        lado: linea.lado ?? null,
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
