"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmarVenta, crearServicio, borrarServicio } from "./venta/actions";
import {
  RUEDA_LABEL,
  LADO_LABEL,
  TIPO_VEHICULO_LABEL,
  infoRueda,
  vehiculoLabel,
  type Rueda,
  type Lado,
} from "@/lib/vehiculo";

type TipoVehiculoProducto = "MOTO" | "AUTO";

type ItemVenta = {
  id_item: number;
  nombre: string;
  categoria: string;
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

type CartServicioLine = {
  key: string;
  id_item: number;
  nombre: string;
  monto: number;
  cantidad: number;
  descripcion?: string;
  rueda?: Rueda;
  lado?: Lado;
};

type VehiculoGrupo = {
  key: string;
  patente?: string;
  tipo_vehiculo: TipoVehiculoProducto;
  lineas: CartServicioLine[];
};

type CartProductoLine = {
  key: string;
  id_item: number;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  descripcion?: string;
};

const fmt = (n: number) => `$${n.toFixed(2)}`;

const TAB_LABEL: Record<string, string> = {
  Servicio: "Vehículos",
  Producto: "Productos",
};

// El carrito (vehículos con sus servicios y productos sueltos) se guarda acá
// para sobrevivir a la navegación entre pantallas: un vehículo cargado y no
// cobrado todavía debe seguir ahí al volver a Ventas.
const CART_STORAGE_KEY = "sistema-taller:venta-carrito";

function newKey(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
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
      className="rounded-lg border-2 border-black bg-white px-3 py-2.5 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] hover:bg-black hover:text-white"
    >
      Borrar
    </button>
  );
}

function QuitarVehiculoButton({ tieneLineas, onQuitar }: { tieneLineas: boolean; onQuitar: () => void }) {
  const [confirmando, setConfirmando] = useState(false);

  if (!tieneLineas) {
    return (
      <button
        type="button"
        onClick={onQuitar}
        className="rounded-lg border-2 border-black bg-white px-3 py-2 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] hover:bg-black hover:text-white"
      >
        Quitar
      </button>
    );
  }

  if (confirmando) {
    return (
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="rounded-lg border-2 border-black bg-white px-2.5 py-2 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] hover:bg-black hover:text-white"
        >
          No
        </button>
        <button
          type="button"
          onClick={onQuitar}
          className="rounded-lg border-2 border-black bg-red-600 px-2.5 py-2 text-xs font-bold tracking-wide uppercase text-white transition active:scale-[0.97] hover:bg-black hover:text-red-500"
        >
          Sí, quitar
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      className="rounded-lg border-2 border-black bg-white px-3 py-2 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] hover:bg-black hover:text-white"
    >
      Quitar
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
  const [filtroTipo, setFiltroTipo] = useState<"TODOS" | TipoVehiculoProducto>("TODOS");
  const [vehiculos, setVehiculos] = useState<VehiculoGrupo[]>([]);
  const [productos, setProductos] = useState<CartProductoLine[]>([]);
  const skipPersist = useRef(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { vehiculos?: VehiculoGrupo[]; productos?: CartProductoLine[] };
      // Hidratar desde localStorage solo puede pasar después del montaje (el
      // server nunca ve localStorage), así que esto corre una única vez acá.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(data.vehiculos)) setVehiculos(data.vehiculos);
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
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ vehiculos, productos }));
    } catch {
      // localStorage lleno o no disponible: no es crítico, solo se pierde la persistencia.
    }
  }, [vehiculos, productos]);

  const [nuevoVehiculoOpen, setNuevoVehiculoOpen] = useState(false);
  const [nuevoVehiculoPatente, setNuevoVehiculoPatente] = useState("");
  const [nuevoVehiculoTipo, setNuevoVehiculoTipo] = useState<TipoVehiculoProducto | null>(null);

  const [editPatenteKey, setEditPatenteKey] = useState<string | null>(null);
  const [editPatenteValue, setEditPatenteValue] = useState("");

  const [pickerVehiculoKey, setPickerVehiculoKey] = useState<string | null>(null);
  const [pickerBusqueda, setPickerBusqueda] = useState("");

  const [modalItem, setModalItem] = useState<ItemVenta | null>(null);
  const [modalMonto, setModalMonto] = useState("");
  const [modalCantidad, setModalCantidad] = useState(1);
  const [modalDescripcion, setModalDescripcion] = useState("");
  const [modalRueda, setModalRueda] = useState<Rueda | null>(null);
  const [modalLado, setModalLado] = useState<Lado | null>(null);

  const [nuevoServicioOpen, setNuevoServicioOpen] = useState(false);
  const [nuevoServicioNombre, setNuevoServicioNombre] = useState("");
  const [pendingServicio, startTransitionServicio] = useTransition();

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
          item.categoria === "Producto" &&
          item.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()) &&
          (filtroTipo === "TODOS" || item.tipo_vehiculo === filtroTipo)
      ),
    [items, busqueda, filtroTipo]
  );

  const serviciosFiltrados = useMemo(
    () =>
      items.filter(
        (item) =>
          item.categoria === "Servicio" &&
          item.nombre.toLowerCase().includes(pickerBusqueda.trim().toLowerCase())
      ),
    [items, pickerBusqueda]
  );

  function abrirNuevoVehiculo() {
    setNuevoVehiculoPatente("");
    setNuevoVehiculoTipo(null);
    setNuevoVehiculoOpen(true);
  }

  function confirmarNuevoVehiculo() {
    if (!nuevoVehiculoTipo) {
      setErrorMsg("Elegí si el vehículo es Moto o Auto.");
      return;
    }
    setErrorMsg(null);
    const key = newKey("vehiculo");
    const patente = nuevoVehiculoPatente.trim().toUpperCase() || undefined;
    setVehiculos((prev) => [...prev, { key, patente, tipo_vehiculo: nuevoVehiculoTipo, lineas: [] }]);
    setNuevoVehiculoOpen(false);
    setPickerBusqueda("");
    setPickerVehiculoKey(key);
  }

  function quitarVehiculo(key: string) {
    setVehiculos((prev) => prev.filter((v) => v.key !== key));
  }

  function abrirEditPatente(v: VehiculoGrupo) {
    setEditPatenteKey(v.key);
    setEditPatenteValue(v.patente ?? "");
  }

  function guardarEditPatente() {
    const patente = editPatenteValue.trim().toUpperCase() || undefined;
    setVehiculos((prev) => prev.map((v) => (v.key === editPatenteKey ? { ...v, patente } : v)));
    setEditPatenteKey(null);
  }

  function abrirPicker(key: string) {
    setPickerBusqueda("");
    setPickerVehiculoKey(key);
  }

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

  function abrirModalServicio(item: ItemVenta) {
    setModalItem(item);
    setModalMonto("");
    setModalCantidad(1);
    setModalDescripcion("");
    setModalRueda(null);
    setModalLado(null);
  }

  function elegirModalRueda(rueda: Rueda) {
    setModalRueda((prev) => (prev === rueda ? null : rueda));
    setModalLado(null);
  }

  function confirmarModalServicio() {
    if (!modalItem || !pickerVehiculoKey) return;
    const monto = Number(modalMonto);
    if (!monto || monto <= 0) {
      setErrorMsg("Ingresá un monto válido.");
      return;
    }
    const linea: CartServicioLine = {
      key: newKey(`servicio-${modalItem.id_item}`),
      id_item: modalItem.id_item,
      nombre: modalItem.nombre,
      monto,
      cantidad: modalCantidad,
      descripcion: modalDescripcion.trim() || undefined,
      rueda: modalRueda ?? undefined,
      lado: modalLado ?? undefined,
    };
    setVehiculos((prev) =>
      prev.map((v) => (v.key === pickerVehiculoKey ? { ...v, lineas: [...v.lineas, linea] } : v))
    );
    setModalItem(null);
  }

  function quitarLineaServicio(vehiculoKey: string, lineaKey: string) {
    setVehiculos((prev) =>
      prev.map((v) =>
        v.key === vehiculoKey ? { ...v, lineas: v.lineas.filter((l) => l.key !== lineaKey) } : v
      )
    );
  }

  const totalVehiculos = vehiculos.reduce(
    (acc, v) => acc + v.lineas.reduce((a, l) => a + l.monto * l.cantidad, 0),
    0
  );
  const totalProductos = productos.reduce((acc, l) => acc + l.precioUnitario * l.cantidad, 0);
  const total = totalVehiculos + totalProductos;
  const cantidadTotal =
    vehiculos.reduce((acc, v) => acc + v.lineas.length, 0) +
    productos.reduce((acc, l) => acc + l.cantidad, 0);
  const vehiculosConLineas = vehiculos.filter((v) => v.lineas.length > 0);
  const carritoVacio = vehiculosConLineas.length === 0 && productos.length === 0;

  function confirmarVentaClick() {
    if (!metodoPagoId) {
      setErrorMsg("Elegí un método de pago.");
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const res = await confirmarVenta(
          vehiculosConLineas.map((v) => ({
            patente: v.patente,
            tipo_vehiculo: v.tipo_vehiculo,
            lineas: v.lineas.map((l) => ({
              id_item: l.id_item,
              cantidad: l.cantidad,
              monto: l.monto,
              descripcion: l.descripcion,
              rueda: l.rueda,
              lado: l.lado,
            })),
          })),
          productos.map((l) => ({
            id_item: l.id_item,
            cantidad: l.cantidad,
            descripcion: l.descripcion,
          })),
          metodoPagoId
        );
        setVehiculos([]);
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

  const pickerVehiculo = vehiculos.find((v) => v.key === pickerVehiculoKey) ?? null;

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

      {tab === "Servicio" && (
        <>
          <button
            onClick={abrirNuevoVehiculo}
            className="self-start rounded-lg border-2 border-black bg-yellow-400 px-5 py-3 text-sm font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-yellow-400"
          >
            Nuevo Vehículo
          </button>

          <div className="flex flex-col gap-3">
            {vehiculos.map((v) => {
              const subtotal = v.lineas.reduce((a, l) => a + l.monto * l.cantidad, 0);
              return (
                <div key={v.key} className="rounded-lg border-2 border-black bg-white p-3 md:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold md:text-base">
                        {vehiculoLabel(v.patente, v.tipo_vehiculo)}
                      </span>
                      {v.lineas.length > 0 && (
                        <span className="text-xs font-semibold text-black/60">{fmt(subtotal)}</span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => abrirEditPatente(v)}
                        className="rounded-lg border-2 border-black bg-white px-3 py-2 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] hover:bg-black hover:text-white"
                      >
                        Patente
                      </button>
                      <QuitarVehiculoButton
                        tieneLineas={v.lineas.length > 0}
                        onQuitar={() => quitarVehiculo(v.key)}
                      />
                    </div>
                  </div>

                  {v.lineas.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {v.lineas.map((l) => (
                        <li
                          key={l.key}
                          className="flex items-start justify-between gap-2 border-t-2 border-black/10 pt-1.5 text-sm"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {l.nombre} x{l.cantidad} — {fmt(l.monto * l.cantidad)}
                            </span>
                            {infoRueda(l) && (
                              <span className="text-xs text-black/50">{infoRueda(l)}</span>
                            )}
                            {l.descripcion && (
                              <span className="text-xs text-black/50">{l.descripcion}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => quitarLineaServicio(v.key, l.key)}
                            className="shrink-0 rounded-lg border-2 border-black bg-white px-2.5 py-1.5 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] hover:bg-black hover:text-white"
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    type="button"
                    onClick={() => abrirPicker(v.key)}
                    className="mt-3 w-full rounded-lg border-2 border-black bg-white py-2.5 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] hover:bg-black hover:text-white"
                  >
                    Agregar servicio
                  </button>
                </div>
              );
            })}
            {vehiculos.length === 0 && (
              <p className="py-8 text-center text-sm font-medium text-black/50">
                Agregá un vehículo para poder cargarle servicios.
              </p>
            )}
          </div>
        </>
      )}

      {tab === "Producto" && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
        </>
      )}

      {nuevoVehiculoOpen && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 md:items-center">
          <div className="w-full max-w-md rounded-t-2xl border-4 border-black bg-white p-5 md:rounded-2xl">
            <p className="mb-3 text-lg font-bold uppercase tracking-wide">Nuevo vehículo</p>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold tracking-wide uppercase" htmlFor="nuevo-vehiculo-patente">
                Patente (opcional)
              </label>
              <input
                id="nuevo-vehiculo-patente"
                type="text"
                autoFocus
                value={nuevoVehiculoPatente}
                onChange={(e) => setNuevoVehiculoPatente(e.target.value)}
                placeholder="Ej: AB123CD"
                className="rounded-lg border-2 border-black px-3 py-3 text-lg font-bold uppercase focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              />
            </div>

            <div className="mt-4 flex flex-col gap-1">
              <span className="text-sm font-bold tracking-wide uppercase">Tipo</span>
              <div className="grid grid-cols-2 gap-3">
                {(["MOTO", "AUTO"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNuevoVehiculoTipo(t)}
                    className={`rounded-lg border-2 border-black py-2.5 text-sm font-bold tracking-wide uppercase transition active:scale-[0.97] ${
                      nuevoVehiculoTipo === t
                        ? "bg-yellow-400 text-black"
                        : "bg-white text-black hover:bg-black hover:text-white"
                    }`}
                  >
                    {TIPO_VEHICULO_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setNuevoVehiculoOpen(false)}
                className="flex-1 rounded-lg border-2 border-black bg-red-600 py-3 text-sm font-bold tracking-wide uppercase text-white active:scale-[0.97] hover:bg-black hover:text-red-500"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarNuevoVehiculo}
                className="flex-1 rounded-lg border-2 border-black bg-yellow-400 py-3 text-sm font-bold tracking-wide uppercase text-black active:scale-[0.97] hover:bg-black hover:text-yellow-400"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {editPatenteKey && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 md:items-center">
          <div className="w-full max-w-md rounded-t-2xl border-4 border-black bg-white p-5 md:rounded-2xl">
            <p className="mb-3 text-lg font-bold uppercase tracking-wide">Patente</p>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold tracking-wide uppercase" htmlFor="edit-vehiculo-patente">
                Patente (opcional)
              </label>
              <input
                id="edit-vehiculo-patente"
                type="text"
                autoFocus
                value={editPatenteValue}
                onChange={(e) => setEditPatenteValue(e.target.value)}
                placeholder="Ej: AB123CD"
                className="rounded-lg border-2 border-black px-3 py-3 text-lg font-bold uppercase focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setEditPatenteKey(null)}
                className="flex-1 rounded-lg border-2 border-black bg-red-600 py-3 text-sm font-bold tracking-wide uppercase text-white active:scale-[0.97] hover:bg-black hover:text-red-500"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEditPatente}
                className="flex-1 rounded-lg border-2 border-black bg-yellow-400 py-3 text-sm font-bold tracking-wide uppercase text-black active:scale-[0.97] hover:bg-black hover:text-yellow-400"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {pickerVehiculo && !modalItem && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 md:items-center">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-t-2xl border-4 border-black bg-white p-4 md:rounded-2xl md:p-6">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-lg font-bold uppercase tracking-wide">
                {vehiculoLabel(pickerVehiculo.patente, pickerVehiculo.tipo_vehiculo)}
              </p>
              <button
                onClick={() => setPickerVehiculoKey(null)}
                className="rounded-lg border-2 border-black bg-white px-3 py-2.5 text-xs font-bold uppercase active:scale-[0.97] hover:bg-black hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                onClick={abrirNuevoServicio}
                className="rounded-lg border-2 border-black bg-yellow-400 px-5 py-3 text-sm font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-yellow-400"
              >
                Nuevo Servicio
              </button>
              <input
                value={pickerBusqueda}
                onChange={(e) => setPickerBusqueda(e.target.value)}
                placeholder="Buscar servicio"
                className="flex-1 rounded-lg border-2 border-black px-4 py-3 text-base focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              />
            </div>

            <div className="mt-3 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {serviciosFiltrados.map((item) => (
                  <div key={item.id_item} className="flex flex-col gap-2 rounded-lg border-2 border-black bg-white p-3">
                    <span className="text-sm leading-tight font-bold">{item.nombre}</span>
                    <span className="text-xs font-semibold text-black/60">Monto a cargar</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirModalServicio(item)}
                        className="flex-1 rounded-lg border-2 border-black bg-yellow-400 py-2.5 text-xs font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-yellow-400"
                      >
                        Agregar
                      </button>
                      <BorrarServicioButton id_item={item.id_item} />
                    </div>
                  </div>
                ))}
                {serviciosFiltrados.length === 0 && (
                  <p className="col-span-2 py-8 text-center text-sm font-medium text-black/50 md:col-span-3">
                    No hay resultados.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {modalItem && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 md:items-center">
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

            <div className="mt-4 flex flex-col gap-1">
              <label className="text-sm font-bold tracking-wide uppercase" htmlFor="modal-descripcion">
                Descripción (opcional)
              </label>
              <textarea
                id="modal-descripcion"
                value={modalDescripcion}
                onChange={(e) => setModalDescripcion(e.target.value)}
                placeholder="Ej: medida, marca, detalle del trabajo"
                rows={2}
                className="resize-none rounded-lg border-2 border-black px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              />
            </div>

            <div className="mt-4 flex flex-col gap-1">
              <span className="text-sm font-bold tracking-wide uppercase">Rueda (opcional)</span>
              <div className="grid grid-cols-2 gap-3">
                {(["DELANTERA", "TRASERA"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => elegirModalRueda(r)}
                    className={`rounded-lg border-2 border-black py-2.5 text-sm font-bold tracking-wide uppercase transition active:scale-[0.97] ${
                      modalRueda === r
                        ? "bg-yellow-400 text-black"
                        : "bg-white text-black hover:bg-black hover:text-white"
                    }`}
                  >
                    {RUEDA_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>

            {modalRueda && (
              <div className="mt-4 flex flex-col gap-1">
                <span className="text-sm font-bold tracking-wide uppercase">Lado (opcional)</span>
                <div className="grid grid-cols-2 gap-3">
                  {(["DERECHA", "IZQUIERDA"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setModalLado((prev) => (prev === l ? null : l))}
                      className={`rounded-lg border-2 border-black py-2.5 text-sm font-bold tracking-wide uppercase transition active:scale-[0.97] ${
                        modalLado === l
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
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 md:items-center">
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

      {!carritoVacio && !cartOpen && (
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
              {vehiculosConLineas.map((v) => {
                const subtotal = v.lineas.reduce((a, l) => a + l.monto * l.cantidad, 0);
                return (
                  <div key={v.key} className="border-b-2 border-black/10 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{vehiculoLabel(v.patente, v.tipo_vehiculo)}</span>
                      <span className="text-sm font-bold">{fmt(subtotal)}</span>
                    </div>
                    <ul className="mt-1 flex flex-col gap-0.5">
                      {v.lineas.map((l) => (
                        <li key={l.key} className="text-xs text-black/70">
                          {l.nombre} x{l.cantidad} — {fmt(l.monto * l.cantidad)}
                          {infoRueda(l) && <span className="block text-black/50">{infoRueda(l)}</span>}
                          {l.descripcion && <span className="block text-black/50">{l.descripcion}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

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
              disabled={pending || carritoVacio}
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
