# Implementation Plan: Conectar Métricas del Dashboard Admin

## Tasks

- [x] **Task 1**: Implementar `metricsService` con gestión de errores (403 y 500) — `src/services/metrics.ts`
- [x] **Task 2**: Extender el soporte para el evento `onConversationClosed` en el WebSocket — `src/hooks/useWebSocket.ts`
- [x] **Task 3**: Conectar y formatear el renderizado visual de métricas y capacidad — `src/components/bandeja/MetricsDashboard.tsx`
- [x] **Task 4**: Cargar métricas de forma segura, definir el callback de cierre de conversación y vincularlo en la página principal — `src/pages/BandejaPage.tsx`
- [x] **Task 5**: Validar la compilación estricta de TypeScript y resolver advertencias — `Terminal`

## Execution Log

### Task 1 — Implementar `metricsService` con gestión de errores
Status: ✅ Done
Notes: Se implementó el servicio `metricsService` en `src/services/metrics.ts` llamando al endpoint `/api/v1/panel/metrics` con manejo robusto de errores: se retorna `null` ante error 403 (Forbidden) y un objeto de métricas en cero ante cualquier otro fallo (500 Supabase Error) para evitar romper el panel.

### Task 2 — Extender soporte para el evento `onConversationClosed` en el WebSocket
Status: ✅ Done
Notes: Se extendió la interfaz `WSHandlers` en `src/hooks/useWebSocket.ts` para registrar y limpiar correctamente la suscripción al evento `onConversationClosed` (vía `"conversation.closed"` del WebSocket).

### Task 3 — Conectar y formatear renderizado visual de métricas y capacidad
Status: ✅ Done
Notes: Se aplicó un diseño estético y responsive en `MetricsDashboard.tsx`. La métrica de "Activas" se muestra en `#00D4AA`. Si el tiempo promedio o efectividad del bot son 0, se muestran como `"— m"` y `"—%"` respectivamente. Para la capacidad del equipo, el color cambia dinámicamente: rojo (`#FF5B5B`) si `capacidad_actual >= capacidad_total` o turquesa/verde (`#00D4AA`) si es menor.

### Task 4 — Cargar métricas de forma segura, callback y vinculación en BandejaPage
Status: ✅ Done
Notes: En `BandejaPage.tsx` se securizó el llamado a `getMetrics` para evitar TypeErrors si el retorno es `null`. Se definió un callback estable `handleConversationClosed` (usando `useCallback` de forma segura) y se vinculó al hook de WebSocket para refrescar las métricas y conversaciones en tiempo real cuando se cierra una conversación.

### Task 5 — Validación de TypeScript
Status: ✅ Done
Notes: Se ejecutó `npx tsc --noEmit` de forma exitosa, validando que no haya errores de tipado o compilación en todo el panel.

