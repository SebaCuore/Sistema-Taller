"use client";

import { useMemo, useState, useTransition } from "react";
import { actualizarStock } from "../actions";

type Item = { id_item: number; nombre: string; stock_actual: number };

export function ActualizarStockClient({ items }: { items: Item[] }) {
  const [busqueda, setBusqueda] = useState("");

  const itemsFiltrados = useMemo(
    () =>
      items.filter((item) =>
        item.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
      ),
    [items, busqueda]
  );

  return (
    <div className="flex flex-col gap-4">
      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar producto por nombre"
        className="rounded-lg border-2 border-black px-4 py-3 text-base focus:ring-2 focus:ring-yellow-400 focus:outline-none"
      />

      <div className="flex flex-col gap-3">
        {itemsFiltrados.map((item) => (
          <FilaProducto key={item.id_item} item={item} />
        ))}
        {itemsFiltrados.length === 0 && (
          <p className="py-8 text-center text-sm font-medium text-black/50">
            No hay productos para esta búsqueda.
          </p>
        )}
      </div>
    </div>
  );
}

function FilaProducto({ item }: { item: Item }) {
  const [valor, setValor] = useState(String(item.stock_actual));
  const [pending, startTransition] = useTransition();
  const [guardado, setGuardado] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function guardar() {
    const cantidad = Number(valor);
    if (!Number.isFinite(cantidad)) {
      setErrorMsg("Cantidad inválida.");
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await actualizarStock(item.id_item, cantidad);
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2000);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "No se pudo guardar.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border-2 border-black bg-white p-3 md:flex-row md:items-center md:justify-between md:p-4">
      <span className="font-bold">{item.nombre}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-24 rounded-lg border-2 border-black px-3 py-2 text-base font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none"
        />
        <button
          onClick={guardar}
          disabled={pending}
          className="rounded-lg border-2 border-black bg-yellow-400 px-4 py-2 text-xs font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-yellow-400 disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-500 md:text-sm"
        >
          {pending ? "Guardando..." : "Guardar"}
        </button>
        {guardado && (
          <span className="text-xs font-bold tracking-wide text-black/60 uppercase">
            Guardado
          </span>
        )}
        {errorMsg && (
          <span className="text-xs font-bold tracking-wide text-red-600 uppercase">
            {errorMsg}
          </span>
        )}
      </div>
    </div>
  );
}
