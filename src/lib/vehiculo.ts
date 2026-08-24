export type Rueda = "DELANTERA" | "TRASERA";
export type Lado = "DERECHA" | "IZQUIERDA";
export type TipoVehiculo = "MOTO" | "AUTO";

export const RUEDA_LABEL: Record<Rueda, string> = { DELANTERA: "Delantera", TRASERA: "Trasera" };
export const LADO_LABEL: Record<Lado, string> = { DERECHA: "Derecha", IZQUIERDA: "Izquierda" };
export const TIPO_VEHICULO_LABEL: Record<TipoVehiculo, string> = { MOTO: "Moto", AUTO: "Auto" };

/** Tipo + patente (o "sin patente") para identificar el grupo en pantalla. */
export function vehiculoLabel(patente: string | null | undefined, tipo: TipoVehiculo) {
  const patenteTexto = patente ? `Patente ${patente}` : "Sin patente";
  return `${TIPO_VEHICULO_LABEL[tipo]} · ${patenteTexto}`;
}

/** A qué rueda del vehículo aplica una línea de servicio, si se cargó. */
export function infoRueda(l: { rueda?: Rueda | string | null; lado?: Lado | string | null }) {
  if (!l.rueda) return "";
  const ruedaLabel = RUEDA_LABEL[l.rueda as Rueda] ?? l.rueda;
  const ladoLabel = l.lado ? (LADO_LABEL[l.lado as Lado] ?? l.lado) : null;
  return [ruedaLabel, ladoLabel].filter(Boolean).join(" ");
}
