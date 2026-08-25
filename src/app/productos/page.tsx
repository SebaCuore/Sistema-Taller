import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { setActivo } from "./actions";
import { verifySession } from "@/lib/dal";
import { ActivoButton } from "./ActivoButton";

export const dynamic = "force-dynamic";

const FILTROS_ESTADO = [
  { key: "activos", label: "Activos" },
  { key: "inactivos", label: "Inactivos" },
  { key: "todos", label: "Todos" },
] as const;

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  await verifySession();

  const { estado = "activos" } = await searchParams;

  const items = await prisma.item.findMany({
    where: {
      categoria: { nombre: "Producto" },
      ...(estado === "todos" ? {} : { activo: estado !== "inactivos" }),
    },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 pb-8 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-wide uppercase md:text-2xl">Productos</h1>
        <Link
          href="/productos/nuevo"
          className="rounded-lg border-2 border-black bg-yellow-400 px-4 py-2.5 text-sm font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-yellow-400 md:px-6 md:py-3"
        >
          Nuevo Producto
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS_ESTADO.map((f) => (
          <Link
            key={f.key}
            href={`/productos?estado=${f.key}`}
            className={`rounded-lg border-2 border-black px-4 py-2 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] md:text-sm ${
              estado === f.key ? "bg-black text-white" : "bg-white text-black hover:bg-yellow-400"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id_item}
            className="flex items-center justify-between gap-3 rounded-lg border-2 border-black bg-white p-3 md:p-4"
          >
            <span className="min-w-0 truncate font-bold">{item.nombre}</span>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/productos/${item.id_item}/editar`}
                className="rounded-lg border-2 border-black bg-white px-3 py-2.5 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] hover:bg-black hover:text-white"
              >
                Editar
              </Link>
              <form action={setActivo.bind(null, item.id_item, !item.activo)}>
                <ActivoButton activo={item.activo} />
              </form>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm font-medium text-black/50">
            No hay productos para este filtro.
          </p>
        )}
      </div>
    </div>
  );
}
