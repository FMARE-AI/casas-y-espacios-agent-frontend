# Aclaraciones: Panel de Alertas de Comportamiento (BehaviorAlertsPanel)

## Preguntas y Respuestas

**P1: La especificación inicial mencionaba `alert.advisor_id` y `alert.advisor_name` para los filtros y la visualización. Sin embargo, `BehaviorAlert` en `src/types/index.ts` define `advisor` como un objeto `Advisor` anidado. ¿Cuál es el correcto?**
R: La tipificación de TypeScript es la fuente de verdad. Se debe usar `alert.advisor.id` para el filtro de asesores y `alert.advisor.full_name` para la visualización y obtención de iniciales en el avatar.

**P2: La especificación solicita llamar a `decrementAlerts()` en el `wsStore`, pero esa acción no existe actualmente. El almacén `wsStore` solo tiene `incrementAlerts()` y `resetAlerts()`. ¿Cómo debemos manejar el decremento al descartar alertas?**
R: Se debe agregar la acción `decrementAlerts: () => set((s) => ({ unreadAlerts: Math.max(0, s.unreadAlerts - 1) }))` en el `wsStore`. Es una adición de una sola línea en el almacén existente.

**P3: La especificación hace referencia al campo `alert.created_at`, pero la definición del tipo en TypeScript utiliza `detected_at`. ¿Cuál nombre de campo se debe utilizar?**
R: Se debe utilizar `alert.detected_at`, ya que es el campo real estructurado en el tipo `BehaviorAlert` e integrado con el backend.

**P4: La especificación menciona el uso de `registerWSHandlers({ onBehaviorAlert: ... })`, pero esa función no existe en `useWebSocket.ts`. ¿Cómo debe conectarse el manejador de WebSocket?**
R: Utilizando el patrón de registro de manejadores existente: `useWebSocket({ onBehaviorAlert: fn })`. El hook ya registra y limpia los manejadores en el objeto global de registro `_handlers`. La función pasada debe estar envuelta en `useCallback` para evitar re-registros innecesarios en cada renderizado (según la Regla 5 del apartado 15 de `CLAUDE.md`).

**P5: ¿Cómo debe realizarse el formateo de fecha al horario de Bogotá usando `date-fns`?**
R: Dado que `date-fns` está instalado, analizamos la fecha en formato ISO UTC con `parseISO`, la convertimos localmente a la zona horaria `America/Bogota` mediante `toLocaleString`, y luego usamos `format` para construir los textos "Hoy, hh:mm a", "Ayer, hh:mm a", o "dd/MM/yyyy hh:mm a" según corresponda.

**P6: `GestionPage` no verifica actualmente el rol `role === 'admin'` antes de renderizarse. ¿Esta validación debe agregarse a nivel de página o de componente?**
R: El componente `BehaviorAlertsPanel` se encargará de leer el rol del `useAuthStore` y retornar `null` si no es un administrador. De esta forma, `GestionPage` permanece limpio, requiriendo únicamente el montaje de `<BehaviorAlertsPanel advisors={advisors} />` al final de su estructura.

**P7: ¿Debe mostrarse un estado de carga o deshabilitado en el botón "Marcar revisada" mientras la petición a la API está en curso?**
R: Sí. Se debe llevar un registro de los IDs de alerta cuyas peticiones de revisión estén en curso en un estado local del tipo `Set<string>` (`reviewingIds`). El botón se deshabilitará mientras el ID de la alerta esté presente en dicho conjunto, y mostrará un spinner de carga en sustitución del icono de check.

**P8: ¿Cómo deben manejarse los errores de backend como `ALREADY_REVIEWED` o `ALERT_NOT_FOUND` al marcar una alerta como revisada?**
R: Si la API devuelve un error `409 ALREADY_REVIEWED` o `404 ALERT_NOT_FOUND`, capturamos el código de error en el bloque catch, removemos la alerta de la lista del cliente y decrementamos el contador de alertas pendientes en el almacén de Zustand de forma silenciosa, sin mostrar ningún toast o alerta de error al administrador. Otros tipos de errores técnicos rehabilitarán el botón para permitir un nuevo intento.

## Decisiones Abiertas

Ninguna — todas las ambigüedades técnicas y de diseño han sido resueltas en los puntos anteriores.
