# Stack y hoja de ruta

## Stack para el MVP

```
Frontend:   Next.js (App Router) + Tailwind CSS
ORM/DB:     Prisma + Neon Postgres (serverless)
Hosting:    Vercel, con deploy automático desde GitHub
Auth:       ninguna por ahora (acceso interno, sin pantalla de login)
```

**Por qué este stack:** Next.js permite tener frontend y backend (API routes) en un solo proyecto, Tailwind acelera un diseño mobile-first, y Prisma + Neon dan una base de datos relacional lista para producción sin infraestructura que mantener. Vercel hace que cada push a GitHub quede desplegado en segundos.

**Por qué sin login todavía:** agregar usuarios y roles no ayuda a validar si el flujo de venta funciona; solo suma trabajo antes de la primera prueba real. Se agrega en Fase 2 si el negocio lo necesita (por ejemplo, para distinguir operario de dueño en los informes).

## Hoja de ruta

**Fase 1 — MVP (este documento + [`02-funcionalidad.md`](./02-funcionalidad.md))**
1. Setup del proyecto Next.js, repo en GitHub, deploy en Vercel, base vacía en Neon.
2. Modelo de datos con Prisma (ver [`03-modelo-de-datos.md`](./03-modelo-de-datos.md)).
3. Pantalla de Catálogo: alta/edición de ítems, precio único o por medida, baja lógica.
4. Pantalla de Venta: carrito, cobro, descuento de stock en tiempo real.
5. Probar con el taller en uso real.

**Fase 2 — según lo que valide el MVP**
- Informes: facturación total, por categoría (Servicios vs. Productos) y por medio de pago.
- Turnos: agendamiento de citas, planilla del día, cobro de un turno agendado.
- Login y roles (operario / administrador).
- Exportación a PDF / impresión de planillas.
- PWA instalable.

No se descartan: quedan pendientes de especificar en detalle cuando el MVP muestre que vale la pena construirlas.
