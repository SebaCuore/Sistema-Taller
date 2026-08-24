import { prisma } from "@/lib/prisma";
import { VehiculosClient } from "./VehiculosClient";
import { verifySession } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function VehiculosPage() {
  await verifySession();

  const [servicios, metodosPago] = await Promise.all([
    prisma.item.findMany({
      where: { activo: true, categoria: { nombre: "Servicio" } },
      orderBy: { nombre: "asc" },
    }),
    prisma.metodoPago.findMany({ where: { activo: true }, orderBy: { id_metodo_pago: "asc" } }),
  ]);

  return (
    <VehiculosClient
      servicios={servicios.map((s) => ({ id_item: s.id_item, nombre: s.nombre }))}
      metodosPago={metodosPago.map((m) => ({ id: m.id_metodo_pago, nombre: m.nombre }))}
    />
  );
}
