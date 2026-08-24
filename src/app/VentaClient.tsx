"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmarVenta } from "./venta/actions";

type TipoVehiculoProducto = "MOTO" | "AUTO";

type ItemVenta = {
  id_item: number;
  nombre: string;
  precio_base: number | null;
  stock_actual: number | null;
  tipo_vehiculo: TipoVehiculoProducto | null;
};
type MetodoPago = { id: number; nombre: string };

const FILTROS_TIPO: { key: "TODOS" | TipoVehiculoProducto; label: string }[] = [
  { key: "TODOS", label: "Todos" },
  { key: "MOTO", label: "Moto" },
  { key: "AUTO", label: "Auto" },
];

type CartProductoLine = {
  key: string;
  id_item: number;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  descripcion?: string;
};

const fmt = (n: number) => `$${n.toFixed(2)}`;

// El carrito se guarda acá para sobrevivir a la navegación entre pantallas.
const CART_STORAGE_KEY = "sistema-taller:venta-carrito";

export function VentaClient({ items, metodosPago }: { items: ItemVenta[]; metodosPago: MetodoPago[] }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"TODOS" | TipoVehiculoProducto>("TODOS");
  const [productos, setProductos] = useState<CartProductoLine[]>([]);
  const skipPersist = useRef(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { productos?: CartProductoLine[] };
      // Hidratar desde localStorage solo puede pasar después del montaje (el
      // server nunca ve localStorage), así que esto corre una única vez acá.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(data.productos)) setProductos(data.productos);
    } catch {
      // localStorage no disponible o con datos corruptos: se sigue con el carrito vacío.
    }
  }, []);

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ productos }));
    } catch {
      // localStorage lleno o no disponible: no es crítico, solo se pierde la persistencia.
    }
  }, [productos]);

  const [descripcionProductoKey, setDescripcionProductoKey] = useState<string | null>(null);
  const [descripcionProductoValue, setDescripcionProductoValue] = useState("");

  const [cartOpen, setCartOpen] = useState(false);
  const [metodoPagoId, setMetodoPagoId] = useState<number | null>(metodosPago[0]?.id ?? null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const productosFiltrados = useMemo(
    () =>
      items.filter(
        (item) =>
          item.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()) &&
          (filtroTipo === "TODOS" || item.tipo_vehiculo === filtroTipo)
      ),
    [items, busqueda, filtroTipo]
  );

  function agregarProducto(item: ItemVenta) {
    const key = `producto-${item.id_item}`;
    setProductos((prev) => {
      const existente = prev.find((l) => l.key === key);
      if (existente) {
        return prev.map((l) => (l.key === key ? { ...l, cantidad: l.cantidad + 1 } : l));
      }
      return [
        ...prev,
        {
          key,
          id_item: item.id_item,
          nombre: item.nombre,
          precioUnitario: item.precio_base ?? 0,
          cantidad: 1,
        },
      ];
    });
  }

  function quitarProducto(key: string) {
    setProductos((prev) => prev.filter((l) => l.key !== key));
  }

  function abrirDescripcionProducto(l: CartProductoLine) {
    setDescripcionProductoKey(l.key);
    setDescripcionProductoValue(l.descripcion ?? "");
  }

  function guardarDescripcionProducto() {
    const descripcion = descripcionProductoValue.trim() || undefined;
    setProductos((prev) =>
      prev.map((l) => (l.key === descripcionProductoKey ? { ...l, descripcion } : l))
    );
    setDescripcionProductoKey(null);
  }

  const total = productos.reduce((acc, l) => acc + l.precioUnitario * l.cantidad, 0);
  const cantidadTotal = productos.reduce((acc, l) => acc + l.cantidad, 0);

  function confirmarVentaClick() {
    if (!metodoPagoId) {
      setErrorMsg("Elegí un método de pago.");
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const res = await confirmarVenta(
          productos.map((l) => ({
            id_item: l.id_item,
            cantidad: l.cantidad,
            descripcion: l.descripcion,
          })),
          metodoPagoId
        );
        setProductos([]);
        setCartOpen(false);
        setSuccessMsg(`Venta confirmada por ${fmt(res.monto_total)}.`);
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "No se pudo confirmar la venta.");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 pb-32 md:gap-6 md:p-6 md:pb-24">
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {FILTROS_TIPO.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltroTipo(f.key)}
              className={`rounded-lg border-2 border-black px-4 py-2 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] md:text-sm ${
                filtroTipo === f.key ? "bg-black text-white" : "bg-white text-black hover:bg-yellow-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar producto"
          className="rounded-lg border-2 border-black px-4 py-3 text-base focus:ring-2 focus:ring-yellow-400 focus:outline-none sm:w-72"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {productosFiltrados.map((item) => {
          const sinStock = item.stock_actual !== null && item.stock_actual <= 0;
          return (
            <div
              key={item.id_item}
              className={`flex flex-col gap-2 rounded-lg border-2 p-3 md:p-4 ${
                sinStock ? "border-black/40 bg-zinc-100" : "border-black bg-white"
              }`}
            >
              <span
                className={`text-sm leading-tight font-bold md:text-base ${
                  sinStock ? "text-black/60" : "text-black"
                }`}
              >
                {item.nombre}
              </span>
              <span className={`text-sm font-semibold ${sinStock ? "text-black/60" : "text-black"}`}>
                {fmt(item.precio_base ?? 0)} · Stock {item.stock_actual ?? 0}
                {sinStock ? " (sin stock)" : ""}
              </span>
              <button
                onClick={() => agregarProducto(item)}
                className={`rounded-lg border-2 py-2.5 text-sm font-bold tracking-wide uppercase transition active:scale-[0.97] md:py-3 ${
                  sinStock
                    ? "border-black/40 bg-zinc-300 text-black/60 hover:bg-black hover:text-white"
                    : "border-black bg-yellow-400 text-black hover:bg-black hover:text-yellow-400"
                }`}
              >
                Agregar
              </button>
            </div>
          );
        })}
        {productosFiltrados.length === 0 && (
          <p className="col-span-2 py-8 text-center text-sm font-medium text-black/50 md:col-span-3 lg:col-span-4">
            No hay resultados.
          </p>
        )}
      </div>

      {descripcionProductoKey && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 md:items-center">
          <div className="w-full max-w-md rounded-t-2xl border-4 border-black bg-white p-5 md:rounded-2xl">
            <p className="mb-3 text-lg font-bold uppercase tracking-wide">Descripción</p>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold tracking-wide uppercase" htmlFor="descripcion-producto">
                Medida, marca u otra característica (opcional)
              </label>
              <textarea
                id="descripcion-producto"
                autoFocus
                value={descripcionProductoValue}
                onChange={(e) => setDescripcionProductoValue(e.target.value)}
                placeholder="Ej: 195/65 R15, Bridgestone"
                rows={3}
                className="resize-none rounded-lg border-2 border-black px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setDescripcionProductoKey(null)}
                className="flex-1 rounded-lg border-2 border-black bg-red-600 py-3 text-sm font-bold tracking-wide uppercase text-white active:scale-[0.97] hover:bg-black hover:text-red-500"
              >
                Cancelar
              </button>
              <button
                onClick={guardarDescripcionProducto}
                className="flex-1 rounded-lg border-2 border-black bg-yellow-400 py-3 text-sm font-bold tracking-wide uppercase text-black active:scale-[0.97] hover:bg-black hover:text-yellow-400"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {productos.length > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-0 bottom-16 z-20 mx-auto flex w-full max-w-5xl items-center justify-between border-t-4 border-black bg-yellow-400 px-5 py-4 text-black active:scale-[0.99] md:bottom-4 md:rounded-lg md:border-4"
        >
          <span className="text-sm font-bold tracking-wide uppercase">Ver ticket ({cantidadTotal})</span>
          <span className="text-lg font-black">{fmt(total)}</span>
        </button>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 md:items-center">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-t-2xl border-4 border-black bg-white p-4 md:rounded-2xl md:p-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-lg font-bold uppercase tracking-wide">Ticket</p>
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-lg border-2 border-black bg-white px-3 py-2.5 text-xs font-bold uppercase active:scale-[0.97] hover:bg-black hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {productos.map((l) => (
                <div
                  key={l.key}
                  className="flex items-center justify-between gap-3 border-b-2 border-black/10 py-2.5"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">
                      {l.nombre} x{l.cantidad}
                    </span>
                    <span className="text-xs font-semibold text-black/60">
                      {fmt(l.precioUnitario * l.cantidad)}
                    </span>
                    {l.descripcion && (
                      <span className="text-xs font-semibold text-black/60">{l.descripcion}</span>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => abrirDescripcionProducto(l)}
                      className="rounded-lg border-2 border-black bg-white px-3 py-2.5 text-xs font-bold tracking-wide uppercase active:scale-[0.97] hover:bg-black hover:text-white"
                    >
                      Descripción
                    </button>
                    <button
                      onClick={() => quitarProducto(l.key)}
                      className="rounded-lg border-2 border-black bg-white px-3 py-2.5 text-xs font-bold tracking-wide uppercase active:scale-[0.97] hover:bg-black hover:text-white"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <p className="text-sm font-bold tracking-wide uppercase">Método de pago</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {metodosPago.map((mp) => (
                  <button
                    key={mp.id}
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

            <div className="mt-4 flex items-center justify-between text-lg font-black">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>

            <button
              onClick={confirmarVentaClick}
              disabled={pending || productos.length === 0}
              className="mt-3 w-full rounded-lg border-4 border-black bg-yellow-400 py-4 text-lg font-black tracking-wide uppercase text-black transition active:scale-[0.98] hover:bg-black hover:text-yellow-400 disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              {pending ? "Confirmando..." : "Confirmar venta"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
