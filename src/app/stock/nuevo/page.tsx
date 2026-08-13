import { createItem } from "../actions";
import { ItemForm } from "../ItemForm";

export default function NuevoItemPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 pb-8 md:gap-6 md:p-6">
      <h1 className="text-xl font-bold tracking-wide uppercase md:text-2xl">Nuevo producto</h1>
      <ItemForm action={createItem} />
    </div>
  );
}
