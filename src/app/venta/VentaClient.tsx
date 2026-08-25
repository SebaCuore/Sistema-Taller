"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmarVenta } from "./actions";

type ItemVenta = { id_item: number; nombre: string };
type MetodoPago = { id: number; nombre: string };

// cantidad y precio se guardan como texto para que el input pueda quedar
// vacío mientras se escribe; se parsean recién al calcular el total.
type LineaVenta = {
  key: string;
  id_item: number;
  nombre: string;
  cantidad: string;
  precio: string;
};

const fmt = (n: number) => `$${n.toFixed(2)}`;

const inputClass =
  "w-full rounded-lg border-2 border-black px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-yellow-400";

// La venta en curso se guarda acá para sobrevivir a la navegación entre pantallas.
const VENTA_STORAGE_KEY = "sistema-taller:venta-en-curso";

function newKey(id_item: number) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `producto-${id_item}-${random}`;
}

function subtotalLinea(l: LineaVenta) {
  const cantidad = Number(l.cantidad);
  const precio = Number(l.precio);
  if (!Number.isFinite(cantidad) || !Number.isFinite(precio)) return 0;
  return cantidad * precio;
}

export function VentaClient({ items, metodosPago }: { items: ItemVenta[]; metodosPago: MetodoPago[] }) {
  const router = useRouter();
  const [lineas, setLineas] = useState<LineaVenta[]>([]);
  const skipPersist = useRef(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(VENTA_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { lineas?: LineaVenta[] };
      // Hidratar desde localStorage solo puede pasar después del montaje (el
      // server nunca ve localStorage), así que esto corre una única vez acá.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(data.lineas)) setLineas(data.lineas);
    } catch {
      // localStorage no disponible o con datos corruptos: se sigue con la venta vacía.
    }
  }, []);

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(VENTA_STORAGE_KEY, JSON.stringify({ lineas }));
    } catch {
      // localStorage lleno o no disponible: no es crítico, solo se pierde la persistencia.
    }
  }, [lineas]);

  const [metodoPagoId, setMetodoPagoId] = useState<number | null>(metodosPago[0]?.id ?? null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = useMemo(() => lineas.reduce((acc, l) => acc + subtotalLinea(l), 0), [lineas]);

  function agregarProducto(item: ItemVenta) {
    setErrorMsg(null);
    setLineas((prev) => [
      ...prev,
      { key: newKey(item.id_item), id_item: item.id_item, nombre: item.nombre, cantidad: "1", precio: "" },
    ]);
  }

  function editarLinea(key: string, campo: "cantidad" | "precio", valor: string) {
    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, [campo]: valor } : l)));
  }

  function quitarLinea(key: string) {
    setLineas((prev) => prev.filter((l) => l.key !== key));
  }

  function registrarVenta() {
    if (lineas.length === 0) {
      setErrorMsg("Agregá al menos un producto.");
      return;
    }
    if (!metodoPagoId) {
      setErrorMsg("Elegí un método de pago.");
      return;
    }
    for (const l of lineas) {
      const cantidad = Number(l.cantidad);
      const precio = Number(l.precio);
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        setErrorMsg(`Ingresá una cantidad válida para ${l.nombre}.`);
        return;
      }
      if (!Number.isFinite(precio) || precio <= 0) {
        setErrorMsg(`Ingresá un precio válido para ${l.nombre}.`);
        return;
      }
    }

    setErrorMsg(null);
    startTransition(async () => {
      try {
        const res = await confirmarVenta(
          lineas.map((l) => ({
            id_item: l.id_item,
            cantidad: Number(l.cantidad),
            monto: Number(l.precio),
          })),
          metodoPagoId
        );
        setLineas([]);
        setSuccessMsg(`Venta registrada por ${fmt(res.monto_total)}.`);
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "No se pudo registrar la venta.");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 pb-8 md:gap-6 md:p-6">
      {successMsg && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border-2 border-black bg-yellow-400 px-4 py-3 text-sm font-bold text-black"
        >
          {successMsg}
        </p>
      )}
      {errorMsg && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-lg border-2 border-yellow-400 bg-black px-4 py-3 text-sm font-bold text-white"
        >
          {errorMsg}
        </p>
      )}

      <h1 className="text-xl font-bold tracking-wide uppercase md:text-2xl">Registrar venta</h1>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold tracking-wide text-black/60 uppercase">Productos</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {items.map((item) => (
            <button
              key={item.id_item}
              type="button"
              onClick={() => agregarProducto(item)}
              className="rounded-lg border-2 border-black bg-white px-3 py-4 text-sm leading-tight font-bold transition active:scale-[0.97] hover:bg-yellow-400 md:text-base"
            >
              {item.nombre}
            </button>
          ))}
          {items.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm font-medium text-black/50">
              No hay productos cargados. Agregalos desde la pantalla Productos.
            </p>
          )}
        </div>
      </div>

      {lineas.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold tracking-wide text-black/60 uppercase">Venta</p>
          {lineas.map((l) => (
            <div key={l.key} className="flex flex-col gap-3 rounded-lg border-2 border-black bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate font-bold">{l.nombre}</span>
                <button
                  type="button"
                  onClick={() => quitarLinea(l.key)}
                  className="shrink-0 rounded-lg border-2 border-black bg-white px-3 py-2 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] hover:bg-black hover:text-white"
                >
                  Quitar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label
                    className="text-xs font-bold tracking-wide uppercase"
                    htmlFor={`cantidad-${l.key}`}
                  >
                    Cantidad
                  </label>
                  <input
                    id={`cantidad-${l.key}`}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={l.cantidad}
                    onChange={(e) => editarLinea(l.key, "cantidad", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold tracking-wide uppercase" htmlFor={`precio-${l.key}`}>
                    Precio unitario ($)
                  </label>
                  <input
                    id={`precio-${l.key}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={l.precio}
                    onChange={(e) => editarLinea(l.key, "precio", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <span className="text-right text-sm font-bold text-black/70">
                Subtotal {fmt(subtotalLinea(l))}
              </span>
            </div>
          ))}

          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold tracking-wide uppercase">Método de pago</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {metodosPago.map((mp) => (
                <button
                  key={mp.id}
                  type="button"
                  onClick={() => setMetodoPagoId(mp.id)}
                  className={`rounded-lg border-2 border-black py-2.5 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] md:text-sm ${
                    metodoPagoId === mp.id ? "bg-black text-white" : "bg-white text-black hover:bg-yellow-400"
                  }`}
                >
                  {mp.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-lg font-black">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={registrarVenta}
        disabled={pending || lineas.length === 0}
        className="w-full rounded-lg border-4 border-black bg-yellow-400 py-4 text-lg font-black tracking-wide uppercase text-black transition active:scale-[0.98] hover:bg-black hover:text-yellow-400 disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-500"
      >
        {pending ? "Registrando..." : "Registrar venta"}
      </button>
    </div>
  );
}
