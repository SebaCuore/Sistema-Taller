## 1. Entidades Principales y sus Funciones

### Categorías

- **Función:** Define el tipo general de oferta del taller. Clasifica cada registro entre **"Servicios"** (mano de obra, reparaciones, alineación, balanceo) y **"Productos"** (cámaras de auto, cámaras de moto, parches, etc.).
    
- **Información que guarda:** Nombre de la categoría y descripción opcional.
    

### Medidas (Rodados)

- **Función:** Funciona como un catálogo centralizado de todas las medidas y rodados con los que trabaja el taller (por ejemplo: R13, R14, R15, R16, 2.75-18, etc.).
    
- **Información que guarda:** Código de la medida y su descripción explicativa.
    

### Ítems (Catálogo Base)

- **Función:** Es la ficha principal de cada producto o servicio que ofrece la gomería. Permite identificar si el trabajo/producto tiene un precio fijo general o si su tarifa varía según el tamaño del vehículo.
    
- **Información que guarda:** Nombre del servicio/producto, descripción, imagen/foto, indicador de si requiere elegir rodado, precio base (si no usa rodado), cantidad en stock (para productos fijos) y un indicador de estado activo/inactivo (para la baja lógica).
    

### Matriz de Ítems por Medida (Precios y Stock Específicos)

- **Función:** Resuelve la necesidad de cobrar tarifas diferentes según el rodado. Almacena las combinaciones entre un ítem específico del catálogo y una medida determinada.
    
- **Información que guarda:** El precio cobrado para esa combinación específica y el stock disponible (en caso de que sea un producto que dependa de la medida, como las cámaras).
    

### Métodos de Pago

- **Función:** Define las distintas opciones de cobro disponibles en el taller.
    
- **Información que guarda:** Nombre del medio de pago (Efectivo, Transferencia, Tarjeta).
    

### Ventas (Cabecera de la Transacción)

- **Función:** Representa el comprobante o ticket general de cada atención realizada en el taller. Es la base sobre la cual se calculan los balances e informes mensuales.
    
- **Información que guarda:** Fecha y hora exacta del cobro, el monto total cobrado, el método de pago utilizado y observaciones adicionales opcionales.
    

### Detalles de la Venta (Líneas del Ticket)

- **Función:** Registra cada uno de los ítems o servicios individuales que forman parte de una venta. Además, congela el precio al momento del cobro para que futuros aumentos de tarifas no alteren los reportes pasados.
    
- **Información que guarda:** El ítem cobrado, la medida/rodado seleccionada (si aplicaba), la cantidad vendida, el precio unitario del momento y el subtotal calculado.
    

## 2. Mapa de Relaciones entre Entidades

### Relación Categorías ➔ Ítems (Uno a Muchos)

- **Cómo se conectan:** Una categoría agrupa muchos ítems. Por ejemplo, la categoría _"Servicio"_ contiene a _"Reparación de neumático"_, _"Alineación"_ y _"Balanceo"_.
    
- **Propósito:** Permite al operario filtrar en la pantalla del celular la vista entre servicios y productos, y permite generar los informes separados por cada rama.
    

### Relación Ítems ➔ Matriz de Ítems por Medida ➔ Medidas (Muchos a Muchos)

- **Cómo se conectan:** Un ítem (ej. _"Cámara de Auto"_) puede estar asociado a muchas medidas (R14, R15, R16), y una medida (ej. _"R14"_) puede aplicar a varios ítems (_"Reparación"_, _"Cámara"_, _"Balanceo"_).
    
- La entidad **Matriz de Ítems por Medida** actúa como el puente entre ambas.
    
- **Propósito:** Al elegir un servicio en la pantalla de ventas, si este depende del tamaño, el sistema busca en esta relación los precios y stock correspondientes a la medida seleccionada. Si el ítem no depende de la medida, se ignora este puente y se usa el precio/stock directo de la ficha del ítem.
    

### Relación Métodos de Pago ➔ Ventas (Uno a Muchos)

- **Cómo se conectan:** Un método de pago (ej. _"Efectivo"_) puede estar presente en muchas ventas registradas.
    
- **Propósito:** Permite clasificar la facturación al final del día o del mes para saber cuánto dinero ingresó por caja chica y cuánto por banco.
    

### Relación Ventas ➔ Detalles de Venta (Uno a Muchos)

- **Cómo se conectan:** Una venta (un ticket) puede contener uno o varios detalles (líneas cobradas). Por ejemplo: en una sola venta se cobra una _"Reparación R15"_ y una _"Cámara de moto"_.
    
- **Propósito:** Mantiene desglosado el contenido exacto de cada transacción para el registro histórico y auditoría.
    

### Relación Ítems (y Matriz por Medida) ➔ Detalles de Venta (Uno a Muchos)

- **Cómo se conectan:** Cada línea del detalle de venta hace referencia a un ítem del catálogo (y opcionalmente a su medida/rodado específica).
    
- **Propósito:** Al guardar la venta, esta relación le indica al sistema qué producto/servicio se vendió para descontar las unidades del stock en tiempo real y sumar el monto en la categoría correspondiente para los informes.
    

## 3. Lógica Operativa del Esquema

1. **Gestión de Tarifas:** Si cambia la lista de precios de los parches o parches por rodado, la modificación se realiza sobre la ficha del ítem o sobre la matriz de medidas. Los tickets antiguos conservan el valor original guardado en sus _Detalles de Venta_.
    
2. **Control de Inventario:** Cuando se confirma una venta que contiene un producto, el sistema consulta si requiere medida o no. Si requiere medida, resta la cantidad del stock en la _Matriz por Medida_; si es un producto estándar, restará del stock general del _Ítem_.
    
3. **Baja de Ítems (Inactivación):** Si se deja de ofrecer un servicio o producto, no se elimina el registro. Se marca como "Inactivo" en la entidad de _Ítems_. Esto hace que deje de figurar en el menú de selección móvil, protegiendo las tablas de _Ventas_ y _Detalles de Venta_ para que los informes de meses pasados no pierdan información.