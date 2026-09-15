# Clarifications: Control Manual de Conversación (Activar/Desactivar Bot)

## Questions & Answers

**Q1: ¿Cómo debe verse/comportarse el control en la UI — un toggle único o dos botones separados?**
A: Dos botones separados. "Tomar control manual" (visible cuando el bot está activo, variant `bot`) y "Devolver al Bot" (ya existente, visible cuando el asesor tiene el control, variant `assigned`) — evita ambigüedad de estado, cada botón solo aparece en su variant correspondiente.

**Q2: ¿Los admins (rol `admin`) también deben poder tomar control manual, o se mantienen solo en modo monitoreo/lectura como hoy?**
A: Se mantiene el comportamiento actual — los admins siguen en variant `monitoring`, sin botones de acción. No se toca `getChatVariant()` para el caso `role === 'admin'`. El backend sí soporta que un admin tome control (Q1 de `human_handover_direct_control`), pero exponerlo en la UI queda fuera de alcance de este ciclo.

**Q3: ¿El botón "Tomar control manual" debe pedir confirmación (modal) o actuar de inmediato?**
A: Con modal de confirmación, igual patrón que `ReturnBotModal` — ambas acciones notifican al cliente por WhatsApp y cambian el estado de la conversación, así que ambas piden confirmar antes de ejecutar. Se crea un componente nuevo `TakeControlModal` (mismo estilo visual que `ReturnBotModal`, sin `backdrop-blur`).

**Q4: ¿El evento WebSocket `conversation.control_taken` ya tiene un handler en el Frontend?**
A: No — `useWebSocket.ts` no lo maneja hoy (solo están cableados `message.new`, `escalation.new`, `escalation.assigned`, `conversation.returned`, `conversation.closed`, `advisor.status_changed`, `behavior.alert`). Hay que agregar el caso nuevo, replicando el patrón de `conversation.returned`.

## Open Decisions
- Texto exacto del botón y del modal de confirmación (copy) — se define en `03-design.md`, consistente con el tono "usted" de `ReturnBotModal` en la UI del panel (nota: el panel interno usa "tú" hacia el asesor, no "usted" — eso es solo para copy hacia el cliente final vía WhatsApp, §3.19 backend no aplica al panel).
- Manejo del caso 409 `CONVERSATION_NOT_ACTIVE` (conversación cerrada entre que se abrió el chat y se hizo clic) — mapear a un toast de error y recargar, mismo patrón que `BOT_ALREADY_ACTIVE` en `handleReturnBot`.
- Si conviene invalidar/recargar la lista de la bandeja (`BandejaPage`) cuando se recibe `conversation.control_taken` para una conversación que no se está viendo actualmente — se resuelve en diseño.

## Actualización — Contrato detallado provisto por el usuario (2026-09-15)

El usuario entregó un contrato técnico completo que reemplaza varias decisiones anteriores. Documentado aquí para no perder la trazabilidad.

**Q5: ¿El control (toggle) va en el header o en el panel lateral (`ClientPanel`)?**
A: En el **header** de `ChatPage.tsx`, no en `ClientPanel`. Muestra "Bot activo" o "Control manual — {advisor.full_name}" siempre visible al abrir la conversación (el dato ya viene en el `GET` inicial, no hace falta intentar tomar control para descubrir que otro lo tiene).

**Q6: ¿El estado de control vive en un store global nuevo?**
A: El usuario pidió "guardarlo en el store global de la conversación activa, no en estado local del header". Investigación: **no existe hoy un store global de conversación** — `conversation` vive en `useState` dentro de `ChatPage.tsx` y se sincroniza vía los handlers de `useWebSocket` (mismo patrón que `messages`). Decisión: no se crea un store Zustand nuevo (evita duplicar el patrón ya establecido y los riesgos documentados en CLAUDE.md §15 sobre stores). El header y `ClientPanel` siguen siendo presentacionales, derivan `bot_activo`/`escalation` directamente del `conversation` que ya vive en `ChatPage` — eso satisface el espíritu del pedido (una sola fuente de verdad, nada de estado duplicado en el header) sin introducir infraestructura nueva.

**Q7 (revierte Q2 de la sección original): ¿Los admins tienen acceso de escritura completo?**
A: **Sí** — confirmado por el usuario. El backend ya bypassea el chequeo de ownership para `role == "admin"` en `/reply`, `/return-bot`, `/close` y no aplica ningún chequeo en `/take-control`. Se elimina el hardcode `if (role === "admin") return "monitoring"` de `getChatVariant()` en `ChatPage.tsx`. Un admin puede tomar control, escribir y devolver el control en cualquier conversación no cerrada, sea o no el dueño del control.

**Q8 (revierte Q3 de la sección original): ¿Modal de confirmación al tomar control?**
A: **No** — confirmado por el usuario. Clic directo, sin modal, igual que el botón "Tomar Conversación" (assign) existente. Difiere de "Devolver al Bot", que sí mantiene su modal (`ReturnBotModal`, sin cambios, fuera de alcance).

**Q9: ¿Refetch tras tomar control con éxito?**
A: No — la respuesta 200 del `PATCH /take-control` ya trae `escalation.advisor_id`/`advisor_name`; se actualiza el estado local directo con eso. Solo se hace un refetch (`GET /conversations/{id}`) en el caso de error `409 CONTROL_ALREADY_TAKEN`, para obtener el nombre y `escalated_at` reales del actor que ganó la carrera.

## Open Decisions — resueltas
- Copy del mensaje de aviso al cliente (handover): no hay soporte especial en backend — es un `outbound_advisor` normal con `advisor_name`, se renderiza como cualquier otro mensaje de asesor (sin componente especial).
- Tipo `Escalation.advisor` en `types/index.ts` estaba tipado como `Advisor | null` (objeto completo) pero el backend nunca envía ese shape completo en este campo (solo `{id, full_name}`, a veces `+area+specialty` en la lista) — se angosta a una interfaz `EscalationAdvisorRef { id, full_name }` porque es el único shape que todo el código realmente usa (verificado por grep: ningún consumidor lee `.area`/`.role`/etc. de `escalation.advisor`).
