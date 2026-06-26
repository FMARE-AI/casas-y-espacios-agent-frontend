# Clarifications: Conectar Métricas del Dashboard Admin

## Questions & Answers

**Q1: ¿Qué comportamiento se espera en la UI si el rol del asesor cambia o no es "admin"?**
A: Las métricas no son visibles para asesores regulares, por lo que el componente `MetricsDashboard` no se renderiza. Si se recibe un error 403, el servicio lo manejará devolviendo `null` silenciosamente y el componente no se mostrará.

**Q2: ¿Cómo debe comportarse el formateador del tiempo promedio de resolución y el porcentaje de efectividad del bot cuando son 0?**
A: Si `tiempo_promedio_min` es `0`, se mostrará `"— m"`. Si `bot_ok_pct` es `0`, se mostrará `"—%"`. Para cualquier otro valor mayor que cero se mostrarán normalmente (`"X m"` y `"X%"`).

**Q3: ¿Se deben actualizar las métricas en cada evento de WebSocket?**
A: No. Para optimizar el rendimiento y evitar llamadas innecesarias, solo se deben refrescar en dos eventos específicos de WebSocket: `escalation.assigned` (cuando una conversación es tomada por un asesor) y `conversation.closed` (cuando una conversación es cerrada).

**Q4: ¿Cómo se gestionan las fallas de base de datos (500 Supabase Error)?**
A: El servicio de métricas interceptará el error y devolverá un objeto con las métricas en cero (`metrics: { activas: 0, escaladas: 0, ... }`) de modo que el panel se dibuje con ceros y no se interrumpa el flujo de trabajo del administrador.

## Open Decisions
- Ninguna adicional.
