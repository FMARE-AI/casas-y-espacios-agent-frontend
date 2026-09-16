# Design: Control Manual de Conversación (Activar/Desactivar Bot)

> Reemplaza la versión anterior de este documento — el usuario entregó un contrato técnico
> detallado (ver `02-clarification.md`, sección "Actualización") que cambia la ubicación del
> control (header, no panel lateral), quita el modal de confirmación al tomar control, y
> extiende el acceso de escritura a los admins. `ReturnBotModal` y el flujo "Devolver al Bot"
> **no se tocan** — siguen funcionando exactamente igual que hoy.

## Overview
Se agrega un indicador/acción de control en el **header** de `ChatPage.tsx`: si el bot está activo, un botón "Tomar control manual" (clic directo, sin modal); si no lo está, una etiqueta fija "🔒 Control manual — {nombre del asesor}" visible para cualquiera que abra la conversación. Se consume `PATCH /conversations/{id}/take-control` (ya implementado, probado, mergeado en `dev`). Se reutiliza el `escalations` + variant existente (`assigned`/`bot`/`monitoring`/`unassigned`) para no duplicar lógica de permisos: al tomar control, la conversación pasa a variant `assigned`, que ya habilita `ChatInput` y muestra "Devolver al Bot" (PW-8, sin cambios) — **cero cambios en `ClientPanel.tsx`**.

Cambio de alcance más grande: se elimina el hardcode `if (role === "admin") return "monitoring"` — los admins ahora siguen la misma regla que cualquier asesor (`escalation.advisor.id === self.id` → pueden actuar), MÁS un bypass adicional (cualquier admin puede actuar sobre una conversación en modo manual aunque el dueño sea otro asesor — así lo permite el backend en `/reply`, `/return-bot`, `/close`).

## Components

### New / Modified Files
| File | Role | Change type |
|------|------|-------------|
| `src/types/index.ts` | Nueva interfaz `EscalationAdvisorRef`; angostar `Escalation.advisor`; nueva `WSConversationControlTaken` | Modify |
| `src/services/conversations.ts` | Nuevo método `takeControl(id)` + tipo `TakeControlResponse` | Modify |
| `src/hooks/useWebSocket.ts` | Nuevo case `conversation.control_taken` + handler `onConversationControlTaken` | Modify |
| `src/pages/ChatPage.tsx` | `getChatVariant()` sin hardcode de admin; nuevo bloque de header; `handleTakeControl`; callback WS | Modify |
| `src/components/chat/ClientPanel.tsx` | — | **Sin cambios** |
| `src/components/modals/ReturnBotModal.tsx` | — | **Sin cambios** |

### Key Abstractions

**`types/index.ts`**
```ts
export interface EscalationAdvisorRef {
  id: string;
  full_name: string;
}

export interface Escalation {
  id: string;
  reason: string;
  summary: string | null;
  escalated_at: string;
  advisor: EscalationAdvisorRef | null;   // antes: Advisor | null
  wait_seconds?: number | null;
  transfer_reason?: string | null;
}

export interface WSConversationControlTaken {
  conversation_id: string;
  escalation_id: string;
  advisor_id: string;
  advisor_name: string;
}
```
Verificado por grep en todo `src/`: ningún consumidor de `escalation.advisor` lee un campo distinto de `.id`/`.full_name` — angostar el tipo no rompe nada existente y permite construir el objeto en el cliente sin castear a `Advisor` completo (que el backend nunca envía en este campo).

**`conversationsService.takeControl`** (`services/conversations.ts`)
```ts
type TakeControlResponse = {
  conversation: { id: string; bot_activo: boolean; status: ConversationStatus }
  escalation: { id: string; advisor_id: string; advisor_name: string }
}

async takeControl(id: string): Promise<TakeControlResponse> {
  const { data } = await apiClient.patch(`/api/v1/panel/conversations/${id}/take-control`)
  return data.data
}
```

### Data Flow

1. Asesor/admin abre la conversación. `GET /conversations/{id}` ya trae `bot_activo`/`escalation.advisor` — el header renderiza el estado real sin ninguna acción adicional (requisito: "no hace falta intentar tomar control para descubrirlo").
2. **Tomar control** (`bot_activo === true`, conversación no cerrada): clic en "Tomar control manual" → `handleTakeControl()`:
   - `setIsTakingControl(true)`
   - `const result = await conversationsService.takeControl(conversationId)`
   - Actualiza `conversation` local **directo con la respuesta**, sin refetch:
     ```ts
     setConversation(prev => prev && ({
       ...prev,
       bot_activo: result.conversation.bot_activo,
       status: result.conversation.status,
       escalation: {
         id: result.escalation.id,
         reason: "control_manual_directo",
         summary: null,
         escalated_at: new Date().toISOString(),   // aproximado — el PATCH no lo devuelve
         advisor: { id: result.escalation.advisor_id, full_name: result.escalation.advisor_name },
       },
     }))
     ```
   - `getChatVariant()` recalcula solo: como `escalation.advisor.id === self.id`, cae en `'assigned'` sin lógica nueva — `ChatInput` se habilita y "Devolver al Bot" aparece automáticamente (código ya existente, sin tocar).
   - `finally setIsTakingControl(false)`
3. **Errores** (mismo `extractErrorCode`/`extractErrorMessage` que ya usa `handleReturnBot`):
   - `409 CONTROL_ALREADY_TAKEN` → toast `error` con `extractErrorMessage(err)` (backend ya arma el texto) + `await loadConversation()` (única llamada de refetch de todo el flujo — necesaria para traer `escalation.advisor.full_name` + `escalated_at` reales, porque el mensaje de error no los trae estructurados).
   - `409 CONVERSATION_NOT_ACTIVE` → toast `error` "Esta conversación ya está cerrada." + `loadConversation()`.
   - `404 CONVERSATION_NOT_FOUND` → toast `error` genérico, sin reload (la conversación ya no existe).
4. **WebSocket — otros viewers**: `conversation.control_taken` llega a cualquier conexión suscrita/en el área correspondiente.
   - `useWebSocket.ts` (nuevo case, mismo patrón que `escalation.assigned`): `useWSStore.getState().incrementAdvisorConversations(advisor_id)`; si `advisor_id === self.id`, agrega a `myAssignedConversationIds`; invoca `_handlers.onConversationControlTaken?.(data)`.
   - `ChatPage.tsx` (nuevo callback): si `event.conversation_id !== conversationId`, no-op. Si `event.advisor_id === self.id`, no-op (ya actualizado por la respuesta HTTP propia — "tu propia pantalla se actualiza con la respuesta HTTP, no esperando el WS"). En cualquier otro caso, parchea `conversation` local igual que el paso 2 pero con los datos del evento (`escalation.advisor = {id: event.advisor_id, full_name: event.advisor_name}`), sin refetch.
   - `message.new` (el aviso al cliente) puede llegar antes o después del `control_taken`, sin orden garantizado — ya soportado porque son handlers independientes que solo tocan sus respectivos slices del estado (`messages` vs `conversation`), no hay dependencia entre ellos.
5. **Devolver al bot**: sin cambios — `ReturnBotModal` + `handleReturnBot()` ya existentes cubren tanto el control tomado por `take-control` como por `assign`, porque ambos dejan una fila en `escalations` con `advisor_id` seteado, que es lo único que `return-bot` verifica.

### API / Interface Contracts

**Endpoint (ya existe, sin cambios):** `PATCH /api/v1/panel/conversations/{conversation_id}/take-control` — ver contrato completo en el mensaje del usuario / `docs/panel_api_reference.md` / `specs/human_handover_direct_control/`.

**`getChatVariant()` — nueva versión (`ChatPage.tsx`):**
```ts
function getChatVariant(): ChatVariant {
  if (!conversation) return "unassigned";
  const { bot_activo, escalation } = conversation;
  const isAdmin = role === "admin";
  const yoTengoControl = !bot_activo && escalation?.advisor?.id === advisor?.id;
  if (yoTengoControl) return "assigned";
  if (isAdmin && !bot_activo && !!escalation?.advisor) return "assigned"; // bypass: admin actúa sobre control ajeno
  if (bot_activo) return "bot";
  if (!bot_activo && escalation?.advisor) return "monitoring"; // otro (no admin) tiene el control
  return "unassigned"; // escalada sin asignar — cola (flujo assign existente, sin cambios)
}
```
`isReadonly` (línea existente) **no cambia** — sigue siendo `variant !== "assigned"` en efecto, y ahora es automáticamente correcto para el bypass de admin sin tocar esa línea.

### Edge Cases & Error Handling
- **Conversación cerrada**: el bloque de header completo (botón o etiqueta) se oculta si `conversation.status === "cerrada"` — regla explícita del usuario ("no mostrar el toggle en conversaciones cerradas").
- **Carrera de dos actores**: el perdedor recibe `409 CONTROL_ALREADY_TAKEN`, ve el toast con el nombre real (vía refetch) y queda en variant `monitoring` (o `assigned`-bypass si es admin) reflejando el estado real.
- **Doble clic / control propio ya tomado**: el backend es idempotente (200, sin nueva notificación) — el Frontend no necesita lógica especial, el PATCH devuelve el mismo payload.
- **Admin viendo una conversación con bot activo**: variant `bot`, ve el mismo botón "Tomar control manual" que un asesor (sin gate de rol en este botón — el backend tampoco lo aplica).
- **Advisor no-admin viendo control ajeno**: variant `monitoring`, banner actualizado a "🔒 {nombre} tiene el control manual de esta conversación." (antes decía "vista de solo lectura para administradores", texto que ya no aplica porque `monitoring` ahora también ocurre para asesores).
- **Mensaje de aviso al cliente**: `outbound_advisor` normal con `advisor_name` — se renderiza en `MessageFeed` sin componente especial (ya soportado, cero cambios).

## Open Questions for Implementation
Ninguna — el contrato del usuario resolvió todas las decisiones pendientes de la versión anterior de este documento.
