import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateItem } from "../../actions";
import { ItemForm } from "../../ItemForm";
import { verifySession } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function EditarItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifySession();

  const { id } = await params;
  const id_item = Number(id);

  const item = await prisma.item.findUnique({ where: { id_item } });

  if (!item) notFound();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 pb-8 md:gap-6 md:p-6">
      <h1 className="text-xl font-bold tracking-wide uppercase md:text-2xl">
        Editar {item.nombre}
      </h1>
      <ItemForm action={updateItem.bind(null, item.id_item)} item={{ nombre: item.nombre }} />
    </div>
  );
}
