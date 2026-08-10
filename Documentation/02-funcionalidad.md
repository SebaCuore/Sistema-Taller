# Funcionalidad del MVP

Dos áreas: **cargar el catálogo** y **vender**. Ambas mobile-first, con botones grandes pensados para usarse con el pulgar mientras se atiende un cliente parado en el mostrador.

## 1. Catálogo (Servicios y Productos)

Pantalla para dar de alta y mantener lo que se vende.

- **Alta/edición de ítem:** nombre, categoría (Servicio o Producto), descripción opcional, foto opcional.
- **Modo de precio**, elegido por ítem:
  - *Precio único*: un monto fijo y, si es Producto, un stock general.
  - *Precio por rodado/medida*: tabla donde cada medida (R13, R14, R15, 2.75-18, etc.) tiene su propio precio y su propio stock.
- **Baja lógica:** un ítem se puede desactivar (deja de aparecer en la venta) sin borrarlo, para no perder el historial de ventas que lo referencian.
- **Ajuste de stock:** carga manual para reponer unidades.

## 2. Venta

Pantalla principal de la app, pensada para cobrar en menos de 10 segundos.

1. **Elegir categoría:** tabs `Servicios` / `Productos`.
2. **Buscar y elegir ítem:** grilla de tarjetas con foto, nombre y precio (o "Desde $X" si varía por medida).
3. **Si el ítem tiene precio por rodado:** se abre un selector para elegir la medida y la cantidad antes de sumarlo al carrito.
4. **Control de stock:** no se puede agregar al carrito más cantidad de la que hay disponible.
5. **Carrito:** lista de ítems agregados, con su medida si aplica, editable/eliminable.
6. **Cobro:** elegir método de pago (Efectivo, Transferencia o Tarjeta) y confirmar.
7. **Al confirmar:** se registra la venta con fecha/hora, se descuenta el stock correspondiente (de la medida específica o del stock general del ítem) y se limpia el carrito.

## Notas de diseño

- Botones de acción principal (agregar, confirmar venta) siempre en la mitad inferior de la pantalla, fáciles de alcanzar con el pulgar.
- Preferir selección por botones/chips (medida, método de pago) antes que texto libre, para minimizar el uso del teclado.
- El precio que queda guardado en cada venta es el vigente al momento del cobro: si después se cambia una tarifa, las ventas viejas no se alteran (ver [`03-modelo-de-datos.md`](./03-modelo-de-datos.md)).
