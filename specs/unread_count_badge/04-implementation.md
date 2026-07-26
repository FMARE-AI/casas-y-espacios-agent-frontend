# Implementation: Unread Count Badge

## Plan de tareas

- [x] 1. `src/types/index.ts` — agregar `unread_count: number` a `Conversation`; agregar `unread_count?` a `WSMessageNew`
- [x] 2. `src/services/conversations.ts` — agregar `markAsSeen()`
- [x] 3. `src/components/bandeja/ConversationCard.tsx` — agregar `relative` + badge
- [x] 4. `src/pages/ChatPage.tsx` — llamar `markAsSeen` + despachar `conversation:unread`
- [x] 5. `src/hooks/useWebSocket.ts` — trackear `currentSubscribedConversationId` + despachar `conversation:unread`
- [x] 6. `src/pages/BandejaPage.tsx` — escuchar `conversation:unread` y actualizar estado local

## Log de ejecución

### Tarea 1 — types/index.ts
Agregado `unread_count: number` a `Conversation`. Actualizado `WSMessageNew` con `unread_count?: number` (opcional — el payload del WS puede no incluirlo según la API reference).

### Tarea 2 — conversations.ts
Agregado `markAsSeen` que llama `PATCH /api/v1/panel/conversations/{id}/seen`. Retorna `{ unread_count: number }`.

### Tarea 3 — ConversationCard.tsx
Root div ahora tiene `relative`. Badge absoluto `top-3 right-3` con `bg-[#01A4E3] rounded-full`. Guard `unread_count > 0`.

### Tarea 4 — ChatPage.tsx
Nuevo `useEffect([conversationId])`: llama `markAsSeen`, luego despacha `conversation:unread` con `unreadCount: 0`. Falla silenciosamente — no bloquea la carga del chat.

### Tarea 5 — useWebSocket.ts
`currentSubscribedConversationId` agregado como variable de módulo. `subscribeConversation` lo setea, `unsubscribeConversation` lo limpia. En el handler `message.new`: si el mensaje es `inbound`, la conversación NO es la suscrita actualmente, y `data.unread_count` está presente → despacha `conversation:unread`.

### Tarea 6 — BandejaPage.tsx
Nuevo `useEffect([])` que registra/desregistra listener `conversation:unread`. Actualiza el `unread_count` de la conversación afectada en el estado local sin recargar la lista.
