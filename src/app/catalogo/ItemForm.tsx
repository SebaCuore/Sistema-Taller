"use client";

import { useState } from "react";

type Categoria = { id_categoria: number; nombre: string };
type Medida = { id_medida: number; codigo: string };
type ExistingMedida = { id_medida: number; precio: number; stock: number };

const inputClass =
  "rounded-lg border-2 border-black px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-yellow-400";

export function ItemForm({
  action,
  categorias,
  medidas,
  item,
}: {
  action: (formData: FormData) => void;
  categorias: Categoria[];
  medidas: Medida[];
  item?: {
    nombre: string;
    descripcion: string | null;
    id_categoria: number;
    tiene_medida: boolean;
    precio_base: number | null;
    stock_actual: number | null;
    item_medidas: ExistingMedida[];
  };
}) {
  const [tieneMedida, setTieneMedida] = useState(item?.tiene_medida ?? false);
  const existingByMedida = new Map(
    (item?.item_medidas ?? []).map((m) => [m.id_medida, m])
  );
  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(
    new Set(item?.item_medidas.map((m) => m.id_medida) ?? [])
  );

  function toggleMedida(id: number) {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
          defaultValue={item?.nombre}
          placeholder="Ej. Cámara de Moto"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold tracking-wide uppercase" htmlFor="id_categoria">
          Categoría
        </label>
        <select
          id="id_categoria"
          name="id_categoria"
          required
          defaultValue={item?.id_categoria ?? categorias[0]?.id_categoria}
          className={inputClass}
        >
          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold tracking-wide uppercase" htmlFor="descripcion">
          Descripción (opcional)
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={2}
          defaultValue={item?.descripcion ?? ""}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-3 rounded-lg border-2 border-black px-3 py-3">
        <input
          type="checkbox"
          name="tiene_medida"
          checked={tieneMedida}
          onChange={(e) => setTieneMedida(e.target.checked)}
          className="h-5 w-5 accent-yellow-400"
        />
        <span className="text-sm font-bold tracking-wide uppercase">Precio por rodado/medida</span>
      </label>

      {!tieneMedida ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold tracking-wide uppercase" htmlFor="precio_base">
              Precio ($)
            </label>
            <input
              id="precio_base"
              name="precio_base"
              type="number"
              step="0.01"
              min="0"
              required={!tieneMedida}
              defaultValue={item?.precio_base ?? ""}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold tracking-wide uppercase" htmlFor="stock_actual">
              Stock
            </label>
            <input
              id="stock_actual"
              name="stock_actual"
              type="number"
              min="0"
              defaultValue={item?.stock_actual ?? ""}
              placeholder="Vacío si es servicio"
              className={inputClass}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border-2 border-black p-3">
          <p className="text-sm font-bold tracking-wide uppercase">Medida, precio y stock</p>
          {medidas.map((medida) => {
            const existing = existingByMedida.get(medida.id_medida);
            const checked = seleccionadas.has(medida.id_medida);
            return (
              <div key={medida.id_medida} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name={`medida_${medida.id_medida}_enabled`}
                  checked={checked}
                  onChange={() => toggleMedida(medida.id_medida)}
                  className="h-5 w-5 shrink-0 accent-yellow-400"
                />
                <span className="w-16 shrink-0 rounded bg-black px-2 py-1 text-center text-xs font-bold text-white">
                  {medida.codigo}
                </span>
                <input
                  type="number"
                  name={`medida_${medida.id_medida}_precio`}
                  step="0.01"
                  min="0"
                  placeholder="Precio"
                  defaultValue={existing?.precio ?? ""}
                  disabled={!checked}
                  className="w-full rounded-lg border-2 border-black px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:border-zinc-300 disabled:bg-zinc-100"
                />
                <input
                  type="number"
                  name={`medida_${medida.id_medida}_stock`}
                  min="0"
                  placeholder="Stock"
                  defaultValue={existing?.stock ?? ""}
                  disabled={!checked}
                  className="w-full rounded-lg border-2 border-black px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:border-zinc-300 disabled:bg-zinc-100"
                />
              </div>
            );
          })}
        </div>
      )}

      <button
        type="submit"
        className="w-full rounded-lg border-4 border-black bg-yellow-400 py-4 text-center text-lg font-black tracking-wide uppercase text-black transition-colors hover:bg-black hover:text-yellow-400"
      >
        Guardar
      </button>
    </form>
  );
}
