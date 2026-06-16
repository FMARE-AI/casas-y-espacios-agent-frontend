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
VITE_API_BASE_URL=      # http://localhost:8000 locally
VITE_WS_BASE_URL=       # ws://localhost:8000 locally
```

All variables use the `VITE_` prefix and are accessed via `import.meta.env`.

## Architecture

**Stack**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase + Zustand

This is the frontend for "Casas y Espacios" — an AI-driven real estate automation platform. The backend API runs on Railway at `https://casas-y-espacios-agent.railway.app`.

### Key directories

- `src/components/ui/` — shadcn/ui components (Base Nova style, Lucide icons). Add new UI primitives here via the shadcn CLI.
- `src/lib/axios.ts` — Axios instance with Supabase auth interceptors. All API calls should use this instance; 401s redirect to `/login`.
- `src/lib/supabase.ts` — Supabase client (auth + DB).
- `src/constants/routes.ts` — Centralized route paths (`LOGIN`, `FIRST_LOGIN`, `BANDEJA`, `CHAT`, `GESTION`, `PERFIL`).
- `src/constants/roles.ts` — User role constants (`ASESOR`, `GERENTE`, `ADMIN`).

### Path alias

`@/*` maps to `./src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`).

### Authentication flow

Supabase handles auth. The Axios interceptor in `src/lib/axios.ts` automatically attaches the session token to every request. Unauthenticated responses (401) trigger a redirect to `/login`.

### Styling

Tailwind CSS v4 with a custom OKLch color theme defined in `src/index.css`. Use the `cn()` utility from `src/lib/utils.ts` to merge Tailwind classes conditionally.

## Deployment

Vercel (auto-detected as Vite). Build command: `npm run build`, output directory: `dist`. The `vercel.json` rewrite (`"/(.*)" → "/index.html"`) handles SPA routing for React Router. Connect the repo in the Vercel dashboard and it deploys automatically on push.
