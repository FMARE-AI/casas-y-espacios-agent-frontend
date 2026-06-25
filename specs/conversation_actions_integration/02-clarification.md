# Clarifications: Conversation Actions Integration

## Questions & Answers

**Q1: El `ChatPage` ya tiene `handleTake()` con error handling parcial. ¿Lo reemplazamos o lo extendemos?**
A: Se extiende. El handler existente ya maneja `ALREADY_ASSIGNED` (recarga) y `MAX_CONVERSATIONS_REACHED` (toast hardcodeado). Se corrige el toast de `MAX_CONVERSATIONS_REACHED` para usar el mensaje exacto del backend (`error.response?.data?.detail?.message`), y se agregan los casos faltantes: `CONVERSATION_NOT_ESCALATED` y los errores globales.

**Q2: ¿`returnToBot()` en `ChatPage` debe cerrar el modal antes o después de la recarga cuando hay `BOT_ALREADY_ACTIVE`?**
A: Primero cerrar el modal (`setShowReturnModal(false)`), luego mostrar toast informativo, luego recargar. El modal debe irse independientemente del resultado para no bloquear la UI.

**Q3: El body de `close()` es opcional según la API. ¿El frontend siempre envía el body o solo si hay valores no-default?**
A: Siempre envía el body con los tres campos. El modal ya inicializa los defaults (`resolution_type: 'otro'`, `client_satisfied: 'sin_confirmar'`), así que el body siempre tendrá valores válidos. Simplificar: siempre enviarlo.

**Q4: `CloseConversationData` ya existe como tipo en `conversations.ts`. ¿Lo mantenemos o lo movemos a `types/`?**
A: Se mantiene en `conversations.ts` como tipo local — es un input-only que no se comparte con otros módulos. Solo `CloseConversationData` como tipo privado del servicio.

**Q5: ¿Qué pasa si `close()` recibe un 409 `ALREADY_CLOSED` — el modal sigue abierto o se cierra y navega?**
A: El modal permanece abierto. Se muestra un toast de error. El asesor puede cancelar manualmente. No se navega porque la conversación podría haber sido cerrada por el bot y el asesor querrá ver el estado actual antes de salir.

**Q6: ¿Los errores globales (403 `BOT_IS_ACTIVE`, 403 `NOT_ASSIGNED`, 404 `CONVERSATION_NOT_FOUND`) aplican a los tres handlers o solo a algunos?**
A: A los tres. Se centraliza en un helper `handleConversationError(code, message)` dentro de `ChatPage` para evitar duplicación entre `handleTake`, `handleReturnBot`, y `handleClose`.

**Q7: ¿La respuesta exitosa de `assign()` incluye suficiente info para actualizar el estado local sin recargar?**
A: No — devuelve solo `{ escalation: { id, advisor_id, advisor_name } }`, no la conversación completa. Se recarga con `loadConversation()` igual que hoy.

## Open Decisions

Ninguna — todas las ambigüedades fueron resueltas antes de iniciar el diseño.
