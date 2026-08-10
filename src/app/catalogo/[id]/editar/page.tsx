import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateItem } from "../../actions";
import { ItemForm } from "../../ItemForm";

export const dynamic = "force-dynamic";

export default async function EditarItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const id_item = Number(id);

  const [item, categorias, medidas] = await Promise.all([
    prisma.item.findUnique({
      where: { id_item },
      include: { item_medidas: true },
    }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.medida.findMany({ where: { activo: true }, orderBy: { codigo: "asc" } }),
  ]);

  if (!item) notFound();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 pb-8 md:gap-6 md:p-6">
      <h1 className="text-xl font-bold tracking-wide uppercase md:text-2xl">
        Editar {item.nombre}
      </h1>
      <ItemForm
        action={updateItem.bind(null, item.id_item)}
        categorias={categorias}
        medidas={medidas}
        item={{
          nombre: item.nombre,
          descripcion: item.descripcion,
          id_categoria: item.id_categoria,
          tiene_medida: item.tiene_medida,
          precio_base: item.precio_base ? item.precio_base.toNumber() : null,
          stock_actual: item.stock_actual,
          item_medidas: item.item_medidas
            .filter((m) => m.activo)
            .map((m) => ({
              id_medida: m.id_medida,
              precio: m.precio.toNumber(),
              stock: m.stock,
            })),
        }}
      />
    </div>
  );
}
