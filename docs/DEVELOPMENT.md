# Guía de desarrollo

## Setup del entorno local

### 1. Requisitos

- Node.js `>=20.19.0` — recomendado usar `nvm use` con el `.nvmrc` del proyecto
- Acceso a Supabase: URL + anon key del proyecto
- Backend FastAPI corriendo en `http://localhost:8000`

### 2. Instalación

```bash
git clone <repo>
cd casas-y-espacios-agent-frontend
npm install
cp .env.example .env
# Completar .env con los valores reales
npm run dev
```

La app queda disponible en `http://localhost:5173`.

---

## Estructura de carpetas relevante para nuevas features

```
src/
├── types/index.ts       ← agregar tipos nuevos aquí
├── services/            ← agregar nuevos servicios aquí
├── hooks/               ← agregar hooks de negocio aquí
├── components/
│   ├── bandeja/         ← componentes de BandejaPage
│   ├── chat/            ← componentes de ChatPage
│   ├── gestion/         ← componentes de GestionPage
│   └── perfil/          ← componentes de PerfilPage
└── pages/               ← una página por ruta
```

---

## Cómo agregar un nuevo endpoint

**1. Agregar el tipo de respuesta en `src/types/index.ts`** (si no existe):

```typescript
export interface MiNuevoRecurso {
  id: string
  nombre: string
  // ...
}
```

**2. Agregar el método al service correspondiente** (o crear uno nuevo):

```typescript
// src/services/miServicio.ts
import apiClient from '../lib/axios'
import type { MiNuevoRecurso } from '../types'

export const miServicio = {
  async obtener(id: string): Promise<{ recurso: MiNuevoRecurso }> {
    const { data } = await apiClient.get(`/api/v1/panel/mi-recurso/${id}`)
    return data.data
  },
}
```

**3. Exportarlo desde `src/services/index.ts`**:

```typescript
export { miServicio } from './miServicio'
```

**4. Consumirlo desde un hook, no directamente desde el componente**:

```typescript
// src/hooks/useMiRecurso.ts
import { useState, useEffect } from 'react'
import { miServicio } from '../services'
import type { MiNuevoRecurso } from '../types'

export function useMiRecurso(id: string) {
  const [recurso, setRecurso] = useState<MiNuevoRecurso | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    miServicio.obtener(id)
      .then(({ recurso }) => setRecurso(recurso))
      .finally(() => setIsLoading(false))
  }, [id])

  return { recurso, isLoading }
}
```

---

## Cómo agregar una nueva página

**1. Crear el archivo de página**:

```typescript
// src/pages/MiPaginaPage.tsx
export default function MiPaginaPage() {
  return (
    <div className="flex-1 p-6">
      <h1 className="text-xl font-bold text-text-primary">Mi Página</h1>
    </div>
  )
}
```

**2. Agregar la ruta en `src/App.tsx`**:

```typescript
import MiPaginaPage from './pages/MiPaginaPage'

// Dentro de <Routes>:
<Route element={<ProtectedRoute />}>
  <Route path="/mi-pagina" element={<MiPaginaPage />} />
</Route>
```

Para páginas de solo admin, usar `<ProtectedRoute requiredRole="admin" />`.

---

## Cómo agregar un componente shadcn/ui

```bash
npx shadcn@latest add <nombre-componente>
# Ejemplo:
npx shadcn@latest add table
npx shadcn@latest add sheet
```

El componente se agrega automáticamente en `src/components/ui/`.

---

## Convenciones del proyecto

### Nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes | PascalCase | `ConversationCard.tsx` |
| Hooks | camelCase con `use` | `useWebSocket.ts` |
| Servicios | camelCase con `Service` | `conversationsService` |
| Tipos | PascalCase | `Conversation`, `Advisor` |
| Variables | camelCase | `isLoading`, `currentAdvisor` |
| Constantes | UPPER_SNAKE | `MAX_RECONNECT_ATTEMPTS` |

### Reglas de código

- **Sin `any`** — TypeScript strict activado; todos los tipos en `src/types/index.ts`
- **Sin llamadas directas a `apiClient`** en componentes — siempre pasar por `src/services/`
- **Sin `supabase.from()`** fuera de `useAuth` — Supabase es solo para Auth
- **Sin `useState` para campos de formulario** — siempre React Hook Form + Zod
- **Sin estilos inline** salvo animaciones dinámicas — solo clases Tailwind

### Estilos

Usar los tokens de color de la paleta definida en `src/index.css`. Ejemplo de glassmorphism:

```tsx
<div className="bg-bg-secondary/80 backdrop-blur-lg border border-border-default rounded-xl">
```

---

## Tareas pendientes de implementación

| Tarea | Página/Componente | Estado |
|---|---|---|
| FE-2 | `Sidebar.tsx`, `ProtectedRoute.tsx` | Placeholder |
| FE-3 | `LoginPage.tsx`, `FirstLoginPage.tsx` | Placeholder |
| FE-4 | `BandejaPage.tsx`, `components/bandeja/` | Placeholder |
| FE-5 | `ChatPage.tsx`, `components/chat/` | Placeholder |
| FE-6 | `HistorialPage.tsx` | Placeholder |
| FE-7 | `GestionPage.tsx`, `components/gestion/` | Placeholder |
| FE-8 | `PerfilPage.tsx`, `components/perfil/` | Placeholder |
| FE-9 | `components/chat/AudioRecorder.tsx` | Por crear |
| FE-10 | `hooks/useWebSocket.ts`, `store/wsStore.ts` | Por crear |
| FE-11 | `store/authStore.ts` (`endSession`) + aviso en `LoginPage.tsx` | Implementado |

---

## Proceso de deploy

El deploy es automático vía Vercel:

- Push a `main` → deploy a **Production**
- Push a cualquier otra rama → deploy de **Preview**

Para que el build pase, el proyecto debe compilar sin errores TypeScript:

```bash
npx tsc --noEmit   # verificar antes de hacer push
npm run build      # build completo
```

Las variables de entorno de producción se configuran en el dashboard de Vercel → Settings → Environment Variables.
