import { prisma } from "@/lib/prisma";
import { VentaClient } from "./VentaClient";
import { verifySession } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function VentaPage() {
  await verifySession();

  const [items, metodosPago] = await Promise.all([
    prisma.item.findMany({
      where: { activo: true, categoria: { nombre: "Producto" } },
      orderBy: { nombre: "asc" },
    }),
    prisma.metodoPago.findMany({ where: { activo: true }, orderBy: { id_metodo_pago: "asc" } }),
  ]);

  return (
    <VentaClient
      items={items.map((item) => ({ id_item: item.id_item, nombre: item.nombre }))}
      metodosPago={metodosPago.map((m) => ({ id: m.id_metodo_pago, nombre: m.nombre }))}
    />
  );
}
