# CLAUDE.md — Casas y Espacios Agent (Frontend)

Instrucciones de arquitectura, convenciones y restricciones para el modelo de IA en este repo.
**Léelas antes de tocar cualquier archivo.**

---

## 1. Proyecto

**Casas y Espacios Agent**: automatización IA conversacional (WhatsApp) para agencia inmobiliaria colombiana. Dos líneas: `administrative` (propietarios, Fase 1 activa) y `commercial` (prospectos, Fase 2 pendiente). Bot resuelve 80% de consultas; escala a este **Panel Web Interno** (este repo) cuando corresponde.

Este repositorio contiene **solo el frontend** (React panel). El backend FastAPI vive en repo separado — no está aquí. Referencia de contrato API: `docs/panel_api_reference.md` (fuente de verdad de endpoints/eventos).

## 2. Backend — resumen (repo separado, contexto para integración)

Stack: Python 3.13+, FastAPI, LangGraph, Supabase, Meta WhatsApp Cloud API. Decisiones clave que afectan al frontend:

- **Envelope de respuesta**: éxito `{ "data": {...} }`, error `{ "detail": { "code", "message" } }`. Ver §17.2.
- **`bot_activo`** en `conversations` es la única fuente de verdad del handover — no hay keywords de texto, el handover es exclusivo del Panel Web.
- **Roles**: solo `asesor` y `admin`. Admin puede crear asesores, monitorear todo, ver métricas.
- **Auth JWT** vía `POST /api/v1/panel/auth/token` (nunca Supabase Auth directo). Ver §17.1.
- **`msg_type`** es la fuente de verdad para renderizar mensajes, no la nulabilidad de `content`/`media_url`. Ver §17.3.
- **`media_url`** siempre URL firmada de Supabase Storage (1 año), nunca ID de media de Meta.
- System prompts de LLM en inglés; mensajes al cliente final en español.
- Todo código (variables, funciones, clases, comentarios) en inglés — excepto strings de UI/WhatsApp y archivos `*.md`.

Si necesitás detalle de módulos, schema de BD, variables de entorno o estado de implementación del backend, consultá el repo del backend directamente (no está espejado acá para evitar desincronización).

---

## 12. Frontend — Stack y Estructura

Panel web interno (React), separado del backend FastAPI.

```
React 18 + TypeScript + Vite
Zustand                     (estado global — authStore, wsStore)
React Router v6             (enrutamiento)
Supabase JS v2               (auth)
Tailwind CSS                (estilos)
sonner                      (toasts)
Web Audio API               (sonido de notificaciones — sin assets externos)
MediaRecorder API           (grabación de audio)
```

**Gestor de paquetes:** `npm`. No usar `yarn` ni `pnpm`.

---

## 13. Frontend — Mapa de Módulos

```
src/
  App.tsx                    — Root: AuthInit + gate isLoading + Routes
  main.tsx                   — Entry point

  hooks/
    useAuth.ts               — Login via POST /auth/token; bootstrap desde getStoredSession();
                               navega a /first-login si must_change_password; deps: []
    useWebSocket.ts          — Ciclo de vida WS; backoff exponencial; socket singleton global

  store/
    authStore.ts             — token, refresh_token, expires_at, advisor, role, isLoading,
                               isFirstLogin, sessionExpired; setSession / clearSession /
                               getStoredSession (persiste en localStorage)
    wsStore.ts               — status, reconnectAttempt, pendingEscalation, unreadAlerts;
                               incrementAlerts / decrementAlerts / resetAlerts

  pages/
    BandejaPage.tsx, ChatPage.tsx, LoginPage.tsx, HistorialPage.tsx,
    PerfilPage.tsx, GestionPage.tsx (solo role=admin)

  components/
    layout/      ProtectedRoute.tsx (guard + WS init + toasts), Sidebar.tsx
    chat/        AudioRecorder.tsx, ChatInput.tsx, MessageBubble.tsx
    bandeja/     ConversationCard.tsx, FilterBar.tsx, MetricsDashboard.tsx
    gestion/     BehaviorAlertsPanel.tsx (admin-only)
    shared/      EscalationToast.tsx, SuccessToast.tsx

  services/
    conversations.ts         — llamadas HTTP + fallback mock
    advisors.ts               — getMe, updateMe (PATCH /advisors/me), updateAvailability, list, create, update
    alerts.ts                 — list({ reviewed, limit }), markReviewed(id)
    index.ts                  — re-exporta conversationsService

  lib/
    supabase.ts               — cliente Supabase (singleton)
    rememberedAccounts.ts     — emails usados con éxito en este equipo (solo email, nunca credenciales)
    axios.ts                  — interceptor con renovación proactiva del token (5 min antes de
                                expirar), serializa refreshes paralelos en un único POST /auth/token/refresh

  types/                      — tipos TS compartidos
  constants/routes.ts         — ROUTES object
```

---

## 14. Frontend — Capa de Mocks (mientras el backend no está conectado)

**Login mock**: `asesor@mock.com`/`123` → `mock-token-asesor` (rol `asesor`); `admin@mock.com`/`123` → `mock-token-admin` (rol `admin`). Sesión mock vive solo en Zustand — se pierde al refrescar.

**API mock**: `conversationsService.list()` devuelve conversación demo si falla el backend. Resto de endpoints sin fallback. Para `replyText`/`replyMedia`/`replyAudio`, `id === 'demo'` devuelve mensaje local sin llamar al backend.

**WebSocket mock**: `useWebSocket` conecta a `VITE_WS_BASE_URL` (default `wss://casasyespaciosagent.up.railway.app/...`). Token mock rechazado → backoff exponencial + banner "Reconectar Canal" es comportamiento esperado en dev.

---

## 15. Frontend — Reglas de Hooks y Estado Global

Existen por **dos bugs críticos** ya causados al violarlas. Leer antes de tocar cualquier hook o store.

### Regla 1 — Zustand: nunca uses el store completo como dependencia

`useAuthStore()` sin selector devuelve el objeto entero; cambia de referencia en cada campo modificado → loop infinito en `useCallback`/`useEffect`.

```tsx
// ❌ const store = useAuthStore(); useCallback(() => store.setAdvisor(...), [store])
// ✅ const session = useAuthStore((s) => s.session)          // selector fino, lectura reactiva
//    useAuthStore.getState().setAdvisor(...)                 // imperativo para writes en effects
```

### Regla 2 — Nunca pongas en deps un valor del store que escribís dentro del effect

Si el effect llama `setReconnectAttempt(n + 1)` y `reconnectAttempt` está en deps, se re-ejecuta en cada incremento y anula el backoff.

```tsx
// ❌ useEffect(() => { ws.onclose = () => setReconnectAttempt(reconnectAttempt + 1) }, [reconnectAttempt])
// ✅ useEffect(() => {
//      ws.onclose = () => {
//        const attempt = useWSStore.getState().reconnectAttempt   // lectura imperativa
//        setReconnectAttempt(attempt + 1)
//      }
//    }, [])
```

### Regla 3 — `useAuth.ts` tiene deps vacíos: no los toques

`useEffect(..., [])` es intencional: lee `getStoredSession()` una vez al montar, restaura token/refresh_token/expires_at vía `useAuthStore.setState`, llama `advisorsService.getMe()` una vez. Agregar deps re-invoca la carga del perfil en cada cambio de estado → loops o re-navegación inesperada a `/first-login`. Todas las escrituras dentro del effect usan `useAuthStore.getState()`/`setState()`, nunca el `store` del closure.

### Regla 4 — `useWebSocket` tiene un socket global: no lo dupliques

`socket`, `isConnecting`, `reconnectTimeout` son variables de módulo — un único socket activo en toda la app, con guard `if (socket || isConnecting) return`. No instanciar `new WebSocket(...)` fuera del hook; no montar `useWebSocket` con lógica de conexión en más de un lugar (solo `ProtectedRoute`).

### Regla 5 — Handlers de WS: `useCallback` con deps estables

Pasar una función inline a `useWebSocket({ onEscalationNew: fn })` re-ejecuta el effect de registro en cada render. Usar `useCallback` o definir la función fuera del componente.

---

## 16. Frontend — Lo que NUNCA Debes Hacer

- Store completo como dependencia de hook (`useEffect`/`useCallback` con `[store]`) — usar selector fino o `getState()`.
- Poner en deps un valor del store que se escribe dentro del mismo effect.
- Agregar deps al `useEffect` de `useAuth.ts` — rompe el login mock y produce loops.
- Instanciar `WebSocket` fuera de `useWebSocket()` — duplica el socket global.
- Navegar a rutas hardcodeadas (`navigate('/bandeja')`) — usar `ROUTES` de `constants/routes.ts`.
- Llamadas HTTP directas con `fetch` — siempre `conversationsService` (usa `apiClient` de axios con auth automática).
- Mezclar lógica de presentación con llamadas a la API — el fetch va en el `useEffect` de la página, no en componentes hijo.
- Usar `localStorage` directamente para la sesión — Supabase Auth lo maneja internamente.
- Importar `socket` del módulo `useWebSocket` — es variable privada del módulo.

### 16.1 Checklist obligatorio de fluidez de UI y UX (todo cambio de frontend)

Antes de dar por terminado cualquier cambio de frontend, verificar que no degrada la fluidez de scroll ni la UX de la vista tocada (y de vistas que comparten el componente/clase modificado). Viene de incidentes reales en producción (lag de scroll en Gestión de Asesores, botones fuera de viewport en `AdvisorModal`) — regla de calidad, no estética.

**Nunca hacer** (causas confirmadas de lag/jank en este proyecto):

- `backdrop-blur-*` en un elemento DENTRO de un contenedor con scroll (ej. barra de filtros, wrapper de tabla) — el navegador recomputa el blur en cada frame → jank. Usar fondo sólido/semi-opaco sin blur.
- `scroll-behavior: smooth` (o `scroll-smooth`) en un panel de scroll continuo por rueda del mouse — cada tick de wheel encola una animación sobre la anterior → se siente lageado. `smooth` solo para saltos programáticos puntuales (`scrollIntoView`, anclas).
- `will-change` persistente sin animación real que lo justifique — reserva una capa de GPU todo el tiempo que el elemento existe. Agregarlo solo mientras la animación concreta está en curso.
- Overlay de modal con `backdrop-blur-sm` a pantalla completa por defecto — una de las operaciones de GPU más caras en CSS. Usar scrim sólido/semi-transparente sin blur salvo que el diseño lo exija y ya esté verificado que no introduce lag.

Además:
- Todo modal debe caber en laptops de baja altura (~700-800px): `max-h-[90vh]` con header/footer fijos y **scroll interno** en el cuerpo — nunca dejar que un campo dinámico empuje los botones de acción fuera del viewport.
- Antes de animación infinita (`animate-pulse`, keyframes con `box-shadow`) en elementos que se repiten en listas con scroll, confirmar que las instancias simultáneas están acotadas.
- Cambios a clase/utilidad compartida (`.app-scroll`, tokens en `index.css`): grep **todos** los usos antes de asumir impacto.
- Nunca sacrificar accesibilidad de scroll/responsive/UX a cambio de un efecto visual — si hay que elegir, la UX gana.

---

## 17. Integración Frontend-Backend — Reglas Críticas

Contrato definido en `docs/panel_api_reference.md` (fuente de verdad).

### 17.1 Autenticación

JWT vía `POST /api/v1/panel/auth/token` — nunca Supabase Auth directo. Respuesta: `access_token`, `refresh_token`, `expires_in`. `useAuth.signIn()` llama `setSession(...)`, que persiste los tres valores en `localStorage`. El interceptor de `src/lib/axios.ts` renueva el token automáticamente 5 min antes de expirar vía `POST /auth/token/refresh`, serializando refreshes paralelos. No agregar el header `Authorization` manualmente.

**WebSocket** es la excepción: JWT como query param, no header: `wss://<host>/api/v1/panel/ws?token=<jwt>`. Cierre con código `4001` → JWT inválido/expirado → redirigir al login inmediatamente.

### 17.2 Envelope de respuesta

Éxito: `{ "data": {...} }`. Error: `{ "detail": { "code": "ERROR_CODE", "message": "..." } }`. Acceder siempre a `response.data.X`; manejar errores leyendo `error.detail.code`.

### 17.3 Renderizado de mensajes

`msg_type` es la fuente de verdad, no la nulabilidad de `content`/`media_url`:

| `msg_type` | Renderizado |
| --- | --- |
| `text` | Texto plano con `content` |
| `audio` | `<audio src={media_url} />` — **nunca mostrar `transcription`** |
| `image` | `<img src={media_url} />` |
| `video` | `<video src={media_url} controls />` |
| `document` | `<a href={media_url}>Descargar</a>` |

`transcription` es contexto interno del agente (Whisper), no contenido para el asesor — si se expone, solo como toggle colapsado "Ver transcripción". `media_url` es siempre URL firmada de Supabase Storage (1 año), nunca ID de media de Meta.

### 17.4 Subida de archivos (multipart)

`POST /reply/media` y `/reply/audio`: usar `FormData`, **no** poner `Content-Type` en el header (el browser setea el boundary automáticamente).

```tsx
// ✅ headers: { Authorization: `Bearer ${token}` }   // solo Authorization
// ❌ headers: { 'Content-Type': 'multipart/form-data' }  // rompe el boundary
```

### 17.5 WebSocket — eventos del servidor

Envelope `{ "event": "<tipo>", "data": {...} }`. Eventos relevantes:

| Evento | Acción esperada |
| --- | --- |
| `message.new` | Append al chat si `conversation_id` coincide; actualizar badge en bandeja |
| `escalation.new` | Mostrar `EscalationToast`; recargar lista de conversaciones |
| `escalation.assigned` | Quitar de cola sin asignar |
| `conversation.returned` | Marcar conversación con ícono de bot |
| `conversation.closed` | Quitar de bandeja o actualizar estado |
| `advisor.status_changed` | Actualizar badge de disponibilidad |
| `behavior.alert` | Solo admins: badge + `GET /behavior-alerts/` para detalles |

`conversation.closed`: `advisor_id`/`advisor_name` ausentes si `closed_by === "bot"` — verificar `closed_by` antes de leerlos. `behavior.alert` solo trae `alert_id` (no difunde contenido sensible) — llamar `GET /behavior-alerts/` tras recibirlo.

Cliente envía `{ "type": "ping" }` cada 30s, servidor responde `{ "type": "pong" }`. Al abrir chat: `subscribe_conversation`; al cerrar: `unsubscribe_conversation`.

### 17.6 Casos de borde conocidos

| Situación | Comportamiento |
| --- | --- |
| `PATCH /assign` con dos asesores simultáneos | Segundo recibe `ALREADY_ASSIGNED` (409) → "Otro asesor tomó esta conversación primero." |
| `status_until` en respuestas de asesor | Hora local de Bogotá sin timezone suffix — no asumir UTC |
| Asesor desactivado con conversaciones activas | `PATCH /advisors/{id}` incluye `"warning"` no-nulo — mostrarlo al admin |
| `active_conversations` en perfil | Puede ser `0` si falla el RPC de Supabase — fallback silencioso, no error |
| Cerrar conversación sin body | Defaults: `resolution_type = "otro"`, `client_satisfied = "sin_confirmar"` — válido |

### 17.7 Quitar mocks progresivamente

Orden: Auth (✅) → `PATCH /advisors/me` (✅) → `GET /conversations/` → `GET /conversations/{id}` → Reply (texto/media/audio, remover guard `id === 'demo'`) → WebSocket (URL real) → resto (alerts, schedules, metrics). Endpoint por endpoint, no todos a la vez, para detectar regresiones.
