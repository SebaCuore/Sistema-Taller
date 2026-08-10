# Modelo de datos (MVP)

## Entidades

**`categorias`** — Agrupa ítems en "Servicio" o "Producto".
- `id_categoria` (PK)
- `nombre`
- `descripcion` (opcional)

**`medidas`** — Catálogo de rodados/medidas del taller (R13, R14, R15, 2.75-18, ...).
- `id_medida` (PK)
- `codigo`
- `descripcion` (opcional)
- `activo`

**`items`** — Ficha de cada servicio/producto.
- `id_item` (PK)
- `id_categoria` (FK → `categorias`)
- `nombre`, `descripcion`, `imagen_url`
- `tiene_medida` (bool: si usa precio por rodado)
- `precio_base` (usado si `tiene_medida = false`)
- `stock_actual` (usado si es Producto y `tiene_medida = false`)
- `activo` (baja lógica)

**`item_medidas`** — Precio y stock específicos cuando un ítem varía por medida.
- `id_item_medida` (PK)
- `id_item` (FK → `items`)
- `id_medida` (FK → `medidas`)
- `precio`, `stock`, `activo`

**`metodos_pago`** — Efectivo, Transferencia, Tarjeta.
- `id_metodo_pago` (PK)
- `nombre`, `activo`

**`ventas`** — Cabecera de cada cobro.
- `id_venta` (PK)
- `id_metodo_pago` (FK → `metodos_pago`)
- `monto_total`, `fecha_hora`, `observaciones` (opcional)

**`detalles_venta`** — Líneas de cada venta.
- `id_detalle` (PK)
- `id_venta` (FK → `ventas`)
- `id_item` (FK → `items`)
- `id_item_medida` (FK → `item_medidas`, opcional)
- `cantidad`, `precio_unitario` (congelado al momento del cobro), `subtotal`

## Relaciones

- `categorias` 1—N `items`.
- `items` N—N `medidas`, a través de `item_medidas` (que además guarda precio y stock específicos de esa combinación).
- `metodos_pago` 1—N `ventas`.
- `ventas` 1—N `detalles_venta`.
- `items` / `item_medidas` 1—N `detalles_venta`.

## Reglas clave

1. **Precios congelados:** `detalles_venta.precio_unitario` se guarda en el momento del cobro. Si después cambia el precio en `items` o `item_medidas`, las ventas pasadas no se ven afectadas.
2. **Descuento de stock:** al confirmar una venta, si el ítem tiene medida se descuenta de `item_medidas.stock`; si no, se descuenta de `items.stock_actual`.
3. **Baja lógica:** desactivar un ítem (o una medida) solo cambia `activo = false`. Nunca se borra un registro que ya tenga ventas asociadas, para no romper el historial.

> Nota: este esquema es el mismo que en la especificación original, sin cambios — la lógica de datos ya estaba bien pensada para el MVP. Lo único que se recorta acá es todo lo que no hace falta para vender: no incluye tablas de turnos, usuarios/roles ni cierres mensuales (eso queda para cuando se construya Fase 2, ver [`04-stack-y-roadmap.md`](./04-stack-y-roadmap.md)).
