# Diseño: Panel de Alertas de Comportamiento (BehaviorAlertsPanel)

## Descripción General

Se monta un nuevo componente `BehaviorAlertsPanel` dentro de `GestionPage`, ubicado debajo de la tabla de asesores. Lee el rol `role` del `useAuthStore` y no renderiza nada si el usuario no es un administrador. Al montarse, obtiene la lista de alertas pendientes de revisión, soporta dos filtros en el cliente (por asesor y por severidad), muestra cada alerta en una tarjeta de diseño premium (con efectos de desenfoque y glassmorphism) y permite al administrador marcarlas como revisadas. Registra un manejador de WebSocket para el evento `onBehaviorAlert` (vía `useWebSocket`) para recargar automáticamente la lista cuando llegan nuevas alertas de moderación en background.
Se implementa `alertsService` para interactuar con la API.
Se añade la acción `decrementAlerts` al `wsStore`.

## Componentes

### Archivos Nuevos / Modificados

| Archivo | Rol | Tipo de Cambio |
|---------|-----|----------------|
| `src/services/alerts.ts` | Peticiones HTTP reales para obtener (`list`) y revisar (`markReviewed`) alertas | Modificado |
| `src/components/gestion/BehaviorAlertsPanel.tsx` | Panel completo: estado, filtros locales, tarjetas visuales, manejador de WebSocket | Creado |
| `src/pages/GestionPage.tsx` | Montaje del componente `<BehaviorAlertsPanel advisors={advisors} />` | Modificado |
| `src/store/wsStore.ts` | Adición de la acción `decrementAlerts` en el almacén de Zustand | Modificado |

### Abstracciones Clave

**`BehaviorAlertsPanel`**
- Propiedades: `{ advisors: Advisor[] }`
- Obtiene el rol desde `useAuthStore` y retorna `null` si no es `'admin'`.
- Estados locales:
  - `alerts`: Listado de alertas recuperadas de la base de datos.
  - `isLoading`: Booleano para el estado de carga inicial (esqueleto visual).
  - `isRefreshing`: Booleano para recargas silenciosas (vía WebSocket).
  - `advisorFilter`: ID del asesor seleccionado en el filtro (o `'todos'`).
  - `severityFilter`: Nivel de severidad seleccionado en el filtro (o `'todos'`).
  - `reviewingIds`: Conjunto `Set<string>` con los IDs de alertas cuya petición de revisión está activa.
- `loadAlerts(silent)`: Llama a `alertsService.list({ reviewed: false, limit: 50 })`. Desactiva los indicadores al finalizar.
- `filteredAlerts` (Zustand/useMemo): Filtra la lista local de alertas basándose en los estados de `advisorFilter` y `severityFilter`.
- `handleMarkReviewed(id)`: Agrega el ID a `reviewingIds`, llama a la API.
  - Si tiene éxito: Remueve la alerta de la lista local y llama a `decrementAlerts()`.
  - Si ocurre error `ALREADY_REVIEWED` (409) o `ALERT_NOT_FOUND` (404): Remueve la alerta de la lista local y llama a `decrementAlerts()` de forma silenciosa.
  - En otros errores: Remueve el ID del conjunto `reviewingIds` para rehabilitar el botón, manteniendo la alerta en pantalla.
- WebSocket: `useWebSocket({ onBehaviorAlert: handleBehaviorAlert })` donde `handleBehaviorAlert` es una referencia estable creada con `useCallback` para recargar la lista de alertas.

**`formatBogota(utcString: string): string`**
- Función de utilidad a nivel de módulo, sin dependencias externas del estado de React.
- Utiliza `parseISO` y `format` de `date-fns`.
- Convierte la fecha UTC a la zona horaria `America/Bogota` mediante `toLocaleString('en-US', { timeZone: 'America/Bogota' })`.
- Retorna la cadena de texto estructurada como:
  - Hoy → "Hoy, hh:mm a"
  - Ayer → "Ayer, hh:mm a"
  - Otro → "dd/MM/yyyy hh:mm a"

**`decrementAlerts` en wsStore**
- Acción en el estado global: `() => set((s) => ({ unreadAlerts: Math.max(0, s.unreadAlerts - 1) }))`. Asegura que el contador nunca sea negativo.

### Flujo de Datos

1. Se monta `GestionPage` → Carga la lista de asesores → Pasa la lista mediante props a `<BehaviorAlertsPanel advisors={advisors} />`.
2. Se monta `BehaviorAlertsPanel` → Un efecto `useEffect` invoca a `loadAlerts()`.
3. `loadAlerts()` invoca el servicio `alertsService.list({ reviewed: false, limit: 50 })`.
4. Si la petición tiene éxito: Se actualizan los estados `alerts` y se finaliza `isLoading`.
5. El valor calculado de `filteredAlerts` se recalcula instantáneamente al cambiar algún filtro, sin llamadas al servidor.
6. El administrador presiona "Marcar revisada" → Se añade el ID al conjunto `reviewingIds` → Se llama a `alertsService.markReviewed(id)`.
7. Al completarse: Se filtra la alerta del array local y se llama a `useWSStore.getState().decrementAlerts()`.
8. En caso de colisión o error `409` / `404`: Se procede idénticamente a un éxito (eliminando del cliente y decrementando el contador) sin alertar negativamente al usuario.
9. Ante fallos de conexión: Se remueve el ID de `reviewingIds` para permitir reintentar la acción.
10. El servidor emite un evento `behavior.alert` por WebSocket → Se activa la función callback registrada → Se ejecuta `loadAlerts(true)` para recargar silenciosamente la lista en segundo plano.

### API y Contratos de Interfaz

```typescript
// alertsService
alertsService.list(params?: { reviewed?: boolean; advisor_id?: string; limit?: number; offset?: number }): Promise<PaginatedAlerts>
// PaginatedAlerts = { alerts: BehaviorAlert[], total: number }

alertsService.markReviewed(alertId: string): Promise<{ alert: BehaviorAlert }>

// Adiciones en wsStore
decrementAlerts: () => void

// Props del componente panel
interface BehaviorAlertsPanelProps {
  advisors: Advisor[]
}
```

### Casos de Borde y Manejo de Errores

- Fallo por `ALREADY_REVIEWED` o `ALERT_NOT_FOUND` al marcar como revisada: Se trata visualmente como una respuesta exitosa (eliminación y decremento de badge). Evita que alertas ya procesadas o inexistentes se queden bloqueadas en el panel.
- Otros códigos de error en la API: El botón se rehabilita, la alerta permanece en pantalla y falla silenciosamente para evitar ruido visual al usuario.
- Todos los elementos filtrados: Muestra el estado vacío de la misma forma que si no hubiese alertas pendientes en la base de datos.
- Deshabilitación por ID (`reviewingIds`): Impide doble clic y peticiones paralelas para un mismo registro.
- Limitación en el decremento: `Math.max(0, ...)` impide que el badge del sidebar muestre números negativos ante inconsistencias de sincronización.
- Manejador de WebSocket estable: Callback sin dependencias `[]` para cumplir con la Regla 5 del apartado 15 de `CLAUDE.md`.

### Especificaciones Visuales

**Contenedor de la sección** (`id="behavior-alerts-section"`):
```
bg-[#252522]/60 border border-[#3A3A37] rounded-xl p-6
```

**Tarjeta de alerta** (`id="behavior-alert-item-${alert.id}"`):
```
bg-[#252522]/65 border border-[#3A3A37]/50 rounded-lg p-4
flex items-start gap-3
hover:border-[#FF5B5B]/35 hover:shadow-lg hover:shadow-[#FF5B5B]/5
transition-all duration-300 transform hover:-translate-y-0.5
```
Cuenta con animación de entrada staggered (`alertFadeIn` con `cubic-bezier(0.16, 1, 0.3, 1)` y retraso dinámico según su índice).

**Etiquetas de tipo de alerta** (`alert_type`):
```
lenguaje_inapropiado      → bg-[#FF5B5B]/15 text-[#FF5B5B]
tono_agresivo             → bg-[#FFB84D]/15 text-[#FFB84D]
comportamiento_inadecuado → bg-[#FFB84D]/10 text-[#FFB84D]/80
```

**Etiquetas de severidad** (`severity`):
```
alta  → bg-[#FF5B5B]/15 text-[#FF5B5B]
media → bg-[#FFB84D]/15 text-[#FFB84D]
baja  → bg-[#8B8FA8]/15 text-[#8B8FA8]
```

**Estado vacío** (`id="behavior-alerts-empty"`):
Muestra un ícono de check de color `#00D4AA` dentro de un círculo con fondo semi-transparente, acompañado del texto "No hay alertas pendientes de revisión".

**Esqueleto de carga (Skeleton)**:
Tres tarjetas con la clase `animate-pulse h-20 bg-[#252522]/65` simulando la disposición del contenido.

**Lista de alertas** (`id="behavior-alerts-list"`): Disposición vertical mediante `space-y-3`.

## Decisiones Técnicas Pendientes

Ninguna.
