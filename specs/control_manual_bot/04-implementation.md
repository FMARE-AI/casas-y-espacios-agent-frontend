# Implementation Plan: Control Manual de Conversación (Activar/Desactivar Bot)

## Tasks

- [x] **Task 1**: `EscalationAdvisorRef` + angostar `Escalation.advisor` + `WSConversationControlTaken` — `src/types/index.ts`
- [x] **Task 2**: `conversationsService.takeControl()` + `TakeControlResponse` — `src/services/conversations.ts`
- [x] **Task 3**: Case `conversation.control_taken` + handler `onConversationControlTaken` en `WSHandlers` — `src/hooks/useWebSocket.ts`
- [x] **Task 4**: `getChatVariant()` sin hardcode de admin + bloque de header (botón/etiqueta) + `handleTakeControl` + callback WS — `src/pages/ChatPage.tsx`
- [x] **Task 5**: Verificación — `tsc -b`, `eslint`, `vitest run`, `vite build`

## Execution Log

### Task 1 — Tipos
Status: ✅ Done
Notes: `EscalationAdvisorRef { id, full_name }` reemplaza `Advisor | null` en `Escalation.advisor` — verificado por grep que ningún consumidor en `src/` lee otro campo. `WSConversationControlTaken` agregada junto a `WSConversationReturned`.

### Task 2 — Servicio
Status: ✅ Done
Notes: `takeControl(id)` sigue el mismo patrón que `returnToBot`/`assign` (PATCH sin body). `TakeControlResponse` tipa `conversation.status` como `ConversationStatus` (import agregado).

### Task 3 — WebSocket
Status: ✅ Done
Notes: Case `conversation.control_taken` en el switch de `useWebSocket.ts`, mismo patrón que `escalation.assigned` (incrementa contador de conversaciones del asesor, agrega a `myAssignedConversationIds` si es el propio usuario). Handler `onConversationControlTaken` registrado/limpiado en el hook con el mismo patrón que los demás (dep array incluido).

### Task 4 — ChatPage
Status: ✅ Done
Notes:
- `getChatVariant()`: se eliminó `if (role === "admin") return "monitoring"`. Nueva lógica: `yoTengoControl` (dueño real) → `assigned`; bypass de admin (`isAdmin && !bot_activo && escalation.advisor` de otro) → también `assigned`; `bot_activo` → `bot`; `!bot_activo && escalation.advisor` de otro (no-admin) → `monitoring`; resto → `unassigned`. `isReadonly` no se tocó — sigue siendo correcto automáticamente.
- `ClientPanel.tsx` y `ReturnBotModal.tsx`: **cero cambios**, tal como preveía el diseño — "Devolver al Bot" y "Cerrar conversación" ya aparecen solos en variant `assigned`, cubriendo el bypass de admin sin código nuevo.
- Header: bloque nuevo que reemplaza el pill "Monitoreo" — si `bot_activo`, botón "Tomar control manual" (sin modal, clic directo); si no, pill "Control manual — {nombre}" (verde si sos vos, ámbar si es otro). Todo oculto si `status === 'cerrada'`.
- `handleTakeControl()`: llama al servicio, parchea `conversation` local directo con la respuesta (sin refetch); en `CONTROL_ALREADY_TAKEN`/`CONVERSATION_NOT_ACTIVE` sí hace `loadConversation()` para traer el estado real; en `CONVERSATION_NOT_FOUND` solo toast.
- `onConversationControlTaken`: ignora el evento si es la propia acción (`advisor_id === self.id`, ya reflejada por la respuesta HTTP); si es de otro, parchea `conversation` directo desde el payload del evento (sin refetch).
- Banner inferior de `variant === 'monitoring'`: el texto "para administradores" ya no aplicaba (ahora cualquier asesor puede caer en ese variant viendo el control de otro) — se actualizó para mostrar el nombre real cuando está disponible.

### Task 5 — Verificación
Status: ✅ Done
Notes: `npm install` (node_modules no estaba instalado), `npx tsc -b` limpio, `npx eslint` sobre los 4 archivos tocados sin warnings, `npx vitest run` → 117/117 tests pasando (0 regresiones), `npx vite build` exitoso. No se corrió el dev server contra un backend real (fuera de alcance de esta sesión — el endpoint ya está validado end-to-end en DEV por el equipo de backend, spec `human_handover_direct_control`).

## Estado final
Feature implementada en `Frontend`, rama `Feature/FRONT-Control-manual-de-conversación-(activar/desactivar-bot)`. Pendiente: revisión visual manual contra un backend real antes de mergear (no se pudo levantar el dev server con datos reales en esta sesión).
