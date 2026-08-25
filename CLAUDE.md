# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Sistema-Taller is a mobile-first web app for a small mechanic/tire shop (gomería), built around managing vehicles and the services performed on them, plus a simple product sale screen. Deployed publicly on Vercel behind a single shared-password login (no per-user accounts — matches the "one shared device at the counter" model). Full product context (MVP scope, data model rationale, roadmap) lives in `Documentation/`:

- `Documentation/01-vision-y-mvp.md` — problem, MVP scope, what's deliberately out of scope
- `Documentation/02-funcionalidad.md` — UX/functional spec for Venta, Historial, Stock screens
- `Documentation/03-modelo-de-datos.md` — data model and the business rules behind it (frozen prices, soft deletes)
- `Documentation/04-stack-y-roadmap.md` — stack rationale and phased roadmap

Read the relevant doc before changing behavior in that area — several rules (e.g. why prices aren't validated against a catalog) are intentional product decisions, not bugs. Note the docs predate the current screens: they still describe a priced/stock-tracked catalog, so trust this file over them on that point.

## Commands

```
npm run dev        # start dev server (Next.js App Router)
npm run build       # runs `prisma migrate deploy` then production build
npm run lint         # eslint
npm run db:push      # push schema without a migration (fast local iteration only, see below)
npm run db:seed       # seed base Categorias, MetodoPago rows, and the base Productos
```

There is no test suite configured in this repo.

Prisma Client is regenerated automatically via `postinstall`. After editing `prisma/schema.prisma`, run `npx prisma generate` (or reinstall) before the generated types in `src/generated/prisma/` will match.

**Schema changes**: this repo uses Prisma Migrate (`prisma/migrations/`), not just `db push`. For a real schema change, run `npx prisma migrate dev --name <description>` and commit the generated migration folder — `npm run build` runs `prisma migrate deploy` automatically, so Vercel applies pending migrations on every deploy. `db:push` is fine for throwaway local experiments but should not be how a schema change ships.

**Required env vars** (see `.env.example`): `DATABASE_URL` (Neon Postgres), `AUTH_PASSWORD` (the shared login password), `AUTH_SECRET` (session-signing secret, generate with `openssl rand -base64 32`). All three must be set in the Vercel project's env vars before deploying, in addition to a local `.env`.

## Architecture

- **Next.js App Router**, one route segment per feature area under `src/app/`, mirroring the four nav tabs in `src/app/NavLinks.tsx` (in order): `/` (**Vehículos — the main screen of the system**; its page is `src/app/page.tsx` but its client + mutations live in `src/app/vehiculos/`, which has no `page.tsx` of its own), `venta/` (Registrar venta — the simple Productos sale screen), `historial/` (sales history + undo), `productos/` (Producto catalog CRUD). Data-fetching pages opt out of caching with `export const dynamic = "force-dynamic"`.
- **Vehículos is the priority surface.** The shop's core flow is managing vehicles and the services performed on them; the Productos sale screen is deliberately the simpler, secondary one. Keep that ordering in mind when adding UI.
- **Two separate checkout paths, one `Venta` table.** `confirmarVenta` (`src/app/venta/actions.ts`) sells Productos; `cobrarVehiculo` (`src/app/vehiculos/actions.ts`) creates a `Vehiculo` row and charges one or more Servicio lines against it. **Both take the unit price hand-entered at sale time** — nothing in the app reads a price from the catalog any more. Both end in a `Venta` + `DetalleVenta` rows, so `historial/` renders them uniformly. Adding a field to "a sale" usually means touching both.
- **Server Actions, not API routes.** Each feature has an `actions.ts` with `"use server"` mutations (`venta/`, `vehiculos/`, `productos/`, `historial/`, `login/`). Pages are async Server Components that fetch via Prisma directly and pass plain-object props to a client component (e.g. `src/app/page.tsx` → `VehiculosClient`). Decimal fields are serialized with `.toNumber()` before crossing to client components.
- **Prisma**: schema at `prisma/schema.prisma`, generated client output is checked into `src/generated/prisma/` (not the default `node_modules/.prisma` location — always import from `@/generated/prisma/client`). Uses the `@prisma/adapter-pg` driver adapter against Neon Postgres; the shared client singleton is `src/lib/prisma.ts`.
- **Data model** (see `Documentation/03-modelo-de-datos.md` for full rationale): `Item` rows represent both Productos and Servicios, distinguished by their `Categoria` (`"Producto"` / `"Servicio"`), not a separate table. **An `Item` currently carries nothing but its `nombre`** — for both categories, `precio_base`, `stock_actual` and `tipo_vehiculo` are left `null` on every row the app creates. Price is typed by hand on each sale and trusted as-is; `DetalleVenta.precio_unitario` is frozen at sale time and never recalculated. Deactivation (`activo = false`) is soft; rows referenced by past sales are never hard-deleted — this applies to `MetodoPago` too (Tarjeta ships seeded as `activo = false` rather than removed, so old sales still resolve; every screen queries `where: { activo: true }`).
- **The unused `Item` columns are kept on purpose.** `precio_base`, `stock_actual` and `tipo_vehiculo` are dead for now — quantity tracking was dropped *"por el momento"*, so the nullable columns stay in `prisma/schema.prisma` rather than being dropped in a destructive migration. Don't write to them, and don't remove them without asking. There is no stock tracking left in the app: selling a Producto does not decrement anything, and `borrarVenta` does not restore anything.
- **Servicio vs Producto CRUD live in different places.** `productos/` manages Productos (name only). Servicios are created/soft-deleted inline from the Vehículos screen via `crearServicio`/`borrarServicio` in `src/app/vehiculos/actions.ts`. Both are just a name — the two screens exist because they belong to different flows, not because the rows differ.
- **`Vehiculo` is per-sale, not a customer-vehicle catalog.** It's created inside `cobrarVehiculo`'s transaction purely to group that visit's Servicio lines (`DetalleVenta.id_vehiculo`), carrying `patente` (optional, normalized to uppercase, max 12 chars) and a required `tipo_vehiculo`. Re-visiting with the same patente creates a *new* row; `patente` is indexed for history search, not unique. Correspondingly, `borrarVenta` (`src/app/historial/actions.ts`) deletes any `Vehiculo` left with no remaining detalles.
- **Enums are duplicated on purpose**: `TipoVehiculo` (MOTO/AUTO), `Rueda` (DELANTERA/TRASERA) and `Lado` (DERECHA/IZQUIERDA) exist in `prisma/schema.prisma`, and `src/lib/vehiculo.ts` re-declares them as plain string-literal types alongside their Spanish display labels (`TIPO_VEHICULO_LABEL`, `vehiculoLabel()`, `infoRueda()`). Client components import from `@/lib/vehiculo` so they don't pull the Prisma client into the browser bundle — add new labels there, not inline.
- **Mutations follow a consistent shape**: validate/parse `FormData` or args → single `prisma.$transaction` when multiple writes must be atomic (see `cobrarVehiculo` in `src/app/vehiculos/actions.ts`) → `revalidatePath` the affected routes → `redirect` for form-submit flows, plain return for client-driven flows (the Vehículos and Venta screens).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`, no separate Tailwind config file. Mobile-first black/yellow theme with a fixed bottom tab bar under `md:` and a top nav above it — both in `NavLinks.tsx`, both hidden on `/login`.
- **Auth**: single shared password, no user accounts. `src/lib/session.ts` signs/verifies a JWT session cookie (`jose`); `src/lib/dal.ts` exports `verifySession()`, called at the top of every Server Action and every data-fetching page — this is the real authorization boundary. `src/proxy.ts` (Next 16's rename of `middleware.ts`) does a cheap optimistic redirect-to-`/login` for unauthenticated requests, but is not itself the security boundary (per Next's own guidance) — always add `verifySession()` to new Server Actions/pages rather than relying on the proxy alone. Login lives at `src/app/login/`. To move to per-operator accounts later (Phase 2 in the roadmap), the DAL's `verifySession()` contract is the seam to extend — callers don't need to change.
- **Security headers** are set in `next.config.ts`. The absence of a Content-Security-Policy is a documented MVP decision (see the comment there), not an oversight — don't "fix" it without asking.

## Working in this repo

This project runs on a pre-release/breaking version of Next.js (currently 16.x) — **do not assume App Router APIs match your training data.** Before writing or changing any Next.js-specific code (routing, data fetching, Server Actions, caching, config), read the matching guide under `node_modules/next/dist/docs/` first, per `AGENTS.md`.
