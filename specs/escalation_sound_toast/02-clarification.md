# Clarification: Toast y Sonido de Alerta de Nuevas Escalaciones

## Preguntas y Respuestas de Diseño

### Q1: ¿Cómo se propaga el evento de WebSocket al componente Toast?
**R**: El hook de websocket `useWebSocket.ts` capturará el evento `escalation.new` y lo registrará en el almacén global `wsStore.ts` mediante `setPendingEscalation`. El componente `<EscalationToast />` estará suscrito a este almacén y se renderizará automáticamente al detectar que hay una escalación pendiente de revisión.

### Q2: ¿Cómo evitamos la duplicación del sonido de alerta?
**R**: El sonido ya está implementado en la función `playNotificationSound()` en `useWebSocket.ts`. El componente visual sólo consumirá el estado `pendingEscalation` del store sin ejecutar ningún método de audio, garantizando que el sonido ocurra exactamente una vez en la recepción del evento del canal.

### Q3: ¿Cómo interactúan el Toast de Escalación y el Toast de Éxito en la pantalla?
**R**: Ambos se posicionan en la esquina superior derecha (`top-24 right-4`). Sin embargo, el Toast de Escalación posee un z-index de `999` y el Toast de Éxito posee un z-index de `998`. Esto significa que si coinciden al mismo tiempo, el de Escalación (que es crítico y urgente) se mostrará por encima de las confirmaciones informativas de éxito.
