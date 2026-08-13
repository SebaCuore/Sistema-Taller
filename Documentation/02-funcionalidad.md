# Funcionalidad del MVP

Tres áreas: **Ventas**, **Historial** y **Stock**. Todas mobile-first, con botones grandes pensados para usarse con el pulgar mientras se atiende un cliente parado en el mostrador.

## 1. Stock (solo Productos)

Pantalla para dar de alta y mantener los productos que se venden. Los servicios ya no se cargan acá — se cargan desde la pantalla de Venta (ver más abajo).

- **Alta ("Nuevo Producto"):** nombre, cantidad, precio y tipo (Moto o Auto, pensado para filtrar el catálogo).
- **Edición ("Editar"):** permite cambiar nombre, precio, cantidad y tipo de un producto ya cargado.
- **Filtros:** por estado (Activos / Inactivos / Todos) y por tipo (Todos / Moto / Auto).
- **Baja lógica:** un producto se puede desactivar (deja de aparecer en la venta) sin borrarlo, para no perder el historial de ventas que lo referencia.
- **"Actualizar Stock":** pantalla aparte, pensada para corregir cantidades rápido (ej. después de un conteo físico). Tiene buscador por nombre y permite cambiar únicamente la cantidad de cada producto, sin tocar nombre, precio ni tipo.

## 2. Venta

Pantalla principal de la app, pensada para cobrar en menos de 10 segundos.

1. **Elegir categoría:** tabs `Servicios` / `Productos`.
2. **Productos:** grilla de tarjetas con nombre, precio y stock, filtrable por Moto/Auto/Todos y por búsqueda. Se suma directamente al carrito con el precio cargado en Stock. Si el stock registrado es 0 o negativo, la tarjeta se ve en gris — pero igual se puede vender, porque puede haber stock físico que no se actualizó en el sistema todavía.
3. **Servicios:** botón "Nuevo Servicio" para cargar un servicio nuevo (solo nombre, sin precio) sin pasar por Stock, y debajo la lista de servicios ya cargados. Al elegir uno, se abre un cuadro para cargar el monto a mano y la cantidad, antes de sumarlo al carrito — el precio nunca queda asociado al servicio, se escribe cada vez.
4. **Carrito:** lista de ítems agregados, editable/eliminable.
5. **Cobro:** elegir método de pago (Efectivo, Transferencia o Tarjeta) y confirmar.
6. **Al confirmar:** se registra la venta con fecha/hora. Si había productos, se descuenta su stock (puede quedar en negativo, como aviso de que hay que recontar). Se limpia el carrito.

## 3. Historial

Lista de ventas para revisar y corregir errores de carga.

- **Filtro por día:** selector de fecha (por defecto, hoy). Muestra las ventas de ese día con hora, ítems, método de pago y total.
- **Total del día:** suma de todas las ventas listadas.
- **Borrar una venta:** botón con confirmación en dos pasos. Al borrar, si la venta incluía Productos, se le repone el stock descontado — para que el error de carga no deje el stock desfasado.

## Notas de diseño

- Botones de acción principal (agregar, confirmar venta) siempre en la mitad inferior de la pantalla, fáciles de alcanzar con el pulgar.
- Todos los botones dan feedback visual inmediato al tocarlos (se achican levemente), para que se sienta que la acción se registró incluso si la confirmación del servidor tarda un instante.
- El precio que queda guardado en cada venta es el vigente al momento del cobro: en productos viene del catálogo, en servicios es el que se cargó a mano ese momento. Ninguno de los dos se recalcula después (ver [`03-modelo-de-datos.md`](./03-modelo-de-datos.md)).
