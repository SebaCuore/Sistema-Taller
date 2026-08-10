"use client";

import { useState, useTransition } from "react";
import { borrarVenta } from "./actions";

export function DeleteVentaButton({ id_venta }: { id_venta: number }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirmando) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold tracking-wide uppercase">¿Borrar?</span>
        <button
          onClick={() => setConfirmando(false)}
          disabled={pending}
          className="rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] hover:bg-black hover:text-white"
        >
          No
        </button>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await borrarVenta(id_venta);
              setConfirmando(false);
            })
          }
          className="rounded-lg border-2 border-black bg-black px-3 py-1.5 text-xs font-bold tracking-wide uppercase text-white transition active:scale-[0.97] disabled:opacity-50"
        >
          {pending ? "Borrando..." : "Sí, borrar"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] hover:bg-black hover:text-white"
    >
      Borrar venta
    </button>
  );
}
