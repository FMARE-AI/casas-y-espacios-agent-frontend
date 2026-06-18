# Arquitectura

## Visión general

El panel es una **SPA (Single Page Application)** que se comunica con dos sistemas externos: Supabase (solo para autenticación) y el backend FastAPI (todos los datos del dominio, vía HTTP y WebSocket).

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER (SPA)                       │
│                                                         │
│  ┌─────────┐    ┌──────────┐    ┌────────────────────┐ │
│  │  Pages  │───▶│  Hooks   │───▶│     Services       │ │
│  └─────────┘    └──────────┘    └────────┬───────────┘ │
│       │              │                   │             │ │
│       │         ┌────▼─────┐             │             │ │
│       │         │  Stores  │             │             │ │
│       │         │ (Zustand)│             │             │ │
│       │         └──────────┘             │             │ │
│       │                                  │             │ │
│  ┌────▼─────────────────────────────┐    │             │ │
│  │         Components               │    │             │ │
│  │  layout/ │ shared/ │ ui/ │ feat/ │    │             │ │
│  └──────────────────────────────────┘    │             │ │
└──────────────────────────────────────────┼─────────────┘
                                           │
                    ┌──────────────────────▼─────────────┐
                    │           EXTERNOS                   │
                    │                                     │
                    │  ┌─────────────┐  ┌─────────────┐  │
                    │  │  Supabase   │  │  FastAPI    │  │
                    │  │  (Auth)     │  │  (Datos)    │  │
                    │  └─────────────┘  └──────┬──────┘  │
                    │                          │          │
                    │                   ┌──────▼──────┐  │
                    │                   │  WebSocket  │  │
                    │                   └─────────────┘  │
                    └─────────────────────────────────────┘
```

---

## Capas

### Pages (`src/pages/`)

Cada archivo corresponde a una ruta de React Router. Las páginas no contienen lógica de negocio; solo componen componentes y consumen hooks.

### Hooks (`src/hooks/`)

Encapsulan la lógica de negocio y coordinan llamadas a servicios, actualizaciones al store y efectos secundarios. Los componentes solo llaman hooks — nunca llaman servicios directamente.

- **`useAuth`** — Sincroniza Supabase Auth con el `authStore`. Es el único lugar donde se instancia el listener `onAuthStateChange`.
- **`useWebSocket`** *(pendiente FE-10)* — Gestiona la conexión WebSocket, reconexión automática y despacha eventos al store.

### Services (`src/services/`)

Capa delgada sobre Axios. Cada método mapea 1:1 con un endpoint del backend. No contienen lógica — solo construyen la llamada HTTP y extraen `response.data.data` del envelope.

Todos los servicios se exportan desde `src/services/index.ts` como punto de entrada único.

### Stores (`src/store/`)

Estado global con Zustand. Solo dos stores:

- **`authStore`** — Sesión de Supabase, datos del asesor autenticado y flags de UI (`isLoading`, `isFirstLogin`, `sessionExpired`).
- **`wsStore`** — Estado de la conexión WebSocket y contador de alertas no leídas.

**Regla importante:** Los datos del servidor (listas de conversaciones, mensajes, etc.) no van al store. Van al estado local del componente o a una solución de server-state como React Query. El store es solo para estado global de infraestructura.

### Components (`src/components/`)

```
components/
├── layout/          # Componentes estructurales (Sidebar, ProtectedRoute)
├── shared/          # Componentes reutilizables entre features
├── ui/              # Primitivas de shadcn/ui (Button, Input, Card, etc.)
├── bandeja/         # Componentes específicos de BandejaPage
├── chat/            # Componentes específicos de ChatPage
├── gestion/         # Componentes específicos de GestionPage
└── perfil/          # Componentes específicos de PerfilPage
```

### Lib (`src/lib/`)

Singletons y utilidades de infraestructura:

- **`supabase.ts`** — Instancia única de `createClient`. Es el único lugar donde se crea el cliente.
- **`axios.ts`** — Instancia de Axios con interceptores. El interceptor de request inyecta el JWT de Supabase automáticamente. El interceptor de response dispara el evento `session-expired` ante un 401.
- **`utils.ts`** — Función `cn()` para merge de clases Tailwind.

---

## Flujo de autenticación

```
App arranca
    │
    ▼
useAuth (useEffect)
    │
    ├─ supabase.auth.getSession()
    │       ├─ Sin sesión → setLoading(false)
    │       └─ Con sesión → loadAdvisor()
    │
    └─ onAuthStateChange listener
            ├─ SIGNED_IN → loadAdvisor()
            ├─ SIGNED_OUT → reset() + setLoading(false)
            └─ TOKEN_REFRESHED → setSession()

loadAdvisor()
    │
    ├─ advisorsService.getMe() → setAdvisor()
    │       └─ full_name vacío → setFirstLogin(true)
    └─ error → supabase.auth.signOut()
```

```
Request HTTP
    │
    ▼
axios interceptor (request)
    │
    └─ supabase.auth.getSession()
           └─ Agrega Authorization: Bearer <token>
                    │
                    ▼
              Backend FastAPI
                    │
                    ▼
axios interceptor (response)
    ├─ 200 → pasa la respuesta
    └─ 401 → dispatchEvent('session-expired')
                    │
                    ▼
            useAuth listener
                    │
                    └─ setSessionExpired(true)
                               │
                               ▼
                    SessionExpiredModal visible
```

---

## Flujo de routing y guards

```
URL solicitada
    │
    ▼
App.tsx (isLoading?)
    ├─ true  → Spinner
    └─ false → BrowserRouter

        │
        ├─ /login, /first-login → Público (sin guard)
        │
        └─ Resto → ProtectedRoute
                │
                ├─ Sin sesión → Navigate /login
                ├─ isFirstLogin → Navigate /first-login
                ├─ requiredRole y rol insuficiente → Navigate /
                └─ OK → Layout (Sidebar + Outlet)
```

---

## Envelope del backend

Todos los endpoints del backend devuelven:

```json
{
  "data": { "...": "..." }
}
```

Los servicios en `src/services/` acceden siempre como `response.data.data`, de modo que los hooks y componentes reciben directamente el objeto del dominio.

---

## Paleta de colores

Los tokens están definidos en `src/index.css` usando `@theme` (Tailwind v4). Se usan como clases de Tailwind normales.

| Token Tailwind         | Hex       | Uso                          |
|------------------------|-----------|------------------------------|
| `bg-bg-main`           | `#1D1D1B` | Fondo principal              |
| `bg-bg-secondary`      | `#252522` | Cards, sidebar               |
| `bg-bg-tertiary`       | `#2E2E2B` | Inputs, botones secundarios  |
| `bg-brand-blue`        | `#01A4E3` | Botones primarios, focus     |
| `border-border-default`| `#3A3A37` | Todos los bordes             |
| `text-text-primary`    | `#F0F0F5` | Texto principal              |
| `text-text-secondary`  | `#8B8FA8` | Texto secundario             |
| `bg-error`             | `#FF5B5B` | Error, escalada              |
| `bg-success`           | `#00D4AA` | Éxito, activa                |
| `bg-warning`           | `#FFB84D` | Advertencia, en atención     |

---

## Componentes shadcn/ui disponibles

Instalados en `src/components/ui/`:

`Badge` · `Button` · `Card` · `Dialog` · `DropdownMenu` · `Input` · `Label` · `Select` · `Sonner` · `Tooltip`
