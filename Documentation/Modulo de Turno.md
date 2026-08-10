## 1. DESCRIPCIÓN Y FLUJO DE PANTALLAS (UX / UI MÓVIL)

El módulo se integra como la **4.ª sección principal** del sistema.

Plaintext

```
┌────────────────────────────────────────────────────────────────────────┐
│                          MENÚ PRINCIPAL (PWA)                          │
├───────────────┬───────────────────┬───────────────────┬────────────────┤
│  1. VENTAS    │   2. CATÁLOGO     │   3. INFORMES     │   4. TURNOS    │
└───────────────┴───────────────────┴───────────────────┴────────────────┘
```

### Screen 4.1: Vista Principal del Módulo de Turnos

Al ingresar a la sección **[ 📅 Turnos ]**, el usuario móvil encuentra dos acciones principales en formato de tarjetas o botones destacados:

1. **`[ ➕ Registrar Nuevo Turno ]`** (Apertura de formulario de agendamiento).
    
2. **`[ 📋 Ver y Exportar Planilla de Turnos ]`** (Lista interactiva y descarga).
    

### Screen 4.2: Formulario "Nuevo Turno"

Diseñado para registrar una reserva en pocos pasos desde el celular:

- **Paso 1 - Datos del Cliente / Vehículo:**
    
    - Nombre del cliente / Apellido (Texto).
        
    - Teléfono de contacto (Tel/WhatsApp).
        
    - Patente / Dominio del vehículo (Opcional pero recomendable para identificar el auto en taller).
        
- **Paso 2 - Selección de Servicio:**
    
    - **Desplegable dinámico:** Muestra exclusivamente los servicios que se encuentran **activos** en el Módulo de Catálogo (ej. _Alineación, Balanceo, Reparación Neumático, Cambio de Cámara_).
        
    - **Selección de Rodado/Medida (Condicional):** Si el servicio seleccionado tiene tarifa/medida dinámicas, el formulario despliega el selector de rodado.
        
- **Paso 3 - Fecha y Horario:**
    
    - **Selector de Fecha:** Calendario (_Date Picker_). Por defecto muestra la fecha actual.
        
    - **Selector de Hora:** Desplegable o bloques de horas configurables (ej. 08:00, 08:30, 09:00, etc.).
        
- **Paso 4 - Confirmación:**
    
    - Botón de acción principal: **`[ CONFIRMAR TURNO ]`**.
        

### Screen 4.3: Planilla de Turnos del Día y Exportación PDF

Muestra la lista cronológica de los turnos programados.

- **Filtro Superior por Fecha:** Selector de día (por defecto muestra **HOY**).
    
- **Listado Cronológico:** Tarjetas o filas ordenadas por hora que muestran:
    
    - **Hora:** (ej. `09:30 hs`)
        
    - **Servicio:** Nombre del servicio + Rodado (ej. _Alineación R15_)
        
    - **Cliente / Vehículo:** Nombre + Teléfono + Patente
        
    - **Estado:** Badges visuales: `[ Pendiente ]` | `[ Completado ]` | `[ Cancelado ]`
        
- **Acciones de Exportación e Impresión (Botones Superiores):**
    
    - **`[ 📄 Descargar Planilla PDF ]`**: Genera y descarga instantáneamente el archivo PDF con la planilla del día seleccionado.
        
    - **`[ 🖨️ Imprimir ]`**: Dispara la función de impresión nativa del sistema operativo (móvil o PC).
        

## 2. EXPORTACIÓN A PDF E IMPRESIÓN (DISEÑO TÉCNICO)

Para generar el PDF en la plataforma Serverless de **Vercel** de manera ultra rápida sin recargar el servidor, se recomienda generar el documento **en el cliente (Frontend)** usando librerías ligeras de JavaScript.

- **Librería Recomendada:** `@react-pdf/renderer` o `jspdf` + `jspdf-autotable`.
    
- **Formato del Documento PDF Generado:**
    
    - **Encabezado:** Nombre del Taller / Gomería + Fecha del Informe + Hora de generación.
        
    - **Tabla Principal:**
        
        |**Hora**|**Servicio a Realizar**|**Cliente / Contacto**|**Vehículo / Patente**|**Estado**|
        |---|---|---|---|---|
        |08:30|Alineación + Balanceo R15|Juan Pérez (3442-XXXXXX)|AB 123 CD|Pendiente|
        |09:15|Reparación Neumático R16|Maria Gómez|AC 987 EF|Completado|
        
    - **Pie de Página:** Conteo total de turnos del día.
        

## 3. IMPACTO Y ACTUALIZACIÓN EN LA BASE DE DATOS (PRISMA / NEON)

Para integrar los turnos en el modelo relacional del sistema, se deben agregar la tabla `turnos` y un estado enumerable (`enum`).

### Esquema Prisma (`schema.prisma`)

Fragmento de código

```
// Enum para controlar la evolución del turno
enum EstadoTurno {
  PENDIENTE
  EN_PROCESO
  COMPLETADO
  CANCELADO
}

// Nueva tabla para la Gestión de Turnos
model Turno {
  id_turno        Int          @id @default(autoincrement())
  
  // Relación obligatoria con la tabla de Items (solo servicios)
  id_item         Int
  item            Item         @relation(fields: [id_item], references: [id_item])
  
  // Relación opcional con la medida/rodado
  id_item_medida  Int?
  item_medida     ItemMedida?  @relation(fields: [id_item_medida], references: [id_item_medida])
  
  // Datos de la cita
  fecha_hora      DateTime     // Fecha y hora programada del turno
  cliente_nombre  String       // Nombre del cliente
  cliente_telefono String?     // Contacto de WhatsApp / Teléfono
  vehiculo_patente String?     // Dominio / Patente del auto/moto
  observaciones   String?      // Notas adicionales (ej. "Trae rueda de auxilio")
  
  // Estado del turno
  estado          EstadoTurno  @default(PENDIENTE)
  
  // Auditoría
  creado_en       DateTime     @default(now())
  actualizado_en  DateTime     @updatedAt

  @@map("turnos")
}
```

## 4. INTEGRACIÓN CON EL MÓDULO DE VENTAS (FLUJO COMPLETO)

Para cerrar el circuito operativo del taller, el Módulo de Turnos se conecta de forma directa con el Módulo de Registro de Ventas:

1. Cuando un vehículo con turno llega al taller y finaliza el trabajo, el operario va a la **Planilla de Turnos**.
    
2. Al presionar el botón **`[ 🛒 Cobrar / Facturar ]`** al lado del turno:
    
    - El sistema redirige automáticamente al **Módulo de Registro de Ventas**.
        
    - Pre-carga en el carrito el **Servicio y Rodado** que estaban agendados en el turno.
        
    - Al confirmar el cobro de la venta, el estado del turno cambia automáticamente a `COMPLETADO`.
        

## 5. REGLAS DE SEGURIDAD Y PERMISOS (RBAC)

Siguiendo la matriz de seguridad previamente definida:

- **Rol OPERARIO:**
    
    - Puede consultar la planilla del día, registrar nuevos turnos, cambiar el estado a _Completado/Cancelado_ y descargar/imprimir la planilla en PDF.
        
- **Rol ADMINISTRADOR (Dueño):**
    
    - Mismos permisos del Operario, con capacidad adicional para reconfigurar o reasignar turnos de fechas pasadas y acceder a métricas de ausentismo (_turnos cancelados vs. completados_).