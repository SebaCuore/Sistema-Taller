"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmarVenta, crearServicio, borrarServicio } from "./venta/actions";
import { RUEDA_LABEL, LADO_LABEL, infoVehiculo, type Rueda, type Lado } from "@/lib/vehiculo";

type TipoVehiculo = "MOTO" | "AUTO";

type ItemVenta = {
  id_item: number;
  nombre: string;
  categoria: string;
  precio_base: number | null;
  stock_actual: number | null;
  tipo_vehiculo: TipoVehiculo | null;
};
type MetodoPago = { id: number; nombre: string };

const FILTROS_TIPO: { key: "TODOS" | TipoVehiculo; label: string }[] = [
  { key: "TODOS", label: "Todos" },
  { key: "MOTO", label: "Moto" },
  { key: "AUTO", label: "Auto" },
];

type CartLine = {
  key: string;
  id_item: number;
  nombre: string;
  esServicio: boolean;
  precioUnitario: number;
  cantidad: number;
  patente?: string;
  rueda?: Rueda;
  lado?: Lado;
};

const fmt = (n: number) => `$${n.toFixed(2)}`;

const TAB_LABEL: Record<string, string> = {
  Servicio: "Servicios",
  Producto: "Productos",
};

function CamposVehiculo({
  patente,
  rueda,
  lado,
  onPatenteChange,
  onRuedaChange,
  onLadoChange,
  idPrefix,
}: {
  patente: string;
  rueda: Rueda | null;
  lado: Lado | null;
  onPatenteChange: (v: string) => void;
  onRuedaChange: (v: Rueda) => void;
  onLadoChange: (v: Lado) => void;
  idPrefix: string;
}) {
  return (
    <>
      <div className="mt-4 flex flex-col gap-1">
        <label className="text-sm font-bold tracking-wide uppercase" htmlFor={`${idPrefix}-patente`}>
          Patente (opcional)
        </label>
        <input
          id={`${idPrefix}-patente`}
          type="text"
          value={patente}
          onChange={(e) => onPatenteChange(e.target.value)}
          placeholder="Ej: AB123CD"
          className="rounded-lg border-2 border-black px-3 py-3 text-base font-bold uppercase focus:ring-2 focus:ring-yellow-400 focus:outline-none"
        />
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <span className="text-sm font-bold tracking-wide uppercase">Rueda (opcional)</span>
        <div className="grid grid-cols-2 gap-3">
          {(["DELANTERA", "TRASERA"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRuedaChange(r)}
              className={`rounded-lg border-2 border-black py-2.5 text-sm font-bold tracking-wide uppercase transition active:scale-[0.97] ${
                rueda === r
                  ? "bg-yellow-400 text-black"
                  : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              {RUEDA_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {rueda && (
        <div className="mt-4 flex flex-col gap-1">
          <span className="text-sm font-bold tracking-wide uppercase">Lado (opcional)</span>
          <div className="grid grid-cols-2 gap-3">
            {(["DERECHA", "IZQUIERDA"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onLadoChange(l)}
                className={`rounded-lg border-2 border-black py-2.5 text-sm font-bold tracking-wide uppercase transition active:scale-[0.97] ${
                  lado === l
                    ? "bg-yellow-400 text-black"
                    : "bg-white text-black hover:bg-black hover:text-white"
                }`}
              >
                {LADO_LABEL[l]}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function BorrarServicioButton({ id_item }: { id_item: number }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirmando) {
    return (
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          disabled={pending}
          className="rounded-lg border-2 border-black bg-red-600 px-2.5 py-2.5 text-xs font-bold tracking-wide uppercase text-white transition active:scale-[0.97] hover:bg-black hover:text-red-500 md:py-3"
        >
          No
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await borrarServicio(id_item);
              router.refresh();
            })
          }
          className="rounded-lg border-2 border-black bg-yellow-400 px-2.5 py-2.5 text-xs font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-yellow-400 disabled:opacity-50 md:py-3"
        >
          {pending ? "..." : "Sí"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      className="rounded-lg border-2 border-black bg-white px-3 py-2.5 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] hover:bg-black hover:text-white md:py-3"
    >
      Borrar
    </button>
  );
}

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
  const [filtroTipo, setFiltroTipo] = useState<"TODOS" | TipoVehiculo>("TODOS");
  const [cart, setCart] = useState<CartLine[]>([]);
  const keyCounter = useRef(0);

  const [modalItem, setModalItem] = useState<ItemVenta | null>(null);
  const [modalMonto, setModalMonto] = useState("");
  const [modalCantidad, setModalCantidad] = useState(1);
  const [modalPatente, setModalPatente] = useState("");
  const [modalRueda, setModalRueda] = useState<Rueda | null>(null);
  const [modalLado, setModalLado] = useState<Lado | null>(null);

  const [nuevoServicioOpen, setNuevoServicioOpen] = useState(false);
  const [nuevoServicioNombre, setNuevoServicioNombre] = useState("");
  const [pendingServicio, startTransitionServicio] = useTransition();

  const [editandoKey, setEditandoKey] = useState<string | null>(null);
  const [editPatente, setEditPatente] = useState("");
  const [editRueda, setEditRueda] = useState<Rueda | null>(null);
  const [editLado, setEditLado] = useState<Lado | null>(null);

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
          item.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()) &&
          (tab !== "Producto" || filtroTipo === "TODOS" || item.tipo_vehiculo === filtroTipo)
      ),
    [items, tab, busqueda, filtroTipo]
  );

  function abrirNuevoServicio() {
    setNuevoServicioNombre("");
    setNuevoServicioOpen(true);
  }

  function confirmarNuevoServicio() {
    const nombre = nuevoServicioNombre.trim();
    if (!nombre) {
      setErrorMsg("Ingresá un nombre para el servicio.");
      return;
    }
    setErrorMsg(null);
    startTransitionServicio(async () => {
      try {
        await crearServicio(nombre);
        setNuevoServicioOpen(false);
        setSuccessMsg(`Servicio "${nombre}" creado.`);
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "No se pudo crear el servicio.");
      }
    });
  }

  function agregarProducto(item: ItemVenta) {
    const key = `producto-${item.id_item}`;
    setCart((prev) => {
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
          esServicio: false,
          precioUnitario: item.precio_base ?? 0,
          cantidad: 1,
        },
      ];
    });
  }

  function abrirModalServicio(item: ItemVenta) {
    setModalItem(item);
    setModalMonto("");
    setModalCantidad(1);
    setModalPatente("");
    setModalRueda(null);
    setModalLado(null);
  }

  function elegirModalRueda(rueda: Rueda) {
    setModalRueda((prev) => (prev === rueda ? null : rueda));
    setModalLado(null);
  }

  function confirmarModalServicio() {
    if (!modalItem) return;
    const monto = Number(modalMonto);
    if (!monto || monto <= 0) {
      setErrorMsg("Ingresá un monto válido.");
      return;
    }
    keyCounter.current += 1;
    setCart((prev) => [
      ...prev,
      {
        key: `servicio-${modalItem.id_item}-${keyCounter.current}`,
        id_item: modalItem.id_item,
        nombre: modalItem.nombre,
        esServicio: true,
        precioUnitario: monto,
        cantidad: modalCantidad,
        patente: modalPatente.trim() || undefined,
        rueda: modalRueda ?? undefined,
        lado: modalLado ?? undefined,
      },
    ]);
    setModalItem(null);
  }

  function quitarLinea(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  function abrirEditorVehiculo(l: CartLine) {
    setEditandoKey(l.key);
    setEditPatente(l.patente ?? "");
    setEditRueda(l.rueda ?? null);
    setEditLado(l.lado ?? null);
  }

  function elegirEditRueda(rueda: Rueda) {
    setEditRueda((prev) => (prev === rueda ? null : rueda));
    setEditLado(null);
  }

  function elegirEditLado(lado: Lado) {
    setEditLado((prev) => (prev === lado ? null : lado));
  }

  function guardarVehiculo() {
    const patente = editPatente.trim() || undefined;
    setCart((prev) =>
      prev.map((l) =>
        l.key === editandoKey
          ? { ...l, patente, rueda: editRueda ?? undefined, lado: editLado ?? undefined }
          : l
      )
    );
    setEditandoKey(null);
  }

  function aplicarATodasLasLineas() {
    const patente = editPatente.trim() || undefined;
    setCart((prev) => prev.map((l) => ({ ...l, patente })));
    setEditandoKey(null);
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
            cantidad: l.cantidad,
            monto: l.esServicio ? l.precioUnitario : undefined,
            patente: l.patente,
            rueda: l.rueda,
            lado: l.lado,
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
        <div className="grid grid-cols-2 gap-2 sm:inline-grid sm:auto-cols-max sm:grid-flow-col">
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => setTab(c)}
              className={`rounded-lg border-2 border-black py-3 text-sm font-bold tracking-wide uppercase transition active:scale-[0.97] sm:px-8 sm:py-3 md:text-base ${
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

      {tab === "Producto" && (
        <div className="flex gap-2">
          {FILTROS_TIPO.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltroTipo(f.key)}
              className={`rounded-lg border-2 border-black px-4 py-2 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] md:text-sm ${
                filtroTipo === f.key
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-yellow-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {tab === "Servicio" && (
        <button
          onClick={abrirNuevoServicio}
          className="self-start rounded-lg border-2 border-black bg-yellow-400 px-5 py-3 text-sm font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-yellow-400"
        >
          Nuevo Servicio
        </button>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {itemsFiltrados.map((item) => {
          const esServicio = item.categoria === "Servicio";
          const sinStock = !esServicio && item.stock_actual !== null && item.stock_actual <= 0;

          return (
            <div
              key={item.id_item}
              className={`flex flex-col gap-2 rounded-lg border-2 p-3 md:p-4 ${
                sinStock ? "border-black/40 bg-zinc-100" : "border-black bg-white"
              }`}
            >
              <span className="text-[11px] font-bold tracking-wide text-black/50 uppercase">
                {item.categoria}
              </span>
              <span
                className={`text-sm leading-tight font-bold md:text-base ${
                  sinStock ? "text-black/60" : "text-black"
                }`}
              >
                {item.nombre}
              </span>
              {esServicio ? (
                <span className="text-sm font-semibold text-black/60">Monto a cargar</span>
              ) : (
                <span
                  className={`text-sm font-semibold ${sinStock ? "text-black/60" : "text-black"}`}
                >
                  {fmt(item.precio_base ?? 0)} · Stock {item.stock_actual ?? 0}
                  {sinStock ? " (sin stock)" : ""}
                </span>
              )}
              {esServicio ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirModalServicio(item)}
                    className="flex-1 rounded-lg border-2 border-black bg-yellow-400 py-2.5 text-sm font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-yellow-400 md:py-3"
                  >
                    Agregar
                  </button>
                  <BorrarServicioButton id_item={item.id_item} />
                </div>
              ) : (
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
              )}
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
            <p className="text-xs font-bold tracking-wide text-black/50 uppercase">Cargar monto</p>
            <p className="mb-3 text-lg font-bold">{modalItem.nombre}</p>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold tracking-wide uppercase" htmlFor="modal-monto">
                Monto ($)
              </label>
              <input
                id="modal-monto"
                type="number"
                step="0.01"
                min="0"
                autoFocus
                value={modalMonto}
                onChange={(e) => setModalMonto(e.target.value)}
                placeholder="0.00"
                className="rounded-lg border-2 border-black px-3 py-3 text-lg font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-bold tracking-wide uppercase">Cantidad</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setModalCantidad((c) => Math.max(1, c - 1))}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-black bg-white text-xl font-black active:scale-[0.95] hover:bg-black hover:text-white"
                >
                  −
                </button>
                <span className="w-6 text-center text-lg font-bold">{modalCantidad}</span>
                <button
                  onClick={() => setModalCantidad((c) => c + 1)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-black bg-white text-xl font-black active:scale-[0.95] hover:bg-black hover:text-white"
                >
                  +
                </button>
              </div>
            </div>

            <CamposVehiculo
              idPrefix="modal"
              patente={modalPatente}
              rueda={modalRueda}
              lado={modalLado}
              onPatenteChange={setModalPatente}
              onRuedaChange={elegirModalRueda}
              onLadoChange={(l) => setModalLado((prev) => (prev === l ? null : l))}
            />

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setModalItem(null)}
                className="flex-1 rounded-lg border-2 border-black bg-red-600 py-3 text-sm font-bold tracking-wide uppercase text-white active:scale-[0.97] hover:bg-black hover:text-red-500"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarModalServicio}
                className="flex-1 rounded-lg border-2 border-black bg-yellow-400 py-3 text-sm font-bold tracking-wide uppercase text-black active:scale-[0.97] hover:bg-black hover:text-yellow-400"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {nuevoServicioOpen && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 md:items-center">
          <div className="w-full max-w-md rounded-t-2xl border-4 border-black bg-white p-5 md:rounded-2xl">
            <p className="mb-3 text-lg font-bold uppercase tracking-wide">Nuevo servicio</p>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold tracking-wide uppercase" htmlFor="nuevo-servicio-nombre">
                Nombre
              </label>
              <input
                id="nuevo-servicio-nombre"
                type="text"
                autoFocus
                value={nuevoServicioNombre}
                onChange={(e) => setNuevoServicioNombre(e.target.value)}
                placeholder="Ej: Alineación"
                className="rounded-lg border-2 border-black px-3 py-3 text-lg font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setNuevoServicioOpen(false)}
                className="flex-1 rounded-lg border-2 border-black bg-red-600 py-3 text-sm font-bold tracking-wide uppercase text-white active:scale-[0.97] hover:bg-black hover:text-red-500"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarNuevoServicio}
                disabled={pendingServicio}
                className="flex-1 rounded-lg border-2 border-black bg-yellow-400 py-3 text-sm font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-yellow-400 disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-500"
              >
                {pendingServicio ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cart.length > 0 && !cartOpen && (
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
              {cart.map((l) => (
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
                      {l.esServicio ? " · monto cargado a mano" : ""}
                    </span>
                    {infoVehiculo(l) && (
                      <span className="text-xs font-semibold text-black/60">{infoVehiculo(l)}</span>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => abrirEditorVehiculo(l)}
                      className="rounded-lg border-2 border-black bg-white px-3 py-2.5 text-xs font-bold tracking-wide uppercase active:scale-[0.97] hover:bg-black hover:text-white"
                    >
                      Vehículo
                    </button>
                    <button
                      onClick={() => quitarLinea(l.key)}
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
              disabled={pending || cart.length === 0}
              className="mt-3 w-full rounded-lg border-4 border-black bg-yellow-400 py-4 text-lg font-black tracking-wide uppercase text-black transition active:scale-[0.98] hover:bg-black hover:text-yellow-400 disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              {pending ? "Confirmando..." : "Confirmar venta"}
            </button>
          </div>
        </div>
      )}

      {editandoKey && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 md:items-center">
          <div className="w-full max-w-md rounded-t-2xl border-4 border-black bg-white p-5 md:rounded-2xl">
            <p className="mb-3 text-lg font-bold uppercase tracking-wide">Vehículo</p>

            <CamposVehiculo
              idPrefix="edit"
              patente={editPatente}
              rueda={editRueda}
              lado={editLado}
              onPatenteChange={setEditPatente}
              onRuedaChange={elegirEditRueda}
              onLadoChange={elegirEditLado}
            />

            {cart.length > 1 && (
              <button
                type="button"
                onClick={aplicarATodasLasLineas}
                className="mt-4 w-full rounded-lg border-2 border-black bg-white py-2.5 text-xs font-bold tracking-wide uppercase active:scale-[0.97] hover:bg-black hover:text-white"
              >
                Aplicar patente a todas las líneas
              </button>
            )}

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setEditandoKey(null)}
                className="flex-1 rounded-lg border-2 border-black bg-red-600 py-3 text-sm font-bold tracking-wide uppercase text-white active:scale-[0.97] hover:bg-black hover:text-red-500"
              >
                Cancelar
              </button>
              <button
                onClick={guardarVehiculo}
                className="flex-1 rounded-lg border-2 border-black bg-yellow-400 py-3 text-sm font-bold tracking-wide uppercase text-black active:scale-[0.97] hover:bg-black hover:text-yellow-400"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
