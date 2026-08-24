"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function BuscarPatenteForm({ patente }: { patente: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [valor, setValor] = useState(patente);

  function buscar() {
    const params = new URLSearchParams(searchParams);
    const q = valor.trim();
    if (q) {
      params.set("patente", q);
    } else {
      params.delete("patente");
    }
    router.push(`/historial?${params.toString()}`);
  }

  return (
    <div className="flex gap-2">
      <label className="sr-only" htmlFor="historial-patente">
        Buscar por patente
      </label>
      <input
        id="historial-patente"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && buscar()}
        placeholder="Buscar por patente"
        className="flex-1 rounded-lg border-2 border-black px-4 py-3 text-base uppercase focus:ring-2 focus:ring-yellow-400 focus:outline-none"
      />
      <button
        onClick={buscar}
        className="rounded-lg border-2 border-black bg-yellow-400 px-5 py-3 text-sm font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-yellow-400"
      >
        Buscar
      </button>
    </div>
  );
}
