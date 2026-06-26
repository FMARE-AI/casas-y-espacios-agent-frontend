# Design: Implementar WebSocket Real

## Overview

Reemplazamos el stub vacío de `useWebSocket.ts` con una conexión WebSocket real al backend,
manteniendo el patrón singleton de módulo ya establecido. El hook es el único punto de entrada
para enviar y recibir mensajes WS en la app. Las páginas (`BandejaPage`, `ChatPage`) reciben
callbacks a través del registro de handlers existente, y exponen nuevas llamadas de
suscripción/cancelación de conversación. Los tipos WS en `types/index.ts` se corrigen para
alinearse exactamente con el contrato de `panel_api_reference.md`.

---

## Components

### New / Modified Files

| File | Role | Change type |
|------|------|-------------|
| `src/types/index.ts` | Corregir tipos WS existentes; agregar tipos faltantes | Modify |
| `src/store/wsStore.ts` | Agregar `connectedAdvisors`, `addConnectedAdvisor`, `removeConnectedAdvisor`, `updateAdvisorStatus` | Modify |
| `src/hooks/useWebSocket.ts` | Implementar conexión real, ping, backoff, subscribe/unsubscribe | Modify |
| `src/pages/BandejaPage.tsx` | Agregar handlers para `queue.pending`, `conversation.closed`, `conversation.returned` | Modify |
| `src/pages/ChatPage.tsx` | Llamar `subscribeConversation` al montar, `unsubscribeConversation` al desmontar; agregar handler `conversation.closed` → navigate, `escalation.assigned` → reload | Modify |

---

## Key Abstractions

### `WSHandlers` (extended)

Agrega dos handlers nuevos al registro existente:

```typescript
interface WSHandlers {
  onEscalationNew?: (data: WSEscalationNew) => void
  onEscalationAssigned?: (data: WSEscalationAssigned) => void
  onMessageNew?: (data: WSMessageNew) => void
  onConversationReturned?: (data: WSConversationReturned) => void
  onConversationClosed?: (data: WSConversationClosed) => void   // NEW
  onQueuePending?: (data: WSQueuePending) => void               // NEW
  onAdvisorStatusChanged?: (data: WSAdvisorStatusChanged) => void
  onBehaviorAlert?: (data: WSBehaviorAlertEvent) => void
}
```

### `useWebSocket(handlers?)` hook

Retorna:

```typescript
{
  reconnect: () => void
  subscribeConversation: (conversationId: string) => void
  unsubscribeConversation: () => void
}
```

`subscribeConversation` envía `{ type: "subscribe_conversation", conversation_id }` si el socket está `OPEN`.
`unsubscribeConversation` envía `{ type: "unsubscribe_conversation" }` si el socket está `OPEN`.

### Variables de módulo (singletons — sin cambios)

```typescript
let socket: WebSocket | null = null
let isConnecting = false
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
let pingInterval: ReturnType<typeof setInterval> | null = null  // NEW
```

---

## Data Flow

### Conexión inicial

1. `ProtectedRoute` monta y llama `useWebSocket()` (sin handlers).
2. El `useEffect` lee `accessToken` del store con selector fino.
3. Si `socket || isConnecting` → retorna (guard de singleton).
4. Construye la URL: `${wsBaseUrl}/api/v1/panel/ws?token=${encodeURIComponent(token)}`.
5. Crea `new WebSocket(url)`, setea `isConnecting = true`.
6. `onopen` → `setStatus('connected')`, arranca ping cada 30s, `isConnecting = false`.
7. `onmessage` → parsea `{ event, data }` → despacha al handler registrado.
8. `onclose` → limpia ping → si `code === 4001` → `setSessionExpired(true)` → no reconectar. Cualquier otro código → `reconnectWithBackoff()`.
9. `onerror` → log (el `onclose` se dispara automáticamente después).

### Backoff exponencial

```
attempts: 0 → 1s, 1 → 2s, 2 → 4s, 3 → 8s, 4+ → 30s
```

El store guarda `reconnectAttempt`. Al reconectar con éxito → reset a 0.

### Ciclo de vida del efecto

```typescript
useEffect(() => {
  if (!accessToken) return
  connect(accessToken)
  return () => {
    // Solo destruir si el componente que inició la conexión desmonta
    // (ProtectedRoute nunca desmonta mientras la sesión está activa)
    clearPing()
    socket?.close()
    socket = null
  }
}, [accessToken])
```

### Suscripción a conversación (ChatPage)

1. `ChatPage` monta, `loadConversation()` se ejecuta.
2. `useEffect` retorna `{ subscribeConversation, unsubscribeConversation }` del hook.
3. Otro `useEffect` con `[conversationId]` deps llama `subscribeConversation(conversationId)`.
4. Al desmontar / cambiar conversación → `unsubscribeConversation()`.

---

## API / Interface Contracts

### Tipos nuevos en `src/types/index.ts`

```typescript
// Corregidos (alineados con panel_api_reference.md)
export interface WSEscalationNew {
  conversation_id: string
  advisor_id: string | null   // null = unassigned queue
  reason: string | null
  channel: string
}

export interface WSBehaviorAlertEvent {  // renombrado de WSBehaviorAlert para evitar colisión
  alert_id: string
}

// Nuevos
export interface WSAdvisorConnected {
  advisor_id: string
  advisor_name: string
  advisor_role: string
  advisor_area: string
}

export interface WSAdvisorDisconnected {
  advisor_id: string
  advisor_name: string
}

export interface WSEscalationAssigned {
  conversation_id: string
  escalation_id: string
  advisor_id: string
  advisor_name: string
}

export interface WSConversationReturned {
  conversation_id: string
  advisor_id: string
  advisor_name: string
}

export interface WSConversationClosed {
  conversation_id: string
  closed_by: 'asesor' | 'bot'
  advisor_id?: string           // absent when closed_by === 'bot'
  advisor_name?: string         // absent when closed_by === 'bot'
  resolution_type?: string
  closed_at?: string
  reason?: string               // present when closed_by === 'bot'
}

export interface WSQueuePending {
  count: number
  message: string
}
```

### wsStore nuevas acciones

```typescript
connectedAdvisors: Array<{ advisor_id: string; advisor_name: string; availability_status?: string }>
addConnectedAdvisor: (data: WSAdvisorConnected) => void
removeConnectedAdvisor: (advisor_id: string) => void
updateAdvisorStatus: (data: WSAdvisorStatusChanged) => void
```

---

## Edge Cases & Error Handling

| Caso | Manejo |
|------|--------|
| Token nulo (sesión no iniciada) | `useEffect` retorna sin conectar |
| Token renovado por interceptor axios | El cambio de `accessToken` en el store dispara el efecto → `connect()` cierra el socket anterior y abre uno nuevo |
| `socket.send()` cuando socket está reconectando | Guardar log `warn` y no crashear — best-effort |
| `conversation.closed` con `closed_by === 'bot'` (sin `advisor_id`) | Leer solo `conversation_id` y `closed_by`; nunca acceder `.advisor_id` sin chequeo |
| `escalation.new` sin `advisor_id` (unassigned) | `setPendingEscalation` con `advisorId: null` — el EscalationToast ya maneja eso |
| Ping enviado con socket cerrado | Guard `if (socket?.readyState === WebSocket.OPEN)` |
| `subscribeConversation` antes de que el socket abra | Best-effort: si no está `OPEN`, no enviar. El servidor mantiene estado solo mientras la conexión vive |
| `message.new` llega pero no hay conversación abierta | Solo actualizar `last_activity` en bandeja vía handler; no crashear |

---

## Open Questions for Implementation

Ninguna — el diseño cubre todos los casos de borde identificados.
