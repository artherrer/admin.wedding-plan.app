# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite)
npm run build      # Production build
npm run typecheck  # Type-check without emitting (tsconfig.app.json)
npm run lint       # ESLint
npm run preview    # Preview production build
```

No test suite configured.

## Environment

Requires `.env` with:
```
VITE_STRAPI_API_URL=...   # e.g. http://localhost:1337
```

## Architecture

Wedding RSVP web app for Brenda & Arturo (Oct 31, 2026). React + TypeScript + Vite, Tailwind CSS, **Strapi v5** backend.

**Routing** — manual, no router library. `App.tsx` reads `window.location.pathname` and renders one of three pages:
- `/` → `HomePage`
- `/invitacion/:codigo` → `InvitationPage`
- `/admin` → `AdminPage`

Navigation via `window.location.href` assignments; `popstate` listener handles back/forward.

## Backend: Strapi v5 (`src/lib/`)

The app migrated from Supabase to Strapi v5. Key differences from v4:
- Responses are **flat** — no `attributes` wrapper. Fields sit directly on the object.
- Relations use **`documentId`** (a stable string) for mutations and lookups, not numeric `id`.

**`src/lib/api.ts`** — axios instance pointed at `VITE_STRAPI_API_URL/api`. Attaches JWT from localStorage on every request. Exports helpers:
- `one(res)` / `many(res)` — unwrap `.data.data` from single/collection responses.
- `ALL` — params object to fetch up to 1000 records (bypasses default page limit).
- `token.get/set/clear` — JWT management in localStorage under key `strapi_jwt`.

**`src/lib/types.ts`** — domain types. All entities extend `StrapiBase` (`id`, `documentId`, `createdAt`, `updatedAt`). `*Input` interfaces are used for create/update payloads (pass `documentId` strings for relation fields).

**`src/lib/services/`** — one file per collection:
- `auth` — `login()` (saves JWT), `getMe()`, `logout()`
- `events` — read-only; event data (schedule, locations, gift registry, media) comes from Strapi
- `guests` — CRUD + `getByCode(uniqueCode)`, `assignTable`, `removeFromTable`
- `companions` — CRUD + `getByGuest(guestDocumentId)`
- `tables` — CRUD + `setCapitan(tableDocumentId, type, personDocumentId)`, `clearCapitan`

Import via barrel: `import { guestService, tableService, ... } from '../lib/services'`.

## Data Flow

`AdminPage` owns all state (`invitados`, `mesas`, `acompanantes`, `event`). On mount it restores session from token, fetches all three collections in parallel, and polls every 5 seconds. Passes data + `onRefresh` callback down to `AdminStats`, `GuestManagement`, and `TableManagement`.

Auth: Strapi users-permissions. Login POSTs to `/api/auth/local`, JWT stored in localStorage. `getMe()` populates the linked `event` relation — each admin user is scoped to one event.

## Admin Panel Features

**GuestManagement** (`/admin` → Invitados tab):
- CRUD for guests (`Guest`) and their companions (`Companion`), expanded inline per row
- `unique_code` auto-generated on create
- CSV export (UTF-8 BOM, columns: Nombre, Tipo, Teléfono, Confirmación, Mesa)
- CSV import with preview modal — Tipo must be `Invitado`/`Acompañante`; groups parsed top-down
- WhatsApp link: `wa.me` with RSVP message pointing to `brendayarturo.com/invitacion/{codigo}`
- Search filters by guest or companion name

**TableManagement** (`/admin` → Mesas tab):
- Drag-and-drop guests onto table cards (checks `confirmed_passes` vs available capacity)
- Only guests with `status === 'yes'` and no assigned table appear in the unassigned panel
- Crown icon (lucide `Crown`) toggles `captain_guest` / `captain_companion` on a table. Setting one clears the other.

## Tailwind Theme

Custom colors defined in `tailwind.config.js`:
- `primary` — #C7623D
- `secondary` — #904029
- `accent` — #874221
- `background` — #C27341
- `text-primary` / `text-secondary` — #333333 / #666666
