# Clarifications: Notification Scope Fix (escalation.new sound)

## Questions & Answers

**Q1: Cuando `escalation.new` trae `advisor_id` no nulo (ya asignada a un asesor específico), ¿el sonido debe sonarle solo a ese asesor (bypass del filtro de área/capacidad), o debe seguir aplicando el filtro incluso en ese caso?**
A: Si ya está asignado (`advisor_id !== null`), solo ese asesor asignado escucha el sonido — match exacto por `advisor.id === escData.advisor_id`, sin evaluar área/capacidad/disponibilidad (el backend ya decidió el destinatario).

**Q2: Además de área+capacidad, ¿el `availability_status` del asesor (available/break/offline) también debe filtrar el sonido de `escalation.new`?**
A: Sí — solo asesores con `availability_status === 'available'` deben sonar. Un asesor en `break` u `offline` no debe sonar por una escalación nueva.

**Q3: El `EscalationToast` visual (`setPendingEscalation`) hoy se dispara para todos los asesores conectados igual que el sonido. ¿Debe aplicar el mismo filtro de alcance que el sonido, o queda fuera de esta spec?**
A: Debe aplicar el mismo filtro que el sonido — consistencia entre sonido y toast visual.

**Q4 (seguimiento — resolviendo una aparente contradicción entre Q1 y Q2): para el caso en cola (`advisor_id === null`), ¿"la escuchan todos menos el admin" significa literalmente todos los asesores conectados no-admin, o "todos los elegibles" (área=`channel` o `'ambas'` + con capacidad + `available`) menos el admin?**
A: "Todos los elegibles" menos el admin. El filtro de área+capacidad+availability_status aplica igual para el caso en cola. La frase "todos menos el admin" se refería a los asesores que ya cumplen esos criterios, no a la totalidad de conectados sin filtrar.

## Resolved Rule Set

Con las respuestas anteriores, la regla completa para `escalation.new` queda:

1. **Admin** → nunca suena ni ve el toast. (Ya funciona hoy — no tocar esa parte.)
2. **`advisor_id !== null` (ya asignada)** → solo suena/toast para el asesor cuyo `id === advisor_id`. No se evalúa área/capacidad/disponibilidad — el backend ya decidió el destinatario.
3. **`advisor_id === null` (en cola)** → suena/toast para todo asesor no-admin que sea simultáneamente:
   - `advisor.area === escData.channel || advisor.area === 'ambas'`
   - `advisor.active_conversations < advisor.max_conversations`
   - `advisor.availability_status === 'available'`
4. El toast (`setPendingEscalation`) usa exactamente el mismo criterio de elegibilidad que el sonido — si no le suena, tampoco debe ver el toast.

## Open Decisions

Ninguna pendiente — el conjunto de reglas anterior queda como base para la Fase 3 (diseño técnico).
