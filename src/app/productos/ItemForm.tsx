"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";

const inputClass =
  "rounded-lg border-2 border-black px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-yellow-400";

function GuardarButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 rounded-lg border-4 border-black bg-yellow-400 py-4 text-center text-lg font-black tracking-wide uppercase text-black transition active:scale-[0.98] hover:bg-black hover:text-yellow-400 disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-500"
    >
      {pending ? "Guardando..." : "Guardar"}
    </button>
  );
}

export function ItemForm({
  action,
  item,
}: {
  action: (formData: FormData) => void;
  item?: { nombre: string };
}) {
  return (
    <form action={action} className="flex flex-col gap-5 md:max-w-2xl">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold tracking-wide uppercase" htmlFor="nombre">
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          autoFocus
          defaultValue={item?.nombre}
          placeholder="Ej. Cámara de moto"
          className={inputClass}
        />
        <p className="text-xs font-medium text-black/50">
          El precio y la cantidad se cargan al registrar cada venta.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/productos"
          className="flex-1 rounded-lg border-2 border-black bg-red-600 py-4 text-center text-sm font-bold tracking-wide uppercase text-white transition active:scale-[0.97] hover:bg-black hover:text-red-500"
        >
          Cancelar
        </Link>
        <GuardarButton />
      </div>
    </form>
  );
}
