export type Rueda = "DELANTERA" | "TRASERA";
export type Lado = "DERECHA" | "IZQUIERDA";

export const RUEDA_LABEL: Record<Rueda, string> = { DELANTERA: "Delantera", TRASERA: "Trasera" };
export const LADO_LABEL: Record<Lado, string> = { DERECHA: "Derecha", IZQUIERDA: "Izquierda" };

export function infoVehiculo(l: {
  patente?: string | null;
  rueda?: Rueda | string | null;
  lado?: Lado | string | null;
}) {
  const partes: string[] = [];
  if (l.patente) partes.push(`Patente ${l.patente}`);
  if (l.rueda) {
    const ruedaLabel = RUEDA_LABEL[l.rueda as Rueda] ?? l.rueda;
    const ladoLabel = l.lado ? (LADO_LABEL[l.lado as Lado] ?? l.lado) : null;
    partes.push([ruedaLabel, ladoLabel].filter(Boolean).join(" "));
  }
  return partes.join(" · ");
}
