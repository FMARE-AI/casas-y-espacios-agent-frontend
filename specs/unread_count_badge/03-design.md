# Design: Unread Count Badge

## Arquitectura general

Sin store adicional. El flujo usa:
1. **API**: `unread_count` viene del `GET /conversations/` existente.
2. **Custom event** (`conversation:unread`): canal de comunicación entre `ChatPage`/`useWebSocket` → `BandejaPage`.
3. **Módulo-level variable** en `useWebSocket.ts`: `currentSubscribedConversationId` para saber si el asesor está viendo un chat.

## Flujo de datos

```
GET /conversations/
  └─ conversations[].unread_count → ConversationCard badge

PATCH /conversations/{id}/seen (al abrir ChatPage)
  └─ window.dispatchEvent('conversation:unread', { conversationId, unreadCount: 0 })
       └─ BandejaPage: setConversations → card se actualiza a 0

WS message.new (inbound, otro chat)
  └─ si data.unread_count !== undefined && conversationId !== currentSubscribed:
       window.dispatchEvent('conversation:unread', { conversationId, unreadCount })
         └─ BandejaPage: setConversations → card se actualiza
```

## Cambios por archivo

### `src/types/index.ts`
```typescript
interface Conversation {
  // ... existing fields ...
  unread_count: number   // nuevo — siempre presente (default 0)
}

interface WSMessageNew {
  message: Message
  conversation_id?: string     // ya existía implícitamente en el hook
  unread_count?: number        // nuevo — opcional, puede no estar en el payload
}
```

### `src/services/conversations.ts`
```typescript
async markAsSeen(conversationId: string): Promise<{ unread_count: number }> {
  const { data } = await apiClient.patch(`/api/v1/panel/conversations/${conversationId}/seen`)
  return data.data
},
```

### `src/components/bandeja/ConversationCard.tsx`
- Root div: agregar `relative`
- Badge absoluto `top-3 right-3`, `bg-[#01A4E3]`, `rounded-full`, `min-w-[20px] h-5`
- Condición: `conversation.unread_count > 0`
- Texto: `unread_count > 99 ? '99+' : unread_count`

### `src/pages/ChatPage.tsx`
```typescript
useEffect(() => {
  if (!conversationId) return
  conversationsService.markAsSeen(conversationId)
    .then(() => {
      window.dispatchEvent(
        new CustomEvent('conversation:unread', {
          detail: { conversationId, unreadCount: 0 }
        })
      )
    })
    .catch(() => {})
}, [conversationId])
```

### `src/hooks/useWebSocket.ts`
```typescript
// Nuevo módulo-level variable
let currentSubscribedConversationId: string | null = null

// subscribeConversation actualizado
const subscribeConversation = useCallback((conversationId: string) => {
  currentSubscribedConversationId = conversationId
  sendMessage({ type: 'subscribe_conversation', conversation_id: conversationId })
}, [])

// unsubscribeConversation actualizado
const unsubscribeConversation = useCallback(() => {
  currentSubscribedConversationId = null
  sendMessage({ type: 'unsubscribe_conversation' })
}, [])

// En handler message.new — agregar tras el sonido:
const raw = data as WSMessageNew & { conversation_id?: string; unread_count?: number }
if (
  normalizedMsg.message.direction === 'inbound' &&
  conversationId !== currentSubscribedConversationId &&
  raw.unread_count !== undefined
) {
  window.dispatchEvent(
    new CustomEvent('conversation:unread', {
      detail: { conversationId, unreadCount: raw.unread_count }
    })
  )
}
```

### `src/pages/BandejaPage.tsx`
```typescript
useEffect(() => {
  const handleUnread = (e: Event) => {
    const { conversationId, unreadCount } =
      (e as CustomEvent<{ conversationId: string; unreadCount: number }>).detail
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, unread_count: unreadCount } : c)
    )
  }
  window.addEventListener('conversation:unread', handleUnread)
  return () => window.removeEventListener('conversation:unread', handleUnread)
}, [])
```

## Decisiones tomadas

| Decisión | Alternativa descartada | Razón |
|----------|----------------------|-------|
| Custom event en `window` | Store Zustand adicional | No requiere nueva infraestructura; suficiente para 1 listener |
| `markAsSeen` independiente de `loadConversation` | Encadenado en el mismo effect | Más simple; falla silenciosamente sin afectar la carga del chat |
| `unread_count: number` (required) | `unread_count?: number` (optional) | API siempre lo devuelve; no queremos `undefined` checks en la card |
| Badge `absolute top-3 right-3` | Inline en el flex row | Patrón estándar para badges de notificación; no rompe el layout existente |
