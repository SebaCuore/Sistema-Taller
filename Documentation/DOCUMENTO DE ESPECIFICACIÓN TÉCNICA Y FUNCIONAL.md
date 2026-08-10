**Proyecto:** Sistema Web de Gestión de Taller Mecánico Ligero y Gomería

**Enfoque:** Web Mobile-First (Optimizado para Smartphone y Escritorio)

**Objetivo:** Gestión integral de ventas, catálogo dinámico por rodados, stock e informes financieros para el personal del taller.

## 1. VISIÓN GENERAL Y ARQUITECTURA PREDICHA

El sistema es una aplicación web progresiva (PWA) de uso interno para la gestión operativa en el taller. Sus pilares principales son la velocidad de registro de transacciones desde un celular, la adaptabilidad de precios según la medida/rodado del vehículo, el control automático de existencias y la consolidación de métricas de facturación.

### Requisitos No Funcionales Clave

- **Estrategia UI/UX:** Mobile-First, diseño táctil (_Thumb-Friendly_), target de área táctil mínimo de 44×44 px.
    
- **Manejo de Datos:** Eliminación mediante **Baja Lógica** para mantener integridad en históricos e informes.
    
- **Inmutabilidad Financiera:** Los precios en los detalles de las ventas se registran congelados al momento del cobro.
    

## 2. ESPECIFICACIÓN DE MÓDULOS Y FUNCIONALIDADES

### 2.1 Módulo 1: Atención y Registro de Ventas (Mobile-First)

- **1.1. Selector de Categoría:**
    
    - Conmutador (_Tabs_) entre **Servicios** y **Productos**.
        
- **1.2. Catálogo e Interfaz Visual:**
    
    - Grilla/Lista de tarjetas con foto, nombre e indicador de tarifa ("Precio Fijo" o "Desde $X" si varía por medida).
        
    - Buscador en tiempo real por nombre.
        
- **1.3. Lógica de Precios Dinámicos por Rodado/Medida:**
    
    - Si el ítem seleccionado tiene precios por medida, se despliega un _modal_ emergente para seleccionar la variante (ej. R13, R14, R15, 2.75-18).
        
    - Selección de cantidad e ingreso al carrito.
        
- **1.4. Control de Stock Pre-Venta:**
    
    - Verificación de stock disponible para productos antes de permitir la suma al ticket.
        
- **1.5. Cierre y Cobro de Venta:**
    
    - Selección del medio de pago: **Efectivo**, **Transferencia** o **Tarjeta**.
        
    - Confirmación: Registra timestamp, genera la transacción y descuenta el stock de productos en tiempo real.
        

### 2.2 Módulo 2: Gestión de Catálogo e Inventario (Modificación)

- **2.1. ABM de Ítems (Servicios y Productos):**
    
    - Formulario de creación/edición con: Nombre, Categoría, Descripción, Foto (archivo o cámara) y Estado (Activo/Inactivo).
        
- **2.2. Configuración de Matriz de Tarifas por Rodado:**
    
    - Opción binaria: _Precio Único General_ vs. _Precio por Rodado/Medida_.
        
    - Sub-tabla dinámica para asociar cada medida/rodado con su precio específico y su nivel de stock individual.
        
- **2.3. Control de Existencias y Ajustes:**
    
    - Carga manual para reposición de stock en productos.
        
- **2.4. Baja Lógica (Archivado):**
    
    - Desactivación de ítems sin eliminación física en la base de datos para preservar el historial de informes.
        

### 2.3 Módulo 3: Reportes e Informes Financieros

- **3.1. Cierre Mensual Automático:**
    
    - Consolidación automática por mes/año sin necesidad de arqueo manual.
        
- **3.2. Panel de Indicadores (KPIs):**
    
    - **Facturación Total:** Suma global del período seleccionado.
        
    - **Desglose por Categoría:** Totales y porcentajes de **Servicios** vs. **Productos**.
        
    - **Desglose por Medio de Pago:** Métricas separadas para Efectivo, Transferencia y Tarjeta.
        
- **3.3. Auditoría de Transacciones:**
    
    - Tabla/Listado cronológico filtrable por rango de fechas, detallando fecha/hora, ítems con sus rodados, cantidades, medio de pago y subtotal.
        

## 3. ESQUEMA CONCEPTUAL DE LA BASE DE DATOS

### 3.1 Entidades y Atributos

1. **Categorías (`categorias`)**
    
    - `id_categoria` (PK, Int)
        
    - `nombre` (String: 'Servicio', 'Producto')
        
    - `descripcion` (String, Opcional)
        
2. **Medidas / Rodados (`medidas`)**
    
    - `id_medida` (PK, Int)
        
    - `codigo` (String: 'R13', 'R14', 'R15', '2.75-18')
        
    - `descripcion` (String, Opcional)
        
    - `activo` (Boolean)
        
3. **Ítems (`items`)**
    
    - `id_item` (PK, Int)
        
    - `id_categoria` (FK ➔ `categorias`)
        
    - `nombre` (String)
        
    - `descripcion` (Text)
        
    - `imagen_url` (String)
        
    - `tiene_medida` (Boolean: Indica si despliega matriz de rodados)
        
    - `precio_base` (Decimal: Usado si `tiene_medida` es False)
        
    - `stock_actual` (Int: Usado si es Producto y `tiene_medida` es False)
        
    - `activo` (Boolean: Indicador de Baja Lógica)
        
4. **Matriz de Ítems por Medida (`item_medidas`)**
    
    - `id_item_medida` (PK, Int)
        
    - `id_item` (FK ➔ `items`)
        
    - `id_medida` (FK ➔ `medidas`)
        
    - `precio` (Decimal: Tarifa específica para la variante)
        
    - `stock` (Int: Existencias específicas para la variante)
        
    - `activo` (Boolean)
        
5. **Métodos de Pago (`metodos_pago`)**
    
    - `id_metodo_pago` (PK, Int)
        
    - `nombre` (String: 'Efectivo', 'Transferencia', 'Tarjeta')
        
    - `activo` (Boolean)
        
6. **Ventas - Cabecera (`ventas`)**
    
    - `id_venta` (PK, Int)
        
    - `id_metodo_pago` (FK ➔ `metodos_pago`)
        
    - `monto_total` (Decimal)
        
    - `fecha_hora` (Timestamp)
        
    - `observaciones` (Text)
        
7. **Detalles de Venta (`detalles_venta`)**
    
    - `id_detalle` (PK, Int)
        
    - `id_venta` (FK ➔ `ventas`)
        
    - `id_item` (FK ➔ `items`)
        
    - `id_item_medida` (FK ➔ `item_medidas`, Opcional)
        
    - `cantidad` (Int)
        
    - `precio_unitario` (Decimal: Congelado al realizar la venta)
        
    - `subtotal` (Decimal)
        

### 3.2 Relaciones de la Base de Datos

- **`categorias` 1 ➔ N `items`:** Agrupa los productos y servicios para filtros de UI y análisis financieros desglosados.
    
- **`items` 1 ➔ N `item_medidas` N ➔ 1 `medidas`:** Mapeo de precios y stocks específicos cuando un servicio o producto varía según el rodado del vehículo.
    
- **`metodos_pago` 1 ➔ N `ventas`:** Clasifica la procedencia del dinero ingresado a la caja.
    
- **`ventas` 1 ➔ N `detalles_venta`:** Asocia la cabecera del ticket con cada una de sus líneas de cobro.
    
- **`items` / `item_medidas` 1 ➔ N `detalles_venta`:** Identifica exactamente el servicio o insumo comercializado para descontar el inventario correspondiente.
    

## 4. ESTRUCTURA Y FLUIDEZ DE LA INTERFAZ DE USUARIO (UI/UX)

Plaintext

```
┌─────────────────────────────────────────────────────────┐
│                    NAVEGACIÓN PRINCIPAL                 │
└─────────────────────────────────────────────────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  1. VENTAS   │    │ 2. CATÁLOGO  │    │  3. INFORMES │
│(Mobile-First)│    │(Modificación)│    │ (Balances)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Layouts de Pantalla

#### 1. Pantalla de Ventas (Vista Principal)

- **Barra Superior Fija:** Título del Taller + Botón Flotante/Icono de Carrito con contador de ítems.
    
- **Selector de Pestañas:** Botones de ancho completo `[ 🔧 Servicios ]` | `[ 📦 Productos ]`.
    
- **Barra de Búsqueda:** Input con filtrado dinámico.
    
- **Grilla de Contenido:** Tarjetas de 2 columnas con imagen, título, precio e ícono de agregado rápido.
    
- **Modal de Rodado (Condicional):** Emergente centrado con botones de tamaño estándar para selección de rodado y cantidad.
    
- **Cajón del Carrito (Drawer/Pop-up):** Lista de líneas agregadas, selector rápido de método de pago y botón principal inferior: `[ CONFIRMAR VENTA - $TOTAL ]`.
    

#### 2. Pantalla de Gestión de Catálogo

- **Acción Principal:** Botón destacado `[ + Crear Servicio/Producto ]`.
    
- **Filtros de Estado:** Chips `[ Todos ]` `[ Activos ]` `[ Inactivos ]`.
    
- **Formulario Móvil Scrollable:**
    
    - Selector de foto / cámara.
        
    - Inputs de texto para nombre y descripción.
        
    - Switch de activación `Precio por Rodado`. Si es verdadero, despliega una matriz de filas con selector de rodado, campo de precio y campo de stock.
        

#### 3. Pantalla de Informes

- **Control de Período:** Selector desplegable de mes/año.
    
- **Tarjetas de KPIs:**
    
    - Contenedor destacado con el **Total Mensual Facturado**.
        
    - Gráfico de barra o tarjetas comparativas: **Servicios ($)** vs. **Productos ($)**.
        
    - Tabla/Tarjetas de canales de cobro (**Efectivo**, **Transferencia**, **Tarjeta**).
        
- **Historial Transaccional:** Lista cronológica con tarjetas resumidas por fecha, ítems, rodados agregados, método de pago y total.