import { prisma } from "@/lib/prisma";
import { createItem } from "../actions";
import { ItemForm } from "../ItemForm";

export const dynamic = "force-dynamic";

export default async function NuevoItemPage() {
  const categorias = await prisma.categoria.findMany({ orderBy: { nombre: "asc" } });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 pb-8 md:gap-6 md:p-6">
      <h1 className="text-xl font-bold tracking-wide uppercase md:text-2xl">
        Nuevo servicio / producto
      </h1>
      <ItemForm action={createItem} categorias={categorias} />
    </div>
  );
}
