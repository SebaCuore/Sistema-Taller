# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Sistema-Taller is a mobile-first web app for managing sales, a product catalog, and stock for a small mechanic/tire shop (gomería). Deployed publicly on Vercel behind a single shared-password login (no per-user accounts — matches the "one shared device at the counter" model). Full product context (MVP scope, data model rationale, roadmap) lives in `Documentation/`:

- `Documentation/01-vision-y-mvp.md` — problem, MVP scope, what's deliberately out of scope
- `Documentation/02-funcionalidad.md` — UX/functional spec for Venta, Historial, Stock screens
- `Documentation/03-modelo-de-datos.md` — data model and the business rules behind it (frozen prices, non-blocking stock, soft deletes)
- `Documentation/04-stack-y-roadmap.md` — stack rationale and phased roadmap

Read the relevant doc before changing behavior in that area — several rules (e.g. why service prices aren't validated against a catalog, why stock can go negative) are intentional product decisions, not bugs.

## Commands

```
npm run dev        # start dev server (Next.js App Router)
npm run build       # runs `prisma migrate deploy` then production build
npm run lint         # eslint
npm run db:push      # push schema without a migration (fast local iteration only, see below)
npm run db:seed       # seed base Categorias (Servicio, Producto) and MetodoPago rows
```

There is no test suite configured in this repo.

Prisma Client is regenerated automatically via `postinstall`. After editing `prisma/schema.prisma`, run `npx prisma generate` (or reinstall) before the generated types in `src/generated/prisma/` will match.

**Schema changes**: this repo uses Prisma Migrate (`prisma/migrations/`), not just `db push`. For a real schema change, run `npx prisma migrate dev --name <description>` and commit the generated migration folder — `npm run build` runs `prisma migrate deploy` automatically, so Vercel applies pending migrations on every deploy. `db:push` is fine for throwaway local experiments but should not be how a schema change ships.

**Required env vars** (see `.env.example`): `DATABASE_URL` (Neon Postgres), `AUTH_PASSWORD` (the shared login password), `AUTH_SECRET` (session-signing secret, generate with `openssl rand -base64 32`). All three must be set in the Vercel project's env vars before deploying, in addition to a local `.env`.

## Architecture

- **Next.js App Router**, one route segment per feature area under `src/app/`: `venta/` (sale screen, the app's home page at `/`), `stock/` (product catalog CRUD + `stock/actualizar` quick-quantity-edit screen), `historial/` (sales history/undo).
- **Server Actions, not API routes.** Each feature has an `actions.ts` with `"use server"` mutations (e.g. `src/app/venta/actions.ts`, `src/app/stock/actions.ts`, `src/app/historial/actions.ts`). Pages are async Server Components that fetch via Prisma directly and pass plain-object props to a client component (e.g. `VentaPage` in `src/app/page.tsx` → `VentaClient`). Decimal fields are serialized with `.toNumber()` before crossing to client components.
- **Prisma**: schema at `prisma/schema.prisma`, generated client output is checked into `src/generated/prisma/` (not the default `node_modules/.prisma` location — always import from `@/generated/prisma/client`). Uses the `@prisma/adapter-pg` driver adapter against Neon Postgres; the shared client singleton is `src/lib/prisma.ts`.
- **Data model** (see `Documentation/03-modelo-de-datos.md` for full rationale): `Item` rows represent both Productos and Servicios, distinguished by their `Categoria` (`"Producto"` / `"Servicio"`), not a separate table. Servicios have `precio_base = null` and `stock_actual = null`; their price is entered by hand at sale time and trusted as-is (the one case where price doesn't come from a catalog). `DetalleVenta.precio_unitario` is frozen at sale time and never recalculated. Selling a Producto decrements `stock_actual` without blocking on insufficient stock — negative stock is a deliberate signal that the physical count is out of sync, not a bug to guard against. Deactivation (`activo = false`) is soft; rows referenced by past sales are never hard-deleted.
- **Mutations follow a consistent shape**: validate/parse `FormData` or args → single `prisma.$transaction` when multiple writes must be atomic (see `confirmarVenta` in `src/app/venta/actions.ts`) → `revalidatePath` the affected routes → `redirect` for form-submit flows, plain return for client-driven flows (cart actions, quick stock edits).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`, no separate Tailwind config file.
- **Auth**: single shared password, no user accounts. `src/lib/session.ts` signs/verifies a JWT session cookie (`jose`); `src/lib/dal.ts` exports `verifySession()`, called at the top of every Server Action and every data-fetching page — this is the real authorization boundary. `src/proxy.ts` (Next 16's rename of `middleware.ts`) does a cheap optimistic redirect-to-`/login` for unauthenticated requests, but is not itself the security boundary (per Next's own guidance) — always add `verifySession()` to new Server Actions/pages rather than relying on the proxy alone. Login lives at `src/app/login/`. To move to per-operator accounts later (Phase 2 in the roadmap), the DAL's `verifySession()` contract is the seam to extend — callers don't need to change.

## Working in this repo

This project runs on a pre-release/breaking version of Next.js (currently 16.x) — **do not assume App Router APIs match your training data.** Before writing or changing any Next.js-specific code (routing, data fetching, Server Actions, caching, config), read the matching guide under `node_modules/next/dist/docs/` first, per `AGENTS.md`.
