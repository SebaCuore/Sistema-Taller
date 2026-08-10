import { prisma } from "@/lib/prisma";
import { VentaClient } from "./VentaClient";

export const dynamic = "force-dynamic";

export default async function VentaPage() {
  const [categorias, items, metodosPago] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.item.findMany({
      where: { activo: true },
      include: {
        categoria: true,
        item_medidas: {
          where: { activo: true },
          include: { medida: true },
          orderBy: { medida: { codigo: "asc" } },
        },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.metodoPago.findMany({ where: { activo: true }, orderBy: { id_metodo_pago: "asc" } }),
  ]);

  const itemsSerializados = items.map((item) => ({
    id_item: item.id_item,
    nombre: item.nombre,
    categoria: item.categoria.nombre,
    tiene_medida: item.tiene_medida,
    precio_base: item.precio_base ? item.precio_base.toNumber() : null,
    stock_actual: item.stock_actual,
    medidas: item.item_medidas.map((m) => ({
      id_item_medida: m.id_item_medida,
      codigo: m.medida.codigo,
      precio: m.precio.toNumber(),
      stock: m.stock,
    })),
  }));

  return (
    <VentaClient
      categorias={categorias.map((c) => c.nombre)}
      items={itemsSerializados}
      metodosPago={metodosPago.map((m) => ({ id: m.id_metodo_pago, nombre: m.nombre }))}
    />
  );
}
