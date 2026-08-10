import { prisma } from "@/lib/prisma";
import { DateFilterForm } from "./DateFilterForm";
import { DeleteVentaButton } from "./DeleteVentaButton";

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
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha: fechaParam } = await searchParams;
  const fecha = fechaParam || hoyArgentina();
  const { inicio, fin } = rangoDelDia(fecha);

  const ventas = await prisma.venta.findMany({
    where: { fecha_hora: { gte: inicio, lte: fin } },
    include: { metodo_pago: true, detalles: { include: { item: true } } },
    orderBy: { fecha_hora: "desc" },
  });

  const totalDia = ventas.reduce((acc, v) => acc + v.monto_total.toNumber(), 0);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 pb-8 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-wide uppercase md:text-2xl">Historial</h1>
        <span className="rounded-lg border-2 border-black bg-yellow-400 px-4 py-2 text-sm font-black">
          {fmt(totalDia)}
        </span>
      </div>

      <DateFilterForm fecha={fecha} />

      <div className="flex flex-col gap-3">
        {ventas.map((venta) => (
          <div key={venta.id_venta} className="rounded-lg border-2 border-black bg-white p-3 md:p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">
                {fmtHora(venta.fecha_hora)} hs · {venta.metodo_pago.nombre}
              </span>
              <span className="text-lg font-black">{fmt(venta.monto_total.toNumber())}</span>
            </div>
            <ul className="mt-1 flex flex-col gap-0.5">
              {venta.detalles.map((d) => (
                <li key={d.id_detalle} className="text-sm text-black/70">
                  {d.item.nombre} x{d.cantidad} — {fmt(d.subtotal.toNumber())}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-end">
              <DeleteVentaButton id_venta={venta.id_venta} />
            </div>
          </div>
        ))}
        {ventas.length === 0 && (
          <p className="py-8 text-center text-sm font-medium text-black/50">
            No hay ventas ese día.
          </p>
        )}
      </div>
    </div>
  );
}
