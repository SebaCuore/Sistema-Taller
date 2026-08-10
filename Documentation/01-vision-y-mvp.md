# Visión y alcance del MVP

## Proyecto

Sistema web de gestión para un taller mecánico ligero / gomería. Uso interno, pensado para cargarse desde el celular durante la atención al cliente.

## Problema que resuelve

Hoy el registro de ventas (servicios y productos) es manual. Esto dificulta saber cuánto se facturó, qué se vendió y cuánto stock queda, sobre todo cuando el precio de un servicio o producto cambia según la medida/rodado del vehículo (ej. una reparación de R13 no cuesta lo mismo que una de R16).

## Objetivo del MVP

Validar con el taller, lo antes posible, que una app simple de carga de ventas mobile-first resuelve el problema real: **cobrar rápido y saber qué stock queda**, sin construir todavía las partes más costosas del sistema.

## Qué entra en el MVP

- Catálogo de Servicios y Productos, con precio único o precio por rodado/medida.
- Pantalla de venta: elegir ítems, cobrar, descontar stock.
- Sin login: acceso interno, un único usuario/dispositivo compartido en el mostrador.

Ver el detalle funcional en [`02-funcionalidad.md`](./02-funcionalidad.md).

## Qué queda fuera del MVP (Fase 2+)

No se descarta, se pospone hasta validar que el flujo de ventas se usa de verdad:

- **Informes/KPIs**: facturación por período, por categoría, por medio de pago.
- **Turnos**: agendamiento de citas, planilla del día, export a PDF.
- **Login y roles (RBAC)**: usuarios, permisos de operario vs. administrador.
- **PWA instalable**: por ahora alcanza con que la web ande bien en el navegador del celular.

## Criterio de éxito del MVP

El taller usa la app para cargar ventas reales durante al menos una semana sin volver a la planilla/cuaderno anterior. Si eso pasa, se justifica invertir en Fase 2 (empezando por Informes, que es lo que más valor agrega sobre datos que el MVP ya está generando).
