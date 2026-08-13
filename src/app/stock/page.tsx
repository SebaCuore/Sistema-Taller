import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { setActivo } from "./actions";

export const dynamic = "force-dynamic";

const FILTROS_ESTADO = [
  { key: "activos", label: "Activos" },
  { key: "inactivos", label: "Inactivos" },
  { key: "todos", label: "Todos" },
] as const;

const FILTROS_TIPO = [
  { key: "todos", label: "Todos" },
  { key: "moto", label: "Moto" },
  { key: "auto", label: "Auto" },
] as const;

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; tipo?: string }>;
}) {
  const { estado = "activos", tipo = "todos" } = await searchParams;

  const items = await prisma.item.findMany({
    where: {
      categoria: { nombre: "Producto" },
      ...(estado === "todos" ? {} : { activo: estado !== "inactivos" }),
      ...(tipo === "moto" ? { tipo_vehiculo: "MOTO" } : {}),
      ...(tipo === "auto" ? { tipo_vehiculo: "AUTO" } : {}),
    },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 pb-8 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-wide uppercase md:text-2xl">Stock</h1>
        <div className="flex gap-2">
          <Link
            href="/stock/actualizar"
            className="rounded-lg border-2 border-black bg-white px-4 py-2.5 text-sm font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-white md:px-6 md:py-3"
          >
            Actualizar Stock
          </Link>
          <Link
            href="/stock/nuevo"
            className="rounded-lg border-2 border-black bg-yellow-400 px-4 py-2.5 text-sm font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-yellow-400 md:px-6 md:py-3"
          >
            Nuevo Producto
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS_ESTADO.map((f) => (
          <Link
            key={f.key}
            href={`/stock?estado=${f.key}&tipo=${tipo}`}
            className={`rounded-lg border-2 border-black px-4 py-2 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] md:text-sm ${
              estado === f.key ? "bg-black text-white" : "bg-white text-black hover:bg-yellow-400"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS_TIPO.map((f) => (
          <Link
            key={f.key}
            href={`/stock?estado=${estado}&tipo=${f.key}`}
            className={`rounded-lg border-2 border-black px-4 py-2 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] md:text-sm ${
              tipo === f.key ? "bg-black text-white" : "bg-white text-black hover:bg-yellow-400"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {items.map((item) => {
          const sinStock = (item.stock_actual ?? 0) <= 0;

          return (
            <div
              key={item.id_item}
              className="flex items-center justify-between gap-3 rounded-lg border-2 border-black bg-white p-3 md:p-4"
            >
              <div className="flex flex-col">
                <span className="text-[11px] font-bold tracking-wide text-black/50 uppercase">
                  {item.tipo_vehiculo === "MOTO"
                    ? "Moto"
                    : item.tipo_vehiculo === "AUTO"
                      ? "Auto"
                      : "Sin tipo"}
                </span>
                <span className="font-bold">{item.nombre}</span>
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
            No hay productos para este filtro.
          </p>
        )}
      </div>
    </div>
  );
}
