"use client";

import { useState } from "react";
import Link from "next/link";

type TipoVehiculo = "MOTO" | "AUTO";

const inputClass =
  "rounded-lg border-2 border-black px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-yellow-400";

export function ItemForm({
  action,
  item,
}: {
  action: (formData: FormData) => void;
  item?: {
    nombre: string;
    precio_base: number | null;
    stock_actual: number | null;
    tipo_vehiculo: TipoVehiculo | null;
  };
}) {
  const [tipoVehiculo, setTipoVehiculo] = useState<TipoVehiculo | null>(
    item?.tipo_vehiculo ?? null
  );

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
          placeholder="Ej. Cámara de moto"
          className={inputClass}
        />
      </div>

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
            Cantidad
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

      <div className="flex flex-col gap-1">
        <span className="text-sm font-bold tracking-wide uppercase">Tipo</span>
        <input type="hidden" name="tipo_vehiculo" value={tipoVehiculo ?? ""} />
        <div className="grid grid-cols-2 gap-3">
          {(["MOTO", "AUTO"] as const).map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setTipoVehiculo(tipo)}
              className={`rounded-lg border-2 border-black py-3 text-sm font-bold tracking-wide uppercase transition active:scale-[0.97] ${
                tipoVehiculo === tipo
                  ? "bg-yellow-400 text-black"
                  : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              {tipo === "MOTO" ? "Moto" : "Auto"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href="/stock"
          className="flex-1 rounded-lg border-2 border-black bg-white py-4 text-center text-sm font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-white"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          className="flex-1 rounded-lg border-4 border-black bg-yellow-400 py-4 text-center text-lg font-black tracking-wide uppercase text-black transition active:scale-[0.98] hover:bg-black hover:text-yellow-400"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
