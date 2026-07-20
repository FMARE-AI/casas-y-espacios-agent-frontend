# Clarifications: Transferir Conversación

## Questions & Answers

**Q1: How should the WebSocket event `conversation.transferred` be structured to support the required updates?**
A: Since the backend changes are in progress, we define the payload for the WebSocket event as follows:
```typescript
export interface WSConversationTransferred {
  conversation_id: string
  source_advisor_id: string
  target_advisor_id: string
  target_advisor_name: string
  reason?: string | null
  channel?: string
}
```
This contains all fields needed for:
- Advisor A (source) to match `source_advisor_id` and navigate/remove.
- Advisor B (target) to match `target_advisor_id` and add conversation + play chime.
- Admins to update the card with `target_advisor_name` and `target_advisor_id`.

**Q2: How should the API mock handle the transfer endpoint?**
A: We will mock the `conversationsService.transfer` endpoint to simulate a successful transfer after a brief delay (e.g., 800ms) when `VITE_USE_MOCKS` or similar local development settings are active, or if the server returns a 404/501 because the endpoint isn't deployed yet.

**Q3: What are the criteria for the target advisor list filtering in the frontend?**
A: 
- `availability_status === 'available'`
- `is_active === true`
- `id !== currentEscalation.advisor_id` (cannot transfer to current owner)
- `active_conversations < max_conversations` (exclude advisors at maximum capacity)

**Q4: Should the modal close on press of the Escape key?**
A: Following the existing patterns in the workspace (like `SessionExpiredModal` or `ReturnBotModal`), we will restrict closing to clicking the "Cancelar" button or the overlay backdrop to avoid accidental closures.

## Open Decisions
None. All requirements, visual specs, and WebSocket behaviors are defined.
