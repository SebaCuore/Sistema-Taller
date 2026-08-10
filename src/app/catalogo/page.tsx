import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { setActivo } from "./actions";

export const dynamic = "force-dynamic";

const FILTROS = [
  { key: "activos", label: "Activos" },
  { key: "inactivos", label: "Inactivos" },
  { key: "todos", label: "Todos" },
] as const;

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado = "activos" } = await searchParams;

  const items = await prisma.item.findMany({
    where: estado === "todos" ? {} : { activo: estado !== "inactivos" },
    include: {
      categoria: true,
      item_medidas: { where: { activo: true }, include: { medida: true } },
    },
    orderBy: [{ categoria: { nombre: "asc" } }, { nombre: "asc" }],
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 pb-8 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-wide uppercase md:text-2xl">Catálogo</h1>
        <Link
          href="/catalogo/nuevo"
          className="rounded-lg border-2 border-black bg-yellow-400 px-4 py-2.5 text-sm font-bold tracking-wide uppercase text-black transition-colors hover:bg-black hover:text-yellow-400 md:px-6 md:py-3"
        >
          Nuevo
        </Link>
      </div>

      <div className="flex gap-2">
        {FILTROS.map((f) => (
          <Link
            key={f.key}
            href={`/catalogo?estado=${f.key}`}
            className={`rounded-lg border-2 border-black px-4 py-2 text-xs font-bold tracking-wide uppercase transition-colors md:text-sm ${
              estado === f.key ? "bg-black text-white" : "bg-white text-black hover:bg-yellow-400"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {items.map((item) => {
          const precioLabel = item.tiene_medida
            ? item.item_medidas.length > 0
              ? `Desde $${Math.min(...item.item_medidas.map((m) => m.precio.toNumber())).toFixed(2)}`
              : "Sin medidas activas"
            : `$${item.precio_base?.toNumber().toFixed(2) ?? "-"}`;

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
                <span className="text-sm font-semibold text-black/70">{precioLabel}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Link
                  href={`/catalogo/${item.id_item}/editar`}
                  className="rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-bold tracking-wide uppercase transition-colors hover:bg-black hover:text-white"
                >
                  Editar
                </Link>
                <form action={setActivo.bind(null, item.id_item, !item.activo)}>
                  <button
                    type="submit"
                    className={`rounded-lg border-2 border-black px-3 py-1.5 text-xs font-bold tracking-wide uppercase ${
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
