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

1. **Elegir categoría:** tabs `Vehículos` / `Productos`.
2. **Productos:** grilla de tarjetas con nombre, precio y stock, filtrable por Moto/Auto/Todos y por búsqueda. Se suma directamente al carrito con el precio cargado en Stock. Si el stock registrado es 0 o negativo, la tarjeta se ve en gris — pero igual se puede vender, porque puede haber stock físico que no se actualizó en el sistema todavía. Cada línea del carrito puede llevar una **descripción** opcional (medida, marca u otra característica), ya que el catálogo de Productos por ahora no las guarda.
3. **Vehículos:** botón "Nuevo Vehículo" para agregar un vehículo a la venta — se elige el **tipo (Moto o Auto, obligatorio)** y la **patente, que es opcional** (se puede dejar en blanco). A cada vehículo agregado se le suman servicios: botón "Agregar servicio" abre un buscador del catálogo de servicios (con "Nuevo Servicio" para cargar uno nuevo sin pasar por Stock); al elegir uno se carga el monto a mano, la cantidad, una descripción opcional y, si corresponde, la rueda/lado del vehículo — el precio nunca queda asociado al servicio, se escribe cada vez. Un vehículo puede acumular varios servicios antes de cobrarse.
4. **Carrito / Ticket:** agrupado por vehículo (cada uno con sus servicios y subtotal) y luego por productos sueltos; todo editable/eliminable. La venta en sí no queda asociada a ningún vehículo — es una agrupación dentro del ticket, no una entidad de la venta. El carrito se guarda en el navegador (no en el servidor) mientras no se cobra, así que un vehículo cargado sin cobrar sigue ahí aunque se navegue a Historial o Stock y se vuelva a Venta — solo se pierde si se cobra o se borra a mano.
5. **Cobro:** elegir método de pago (Efectivo, Transferencia o Tarjeta) y confirmar.
6. **Al confirmar:** se registra la venta con fecha/hora; los vehículos con servicios cargados se crean junto con ella. Si había productos, se descuenta su stock (puede quedar en negativo, como aviso de que hay que recontar). Se limpia el carrito.

## 3. Historial

Lista de ventas para revisar y corregir errores de carga.

- **Filtro por día:** selector de fecha (por defecto, hoy). Muestra las ventas de ese día con hora, método de pago y total.
- **Por vehículo, no por servicio:** cada venta se muestra agrupada por vehículo atendido (patente y sus servicios, con descripción y rueda/lado si se cargaron) y, aparte, sus líneas de producto sueltas — no como una lista plana de ítems.
- **Buscar por patente:** además del filtro por día, se puede buscar en todo el historial por patente de vehículo.
- **Total del día:** suma de todas las ventas listadas.
- **Borrar una venta:** botón con confirmación en dos pasos. Al borrar, si la venta incluía Productos, se le repone el stock descontado — para que el error de carga no deje el stock desfasado. Los vehículos que queden sin servicios asociados también se borran.

## Notas de diseño

- Botones de acción principal (agregar, confirmar venta) siempre en la mitad inferior de la pantalla, fáciles de alcanzar con el pulgar.
- Todos los botones dan feedback visual inmediato al tocarlos (se achican levemente), para que se sienta que la acción se registró incluso si la confirmación del servidor tarda un instante.
- El precio que queda guardado en cada venta es el vigente al momento del cobro: en productos viene del catálogo, en servicios es el que se cargó a mano ese momento. Ninguno de los dos se recalcula después (ver [`03-modelo-de-datos.md`](./03-modelo-de-datos.md)).
