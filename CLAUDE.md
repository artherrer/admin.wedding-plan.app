# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server (Vite, port 5173)
npm run build      # TypeScript compile + Vite bundle → dist/
npm run preview    # Serve dist/ locally
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit (sin emitir archivos)
```

No hay suite de tests.

## Env vars requeridas

```
VITE_STRAPI_API_URL=http://localhost:1337   # Base URL del backend Strapi
VITE_EVENT_ID=<documentId>                  # documentId del evento principal (opcional)
VITE_SITE_URL=http://localhost:5173        # URL pública del sitio del evento
```

## Arquitectura

SPA de React 18 + Vite + Tailwind. Panel de administración para bodas, conectado a un backend **Strapi v5**.

### Capa de datos (`src/lib/`)

- **`api.ts`** — instancia axios con interceptor de JWT (`strapi_jwt` en localStorage). Helpers `one<T>()` y `many<T>()` extraen `res.data.data`. Constante `ALL` fija `pageSize: 1000` para evitar paginación.
- **`types.ts`** — todos los tipos de dominio. En Strapi v5 las respuestas son **planas** (sin wrapper `attributes`). Las relaciones usan `documentId` (string estable) para mutaciones, no `id` (número).
- **`services/`** — un módulo por entidad (`auth`, `events`, `guests`, `companions`, `tables`). Cada servicio filtra por `eventDocumentId` para aislar los datos del evento activo.

### Entidades del dominio

```
Event  ─── 1:N ──→  Guest  ─── 1:N ──→  Companion
  └── 1:N ──→  Table  ←── captain_guest / captain_companion
```

- `Guest.status`: `"pending" | "yes" | "no"`
- `Guest.confirmed_passes`: pases confirmados del invitado (sin contar acompañantes)
- Las mesas tienen un capitán opcional (`captain_guest` XOR `captain_companion`)

### Componentes (`src/components/`)

- **`AdminPage.tsx`** — componente raíz. Maneja autenticación, selección de evento (si el usuario admin tiene >1 evento), y carga paralela de `guests + tables + companions`. Pasa datos a los tres tabs.
- **`admin/AdminStats.tsx`** — tab de estadísticas (solo lectura, recibe props).
- **`admin/GuestManagement.tsx`** — CRUD de invitados y acompañantes, asignación de mesa, link de WhatsApp.
- **`admin/TableManagement.tsx`** — CRUD de mesas, asignación de capitán.

### Flujo de autenticación

1. Al montar, verifica `localStorage` para token existente y llama `eventService.getAll()`.
2. Si el usuario tiene >1 evento, muestra pantalla de selección; si tiene 1, lo carga directamente.
3. `VITE_EVENT_ID` opcional: si está definido, verifica `event.is_manageable` antes de mostrar login (para bloquear acceso público al panel).
4. JWT stateless; logout = `localStorage.removeItem('strapi_jwt')`.

### Convenciones clave

- Siempre usar `documentId` (string) para referencias entre entidades, nunca `id` (número).
- Todo filtro de colección pasa `eventDocumentId` para aislar datos por evento.
- `tableService.setCapitan()` pone a null el campo opuesto (`captain_guest` XOR `captain_companion`).
