# Spec: Toast y Sonido de Alerta de Nuevas Escalaciones

## 1. Descripción General (WHAT & WHY)
Cuando un cliente requiere atención personalizada en WhatsApp, el bot de IA del backend escala la conversación al Panel Web Interno, emitiendo un evento en tiempo real `escalation.new` a través de WebSocket. 

El sistema necesita una notificación visual y sonora de alta prioridad en pantalla (Toast) para alertar de inmediato a los asesores. Este toast permitirá a cualquier asesor tomar el control de la conversación ("Atender ya") o descartar la alerta ("Ignorar") de manera ágil. El sonido llama la atención del asesor incluso si está en otra pestaña del panel.

## 2. Requerimientos de Usuario
- **Notificación Visual de Alta Prioridad**: Debe mostrarse un Toast en la parte superior derecha de la pantalla con un borde rojo característico (`#FF5B5B`) e icono de campana animado (`animate-bounce`).
- **Alerta Sonora**: Se debe emitir una alerta sonora (ya integrada en el WebSocket hook) al recibir el evento.
- **Acciones Disponibles**:
  - **Atender ya**: Dirige de inmediato al asesor al chat correspondiente (`/chat/{conversationId}`) y descarta el toast.
  - **Ignorar**: Cierra el toast manualmente sin alterar el estado del chat.
- **Auto-descarte**: El toast se descartará automáticamente tras 8 segundos de inactividad.
- **Evitar Superposiciones**: Tendrá un z-index de `999` (superior a las notificaciones informativas de z-index `998`) para posicionarse siempre al frente.
