# Spec: Implementar WebSocket Real con el Backend

## Problem

El frontend actualmente no tiene ninguna conexión WebSocket activa con el backend.
`useWebSocket.ts` contiene solo un `TODO` y el store `wsStore` nunca recibe eventos reales.
Esto significa que:

- Los asesores no reciben nuevas escalaciones en tiempo real.
- Los mensajes del cliente no aparecen sin recargar la página.
- El chat no se actualiza cuando otra persona toma, devuelve o cierra una conversación.
- Los admins no reciben alertas de comportamiento.

## Goals

- Conectar `useWebSocket.ts` al backend real usando `wss://<host>/api/v1/panel/ws?token=<jwt>`.
- Implementar todos los handlers de eventos servidor → cliente definidos en `panel_api_reference.md`.
- Implementar el protocolo de suscripción a conversación (`subscribe_conversation` / `unsubscribe_conversation`).
- Implementar ping keepalive cada 30 segundos.
- Reconexión con backoff exponencial para cualquier cierre que no sea código 4001.
- Código 4001 → no reconectar → disparar session-expired → redirigir al login.

## Non-Goals
    
- No crear un nuevo componente de UI para el estado de conexión (ya existe el banner "Reconectar Canal").
- No cambiar la arquitectura de singletons del módulo (`socket`, `isConnecting`, `reconnectTimeout`).
- No implementar visualización de asesores conectados más allá del `wsStore` (el sidebar usa datos estáticos — eso es UI separada).

## Expected Behavior

**Conexión:**
- Al montar `ProtectedRoute`, `useWebSocket()` conecta al WS con el JWT del `authStore`.
- Si el token cambia (renovación de axios interceptor), el socket se reconecta con el nuevo token.

**Eventos recibidos:**
| Evento | Comportamiento |
|--------|----------------|
| `advisor.connected` | `wsStore.addConnectedAdvisor(data)` |
| `advisor.disconnected` | `wsStore.removeConnectedAdvisor(data.advisor_id)` |
| `advisor.status_changed` | `wsStore.updateAdvisorStatus(data)` |
| `message.new` | Si `conversation_id` === conversación abierta → append al feed. Siempre: actualizar `last_activity` en bandeja |
| `escalation.new` | Recargar bandeja; si lleva `advisor_id` → el escalation toast de `ProtectedRoute` lo maneja |
| `escalation.assigned` | Recargar bandeja; si es la conv abierta → reload |
| `conversation.returned` | Si es la conv abierta → reload para cambiar variante a `bot` |
| `conversation.closed` | Si es la conv abierta → navegar a `/`; siempre recargar bandeja |
| `behavior.alert` | Solo admins: `wsStore.incrementAlerts()` |
| `queue.pending` | Toast informativo + recargar bandeja (solo asesores, nunca admins — el servidor ya filtra) |

**Suscripción a conversación:**
- `ChatPage` llama `subscribeConversation(id)` al montar.
- `ChatPage` llama `unsubscribeConversation()` al desmontar.

**Ping:**
- Cada 30s el hook envía `{ type: "ping" }`.
- El `{ type: "pong" }` del servidor se ignora silenciosamente.

**Backoff:** `1s → 2s → 4s → 8s → 30s` (máximo).

## Constraints

- El JWT va como query param (`?token=`), nunca como header — restricción del protocolo WS.
- Leer el JWT desde `useAuthStore` (selector fino), nunca de `localStorage` directamente.
- Respetar las reglas de hooks del CLAUDE.md: sin store completo como dep, `getState()` dentro de callbacks.
- Mantener el patrón singleton de módulo (`socket`, `isConnecting`, `reconnectTimeout` como variables de módulo).
- `npx tsc --noEmit` debe pasar sin errores.
- Tipos WS en `src/types/index.ts`; no definir inline en el hook.

## Priority

Alta — es la funcionalidad de tiempo real del panel. Sin esto, los asesores usan la app como un panel de refresco manual.
