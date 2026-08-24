"use client";

import { useFormStatus } from "react-dom";

export function ActivoButton({ activo }: { activo: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg border-2 border-black px-3 py-2.5 text-xs font-bold tracking-wide uppercase active:scale-[0.97] disabled:opacity-50 ${
        activo ? "bg-yellow-400 text-black" : "bg-white text-black/60"
      }`}
    >
      {pending ? "..." : activo ? "Activo" : "Inactivo"}
    </button>
  );
}
