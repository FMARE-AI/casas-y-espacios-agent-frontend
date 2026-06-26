# Clarifications: Conectar Historial de Conversaciones Cerradas

## Questions & Answers

**Q1: ¿Cómo se deben formatear y mostrar visualmente los valores de la columna "¿El cliente está satisfecho?" en la tabla?**
A: ["Sí" en verde, "No" en rojo, "Sin confirmar" en gris]

**Q2: ¿Cómo se deben exportar los valores de satisfacción en el CSV?**
A: [en texto plano formateado "Sí", "No", "Sin confirmar"]

**Q3: Para visualizar el texto completo de las notas de resolución al hacer click, ¿es preferible que se expanda directamente la fila en la tabla de forma inline o que se abra un modal/tooltip flotante?**
A: [Lo que creas que sea mejor y más cómodo para el usuario]

**Q4: ¿Dónde es el lugar idóneo para colocar el comentario TODO sobre el bug de `closed_at` en el backend?**
A: [junto a la función helper de formateo de fecha `formatClosedDate`]

## Open Decisions
- Ninguna adicional.
