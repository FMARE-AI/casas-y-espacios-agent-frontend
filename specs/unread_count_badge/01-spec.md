# Spec: Unread Count Badge en Conversaciones

## Qué

Mostrar un badge azul con el número de mensajes no leídos en cada `ConversationCard` de la Bandeja. El contador se resetea automáticamente al abrir el chat y se actualiza en tiempo real vía WebSocket.

## Por qué

Los asesores no pueden saber si llegaron mensajes nuevos a una conversación sin abrirla. Sin el badge, deben revisar cada card manualmente para detectar mensajes recientes del cliente.

## Alcance

| Archivo | Cambio |
|---------|--------|
| `src/types/index.ts` | `unread_count: number` en `Conversation`; `unread_count?` en `WSMessageNew` |
| `src/services/conversations.ts` | `markAsSeen(id)` → `PATCH /conversations/{id}/seen` |
| `src/components/bandeja/ConversationCard.tsx` | Badge absoluto azul top-right |
| `src/pages/ChatPage.tsx` | Llamar `markAsSeen` al montar y despachar evento |
| `src/hooks/useWebSocket.ts` | Trackear `currentSubscribedConversationId`; despachar `conversation:unread` |
| `src/pages/BandejaPage.tsx` | Escuchar `conversation:unread` y actualizar estado local |

## Comportamiento esperado

1. Al cargar la Bandeja, cada card muestra su `unread_count` del API.
2. El badge es azul (`#01A4E3`), circular, muestra el número. Si `unread_count = 0` → no aparece. Si `> 99` → `"99+"`.
3. Al abrir un chat → `PATCH /seen` → badge desaparece en la Bandeja vía custom event.
4. Mientras el asesor ESTÁ en el chat → mensajes nuevos del WS NO acumulan el badge (está viendo el chat).
5. Mientras el asesor NO está en ese chat → mensaje inbound del WS actualiza el badge si `data.unread_count` está presente en el payload.

## Fuera de alcance

- Persistencia del badge entre recargas de página (el API ya maneja eso).
- Badge en Sidebar u otras secciones.
- Soporte multi-tab (no considerado).
