# Design: Conversation Actions Integration

## Overview

Se implementan los tres métodos stub de `conversationsService` (`assign`, `returnToBot`, `close`) con las llamadas HTTP reales a la API del panel. El error handling se centraliza en helpers internos de `ChatPage` para evitar duplicación entre los tres handlers existentes. No hay cambios en la UI — la capa de presentación (`ClientPanel`, modales, spinners) ya está completa.

## Components

### New / Modified Files

| File | Role | Change type |
|------|------|-------------|
| `src/services/conversations.ts` | Implementar los tres stubs HTTP | Modify |
| `src/pages/ChatPage.tsx` | Centralizar error handling, corregir y extender handlers | Modify |

### Key Abstractions

#### `conversationsService.assign(id: string)`
- **Input:** `conversation_id` (UUID)
- **Output:** `Promise<{ escalation: { id: string; advisor_id: string; advisor_name: string } }>`
- **HTTP:** `PATCH /api/v1/panel/conversations/{id}/assign` — sin body
- Lanza error de Axios con `response.data.detail.code` para que el caller lo maneje

#### `conversationsService.returnToBot(id: string)`
- **Input:** `conversation_id` (UUID)
- **Output:** `Promise<{ conversation: Conversation }>`
- **HTTP:** `PATCH /api/v1/panel/conversations/{id}/return-bot` — sin body

#### `conversationsService.close(id: string, data?: CloseConversationData)`
- **Input:** `conversation_id`, body opcional `{ resolution_type?, resolution_notes?, client_satisfied? }`
- **Output:** `Promise<{ conversation: Conversation }>`
- **HTTP:** `PATCH /api/v1/panel/conversations/{id}/close` — body siempre enviado (defaults desde el modal)

#### Helpers internos en `ChatPage` (no exportados)

```typescript
function extractErrorCode(err: unknown): string | undefined
function extractErrorMessage(err: unknown): string | undefined
```

Estos helpers centralizan la extracción de `err.response?.data?.detail?.code` y `…message`, evitando el cast repetido en cada handler.

### Data Flow

**Tomar conversación (`handleTake`):**
1. Usuario hace clic en "Tomar Conversación" en `ClientPanel`
2. `ChatPage.handleTake()` setea `isAssigning = true`
3. Llama `conversationsService.assign(conversationId)`
4. Axios envía `PATCH /api/v1/panel/conversations/{id}/assign`
5a. **Éxito 200** → `loadConversation()` recarga datos → variant pasa a `'assigned'`
5b. **409 `ALREADY_ASSIGNED`** → `loadConversation()` (ver nuevo estado) — sin toast
5c. **409 `MAX_CONVERSATIONS_REACHED`** → `toast.error(extractErrorMessage(err))` (mensaje del backend con conteos)
5d. **409 `CONVERSATION_NOT_ESCALATED`** → `toast.error("La conversación no está en estado escalado.")`
5e. **Error global** → `toast.error(globalMessage(code))`
6. `finally`: `isAssigning = false`

**Devolver al bot (`handleReturnBot`):**
1. Usuario confirma en `ReturnBotModal`
2. `ChatPage.handleReturnBot()` setea `isReturning = true`
3. Llama `conversationsService.returnToBot(conversationId)`
4. Axios envía `PATCH /api/v1/panel/conversations/{id}/return-bot`
5a. **Éxito 200** → `setShowReturnModal(false)` → `loadConversation()` → variant pasa a `'bot'`
5b. **403 `BOT_ALREADY_ACTIVE`** → `setShowReturnModal(false)` → `toast.info("El bot ya controla esta conversación.")` → `loadConversation()`
5c. **Error global** → `setShowReturnModal(false)` → `toast.error(globalMessage(code))`
6. `finally`: `isReturning = false`

**Cerrar conversación (`handleClose`):**
1. Usuario selecciona clasificación y confirma en `CloseConversationModal`
2. `ChatPage.handleClose(data)` setea `isClosing = true`
3. Llama `conversationsService.close(conversationId, data)`
4. Axios envía `PATCH /api/v1/panel/conversations/{id}/close` con body `{ resolution_type, resolution_notes, client_satisfied }`
5a. **Éxito 200** → `setShowCloseModal(false)` → `navigate('/')`
5b. **409 `ALREADY_CLOSED`** → `toast.error("Esta conversación ya fue cerrada.")` — modal permanece abierto
5c. **Error global** → `toast.error(globalMessage(code))` — modal permanece abierto
6. `finally`: `isClosing = false`

### API / Interface Contracts

**assign — respuesta exitosa:**
```typescript
{ escalation: { id: string; advisor_id: string; advisor_name: string } }
```

**returnToBot — respuesta exitosa:**
```typescript
{ conversation: { id: string; bot_activo: true; status: 'activa' } }
```

**close — respuesta exitosa:**
```typescript
{
  conversation: {
    id: string
    status: 'cerrada'
    resolution_type: string
    resolution_notes: string | null
    client_satisfied: string
    closed_by: 'asesor'
    closed_at: string
  }
}
```

**Tipos actualizados en `conversations.ts`:**
```typescript
type AssignResponse = { escalation: { id: string; advisor_id: string; advisor_name: string } }
type ReturnToBotResponse = { conversation: Conversation }
type CloseResponse = { conversation: Conversation }
```

### Edge Cases & Error Handling

| Situación | Comportamiento |
|---|---|
| `ALREADY_ASSIGNED` en assign | Recargar sin toast — la conversación muestra el asesor que la tomó primero |
| `MAX_CONVERSATIONS_REACHED` | Mostrar el `detail.message` exacto del backend (incluye "X de Y") |
| `BOT_ALREADY_ACTIVE` en returnToBot | Cerrar modal + toast + recargar |
| `ALREADY_CLOSED` en close | No navegar, no cerrar modal, toast de error |
| Error 401 / 403 `ADVISOR_INACTIVE` | Manejado por el interceptor de axios en `src/lib/axios.ts` — no requiere manejo explícito en los handlers |
| Error de red (sin `response`) | Cae al else del catch → toast genérico "No se pudo [acción]" |

### Errores globales — tabla de mensajes

```typescript
function getGlobalErrorMessage(code: string | undefined, action: string): string {
  switch (code) {
    case 'BOT_IS_ACTIVE':        return 'El bot tiene el control de esta conversación.'
    case 'NOT_ASSIGNED':         return 'No estás asignado a esta conversación.'
    case 'CONVERSATION_NOT_FOUND': return 'Conversación no encontrada.'
    case 'ALREADY_CLOSED':       return 'Esta conversación ya fue cerrada.'
    default:                     return `No se pudo ${action}`
  }
}
```

## Open Questions for Implementation

Ninguna.
