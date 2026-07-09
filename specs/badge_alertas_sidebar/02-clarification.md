# Clarifications: Badge de Alertas en Sidebar

## Questions & Answers

**Q1: ¿Cómo debe comportarse el badge si hay más de 99 alertas?**  
A: Debe mostrar "99+" para evitar deformaciones del contenedor visual en el Sidebar.

**Q2: ¿Cuándo y cómo se decrementa el conteo de alertas?**  
A: El decremento ocurre en `GestionPage.tsx` cuando el administrador marca una alerta como revisada llamando a `alertsService.markReviewed(alertId)` y luego a `decrementAlerts()` de `wsStore`.

**Q3: ¿Se debe mostrar el badge de alertas en la Bandeja de Entrada?**  
A: No, el badge en la Bandeja de Entrada corresponde a conversaciones asignadas/pendientes. El conteo de alertas de comportamiento sin revisar (`unreadAlerts`) debe mostrarse exclusivamente en "Gestión Asesores" para administradores.

**Q4: ¿Qué pasa si la consulta inicial al backend falla?**  
A: Debe fallar de forma silenciosa (fail silently) y dejar el badge en 0 sin interrumpir la renderización del Sidebar.

## Open Decisions
Ninguno. Los requisitos son claros y han sido provistos de forma detallada por el usuario.
