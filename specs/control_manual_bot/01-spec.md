# Spec: Control Manual de Conversación (Activar/Desactivar Bot)

## Problem
Cuando el bot está gestionando una conversación con normalidad (`bot_activo = true`, sin escalado activo), ningún asesor tiene manera de tomar control manual desde el panel: el chat aparece en modo solo lectura ("🤖 El bot está gestionando esta conversación") sin ningún botón de acción. El backend ya expone `PATCH /conversations/{id}/take-control` (PW-24, spec `human_handover_direct_control`, mergeado a `dev`) exactamente para este caso, pero el Frontend nunca lo consume — solo existe el flujo inverso ("Devolver al Bot", PW-8, ya implementado vía `ReturnBotModal`).

## Goals
- Permitir que un asesor tome control manual de cualquier conversación no cerrada, incluso si el bot la está gestionando normalmente y no hay escalado previo.
- Completar el ciclo activar/desactivar bot en la UI: "Tomar control manual" (nuevo) + "Devolver al Bot" (ya existente, sin cambios).
- Reflejar en tiempo real, vía WebSocket, cuando otro asesor toma el control de una conversación que se está viendo, para evitar que dos personas intenten intervenir la misma.

## Non-Goals
- No se modifica el endpoint `assign` (PW-7) ni el botón "Tomar Conversación" existente para colas ya escaladas sin asignar — ese flujo sigue igual.
- No se agregan permisos ni gates de área nuevos — el backend ya no aplica chequeo de área para `take-control` (decisión ya tomada en el spec de backend).
- No se decide en este documento si el rol `admin` obtiene este botón (hoy los admins solo tienen vista `monitoring`, sin ninguna acción disponible) — abierto en `02-clarification.md`.

## Expected Behavior
1. Un asesor abre una conversación donde el bot tiene el control (`variant === 'bot'` en `ChatPage.tsx`, sin escalado activo).
2. En el panel derecho (`ClientPanel.tsx`) ve un botón para tomar control manual, en lugar del banner de solo lectura actual.
3. Al confirmar, se llama `PATCH /conversations/{id}/take-control` vía `conversationsService`. Con éxito, la conversación pasa a variant `assigned` para ese asesor: se habilita `ChatInput` y aparece el botón "Devolver al Bot" (ya existente, sin cambios).
4. El backend ya envía la notificación al cliente por WhatsApp ("Un asesor ha tomado el control...") — el Frontend no duplica ese mensaje.
5. Si otro asesor ya tomó el control primero (`409 CONTROL_ALREADY_TAKEN`), se muestra un toast de error con el nombre de quien lo tiene y se recarga el estado de la conversación.
6. El evento WebSocket `conversation.control_taken` (ya emitido por el backend) actualiza en tiempo real la bandeja/chat de otros asesores conectados que estén viendo o listando esa conversación.

## Constraints
- Reusar el patrón existente: llamadas vía `conversationsService` (nunca `fetch` directo), `apiClient` de axios con auth automática (§16 CLAUDE.md).
- Seguir el envelope `{ data: {...} }` / `{ detail: { code, message } }` (§17.2 CLAUDE.md).
- Si se agrega un modal de confirmación, evitar `backdrop-blur` a pantalla completa (regla de performance, §16.1 CLAUDE.md) — usar scrim sólido, igual que `ReturnBotModal`.
- Mantener el patrón visual y de estados (`disabled`, spinner) que ya usan los botones `onTake`/`onReturnBot` en `ClientPanel.tsx`.

## Priority
Alta — es el complemento directo de una feature de backend ya mergeada y probada (135 tests, PR #173); sin esto, ese trabajo de backend queda sin usar desde el panel.
