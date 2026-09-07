# Configuración

## Variables de entorno

Copiar `.env.example` a `.env` y completar los valores. Nunca commitear `.env` con valores reales.

| Variable | Descripción | Ejemplo | Requerida |
|---|---|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | `https://xxxx.supabase.co` | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Anon key pública de Supabase | `eyJ...` | ✅ |
| `VITE_API_URL` | URL base del backend FastAPI | `http://localhost:8000` | ✅ |
| `VITE_WS_BASE_URL` | URL base del WebSocket | `ws://localhost:8000` | ✅ |

> **Nota:** Todas las variables deben tener el prefijo `VITE_` para ser accesibles en el código via `import.meta.env`.

---

## Por ambiente

### Desarrollo local

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

### Staging / Preview (Vercel)

Configurar en Vercel → Settings → Environment Variables → marcar **Preview**.

```
VITE_API_URL=https://tu-api-staging.railway.app
VITE_WS_BASE_URL=wss://tu-api-staging.railway.app
```

### Producción (Vercel)

Configurar en Vercel → Settings → Environment Variables → marcar **Production**.

```
VITE_API_URL=https://casas-y-espacios-agent.railway.app
VITE_WS_BASE_URL=wss://casas-y-espacios-agent.railway.app
```

---

## Supabase

El proyecto usa Supabase **solo para autenticación**. Nunca se hacen queries de datos directamente a Supabase desde el frontend; todo va por el backend FastAPI.

Configuración del cliente (`src/lib/supabase.ts`):

| Opción | Valor | Efecto |
|---|---|---|
| `persistSession` | `true` | La sesión sobrevive al recargar la página (localStorage) |
| `autoRefreshToken` | `true` | Renueva el JWT automáticamente antes de que expire |
| `detectSessionInUrl` | `false` | No busca tokens en la URL (no se usa OAuth redirect flow) |

---

## Axios

Configuración del cliente HTTP (`src/lib/axios.ts`):

| Opción | Valor |
|---|---|
| `baseURL` | `VITE_API_URL` |
| `timeout` | 30 segundos |
| `Content-Type` | `application/json` |

**Interceptores activos:**

1. **Request** — Obtiene la sesión de Supabase e inyecta `Authorization: Bearer <token>` en cada request
2. **Response** — Ante un 401 o 403 del refresh llama a `endSession()`, que limpia las credenciales y guarda un `sessionNotice`. `ProtectedRoute` redirige a `/login` en cuanto `token` es `null` y `LoginPage` muestra el aviso. Un 5xx (incluido el 503 documentado del refresh) NO cierra la sesión: el refresh no pudo completarse, pero el refresh token sigue siendo válido

---

## Deployment

### Vercel (producción)

El proyecto está configurado para Vercel en `vercel.json`:

```json
{
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

El rewrite es necesario porque React Router maneja el routing en el cliente. Sin él, un refresh en `/chat/123` devolvería 404.

**Flujo automático:**

```
push main  →  Vercel build (npm run build)  →  deploy Production
push dev   →  Vercel build  →  deploy Preview URL
```

### Variables en Vercel

1. Ir a Vercel → tu proyecto → **Settings → Environment Variables**
2. Agregar cada variable marcando el ambiente correspondiente (Production / Preview / Development)
3. El próximo deploy las tomará automáticamente

---

## Tailwind CSS v4

Los tokens de color se definen en `src/index.css` con `@theme` (no en un archivo de configuración separado, que es el enfoque de Tailwind v3).

```css
@theme {
  --color-bg-main: #1D1D1B;
  --color-brand-blue: #01A4E3;
  /* ... */
}
```

Esto genera automáticamente las clases `bg-bg-main`, `text-brand-blue`, etc.
