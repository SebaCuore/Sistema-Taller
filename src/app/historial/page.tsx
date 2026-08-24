import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { DateFilterForm } from "./DateFilterForm";
import { BuscarPatenteForm } from "./BuscarPatenteForm";
import { DeleteVentaButton } from "./DeleteVentaButton";
import { infoRueda, vehiculoLabel } from "@/lib/vehiculo";
import { verifySession } from "@/lib/dal";

export const dynamic = "force-dynamic";

const ZONA = "America/Argentina/Buenos_Aires";

function hoyArgentina() {
  return new Date().toLocaleDateString("en-CA", { timeZone: ZONA });
}

// Argentina no tiene horario de verano actualmente: offset fijo -03:00.
function rangoDelDia(fecha: string) {
  const inicio = new Date(`${fecha}T00:00:00-03:00`);
  const fin = new Date(`${fecha}T23:59:59.999-03:00`);
  return { inicio, fin };
}

const fmt = (n: number) => `$${n.toFixed(2)}`;

const fmtHora = (d: Date) =>
  d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: ZONA });

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; patente?: string }>;
}) {
  await verifySession();

  const { fecha: fechaParam, patente: patenteParam } = await searchParams;
  const patenteQuery = (patenteParam ?? "").trim();

  // Con patente activa y sin fecha elegida a mano, se busca en todo el
  // historial. Sin patente, el comportamiento de siempre: por defecto "hoy".
  const usarFiltroFecha = Boolean(fechaParam) || !patenteQuery;
  const fecha = fechaParam || hoyArgentina();

  const where: Prisma.VentaWhereInput = {};
  if (usarFiltroFecha) {
    const { inicio, fin } = rangoDelDia(fecha);
    where.fecha_hora = { gte: inicio, lte: fin };
  }
  if (patenteQuery) {
    where.detalles = { some: { vehiculo: { patente: { contains: patenteQuery, mode: "insensitive" } } } };
  }

  const ventas = await prisma.venta.findMany({
    where,
    include: {
      metodo_pago: true,
      detalles: { include: { item: true, vehiculo: true } },
    },
    orderBy: { fecha_hora: "desc" },
  });

  const totalDia = ventas.reduce((acc, v) => acc + v.monto_total.toNumber(), 0);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 pb-8 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-wide uppercase md:text-2xl">Historial</h1>
        {usarFiltroFecha && (
          <span className="rounded-lg border-2 border-black bg-yellow-400 px-4 py-2 text-sm font-black">
            {fmt(totalDia)}
          </span>
        )}
      </div>

      <DateFilterForm fecha={fecha} />
      <BuscarPatenteForm patente={patenteQuery} />

      {patenteQuery && !fechaParam && (
        <p className="text-sm font-medium text-black/60">
          Mostrando resultados de <strong>todas las fechas</strong> para la patente buscada.{" "}
          <Link href={`/historial?fecha=${fecha}`} className="underline">
            Volver a hoy
          </Link>
        </p>
      )}

      <div className="flex flex-col gap-3">
        {ventas.map((venta) => {
          const gruposVehiculo = new Map<
            number,
            { patente: string | null; tipo_vehiculo: "MOTO" | "AUTO"; lineas: typeof venta.detalles }
          >();
          const lineasProducto: typeof venta.detalles = [];

          for (const d of venta.detalles) {
            if (d.id_vehiculo && d.vehiculo) {
              const grupo = gruposVehiculo.get(d.id_vehiculo);
              if (grupo) {
                grupo.lineas.push(d);
              } else {
                gruposVehiculo.set(d.id_vehiculo, {
                  patente: d.vehiculo.patente,
                  tipo_vehiculo: d.vehiculo.tipo_vehiculo,
                  lineas: [d],
                });
              }
            } else {
              lineasProducto.push(d);
            }
          }

          return (
            <div key={venta.id_venta} className="rounded-lg border-2 border-black bg-white p-3 md:p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">
                  {fmtHora(venta.fecha_hora)} hs · {venta.metodo_pago.nombre}
                </span>
                <span className="text-lg font-black">{fmt(venta.monto_total.toNumber())}</span>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                {Array.from(gruposVehiculo.entries()).map(([id_vehiculo, grupo]) => {
                  const subtotal = grupo.lineas.reduce((a, d) => a + d.subtotal.toNumber(), 0);
                  return (
                    <div key={id_vehiculo} className="rounded-lg bg-zinc-50 p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">
                          {vehiculoLabel(grupo.patente, grupo.tipo_vehiculo)}
                        </span>
                        <span className="text-sm font-bold">{fmt(subtotal)}</span>
                      </div>
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {grupo.lineas.map((d) => (
                          <li key={d.id_detalle} className="text-sm text-black/70">
                            {d.item.nombre} x{d.cantidad} — {fmt(d.subtotal.toNumber())}
                            {infoRueda(d) && <span className="block text-xs text-black/50">{infoRueda(d)}</span>}
                            {d.descripcion && (
                              <span className="block text-xs text-black/50">{d.descripcion}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

                {lineasProducto.length > 0 && (
                  <div className="rounded-lg bg-zinc-50 p-2">
                    {gruposVehiculo.size > 0 && (
                      <p className="mb-1 text-xs font-bold tracking-wide text-black/50 uppercase">Productos</p>
                    )}
                    <ul className="flex flex-col gap-0.5">
                      {lineasProducto.map((d) => (
                        <li key={d.id_detalle} className="text-sm text-black/70">
                          {d.item.nombre} x{d.cantidad} — {fmt(d.subtotal.toNumber())}
                          {d.descripcion && (
                            <span className="block text-xs text-black/50">{d.descripcion}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-2 flex justify-end">
                <DeleteVentaButton id_venta={venta.id_venta} />
              </div>
            </div>
          );
        })}
        {ventas.length === 0 && (
          <p className="py-8 text-center text-sm font-medium text-black/50">
            {patenteQuery ? "No se encontraron ventas con esa patente." : "No hay ventas ese día."}
          </p>
        )}
      </div>
    </div>
  );
}
