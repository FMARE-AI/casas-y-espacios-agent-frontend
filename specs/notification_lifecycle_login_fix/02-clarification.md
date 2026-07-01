# Clarifications: Notification Lifecycle / Login Fix (WS active without session)

## Questions & Answers

**Q1: ¿Dónde debe vivir el fix del cierre del socket al terminar la sesión?**
A: Dentro del propio efecto de conexión en `useWebSocket.ts` — agregar el cierre del socket (`socket.close()` + limpieza de `ping`/`reconnect` timers) en la rama `if (!accessToken)` del `useEffect` existente (líneas 452-473 de `src/hooks/useWebSocket.ts`). Se dispara automáticamente para todo camino que ponga `token` en `null`, sin acoplar `authStore` al módulo del hook. Respeta la Regla 4 de `CLAUDE.md` §15 (un solo socket, gestionado únicamente desde el hook).

**Q2: En el flujo `ADVISOR_INACTIVE` (403), el token NO se limpia hasta que el usuario confirma el modal bloqueante — ¿debe cerrarse el socket inmediatamente al setear `sessionExpired = true` (aunque el token siga vigente), o es aceptable que se cierre recién cuando el usuario confirma?**
A: Cerrar inmediatamente al bloquear — en cuanto `sessionExpired` pasa a `true` (por cualquier causa: 401 o `ADVISOR_INACTIVE`), el socket debe cerrarse ya. Consistente con el principio fail-secure: si el panel está bloqueado, no debe seguir recibiendo/reproduciendo eventos en background.

## Resolved Rule Set

1. El `useEffect` de conexión (`[accessToken]`) gana una rama de cierre explícito: cuando `accessToken` es falsy, además de `setStatus('disconnected')`, debe cerrar cualquier socket module-singleton abierto (`socket.close()`, `socket = null`, `connectedToken = null`, `clearPing()`, `clearReconnect()`), igual que ya hace la rama "token cambió a otro valor truthy" (líneas 462-469) — reutilizar esa misma lógica de teardown, no duplicarla.
2. Dado que el 401 (`session-expired`) ya llama `clearSession()` de forma síncrona (pone `token: null` inmediatamente vía `axios.ts` interceptor), la regla 1 ya cubre ese caso sin cambios adicionales en `authStore`.
3. Para `ADVISOR_INACTIVE` (403), el `token` permanece no-nulo hasta que el usuario confirma el modal — por lo tanto la regla 1 sola NO cierra el socket en este flujo. Se necesita un disparador adicional: cerrar el socket también cuando `sessionExpired` pasa a `true`, independientemente del valor de `accessToken`. Esto implica que `useWebSocket`'s conexión debe reaccionar tanto a `accessToken` como a `sessionExpired` (o exponer/ejecutar el mismo teardown desde donde se setea `sessionExpired`).
4. Debe reutilizarse la lógica de teardown existente (no crear una segunda ruta de cierre) para no violar la Regla 4 de `CLAUDE.md` §15 (un solo socket, un solo punto de gestión).

## Open Decisions

- Mecánica exacta para que el cierre reaccione también a `sessionExpired` sin violar la Regla 1/2 de Hooks de `CLAUDE.md` §15 (no usar el store completo como dependencia, no depender de un valor que se escribe dentro del mismo efecto) — se define en Fase 3 (diseño).
