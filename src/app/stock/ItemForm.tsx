"use client";

import { useState } from "react";

type Categoria = { id_categoria: number; nombre: string };

const inputClass =
  "rounded-lg border-2 border-black px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-yellow-400";

export function ItemForm({
  action,
  categorias,
  item,
}: {
  action: (formData: FormData) => void;
  categorias: Categoria[];
  item?: {
    nombre: string;
    descripcion: string | null;
    id_categoria: number;
    precio_base: number | null;
    stock_actual: number | null;
  };
}) {
  const [idCategoria, setIdCategoria] = useState(
    item?.id_categoria ?? categorias[0]?.id_categoria
  );
  const categoriaSeleccionada = categorias.find((c) => c.id_categoria === idCategoria);
  const esProducto = categoriaSeleccionada?.nombre === "Producto";

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
          placeholder="Ej. Alineación"
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
          value={idCategoria}
          onChange={(e) => setIdCategoria(Number(e.target.value))}
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

      {esProducto ? (
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
              required
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
              required
              defaultValue={item?.stock_actual ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      ) : (
        <p className="rounded-lg border-2 border-black bg-yellow-100 px-3 py-3 text-sm font-semibold">
          Los servicios no llevan precio cargado: el monto se ingresa a mano al momento de la
          venta.
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-lg border-4 border-black bg-yellow-400 py-4 text-center text-lg font-black tracking-wide uppercase text-black transition active:scale-[0.98] hover:bg-black hover:text-yellow-400"
      >
        Guardar
      </button>
    </form>
  );
}
