# Spec: Badge de Alertas en Sidebar

## Problem
El panel de control carece de una indicación visual en tiempo real en la barra lateral para alertar a los administradores sobre nuevas alertas de comportamiento detectadas en los asesores (por ejemplo, lenguaje inapropiado, tono agresivo). Actualmente, el administrador debe entrar a la sección de Gestión de Asesores para saber si hay alertas pendientes.

## Goals
- Mostrar un badge rojo con el conteo de alertas de comportamiento sin revisar junto al ítem de navegación "Gestión Asesores" en el Sidebar.
- Restringir la visibilidad del badge únicamente a usuarios con rol `admin`.
- Inicializar el conteo de alertas sin revisar al cargar la aplicación/Sidebar haciendo una consulta eficiente al backend.
- Mantener el conteo sincronizado en tiempo real a través de WebSockets cuando se reciben nuevas alertas.
- Decrementar el contador en tiempo real cuando un administrador marque una alerta como revisada.

## Non-Goals
- Desarrollar la lógica de WebSocket para el evento `behavior.alert` (ya está implementada en el store).
- Implementar el diseño completo de la página de gestión de asesores (ya existe).

## Expected Behavior
- Cuando un administrador inicia sesión o refresca la página, el Sidebar consulta la base de datos (mediante `alertsService.list` con `reviewed=false` y `limit=1`).
- El badge muestra el número total de alertas sin revisar. Si el número es mayor a 99, muestra "99+".
- Si el contador es 0 o el rol del usuario no es `admin`, el badge permanece oculto.
- Al recibir un evento WebSocket de alerta, el conteo incrementa de forma automática (gestionado por el store).
- Al revisar una alerta en la página de Gestión de Asesores, el conteo se decrementa en 1 en tiempo real.

## Constraints
- El conteo en el store no debe descender de 0 (usar `Math.max(0, ...)`).
- La consulta inicial debe ser ligera utilizando `limit: 1` para no traer datos de alertas innecesarios.
- No debe haber errores de TypeScript (`tsc --noEmit`).

## Priority
High — Mejora clave para la experiencia del administrador y la monitorización de alertas.
