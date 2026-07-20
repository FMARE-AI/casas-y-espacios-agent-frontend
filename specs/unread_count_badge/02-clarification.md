# Clarification: Unread Count Badge

## Q1: ¿El payload de `message.new` vía WS incluye `unread_count`?

**A:** La API reference no lo muestra en el ejemplo del payload. El handler en `useWebSocket.ts` usa un guard `if (data.unread_count !== undefined)` — solo despacha el custom event si el backend lo incluye. Si el backend no lo envía, el badge en la Bandeja no se actualiza vía WS (se sincroniza en el próximo `GET /conversations/`).

## Q2: ¿Qué pasa si el asesor cierra el chat sin marcar como leído?

**A:** `markAsSeen` se llama automáticamente al ABRIR el chat. Al cerrar el chat → `unsubscribeConversation()` limpia `currentSubscribedConversationId`. El servidor puede seguir acumulando `unread_count` después si llegan más mensajes.

## Q3: ¿Se necesita un store global para las conversaciones?

**A:** No. Se usa el custom event `conversation:unread` (`window.dispatchEvent`) como canal de comunicación entre `ChatPage`/`useWebSocket` y `BandejaPage`. No requiere store adicional.

## Q4: ¿Overlap del badge con `renderTopRight()` en `ConversationCard`?

**A:** El badge se posiciona absolutamente en `top-3 right-3` sobre el card. `renderTopRight()` queda en el flow normal del flex. El badge (z-index mayor por ser absoluto) se superpone visualmente, lo cual es el comportamiento estándar de badges de notificación.

## Q5: ¿`unread_count` es required u optional en el tipo `Conversation`?

**A:** Required (`unread_count: number`). El backend siempre lo incluye en `GET /conversations/`. La API reference muestra `"unread_count": 0` en el ejemplo de response — nunca es null.
