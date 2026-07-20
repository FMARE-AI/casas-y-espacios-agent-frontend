# Spec: Transferir Conversación

## Problem
Currently, advisors have no direct way to transfer a conversation to another advisor if the customer changes the topic of interest (e.g., a customer who initially contacted about billing/portfolio queries now asks about property maintenance). If the topic changes, the current advisor must either manually try to coordinate or ask the client to start a new query, which degrades user experience and loses the conversation history context.

## Goals
- Provide a "Transferir" button in the right-side client panel of the chat.
- Allow the assigned advisor or any administrator to transfer an active conversation directly to another available advisor.
- Present a modal listing available advisors who have capacity, showing their name, specialty/area, and current workload.
- Provide an optional field to input the reason for transfer (up to 500 characters).
- Maintain real-time sync via WebSockets so that the transferring advisor, receiving advisor, and admins see the updated state immediately, with sound alerts only for the receiving advisor.

## Non-Goals
- Transferring to advisors who are inactive, unavailable, or already at their maximum conversation capacity.
- Transferring to oneself.
- Transferring closed conversations.
- Creating a separate page or route for transfer workflow (it must be a modal in the chat view).

## Expected Behavior

### 1. Visibility of the "Transferir" Button
The button is located in the right-side panel (within `ClientPanel.tsx` or similar) next to "Devolver al bot" and "Cerrar conversación".
It is rendered in the DOM if and only if all of these conditions are met:
- `conversation.status === 'activa'`
- An active escalation exists: `escalation !== null && escalation.resolved_at === null`
- The logged-in advisor is the assigned advisor (`escalation.advisor_id === currentAdvisor.id`) OR the advisor's role is `admin`.
- The bot does not have control: `bot_activo === false`

### 2. Modal Interface ("Transferir conversación")
Clicking "Transferir" opens a modal overlay:
- Calls `advisorsService.list()` (frontend filters: `availability_status === 'available'`, `is_active === true`, and excludes the currently assigned advisor).
- Excludes advisors where `active_conversations >= max_conversations`.
- Lists each candidate with: full name, specialty/area, and load representation (e.g., `"2 / 3 conversaciones"`).
- Highlights the selected advisor.
- If list is empty: shows "No hay asesores disponibles en este momento. Intenta de nuevo en unos minutos." and a "Cancelar" button.
- Includes an optional textarea for the transfer reason (max 500 characters, placeholder: `"El cliente ahora pregunta por mantenimiento del inmueble"`).
- "Confirmar transferencia" button (only active when an advisor is selected) and "Cancelar" button.

### 3. API Request and Response
- Clicking "Confirmar transferencia" calls `POST /api/v1/panel/conversations/{id}/transfer` with `{ target_advisor_id, reason }`.
- While waiting, the button shows a spinner/loading state (`"Transfiriendo..."`).
- **Success (200)**: Close modal, show toast `"Conversación transferida a [Nombre]"`, navigate back to `/bandeja`.
- **Failure**: Keep modal open, show error message in the modal, restore button state.

### 4. Real-time WebSocket Updates (`conversation.transferred`)
When the server emits `conversation.transferred`:
- **Source Advisor (A)**: If on the chat page of the transferred conversation, navigate to `/bandeja`. If already in the inbox (`/bandeja`), remove the conversation card.
- **Target Advisor (B)**: Add the conversation to the inbox with the badge "Asignada a ti" and trigger the notification chime (sound only for Advisor B).
- **Admins**: Update the inbox card to display the new assigned advisor.

## Constraints
- Do not use complete state spread (`{...state}`) to modify state, as per codebase rules.
- Fetch available advisors using `advisorsService.list()`, not direct fetch.
- Modal must use the project's existing overlay pattern (do not use `position: fixed` directly if a wrapper pattern exists).
- If the backend endpoint is not yet deployed, fallback to API mocks.

## Priority
High — Essential for proper team collaboration and handling multi-topic client chats without forcing restarts.
