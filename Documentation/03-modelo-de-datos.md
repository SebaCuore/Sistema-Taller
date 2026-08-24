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
- `id_vehiculo` (FK → `vehiculos`, opcional) — solo en líneas de Servicio agregadas a un vehículo.
- `cantidad`, `precio_unitario` (congelado al momento del cobro), `subtotal`
- `descripcion` (opcional) — nota a mano cargada al vender (medidas, marca, características), útil sobre todo en Productos que no las tienen en el catálogo.
- `rueda`, `lado` (opcionales) — a qué rueda del vehículo aplica el servicio, si corresponde.

**`vehiculos`** — Agrupa los servicios de una misma venta bajo el vehículo atendido.
- `id_vehiculo` (PK)
- `patente` (opcional)
- `tipo_vehiculo` (Moto/Auto, obligatorio)
- `creado_en`

No es un catálogo reutilizable entre visitas: se crea junto con la venta que lo usa (ver regla 4 más abajo).

## Relaciones

- `categorias` 1—N `items`.
- `metodos_pago` 1—N `ventas`.
- `ventas` 1—N `detalles_venta`.
- `items` 1—N `detalles_venta`.
- `vehiculos` 1—N `detalles_venta` (opcional — solo líneas de Servicio agregadas a un vehículo la tienen).

## Reglas clave

1. **Precios congelados:** `detalles_venta.precio_unitario` se guarda en el momento del cobro.
   - En **Productos**, viene de `items.precio_base` en ese instante — si después cambia el precio del ítem, las ventas pasadas no se ven afectadas.
   - En **Servicios**, no viene de ninguna tabla: lo escribe el operario al momento de la venta. El servidor confía en ese monto porque el precio de la mano de obra no está en ningún catálogo — es la única excepción a "todo precio sale de una tabla".
2. **Descuento de stock:** al confirmar una venta con un Producto, se descuenta `items.stock_actual` por la cantidad vendida. **No se bloquea la venta si el stock no alcanza** — puede quedar en 0 o negativo, como señal de que el stock cargado en el sistema está desactualizado respecto al físico. Los Servicios no tienen stock.
3. **Baja lógica:** desactivar un ítem solo cambia `activo = false`. Nunca se borra un registro que ya tenga ventas asociadas, para no romper el historial.
4. **Vehículos por venta, no por cliente:** un vehículo se agrega desde la pantalla de Venta con el único dato de la patente (opcional) y se persiste recién al confirmar la venta, junto con sus `detalles_venta`. No hay una pantalla de catálogo de vehículos ni búsqueda de vehículos existentes por patente al cargar una venta nueva — cada visita crea su propio registro, aunque la patente se repita entre visitas. Al borrar una venta (`borrarVenta`), los vehículos que queden sin ningún detalle asociado se borran también, para no acumular filas huérfanas. Una `venta` en sí no tiene FK a `vehiculo`: puede mezclar líneas de distintos vehículos y productos sueltos sin vehículo.

> Este modelo reemplaza al esquema original, que incluía una tabla `medidas` e `item_medidas` para manejar precios por rodado. Se simplificó porque en la práctica el precio de un servicio se negocia caso a caso (no tiene sentido mantener una tarifa fija por medida) y los productos, para este MVP, alcanzan con un precio y un stock únicos.
