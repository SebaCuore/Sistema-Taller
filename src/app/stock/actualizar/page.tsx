import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ActualizarStockClient } from "./ActualizarStockClient";
import { verifySession } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function ActualizarStockPage() {
  await verifySession();

  const items = await prisma.item.findMany({
    where: { categoria: { nombre: "Producto" }, activo: true },
    orderBy: { nombre: "asc" },
  });

  const itemsSerializados = items.map((item) => ({
    id_item: item.id_item,
    nombre: item.nombre,
    stock_actual: item.stock_actual ?? 0,
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 pb-8 md:gap-6 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-wide uppercase md:text-2xl">Actualizar Stock</h1>
        <Link
          href="/stock"
          className="rounded-lg border-2 border-black bg-white px-4 py-2.5 text-sm font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-white md:px-6 md:py-3"
        >
          Cancelar
        </Link>
      </div>
      <ActualizarStockClient items={itemsSerializados} />
    </div>
  );
}
