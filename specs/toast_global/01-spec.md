# Spec: Toast Global de Operaciones Exitosas

## 1. Descripción General (WHAT & WHY)
El sistema requiere una interfaz de retroalimentación inmediata, consistente y no intrusiva para notificar al asesor que una acción u operación en el Panel Web Interno se ha completado de manera exitosa. 

Actualmente, las interacciones críticas (tales como la creación o actualización de asesores, el cambio de contraseñas de seguridad, o la revisión de alertas) carecen de una confirmación visual global. Este componente resolverá dicha carencia proporcionando una notificación tipo "Toast" reutilizable desde cualquier punto de la aplicación.

## 2. Requerimientos de Usuario
- **Consistencia Visual**: El Toast debe presentarse en la parte superior derecha de la pantalla y debe ser estéticamente coherente con el diseño corporativo oscuro.
- **Auto-descarte**: La notificación debe cerrarse sola tras 4 segundos para evitar saturar la interfaz del usuario.
- **Acceso Global**: Debe poder invocarse desde cualquier componente de la aplicación sin necesidad de pasar props de forma manual (sin prop-drilling).
- **Control de Superposición**: No debe superponerse con notificaciones de mayor prioridad (como alertas de nuevas escalaciones).
