# Design: Badge de Alertas en Sidebar

## Overview
El diseño implementa el badge de alertas de comportamiento sin revisar en la barra lateral para el rol de administrador. Se inicializa el contador de alertas desde la base de datos de manera eficiente al cargar el Sidebar, y se mantiene sincronizado usando el websocket (Zustand store).

## Components

### New / Modified Files
| File | Role | Change type |
|------|------|-------------|
| `src/store/wsStore.ts` | Almacenamiento del estado global del WebSocket y contador de alertas | Modify |
| `src/components/layout/Sidebar.tsx` | Barra lateral principal que renderiza el menú de navegación | Modify |

### Key Abstractions

#### `src/store/wsStore.ts`
Agregamos a la interfaz `WSState` y al store `useWSStore`:
- `setUnreadAlerts: (count: number) => void`: Permite establecer directamente el número de alertas no leídas.
- `decrementAlerts: () => void`: Ya está definido, pero nos aseguramos de que proteja el contador de descensos por debajo de 0 usando `Math.max(0, s.unreadAlerts - 1)`.

#### `src/components/layout/Sidebar.tsx`
- **Carga inicial**: `useEffect` que se dispara al cambiar el `role`. Si el rol es `admin`, ejecuta una petición HTTP ligera:
  ```typescript
  alertsService.list({ reviewed: false, limit: 1 })
  ```
  Al resolver, llama a `setUnreadAlerts(result.total)`.
- **Renderizado del Badge**: Modificamos el componente interno `NavItem` para dar formato de min-ancho y limitar visualmente el badge a `99+` cuando el valor sea mayor que 99.
- Pasamos `badge={unreadAlerts}` al ítem `/gestion` de "Gestión Asesores".
- Eliminamos `badge={unreadAlerts}` del ítem `/` ("Bandeja de Entrada"), ya que las alertas no leídas corresponden a alertas de comportamiento y no a la bandeja.

### Data Flow
1. El usuario inicia sesión como `admin`.
2. Se monta el `Sidebar.tsx`.
3. El `useEffect` del Sidebar detecta el rol `admin` y llama a `alertsService.list({ reviewed: false, limit: 1 })`.
4. El backend responde con el total de alertas de comportamiento sin revisar (`total`).
5. El Sidebar llama a `setUnreadAlerts(total)`.
6. El store se actualiza, reactivando la interfaz y mostrando el badge de alertas rojo sobre "Gestión Asesores".
7. Si el backend emite un evento websocket `behavior.alert`, `wsStore` incrementa `unreadAlerts` y el badge se actualiza en tiempo real.
8. Cuando el admin revisa una alerta en `GestionPage.tsx`, se ejecuta `handleMarkReviewed`, el cual llama a `decrementAlerts()`, restando 1 en el store y actualizando el badge del Sidebar.

### API / Interface Contracts
- `alertsService.list({ reviewed?: boolean, limit?: number }) -> Promise<PaginatedAlerts>` (donde `PaginatedAlerts` contiene el atributo `total`).

### Edge Cases & Error Handling
- **Fallo de Red en Carga Inicial**: Si `alertsService.list` falla, se captura el error y se silencia, dejando el contador en 0.
- **Decremento Excesivo**: `decrementAlerts` utiliza `Math.max(0, ...)` para evitar números negativos.
- **Desbordamiento Visual**: Valores superiores a 99 son truncados a `"99+"` mediante el formateador del `NavItem`.
