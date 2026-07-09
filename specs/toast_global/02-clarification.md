# Clarification: Toast Global de Operaciones Exitosas

## Preguntas y Respuestas de Diseño

### Q1: ¿Cómo se maneja el estado de la notificación sin caer en prop-drilling?
**R**: Para mantener el estado global de forma limpia y consistente con el resto de la aplicación (que utiliza Zustand para la autenticación y estado del WebSocket), utilizaremos un almacén Zustand dedicado (`toastStore`) que exponga los métodos y variables del estado.

### Q2: ¿Cuál debe ser el orden de visualización en caso de que existan múltiples notificaciones?
**R**: El Toast de Operación Exitosa tendrá un z-index de `998`, mientras que el Toast de Nueva Escalación (que es una alerta crítica y requiere atención inmediata) se mantendrá en `999`. Esto asegura que las alertas críticas siempre queden por encima en caso de coincidir en pantalla.

### Q3: ¿Cómo se implementa la animación de entrada y salida?
**R**: En lugar de montar/desmontar el componente interrumpiendo la animación de CSS, el componente permanecerá en el DOM pero transicionará su posición en el eje X (`translate-x-0` cuando se muestre, y `translate-x-[400px]` cuando esté oculto) junto con transiciones de CSS fluidas.
