"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmarVenta } from "./venta/actions";

type MedidaOption = { id_item_medida: number; codigo: string; precio: number; stock: number };
type ItemVenta = {
  id_item: number;
  nombre: string;
  categoria: string;
  tiene_medida: boolean;
  precio_base: number | null;
  stock_actual: number | null;
  medidas: MedidaOption[];
};
type MetodoPago = { id: number; nombre: string };

type CartLine = {
  key: string;
  id_item: number;
  id_item_medida: number | null;
  nombre: string;
  medidaCodigo: string | null;
  precioUnitario: number;
  cantidad: number;
  stockDisponible: number | null;
};

const fmt = (n: number) => `$${n.toFixed(2)}`;

const TAB_LABEL: Record<string, string> = {
  Servicio: "Servicios",
  Producto: "Productos",
};

export function VentaClient({
  categorias,
  items,
  metodosPago,
}: {
  categorias: string[];
  items: ItemVenta[];
  metodosPago: MetodoPago[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState(categorias[0] ?? "");
  const [busqueda, setBusqueda] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [modalItem, setModalItem] = useState<ItemVenta | null>(null);
  const [modalMedidaId, setModalMedidaId] = useState<number | null>(null);
  const [modalCantidad, setModalCantidad] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [metodoPagoId, setMetodoPagoId] = useState<number | null>(metodosPago[0]?.id ?? null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const itemsFiltrados = useMemo(
    () =>
      items.filter(
        (item) =>
          item.categoria === tab &&
          item.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
      ),
    [items, tab, busqueda]
  );

  const cantidadEnCarrito = (id_item: number, id_item_medida: number | null) =>
    cart
      .filter((l) => l.id_item === id_item && l.id_item_medida === id_item_medida)
      .reduce((acc, l) => acc + l.cantidad, 0);

  function agregarLinea(linea: CartLine) {
    setCart((prev) => {
      const existente = prev.find((l) => l.key === linea.key);
      if (existente) {
        return prev.map((l) =>
          l.key === linea.key ? { ...l, cantidad: l.cantidad + linea.cantidad } : l
        );
      }
      return [...prev, linea];
    });
  }

  function agregarSinMedida(item: ItemVenta) {
    const yaEnCarrito = cantidadEnCarrito(item.id_item, null);
    if (item.stock_actual !== null && yaEnCarrito + 1 > item.stock_actual) {
      setErrorMsg(`No queda más stock de ${item.nombre}.`);
      return;
    }
    agregarLinea({
      key: `${item.id_item}-base`,
      id_item: item.id_item,
      id_item_medida: null,
      nombre: item.nombre,
      medidaCodigo: null,
      precioUnitario: item.precio_base ?? 0,
      cantidad: 1,
      stockDisponible: item.stock_actual,
    });
  }

  function abrirModal(item: ItemVenta) {
    setModalItem(item);
    setModalMedidaId(item.medidas[0]?.id_item_medida ?? null);
    setModalCantidad(1);
  }

  function confirmarModal() {
    if (!modalItem || !modalMedidaId) return;
    const medida = modalItem.medidas.find((m) => m.id_item_medida === modalMedidaId);
    if (!medida) return;
    const yaEnCarrito = cantidadEnCarrito(modalItem.id_item, medida.id_item_medida);
    if (yaEnCarrito + modalCantidad > medida.stock) {
      setErrorMsg(`No queda suficiente stock de ${modalItem.nombre} (${medida.codigo}).`);
      return;
    }
    agregarLinea({
      key: `${modalItem.id_item}-${medida.id_item_medida}`,
      id_item: modalItem.id_item,
      id_item_medida: medida.id_item_medida,
      nombre: modalItem.nombre,
      medidaCodigo: medida.codigo,
      precioUnitario: medida.precio,
      cantidad: modalCantidad,
      stockDisponible: medida.stock,
    });
    setModalItem(null);
  }

  function quitarLinea(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  const total = cart.reduce((acc, l) => acc + l.precioUnitario * l.cantidad, 0);
  const cantidadTotal = cart.reduce((acc, l) => acc + l.cantidad, 0);

  function confirmarVentaClick() {
    if (!metodoPagoId) {
      setErrorMsg("Elegí un método de pago.");
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const res = await confirmarVenta(
          cart.map((l) => ({
            id_item: l.id_item,
            id_item_medida: l.id_item_medida,
            cantidad: l.cantidad,
          })),
          metodoPagoId
        );
        setCart([]);
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
        <p className="rounded-lg border-2 border-black bg-yellow-400 px-4 py-3 text-sm font-bold text-black">
          {successMsg}
        </p>
      )}
      {errorMsg && (
        <p className="rounded-lg border-2 border-yellow-400 bg-black px-4 py-3 text-sm font-bold text-white">
          {errorMsg}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:inline-grid sm:auto-cols-max sm:grid-flow-col">
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => setTab(c)}
              className={`rounded-lg border-2 border-black py-3 text-sm font-bold tracking-wide uppercase transition-colors sm:px-8 sm:py-3 md:text-base ${
                tab === c ? "bg-yellow-400 text-black" : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              {TAB_LABEL[c] ?? c}
            </button>
          ))}
        </div>

        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar servicio o producto"
          className="rounded-lg border-2 border-black px-4 py-3 text-base focus:ring-2 focus:ring-yellow-400 focus:outline-none sm:w-72"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {itemsFiltrados.map((item) => {
          const sinStock =
            !item.tiene_medida &&
            item.stock_actual !== null &&
            cantidadEnCarrito(item.id_item, null) >= item.stock_actual;

          return (
            <div
              key={item.id_item}
              className="flex flex-col gap-2 rounded-lg border-2 border-black bg-white p-3 md:p-4"
            >
              <span className="text-[11px] font-bold tracking-wide text-black/50 uppercase">
                {item.categoria}
              </span>
              <span className="text-sm leading-tight font-bold md:text-base">{item.nombre}</span>
              <span className="text-sm font-semibold text-black">
                {item.tiene_medida
                  ? item.medidas.length > 0
                    ? `Desde ${fmt(Math.min(...item.medidas.map((m) => m.precio)))}`
                    : "Sin medidas"
                  : fmt(item.precio_base ?? 0)}
              </span>
              <button
                onClick={() => (item.tiene_medida ? abrirModal(item) : agregarSinMedida(item))}
                disabled={sinStock || (item.tiene_medida && item.medidas.length === 0)}
                className="rounded-lg border-2 border-black bg-yellow-400 py-2.5 text-sm font-bold tracking-wide uppercase text-black transition-colors hover:bg-black hover:text-yellow-400 disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-500 disabled:hover:bg-zinc-200 disabled:hover:text-zinc-500 md:py-3"
              >
                {sinStock ? "Sin stock" : "Agregar"}
              </button>
            </div>
          );
        })}
        {itemsFiltrados.length === 0 && (
          <p className="col-span-2 py-8 text-center text-sm font-medium text-black/50 md:col-span-3 lg:col-span-4">
            No hay resultados.
          </p>
        )}
      </div>

      {modalItem && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 md:items-center">
          <div className="w-full max-w-md rounded-t-2xl border-4 border-black bg-white p-5 md:rounded-2xl">
            <p className="text-xs font-bold tracking-wide text-black/50 uppercase">Seleccionar rodado</p>
            <p className="mb-3 text-lg font-bold">{modalItem.nombre}</p>

            <div className="flex flex-col gap-2">
              {modalItem.medidas.map((m) => {
                const agotada = m.stock <= cantidadEnCarrito(modalItem.id_item, m.id_item_medida);
                const seleccionada = modalMedidaId === m.id_item_medida;
                return (
                  <button
                    key={m.id_item_medida}
                    onClick={() => setModalMedidaId(m.id_item_medida)}
                    disabled={agotada}
                    className={`flex items-center justify-between rounded-lg border-2 border-black px-4 py-3 text-left font-semibold transition-colors disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400 ${
                      seleccionada ? "bg-yellow-400 text-black" : "bg-white text-black hover:bg-black hover:text-white"
                    }`}
                  >
                    <span>Rodado {m.codigo}</span>
                    <span>{fmt(m.precio)}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wide">Cantidad</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setModalCantidad((c) => Math.max(1, c - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-white text-xl font-black hover:bg-black hover:text-white"
                >
                  −
                </button>
                <span className="w-6 text-center text-lg font-bold">{modalCantidad}</span>
                <button
                  onClick={() => setModalCantidad((c) => c + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-white text-xl font-black hover:bg-black hover:text-white"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setModalItem(null)}
                className="flex-1 rounded-lg border-2 border-black bg-white py-3 text-sm font-bold tracking-wide uppercase hover:bg-black hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarModal}
                disabled={!modalMedidaId}
                className="flex-1 rounded-lg border-2 border-black bg-yellow-400 py-3 text-sm font-bold tracking-wide uppercase text-black hover:bg-black hover:text-yellow-400 disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-500"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {cart.length > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-0 bottom-16 z-20 mx-auto flex w-full max-w-5xl items-center justify-between border-t-4 border-black bg-yellow-400 px-5 py-4 text-black md:bottom-4 md:rounded-lg md:border-4"
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
                className="rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-bold uppercase hover:bg-black hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {cart.map((l) => (
                <div
                  key={l.key}
                  className="flex items-center justify-between gap-3 border-b-2 border-black/10 py-2.5"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">
                      {l.nombre}
                      {l.medidaCodigo ? ` (${l.medidaCodigo})` : ""} x{l.cantidad}
                    </span>
                    <span className="text-xs font-semibold text-black/60">
                      {fmt(l.precioUnitario * l.cantidad)}
                    </span>
                  </div>
                  <button
                    onClick={() => quitarLinea(l.key)}
                    className="shrink-0 rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-bold tracking-wide uppercase hover:bg-black hover:text-white"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <p className="text-sm font-bold tracking-wide uppercase">Método de pago</p>
              <div className="grid grid-cols-3 gap-2">
                {metodosPago.map((mp) => (
                  <button
                    key={mp.id}
                    onClick={() => setMetodoPagoId(mp.id)}
                    className={`rounded-lg border-2 border-black py-2.5 text-xs font-bold tracking-wide uppercase transition-colors md:text-sm ${
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
              disabled={pending || cart.length === 0}
              className="mt-3 w-full rounded-lg border-4 border-black bg-yellow-400 py-4 text-lg font-black tracking-wide uppercase text-black transition-colors hover:bg-black hover:text-yellow-400 disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              {pending ? "Confirmando..." : "Confirmar venta"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
