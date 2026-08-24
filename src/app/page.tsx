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

  const itemsSerializados = items.map((item) => ({
    id_item: item.id_item,
    nombre: item.nombre,
    precio_base: item.precio_base ? item.precio_base.toNumber() : null,
    stock_actual: item.stock_actual,
    tipo_vehiculo: item.tipo_vehiculo,
  }));

  return (
    <VentaClient
      items={itemsSerializados}
      metodosPago={metodosPago.map((m) => ({ id: m.id_metodo_pago, nombre: m.nombre }))}
    />
  );
}
