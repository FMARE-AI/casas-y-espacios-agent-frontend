# Spec: Conversation Actions Integration

## Problem

Los tres métodos de acción en `conversationsService` — `assign()`, `returnToBot()`, `close()` — siguen lanzando `throw new Error('NOT IMPLEMENTED')`. La UI de `ChatPage` y `ClientPanel` ya está completa (botones, modales, spinners, handlers), pero cualquier clic sobre "Tomar Conversación", "Devolver al Bot" o "Cerrar conversación" explota en runtime. El panel web es inutilizable en producción hasta que estas llamadas HTTP estén conectadas.

## Goals

- Implementar `conversationsService.assign()` con la llamada real a `PATCH /conversations/{id}/assign`.
- Implementar `conversationsService.returnToBot()` con `PATCH /conversations/{id}/return-bot`.
- Implementar `conversationsService.close()` con `PATCH /conversations/{id}/close` (body opcional).
- Manejar todos los códigos de error específicos definidos en `panel_api_reference.md` para cada endpoint.
- Completar el manejo de errores globales en `ChatPage` (errores que actualmente llegan al catch genérico sin mensaje descriptivo).
- Pasar `npx tsc --noEmit` sin errores.

## Non-Goals

- Cambios en la UI de modales (ya implementados en el spec `close_conversation`).
- Cambios en `ClientPanel` más allá de lo necesario para conectar errores.
- Implementar `getById()` o `getMessages()` (pendiente Tarea 4 de otro spec).
- Implementar los métodos `replyText()`, `replyMedia()`, `replyAudio()` (pendiente Tarea 6).
- Cualquier cambio en el backend.

## Expected Behavior

### assign()
- `PATCH /api/v1/panel/conversations/{id}/assign` sin body.
- Éxito 200 → devuelve `{ escalation: { id, advisor_id, advisor_name } }`.
- 409 `ALREADY_ASSIGNED` → recargar la conversación (estado actualizado con nuevo asesor).
- 409 `MAX_CONVERSATIONS_REACHED` → mostrar el mensaje exacto del backend (incluye conteos X/Y).
- 409 `CONVERSATION_NOT_ESCALATED` → toast: "La conversación no está en estado escalado."
- Errores globales: 403 `BOT_IS_ACTIVE`, 403 `NOT_ASSIGNED`, 404 `CONVERSATION_NOT_FOUND`, 409 `ALREADY_CLOSED`.

### returnToBot()
- `PATCH /api/v1/panel/conversations/{id}/return-bot` sin body.
- Éxito 200 → devuelve `{ conversation: { id, bot_activo: true, status: "activa" } }`.
- 403 `BOT_ALREADY_ACTIVE` → recargar la conversación (sincronizar estado) + toast informativo.
- Errores globales aplicables.

### close()
- `PATCH /api/v1/panel/conversations/{id}/close` con body opcional `{ resolution_type, resolution_notes, client_satisfied }`.
- Éxito 200 → devuelve `{ conversation: { status, resolution_type, resolution_notes, client_satisfied, closed_by, closed_at } }`.
- 409 `ALREADY_CLOSED` → toast: "Esta conversación ya fue cerrada."
- Errores globales aplicables.

### Errores globales en ChatPage (todos los handlers)
| Código | Mensaje al asesor |
|---|---|
| 403 `BOT_IS_ACTIVE` | "El bot tiene el control de esta conversación." |
| 403 `NOT_ASSIGNED` | "No estás asignado a esta conversación." |
| 404 `CONVERSATION_NOT_FOUND` | "Conversación no encontrada." |
| 409 `ALREADY_CLOSED` | "Esta conversación ya fue cerrada." |

## Constraints

- Todo acceso HTTP pasa por `apiClient` de `src/lib/axios.ts` (nunca `fetch` directo).
- Errores se extraen de `error.response?.data?.detail?.code` (envelope `{ detail: { code, message } }`).
- Seguir reglas de Zustand (secciones 15–16 de CLAUDE.md): ningún store completo como dep, ningún valor que se escribe en las deps del effect.
- `npx tsc --noEmit` debe pasar al finalizar.
- No hay mock fallback para estas acciones — si el backend no responde, el error debe surfacearse.

## Priority

Alta — sin estas implementaciones el panel web no puede ser usado en producción para ninguna acción de atención al cliente.
