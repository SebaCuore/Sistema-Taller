# Modelo de datos (MVP)

## Entidades

**`categorias`** — Agrupa ítems en "Servicio" o "Producto".
- `id_categoria` (PK)
- `nombre`
- `descripcion` (opcional)

**`items`** — Ficha de cada servicio/producto.
- `id_item` (PK)
- `id_categoria` (FK → `categorias`)
- `nombre`, `descripcion`, `imagen_url`
- `precio_base` — obligatorio si es Producto; `null` si es Servicio (el precio se carga a mano al vender).
- `stock_actual` — obligatorio si es Producto; `null` si es Servicio.
- `activo` (baja lógica)

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
- `cantidad`, `precio_unitario` (congelado al momento del cobro), `subtotal`

## Relaciones

- `categorias` 1—N `items`.
- `metodos_pago` 1—N `ventas`.
- `ventas` 1—N `detalles_venta`.
- `items` 1—N `detalles_venta`.

## Reglas clave

1. **Precios congelados:** `detalles_venta.precio_unitario` se guarda en el momento del cobro.
   - En **Productos**, viene de `items.precio_base` en ese instante — si después cambia el precio del ítem, las ventas pasadas no se ven afectadas.
   - En **Servicios**, no viene de ninguna tabla: lo escribe el operario al momento de la venta. El servidor confía en ese monto porque el precio de la mano de obra no está en ningún catálogo — es la única excepción a "todo precio sale de una tabla".
2. **Descuento de stock:** al confirmar una venta con un Producto, se descuenta `items.stock_actual` por la cantidad vendida. **No se bloquea la venta si el stock no alcanza** — puede quedar en 0 o negativo, como señal de que el stock cargado en el sistema está desactualizado respecto al físico. Los Servicios no tienen stock.
3. **Baja lógica:** desactivar un ítem solo cambia `activo = false`. Nunca se borra un registro que ya tenga ventas asociadas, para no romper el historial.

> Este modelo reemplaza al esquema original, que incluía una tabla `medidas` e `item_medidas` para manejar precios por rodado. Se simplificó porque en la práctica el precio de un servicio se negocia caso a caso (no tiene sentido mantener una tarifa fija por medida) y los productos, para este MVP, alcanzan con un precio y un stock únicos.
