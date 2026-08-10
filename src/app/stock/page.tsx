import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { setActivo } from "./actions";

export const dynamic = "force-dynamic";

const FILTROS = [
  { key: "activos", label: "Activos" },
  { key: "inactivos", label: "Inactivos" },
  { key: "todos", label: "Todos" },
] as const;

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado = "activos" } = await searchParams;

  const items = await prisma.item.findMany({
    where: estado === "todos" ? {} : { activo: estado !== "inactivos" },
    include: { categoria: true },
    orderBy: [{ categoria: { nombre: "asc" } }, { nombre: "asc" }],
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 pb-8 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-wide uppercase md:text-2xl">Stock</h1>
        <Link
          href="/stock/nuevo"
          className="rounded-lg border-2 border-black bg-yellow-400 px-4 py-2.5 text-sm font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-yellow-400 md:px-6 md:py-3"
        >
          Nuevo
        </Link>
      </div>

      <div className="flex gap-2">
        {FILTROS.map((f) => (
          <Link
            key={f.key}
            href={`/stock?estado=${f.key}`}
            className={`rounded-lg border-2 border-black px-4 py-2 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] md:text-sm ${
              estado === f.key ? "bg-black text-white" : "bg-white text-black hover:bg-yellow-400"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {items.map((item) => {
          const esProducto = item.categoria.nombre === "Producto";
          const sinStock = esProducto && (item.stock_actual ?? 0) <= 0;

          return (
            <div
              key={item.id_item}
              className="flex items-center justify-between gap-3 rounded-lg border-2 border-black bg-white p-3 md:p-4"
            >
              <div className="flex flex-col">
                <span className="text-[11px] font-bold tracking-wide text-black/50 uppercase">
                  {item.categoria.nombre}
                </span>
                <span className="font-bold">{item.nombre}</span>
                {esProducto ? (
                  <span className="text-sm font-semibold text-black/70">
                    ${item.precio_base?.toNumber().toFixed(2) ?? "-"} · Stock:{" "}
                    <span className={sinStock ? "font-bold text-black" : undefined}>
                      {item.stock_actual ?? 0}
                    </span>
                    {sinStock && (
                      <span className="ml-2 rounded bg-black px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-yellow-400 uppercase">
                        Sin stock
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-black/70">Precio manual en la venta</span>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Link
                  href={`/stock/${item.id_item}/editar`}
                  className="rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] hover:bg-black hover:text-white"
                >
                  Editar
                </Link>
                <form action={setActivo.bind(null, item.id_item, !item.activo)}>
                  <button
                    type="submit"
                    className={`rounded-lg border-2 border-black px-3 py-1.5 text-xs font-bold tracking-wide uppercase active:scale-[0.97] ${
                      item.activo ? "bg-yellow-400 text-black" : "bg-white text-black/60"
                    }`}
                  >
                    {item.activo ? "Activo" : "Inactivo"}
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm font-medium text-black/50">
            No hay ítems para este filtro.
          </p>
        )}
      </div>
    </div>
  );
}
