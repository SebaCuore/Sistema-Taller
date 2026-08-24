# Funcionalidad del MVP

Cuatro áreas: **Ventas**, **Vehículos**, **Historial** y **Stock**. Todas mobile-first, con botones grandes pensados para usarse con el pulgar mientras se atiende un cliente parado en el mostrador.

## 1. Stock (solo Productos)

Pantalla para dar de alta y mantener los productos que se venden. Los servicios no se cargan acá — se cargan desde la pantalla de Vehículos (ver más abajo).

- **Alta ("Nuevo Producto"):** nombre, cantidad, precio y tipo (Moto o Auto, pensado para filtrar el catálogo).
- **Edición ("Editar"):** permite cambiar nombre, precio, cantidad y tipo de un producto ya cargado.
- **Filtros:** por estado (Activos / Inactivos / Todos) y por tipo (Todos / Moto / Auto).
- **Baja lógica:** un producto se puede desactivar (deja de aparecer en la venta) sin borrarlo, para no perder el historial de ventas que lo referencia.
- **"Actualizar Stock":** pantalla aparte, pensada para corregir cantidades rápido (ej. después de un conteo físico). Tiene buscador por nombre y permite cambiar únicamente la cantidad de cada producto, sin tocar nombre, precio ni tipo.

## 2. Venta (solo Productos)

Pantalla principal de la app, pensada para cobrar en menos de 10 segundos. Es exclusiva para vender Productos — los servicios a vehículos se cobran desde la pantalla de Vehículos, en un ticket aparte, para no mezclar ambos tipos de cobro.

1. **Catálogo:** grilla de tarjetas con nombre, precio y stock, filtrable por Moto/Auto/Todos y por búsqueda. Se suma directamente al carrito con el precio cargado en Stock. Si el stock registrado es 0 o negativo, la tarjeta se ve en gris — pero igual se puede vender, porque puede haber stock físico que no se actualizó en el sistema todavía. Cada línea del carrito puede llevar una **descripción** opcional (medida, marca u otra característica), ya que el catálogo de Productos por ahora no las guarda.
2. **Carrito / Ticket:** lista de productos agregados, editable/eliminable. Se guarda en el navegador (no en el servidor) mientras no se cobra, así que sobrevive a navegar a otra pantalla y volver.
3. **Cobro:** elegir método de pago (Efectivo o Transferencia) y confirmar.
4. **Al confirmar:** se registra la venta con fecha/hora y se descuenta el stock de lo vendido (puede quedar en negativo, como aviso de que hay que recontar). Se limpia el carrito.

## 3. Vehículos

Pantalla para los vehículos que están siendo atendidos en el taller y los servicios que se les hacen. Cada vehículo se cobra con su propio ticket, independiente de los demás y de las ventas de Productos.

1. **"Nuevo Vehículo":** se elige el **tipo (Moto o Auto, obligatorio)** y se carga la **patente, que es opcional** (se puede dejar en blanco). El vehículo queda en pantalla como "en el taller" hasta que se cobra o se quita a mano — no hace falta cobrarlo enseguida.
2. **"Agregar servicio":** por cada vehículo, abre un buscador del catálogo de servicios (con "Nuevo Servicio" para cargar uno nuevo sin pasar por Stock); al elegir uno se carga el monto a mano, la cantidad, una descripción opcional y, si corresponde, la rueda/lado del vehículo — el precio nunca queda asociado al servicio, se escribe cada vez. Un vehículo puede acumular varios servicios antes de cobrarse.
3. **Vehículos en el taller:** la lista se guarda en el navegador (no en el servidor) mientras no se cobran, así que sobreviven a navegar a otra pantalla (Historial, Stock, Ventas) y volver — solo se pierden si se cobran o se quitan a mano.
4. **"Cobrar":** cada vehículo tiene su propio botón, que abre su propio ticket (solo los servicios de ese vehículo, nunca mezclados con otro vehículo ni con productos). Se elige método de pago (Efectivo o Transferencia) y se confirma.
5. **Al confirmar:** se registra la venta con fecha/hora, se crea el vehículo (recién en este momento, junto con sus `detalles_venta`) y el vehículo desaparece de la lista de "en el taller".

## 4. Historial

Lista de ventas para revisar y corregir errores de carga.

- **Filtro por día:** selector de fecha (por defecto, hoy). Muestra las ventas de ese día con hora, método de pago y total.
- **Por vehículo, no por servicio:** una venta de la pantalla Vehículos se muestra agrupada por el vehículo atendido (patente, tipo y sus servicios, con descripción y rueda/lado si se cargaron); una venta de la pantalla Ventas se muestra como sus líneas de producto — nunca mezcladas, porque cada venta viene de una sola pantalla.
- **Buscar por patente:** además del filtro por día, se puede buscar en todo el historial por patente de vehículo.
- **Total del día:** suma de todas las ventas listadas.
- **Borrar una venta:** botón con confirmación en dos pasos. Al borrar, si la venta incluía Productos, se le repone el stock descontado — para que el error de carga no deje el stock desfasado. Si incluía un vehículo, se borra también (ya no le queda ningún detalle).

## Notas de diseño

- Botones de acción principal (agregar, confirmar venta, cobrar) siempre en la mitad inferior de la pantalla, fáciles de alcanzar con el pulgar.
- Todos los botones dan feedback visual inmediato al tocarlos (se achican levemente), para que se sienta que la acción se registró incluso si la confirmación del servidor tarda un instante.
- El precio que queda guardado en cada venta es el vigente al momento del cobro: en productos viene del catálogo, en servicios es el que se cargó a mano ese momento. Ninguno de los dos se recalcula después (ver [`03-modelo-de-datos.md`](./03-modelo-de-datos.md)).
