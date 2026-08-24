"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cobrarVehiculo, crearServicio, borrarServicio } from "./actions";
import {
  RUEDA_LABEL,
  LADO_LABEL,
  TIPO_VEHICULO_LABEL,
  infoRueda,
  vehiculoLabel,
  type Rueda,
  type Lado,
  type TipoVehiculo,
} from "@/lib/vehiculo";

type ServicioCatalogo = { id_item: number; nombre: string };
type MetodoPago = { id: number; nombre: string };

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
  tipo_vehiculo: TipoVehiculo;
  lineas: CartServicioLine[];
};

const fmt = (n: number) => `$${n.toFixed(2)}`;

// Los vehículos en el taller (todavía sin cobrar) se guardan acá para
// sobrevivir a la navegación entre pantallas.
const VEHICULOS_STORAGE_KEY = "sistema-taller:vehiculos-taller";

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

export function VehiculosClient({
  servicios,
  metodosPago,
}: {
  servicios: ServicioCatalogo[];
  metodosPago: MetodoPago[];
}) {
  const router = useRouter();
  const [vehiculos, setVehiculos] = useState<VehiculoGrupo[]>([]);
  const skipPersist = useRef(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(VEHICULOS_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { vehiculos?: VehiculoGrupo[] };
      // Hidratar desde localStorage solo puede pasar después del montaje (el
      // server nunca ve localStorage), así que esto corre una única vez acá.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(data.vehiculos)) setVehiculos(data.vehiculos);
    } catch {
      // localStorage no disponible o con datos corruptos: se sigue vacío.
    }
  }, []);

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(VEHICULOS_STORAGE_KEY, JSON.stringify({ vehiculos }));
    } catch {
      // localStorage lleno o no disponible: no es crítico, solo se pierde la persistencia.
    }
  }, [vehiculos]);

  const [nuevoVehiculoOpen, setNuevoVehiculoOpen] = useState(false);
  const [nuevoVehiculoPatente, setNuevoVehiculoPatente] = useState("");
  const [nuevoVehiculoTipo, setNuevoVehiculoTipo] = useState<TipoVehiculo | null>(null);

  const [editPatenteKey, setEditPatenteKey] = useState<string | null>(null);
  const [editPatenteValue, setEditPatenteValue] = useState("");

  const [pickerVehiculoKey, setPickerVehiculoKey] = useState<string | null>(null);
  const [pickerBusqueda, setPickerBusqueda] = useState("");

  const [modalItem, setModalItem] = useState<ServicioCatalogo | null>(null);
  const [modalMonto, setModalMonto] = useState("");
  const [modalCantidad, setModalCantidad] = useState(1);
  const [modalDescripcion, setModalDescripcion] = useState("");
  const [modalRueda, setModalRueda] = useState<Rueda | null>(null);
  const [modalLado, setModalLado] = useState<Lado | null>(null);

  const [nuevoServicioOpen, setNuevoServicioOpen] = useState(false);
  const [nuevoServicioNombre, setNuevoServicioNombre] = useState("");
  const [pendingServicio, startTransitionServicio] = useTransition();

  const [cobroVehiculoKey, setCobroVehiculoKey] = useState<string | null>(null);
  const [cobroMetodoPagoId, setCobroMetodoPagoId] = useState<number | null>(metodosPago[0]?.id ?? null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const serviciosFiltrados = useMemo(
    () =>
      servicios.filter((item) => item.nombre.toLowerCase().includes(pickerBusqueda.trim().toLowerCase())),
    [servicios, pickerBusqueda]
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

  function abrirModalServicio(item: ServicioCatalogo) {
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

  function abrirCobro(v: VehiculoGrupo) {
    setCobroVehiculoKey(v.key);
    setCobroMetodoPagoId(metodosPago[0]?.id ?? null);
  }

  const cobroVehiculo = vehiculos.find((v) => v.key === cobroVehiculoKey) ?? null;
  const cobroSubtotal = cobroVehiculo?.lineas.reduce((a, l) => a + l.monto * l.cantidad, 0) ?? 0;

  function confirmarCobro() {
    if (!cobroVehiculo) return;
    if (!cobroMetodoPagoId) {
      setErrorMsg("Elegí un método de pago.");
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const res = await cobrarVehiculo(
          cobroVehiculo.patente,
          cobroVehiculo.tipo_vehiculo,
          cobroVehiculo.lineas.map((l) => ({
            id_item: l.id_item,
            cantidad: l.cantidad,
            monto: l.monto,
            descripcion: l.descripcion,
            rueda: l.rueda,
            lado: l.lado,
          })),
          cobroMetodoPagoId
        );
        setVehiculos((prev) => prev.filter((v) => v.key !== cobroVehiculo.key));
        setCobroVehiculoKey(null);
        setSuccessMsg(`Vehículo cobrado por ${fmt(res.monto_total)}.`);
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "No se pudo cobrar el vehículo.");
      }
    });
  }

  const pickerVehiculo = vehiculos.find((v) => v.key === pickerVehiculoKey) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 pb-8 md:gap-6 md:p-6">
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

      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-wide uppercase md:text-2xl">Vehículos</h1>
        <button
          onClick={abrirNuevoVehiculo}
          className="rounded-lg border-2 border-black bg-yellow-400 px-5 py-3 text-sm font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-yellow-400"
        >
          Nuevo Vehículo
        </button>
      </div>

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
                  <QuitarVehiculoButton tieneLineas={v.lineas.length > 0} onQuitar={() => quitarVehiculo(v.key)} />
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
                        {infoRueda(l) && <span className="text-xs text-black/50">{infoRueda(l)}</span>}
                        {l.descripcion && <span className="text-xs text-black/50">{l.descripcion}</span>}
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

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => abrirPicker(v.key)}
                  className="flex-1 rounded-lg border-2 border-black bg-white py-2.5 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] hover:bg-black hover:text-white"
                >
                  Agregar servicio
                </button>
                {v.lineas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => abrirCobro(v)}
                    className="flex-1 rounded-lg border-2 border-black bg-yellow-400 py-2.5 text-xs font-bold tracking-wide uppercase text-black transition active:scale-[0.97] hover:bg-black hover:text-yellow-400"
                  >
                    Cobrar
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {vehiculos.length === 0 && (
          <p className="py-8 text-center text-sm font-medium text-black/50">
            Agregá un vehículo para poder cargarle servicios.
          </p>
        )}
      </div>

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

      {cobroVehiculo && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 md:items-center">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-t-2xl border-4 border-black bg-white p-4 md:rounded-2xl md:p-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-lg font-bold uppercase tracking-wide">
                Cobrar · {vehiculoLabel(cobroVehiculo.patente, cobroVehiculo.tipo_vehiculo)}
              </p>
              <button
                onClick={() => setCobroVehiculoKey(null)}
                className="rounded-lg border-2 border-black bg-white px-3 py-2.5 text-xs font-bold uppercase active:scale-[0.97] hover:bg-black hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {cobroVehiculo.lineas.map((l) => (
                <div key={l.key} className="border-b-2 border-black/10 py-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      {l.nombre} x{l.cantidad}
                    </span>
                    <span className="font-bold">{fmt(l.monto * l.cantidad)}</span>
                  </div>
                  {infoRueda(l) && <span className="block text-xs text-black/50">{infoRueda(l)}</span>}
                  {l.descripcion && <span className="block text-xs text-black/50">{l.descripcion}</span>}
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <p className="text-sm font-bold tracking-wide uppercase">Método de pago</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {metodosPago.map((mp) => (
                  <button
                    key={mp.id}
                    onClick={() => setCobroMetodoPagoId(mp.id)}
                    className={`rounded-lg border-2 border-black py-2.5 text-xs font-bold tracking-wide uppercase transition active:scale-[0.97] md:text-sm ${
                      cobroMetodoPagoId === mp.id ? "bg-black text-white" : "bg-white text-black hover:bg-yellow-400"
                    }`}
                  >
                    {mp.nombre}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-lg font-black">
              <span>Total</span>
              <span>{fmt(cobroSubtotal)}</span>
            </div>

            <button
              onClick={confirmarCobro}
              disabled={pending}
              className="mt-3 w-full rounded-lg border-4 border-black bg-yellow-400 py-4 text-lg font-black tracking-wide uppercase text-black transition active:scale-[0.98] hover:bg-black hover:text-yellow-400 disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              {pending ? "Confirmando..." : "Confirmar cobro"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
