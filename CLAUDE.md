# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # tsc -b && vite build
npm run lint       # ESLint
npm run preview    # Preview production build locally
```

Node.js `>=20.19.0` is required (see `.nvmrc`).

## Environment Variables

Copy `.env.example` to `.env`. Required variables:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=          # http://localhost:8000 locally
VITE_WS_BASE_URL=      # ws://localhost:8000 locally
```

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (tokens definidos en `src/index.css` via `@theme`)
- Zustand — estado global
- Axios — HTTP
- Supabase JS — solo Auth, nunca para queries de datos
- React Router v7
- React Hook Form + Zod — formularios
- date-fns — fechas
- shadcn/ui — componentes base (`src/components/ui/`)

## Paleta de colores — OBLIGATORIA

No usar colores fuera de estos tokens. En Tailwind v4 se usan como `bg-bg-main`, `text-text-primary`, etc.

| Token             | Valor     | Uso                          |
|-------------------|-----------|------------------------------|
| `bg-bg-main`      | `#1D1D1B` | Fondo principal              |
| `bg-bg-secondary` | `#252522` | Cards, sidebar               |
| `bg-bg-tertiary`  | `#2E2E2B` | Inputs, botones secundarios  |
| `bg-brand-blue`   | `#01A4E3` | Botones primarios, focus     |
| `border-border-default` | `#3A3A37` | Todos los bordes        |
| `text-text-primary` | `#F0F0F5` | Texto principal            |
| `text-text-secondary` | `#8B8FA8` | Texto secundario         |
| `bg-error`        | `#FF5B5B` | Error, escalada              |
| `bg-success`      | `#00D4AA` | Éxito, activa                |
| `bg-warning`      | `#FFB84D` | Advertencia, en atención     |

## Estructura del proyecto

```
src/
├── types/index.ts              ← TODOS los tipos TypeScript
├── lib/
│   ├── supabase.ts             ← cliente Supabase (singleton)
│   └── axios.ts                ← cliente Axios con interceptores
├── services/                   ← llamadas al backend
│   ├── conversations.ts
│   ├── advisors.ts
│   ├── alerts.ts
│   ├── schedules.ts
│   └── index.ts
├── store/
│   ├── authStore.ts            ← sesión y advisor autenticado
│   └── wsStore.ts              ← estado del WebSocket
├── hooks/
│   ├── useAuth.ts              ← autenticación
│   └── useWebSocket.ts         ← WebSocket (FE-10)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── bandeja/
│   ├── chat/
│   ├── gestion/
│   ├── perfil/
│   ├── shared/
│   └── ui/                     ← shadcn/ui primitives
└── pages/
    ├── LoginPage.tsx
    ├── FirstLoginPage.tsx
    ├── BandejaPage.tsx
    ├── ChatPage.tsx
    ├── HistorialPage.tsx
    ├── GestionPage.tsx
    └── PerfilPage.tsx
```

## Rutas

| Ruta          | Página            | Acceso          |
|---------------|-------------------|-----------------|
| `/login`      | LoginPage         | Público         |
| `/first-login`| FirstLoginPage    | Público         |
| `/`           | BandejaPage       | Asesor, Admin   |
| `/chat/:id`   | ChatPage          | Asesor, Admin   |
| `/historial`  | HistorialPage     | Asesor, Admin   |
| `/perfil`     | PerfilPage        | Asesor, Admin   |
| `/gestion`    | GestionPage       | Solo Admin      |

## Reglas que nunca se rompen

**Tipos**
- Todos los tipos en `src/types/index.ts`
- Nunca `any`, nunca tipos inline en componentes

**Llamadas al backend**
- Siempre a través de `src/services/`
- Nunca `apiClient` directamente en componentes
- Nunca `fetch` — solo Axios via `apiClient`

**Estado global**
- Auth → `useAuthStore`
- WebSocket → `useWSStore`
- Listas del servidor (conversaciones, mensajes) → estado local del componente, nunca en Zustand

**Supabase**
- Solo para Auth — nunca `supabase.from(...)` en componentes
- Todos los datos del dominio vienen del backend FastAPI

**Formularios**
- Siempre React Hook Form + Zod, nunca `useState` para campos

**Estilos**
- Solo clases Tailwind con los tokens de la paleta
- Glassmorphism: `bg-[#252522]/80 backdrop-blur-lg`
- Nunca estilos inline salvo animaciones dinámicas

## Response envelope del backend

Todos los endpoints devuelven `{"data": {...}}`.
Los servicios en `src/services/` ya hacen `return data.data`.

## Eventos WebSocket

| Evento                   | Acción en UI                            |
|--------------------------|-----------------------------------------|
| `escalation.new`         | Nueva card en bandeja + toast           |
| `escalation.assigned`    | Actualiza card en bandeja               |
| `message.new`            | Agrega mensaje al feed del chat         |
| `conversation.returned`  | Actualiza estado del chat               |
| `advisor.connected`      | Actualiza indicador en bandeja          |
| `advisor.disconnected`   | Actualiza indicador en bandeja          |
| `behavior.alert`         | Badge admin + lista alertas             |
| `advisor.status_changed` | Indicador disponibilidad sidebar        |

## Tareas y archivos principales

| Tarea  | Archivos principales                          |
|--------|-----------------------------------------------|
| FE-2   | Sidebar.tsx, ProtectedRoute.tsx               |
| FE-3   | LoginPage.tsx, FirstLoginPage.tsx             |
| FE-4   | BandejaPage.tsx, components/bandeja/          |
| FE-5   | ChatPage.tsx, components/chat/                |
| FE-6   | HistorialPage.tsx                             |
| FE-7   | GestionPage.tsx, components/gestion/          |
| FE-8   | PerfilPage.tsx, components/perfil/            |
| FE-9   | components/chat/AudioRecorder.tsx             |
| FE-10  | hooks/useWebSocket.ts, store/wsStore.ts       |
| FE-11  | components/shared/SessionExpiredModal.tsx     |

## Deployment

Vercel (auto-detected as Vite). Build command: `npm run build`, output directory: `dist`. El `vercel.json` rewrite (`"/(.*)" → "/index.html"`) maneja el routing SPA de React Router.
