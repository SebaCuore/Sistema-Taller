import { prisma } from "@/lib/prisma";
import { VentaClient } from "./VentaClient";

export const dynamic = "force-dynamic";

export default async function VentaPage() {
  const [categorias, items, metodosPago] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.item.findMany({
      where: { activo: true },
      include: { categoria: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.metodoPago.findMany({ where: { activo: true }, orderBy: { id_metodo_pago: "asc" } }),
  ]);

  const itemsSerializados = items.map((item) => ({
    id_item: item.id_item,
    nombre: item.nombre,
    categoria: item.categoria.nombre,
    precio_base: item.precio_base ? item.precio_base.toNumber() : null,
    stock_actual: item.stock_actual,
    tipo_vehiculo: item.tipo_vehiculo,
  }));

  return (
    <VentaClient
      categorias={categorias.map((c) => c.nombre)}
      items={itemsSerializados}
      metodosPago={metodosPago.map((m) => ({ id: m.id_metodo_pago, nombre: m.nombre }))}
    />
  );
}
