# Implementation Plan: Implementar WebSocket Real

## Tasks

- [x] **Task 1**: Corregir y extender tipos WS — `src/types/index.ts`
- [x] **Task 2**: Extender wsStore con presencia de asesores — `src/store/wsStore.ts`
- [x] **Task 3**: Implementar conexión real en useWebSocket — `src/hooks/useWebSocket.ts`
- [x] **Task 4**: Agregar handlers en BandejaPage — `src/pages/BandejaPage.tsx`
- [x] **Task 5**: Agregar subscribe/unsubscribe + handlers en ChatPage — `src/pages/ChatPage.tsx`
- [x] **Task 6**: Verificar `npx tsc --noEmit` sin errores

## Execution Log

### Task 1 — Corregir y extender tipos WS
Status: ✅ Done
Notes: Corregido WSEscalationNew (advisor_id en vez de client_name), WSMessageNew (message.conversation_id incluido), WSBehaviorAlert renombrado a WSBehaviorAlertEvent (solo alert_id). Agregados: WSAdvisorConnected, WSAdvisorDisconnected, WSEscalationAssigned, WSConversationReturned, WSConversationClosed, WSQueuePending.

### Task 2 — Extender wsStore
Status: ✅ Done
Notes: Agregados connectedAdvisors[], addConnectedAdvisor, removeConnectedAdvisor, updateAdvisorStatus. Importados WSAdvisorConnected y WSAdvisorStatusChanged desde types.

### Task 3 — Implementar conexión real en useWebSocket
Status: ✅ Done
Notes: Singleton con guard, backoff 1→2→4→8→30s, código 4001 → setSessionExpired, ping cada 30s, todos los eventos despachados, subscribeConversation/unsubscribeConversation retornados.

### Task 4 — Handlers en BandejaPage
Status: ✅ Done
Notes: Agregados handleConversationClosed, handleConversationReturned, handleQueuePending (toast.info + reload). handleEscalationAssigned simplificado (no usaba el argumento data). Importados WSConversationClosed, WSQueuePending, toast.

### Task 5 — Subscribe/unsubscribe + handlers en ChatPage
Status: ✅ Done
Notes: Agregados onConversationClosed (→ navigate('/')), onEscalationAssigned (→ reload). useEffect con subscribeConversation al montar / unsubscribeConversation al desmontar. Tipos WSConversationClosed y WSEscalationAssigned importados.

### Task 6 — TypeScript check
Status: ✅ Done
Notes: npx tsc --noEmit sin errores.
