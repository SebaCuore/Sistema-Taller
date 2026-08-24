"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function DateFilterForm({ fecha }: { fecha: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function cambiar(nuevaFecha: string) {
    const params = new URLSearchParams(searchParams);
    if (nuevaFecha) {
      params.set("fecha", nuevaFecha);
    } else {
      params.delete("fecha");
    }
    router.push(`/historial?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="sr-only" htmlFor="historial-fecha">
        Filtrar por fecha
      </label>
      <input
        id="historial-fecha"
        type="date"
        defaultValue={fecha}
        onChange={(e) => cambiar(e.target.value)}
        className="w-full rounded-lg border-2 border-black px-4 py-3 text-base focus:ring-2 focus:ring-yellow-400 focus:outline-none sm:w-56"
      />
    </div>
  );
}
