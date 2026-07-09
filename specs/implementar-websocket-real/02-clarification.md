# Clarifications: Implementar WebSocket Real

## Questions & Answers

**Q1: ¿El `VITE_WS_BASE_URL` ya tiene el `?token=` en el valor del env, o el hook construye la URL?**
A: El `.env.example` dice `VITE_WS_BASE_URL="your-websocket-url?token={jwt}"` pero eso es solo documentación del placeholder. El hook debe construir `${VITE_WS_BASE_URL}/api/v1/panel/ws?token=${jwt}` — la variable debería ser solo el host base.

**Q2: ¿Qué URL usa el hook si `VITE_WS_BASE_URL` no está configurada?**
A: El CLAUDE.md dice: "Si no está configurada, usa `wss://casasyespaciosagent.up.railway.app/...`". Mantener ese fallback.

**Q3: ¿El `wsStore` necesita exponer la lista de asesores conectados en la UI de la bandeja?**
A: El `ConnectedAdvisors` component en `BandejaPage` actualmente es estático (hardcodeado con Andrés, Diana, Julio). La tarea NO incluye conectarlo con datos reales — solo mantener el estado en el store para uso futuro. Por ahora, `addConnectedAdvisor` / `removeConnectedAdvisor` / `updateAdvisorStatus` solo actualizan el store interno; el componente UI no los consume todavía.

**Q4: ¿Dónde se maneja el toast de `escalation.new`?**
A: El `EscalationToast` en `ProtectedRoute` ya lee `wsStore.pendingEscalation`. El handler de `escalation.new` en `useWebSocket` debe seguir llamando `wsStore.setPendingEscalation(...)` — sin cambios en eso. Lo que cambia es que el handler ahora vendrá de un evento WS real.

**Q5: ¿Los tipos WS en `types/index.ts` deben alinearse exactamente con el contrato de la API?**
A: Sí. El `WSEscalationNew` actual tiene `client_name` que no existe en la API (la API manda `advisor_id`, `reason`, `channel`, `conversation_id`). Hay que corregirlo. `WSBehaviorAlert` tiene `{ alert: BehaviorAlert }` pero la API manda solo `{ alert_id }`. Ambos deben corregirse.

**Q6: ¿El `subscribeConversation` / `unsubscribeConversation` debe ser retornado por el hook o exportado separadamente?**
A: Lo devuelve el hook: `const { reconnect, subscribeConversation, unsubscribeConversation } = useWebSocket(handlers)`. Internamente envía el frame WS si el socket está abierto.

**Q7: ¿Qué pasa si `ChatPage` llama `subscribeConversation` antes de que el socket esté abierto?**
A: El socket singleton se abre en `ProtectedRoute` antes de que `ChatPage` monte (el árbol de componentes garantiza esto). Sin embargo, si por alguna razón el socket está reconectando, se hace best-effort: el hook intenta suscribir al reconectar. No bloquear el render.

**Q8: ¿El `conversation.closed` debe navegar solo si la conversación ACTUALMENTE ABIERTA es la que se cierra?**
A: Sí. Si el asesor está en `ChatPage` con la conversación X y llega `conversation.closed` con `conversation_id = X` → navegar a `/`. Si es una conversación diferente → solo recargar la bandeja.

**Q9: ¿`message.new` del tipo `data.message` tiene `conversation_id`?**
A: Sí, según `panel_api_reference.md` el campo está en `data.message.conversation_id`. No hay un campo `data.conversation_id` separado — el conversation_id está DENTRO del objeto message.

## Open Decisions

Ninguna — todas las ambigüedades están resueltas arriba.
