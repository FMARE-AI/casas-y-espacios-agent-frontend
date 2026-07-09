# Especificación: Panel de Alertas de Comportamiento (BehaviorAlertsPanel)

## Problema

El módulo de moderación detecta mensajes inapropiados de los asesores y los registra como alertas de comportamiento (`BehaviorAlert`). Actualmente, los administradores no disponen de una interfaz en el panel web para revisar estas alertas, descartarlas o navegar directamente a la conversación donde ocurrieron.

## Objetivos

- Implementar `alertsService` para listar y revisar las alertas de comportamiento.
- Mostrar todas las alertas de comportamiento pendientes (sin revisar) en la sección de administración de `GestionPage`.
- Permitir al administrador marcar las alertas como revisadas (lo que las remueve de la lista).
- Permitir el filtrado en el cliente por asesor y por nivel de severidad.
- Mantener sincronizado el badge del sidebar (`wsStore.unreadAlerts`): decrementar cuando una alerta se marca como revisada, e incrementar cuando llega el evento de WebSocket `behavior.alert` (esto último ya es gestionado por `useWebSocket`).
- Recargar automáticamente la lista de alertas cuando se recibe el evento `behavior.alert` a través de WebSocket.

## Fuera de Alcance (Non-Goals)

- Editar o eliminar alertas (únicamente se permite marcarlas como revisadas).
- Paginación que supere el límite inicial de 50 alertas.
- Mostrar alertas que ya han sido revisadas.
- Optimizaciones de diseño exclusivas para dispositivos móviles más allá de las utilidades adaptables (responsive) de Tailwind CSS.

## Comportamiento Esperado

1. El administrador ingresa a `GestionPage`. Debajo de la tabla de asesores aparece una nueva tarjeta: "Alertas de Comportamiento".
2. La tarjeta carga las alertas sin revisar desde la API. Se muestra un esqueleto de carga (skeleton) mientras se realiza la petición.
3. Si no existen alertas (o todas son filtradas), se muestra un estado vacío con un ícono de check verde.
4. El administrador puede filtrar por asesor (selector) y por severidad (selector). Ambos filtros se aplican localmente en el cliente, sin realizar nuevas peticiones a la API.
5. Cada tarjeta de alerta muestra: avatar con iniciales del asesor, nombre del asesor, etiqueta del tipo de alerta, etiqueta de la severidad, fragmento del mensaje infractor, fecha formateada en horario de Bogotá, y dos acciones:
   - "Ver conversación" (redirige a `/chat/{id}`).
   - "Marcar revisada".
6. Al hacer clic en "Marcar revisada" se realiza una llamada a la API. Si tiene éxito, la alerta se elimina de la lista local y se ejecuta `decrementAlerts()` en el `wsStore`.
7. Si la API retorna un error `ALREADY_REVIEWED` (409) o `ALERT_NOT_FOUND` (404), la alerta también se elimina de la lista local y se decrementa el badge, sin mostrar ningún banner de error o alerta al usuario.
8. Cuando se dispara un evento de WebSocket con el tipo `behavior.alert`, la lista se vuelve a cargar silenciosamente desde la API.

## Restricciones

- Solo debe ser visible cuando `role === 'admin'` (leído desde `useAuthStore`).
- Cumplir con la sección 12 de `CLAUDE.md`: todo el código fuente en inglés, pero los textos visibles de cara al usuario en español.
- Cumplir con la sección 16 de `CLAUDE.md`: no utilizar el almacén completo como dependencia en hooks para evitar bucles infinitos; asegurar referencias estables para manejadores de WebSocket.
- Paleta de colores del diseño: `#FF5B5B` (Rojo), `#FFB84D` (Naranja), `#00D4AA` (Verde menta), `#01A4E3` (Azul), `#8B8FA8` (Gris texto), `#3A3A37` (Bordes), `#2E2E2B` (Fondos secundarios), `#252522` (Fondo panel), `#1D1D1B` (Fondos oscuros), `#F0F0F5` (Texto principal).
- Formateo de fechas: usar `date-fns` adaptado al huso horario de Bogotá:
  - Hoy → "Hoy, HH:MM AM/PM"
  - Ayer → "Ayer, HH:MM AM/PM"
  - Otro → "DD/MM/YYYY HH:MM AM/PM"
- El objeto `BehaviorAlert.advisor` es una entidad anidada del tipo `Advisor` (no un ID plano `advisor_id`).
- El almacén `wsStore` requiere una acción `decrementAlerts()`.

## Prioridad

Alta — Actualmente los administradores no tienen forma de visualizar ni gestionar los hallazgos de moderación del sistema.
