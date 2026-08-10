## 1. Pantalla Principal: Registro de Ventas (Paso a Paso)

Es la pantalla por defecto al abrir la aplicación. Diseñada para registrar un cobro en menos de 10 segundos.

### 📐 Estructura de la Interfaz (Layout)

- **Encabezado Superior (Fijo):**
    
    - Logo/Nombre del taller.
        
    - Icono de Carrito/Ticket con badge flotante `[ 2 ]` que indica la cantidad de ítems sumados.
        
- **Selector de Categoría (Tabs superiores):**
    
    - Dos botones grandes de borde a borde: **[ 🔧 Servicios ]** | **[ 📦 Productos ]**
        
- **Barra de Búsqueda:**
    
    - Campo de texto con lupa: _"Buscar servicio o producto..."_
        
- **Catálogo (Grilla de Tarjetas - 2 columnas):**
    
    - Cada tarjeta contiene:
        
        - Imagen del ítem (tamaño mediano).
            
        - Nombre en negrita (ej. _"Cámara Auto"_).
            
        - Precio base o etiqueta _"Desde $X"_ (si varía por rodado).
            
        - Botón destacado: **[ + Agregar ]**
            

### 📱 Ventana Emergente: Selector de Rodado / Medida (Modal)

Se despliega **únicamente** al tocar un ítem que tiene precios diferidos por rodado.

Plaintext

```
┌──────────────────────────────────────────┐
│  Seleccionar Rodado                      │
│  Reparación Neumático                    │
├──────────────────────────────────────────┤
│  [ Rodado R13 - $4.000 ]                │
│  [ Rodado R14 - $4.500 ]                │
│  [ Rodado R15 - $5.200 ]                │
│  [ Rodado R16 - $6.000 ]                │
├──────────────────────────────────────────┤
│  Cantidad:  [ - ]  1  [ + ]              │
├──────────────────────────────────────────┤
│  [ Cancelar ]     [ Confirmar / Sumar ]  │
└──────────────────────────────────────────┘
```

### 🛒 Pantalla / Desplegable: Carrito y Cierre de Venta

Se abre al tocar el icono del Carrito arriba o un botón flotante inferior **[ Ver Ticket ($9.500) ]**.

1. **Lista de ítems agregados:**
    
    - _Reparación Neumático (R15)_ x1 ➔ $5.200 `[🗑️]`
        
    - _Cámara de Moto (2.75-18)_ x1 ➔ $4.300 `[🗑️]`
        
2. **Método de Pago (Botones de un solo toque):**
    
    - `[ 💵 Efectivo ]` `[ 📱 Transferencia ]` `[ 💳 Tarjeta ]`
        
3. **Total y Confirmación:**
    
    - Texto grande: **TOTAL: $9.500**
        
    - Botón de acción principal verde de pantalla completa: **[ CONFIRMAR VENTA ]**
        

## 2. Pantalla de Gestión: Modificación y Catálogo

Diseñada para agregar o editar productos, cambiar listas de precios y controlar stock desde el teléfono.

### 📐 Estructura de la Interfaz

- **Barra Superior:** Botón de regreso `[⬅]` + Título _"Gestión de Catálogo"_.
    
- **Botón de Acción Principal (Flotante o Superior):**
    
    - `[ + Nuevo Servicio / Producto ]`
        
- **Lista Desplegable de Ítems (Acordeón):**
    
    - Filtro rápido: _Todos / Solo Activos / Inactivos_.
        
    - Cada fila muestra: **Foto** + **Nombre** + **Tipo (Servicio/Producto)** + **Estado (Switch On/Off para Baja Lógica)**.
        

### 📝 Formulario: Crear o Editar Ítem

Un formulario vertical sencillo scrollable:

1. **Foto:** Recuadro toque para tomar foto con la cámara del celular o subir archivo.
    
2. **Nombre:** Campo de texto (ej. _"Cámara de Moto"_).
    
3. **Tipo:** Botones de selección `[ Servicio ]` o `[ Producto ]`.
    
4. **Modo de Precio:**
    
    - `( ) Precio Único` ➔ Habilita campo: _Monto ($)_ y _Stock Actual_.
        
    - `(X) Precio por Rodado/Medida` ➔ Despliega subtabla:
        
        - _R13 / Medida A_ ➔ Precio: `[$ 4.000]` | Stock: `[ 10 ]`
            
        - _R14 / Medida B_ ➔ Precio: `[$ 4.500]` | Stock: `[ 8 ]`
            
        - `[ + Agregar otra medida ]`
            
5. **Botones finales:** `[ Desactivar Ítem ]` | `[ Guardar Cambios ]`.
    

## 3. Pantalla de Informes y Balance Mensual

Aprovecha el ancho de la pantalla móvil usando tarjetas con métricas visuales clave (KPIs) e historial scrolleable.

### 📐 Estructura de la Interfaz

- **Filtro de Período:** Selector desplegable de mes/año (ej. _"Agosto 2026"_).
    
- **Tarjetas de Resumen Financiero (KPIs):**
    
    - **Facturación Total:** `$ 1.250.000` (Texto grande).
        
    - **Comparativo Servicios vs. Productos:**
        
        - 🔧 _Servicios:_ `$ 750.000` (60%)
            
        - 📦 _Productos:_ `$ 500.000` (40%)
            
- **Desglose por Medio de Pago (Barra o Tarjetas pequeñas):**
    
    - 💵 _Efectivo:_ `$ 600.000`
        
    - 📱 _Transferencia:_ `$ 450.000`
        
    - 💳 _Tarjeta:_ `$ 200.000`
        
- **Listado de Transacciones Recientes (Historial):**
    
    - Buscador por fecha o concepto.
        
    - Tarjetas compactas con el detalle:
        
        > **10/08/2026 - 14:30 hs**
        > 
        > _Reparación Neumático (R15) x1 + Cámara Moto x1_
        > 
        > **Total:** $9.500 | _Efectivo_
        

## 🎨 Criterios Clave de Diseño Móvil (UX/UI)

1. **Diseño "Thumb-Friendly" (Área del Pulgar):** Los botones más importantes (Confirmar venta, Abrir ticket, Agregar) deben estar situados en la mitad inferior de la pantalla.
    
2. **Confirmaciones Visuales Rápidas:** Al agregar un producto al carrito, mostrar una animación breve o vibración (_feedback háptico_) para que el usuario sepa que se guardó sin tener que mirar fijamente la pantalla.
    
3. **Poco Cuidado en el Teclado:** Usar selectores de botones/medidas predeterminados en lugar de obligar al usuario a tipear texto constantemente con el teclado en pantalla.