# Design: Conectar Métricas del Dashboard Admin

## Overview
Este diseño describe la arquitectura técnica para conectar el panel de métricas del administrador con la API real del backend. Las métricas se recuperarán mediante peticiones HTTP asíncronas y se refrescarán bajo demanda al montar la vista, al refrescar manualmente y al recibir eventos de WebSocket que alteren el estado de las conversaciones.

## Components

### New / Modified Files
| File | Role | Change type |
|------|------|-------------|
| `src/services/metrics.ts` | Servicio de API para obtener las métricas de negocio. | Modificar / Completar |
| `src/hooks/useWebSocket.ts` | Hook de WebSocket para registrar el evento `onConversationClosed`. | Modificar |
| `src/components/bandeja/MetricsDashboard.tsx` | Componente de UI que renderiza las métricas. | Modificar |
| `src/pages/BandejaPage.tsx` | Vista principal de la bandeja de entrada de conversaciones. | Modificar |

### Key Abstractions

#### 1. `src/services/metrics.ts`
Implementar el manejo de errores riguroso para `GET /api/v1/panel/metrics`:
- En caso de éxito, retornar `{ metrics: DashboardMetrics }`.
- Si el error es `403 Forbidden` (por ejemplo, si un asesor intenta consumirlo), retornar `null`.
- Si ocurre un error de base de datos (`500 INTERNAL SERVER ERROR` con código `SUPABASE_ERROR` u otros), retornar un objeto con todas las métricas en `0` para evitar fallos catastróficos en la interfaz.

#### 2. `src/hooks/useWebSocket.ts`
Añadir soporte para el evento `conversation.closed` en el WebSocket:
- Ampliar la interfaz `WSHandlers` para incluir `onConversationClosed?: (data: { conversation_id: string }) => void`.
- En el efecto de registro de handlers, mapear `onConversationClosed` a la variable global de módulo `_handlers`.
- En el efecto de limpieza, remover el handler correspondiente.

#### 3. `src/components/bandeja/MetricsDashboard.tsx`
Actualizar el pintado de las métricas aplicando estilos de `frontend-design`:
- **activas**: Modificar el color de texto a turquesa `#00D4AA`.
- **tiempo_promedio_min**: Mostrar `"— m"` si el valor es `0`.
- **bot_ok_pct**: Mostrar `"—%"` si el valor es `0`.
- **Capacidad**: Cambiar dinámicamente el color a rojo (`#FF5B5B`) si `capacidad_actual >= capacidad_total` o a verde (`#00D4AA`) si `capacidad_actual < capacidad_total`.

#### 4. `src/pages/BandejaPage.tsx`
- En la función `loadConversations`, al cargar los datos si el rol del usuario es `'admin'`, invocar a `metricsService.getMetrics()`.
- Guardar el resultado en el estado `dashboardMetrics` manejando la posible respuesta `null` de forma segura.
- Definir un callback estable `handleConversationClosed` utilizando `useCallback` para evitar re-renderizados y re-suscripciones innecesarias del WebSocket:
  ```typescript
  const handleConversationClosed = useCallback((data: { conversation_id: string }) => {
    loadConversations()
  }, [statusFilter, channelFilter, role])
  ```
- Registrar `onConversationClosed` en la llamada a `useWebSocket` de la página.

## Data Flow
1. Al montar `BandejaPage`, se invoca `loadConversations`.
2. `loadConversations` solicita la lista de conversaciones y, si el usuario es `admin`, solicita las métricas al servicio.
3. El servicio realiza el llamado a `GET /api/v1/panel/metrics`.
4. El backend calcula y devuelve las métricas en un envelope `{ "data": { "metrics": { ... } } }`.
5. `BandejaPage` actualiza el estado y dibuja `MetricsDashboard`.
6. Si un asesor toma una conversación, el backend emite `escalation.assigned` vía WebSocket. El frontend recibe el evento y llama a `loadConversations()`, lo que actualiza la lista y refresca las métricas de negocio.
7. Si una conversación se cierra, el backend emite `conversation.closed` vía WebSocket. El frontend lo procesa en `handleConversationClosed` y llama a `loadConversations()`, actualizando la lista de chats activos y el panel de métricas.

## Edge Cases & Error Handling
- **Respuesta nula (403)**: Si el endpoint responde con un 403, se retorna `null` y el componente de dashboard no se dibuja en pantalla.
- **Falla del backend (500)**: Se retorna un estado con ceros, lo que evita que la app falle por un TypeError al intentar desestructurar campos inexistentes.
- **WebSocket desconectado**: Al no depender de un canal directo del WebSocket para empujar los valores de métricas parciales, refrescar mediante la recarga de conversaciones activa una petición HTTP limpia que re-sincroniza las métricas.
