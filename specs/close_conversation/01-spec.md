# Spec: Close Conversation

## Problem
Advisors who have taken a conversation have no way to mark it as closed from the chat panel.
Currently only the bot or the backend can close conversations. This forces advisors to leave conversations open indefinitely after resolving the client's issue, degrading the quality of the closed-conversations history and making audit/reporting unusable.

## Goals
- Allow an advisor to close a conversation they own directly from the chat interface.
- Capture structured resolution metadata (type, notes, client satisfaction) at the moment of closing, to feed the history and future reporting.
- Show the resolution data in HistorialPage so auditors can see how each conversation was resolved.

## Non-Goals
- Admin closing conversations they don't own (admin is read-only monitoring — no close action).
- Bulk close from BandejaPage.
- Editing resolution data after closing.
- Any backend implementation — this spec covers only the frontend.

## Expected Behavior

### Advisor flow
1. Advisor is in ChatPage with `variant === 'assigned'` (own conversation).
2. A "Cerrar conversación" button appears below the "Devolver al Bot" button in the ClientPanel right sidebar.
3. Clicking the button opens a classification modal (does not close immediately).
4. Modal presents:
   - 8 resolution-type options (radio-style buttons), default: `otro`.
   - Optional free-text notes field (max 500 chars), with live char counter.
   - 3 client-satisfaction options (`si`, `no`, `sin_confirmar`), default: `sin_confirmar`.
5. Advisor selects options and clicks "Confirmar cierre":
   - Spinner appears on the button; button disabled.
   - Calls `PATCH /conversations/{id}/close` with `{ resolution_type, resolution_notes, client_satisfied }`.
   - On success: modal closes, navigates to bandeja (`/`).
6. Clicking "Cancelar" closes the modal with no action.
7. Escape key does NOT close the modal (consistent with ReturnBotModal pattern).

### HistorialPage
- "Motivo / Resolución" column now shows `resolution_type` (formatted label) instead of `intent`.
- If `resolution_notes` is set, show it truncated below the label (max-w-[200px], title tooltip).
- New "Cerrado por" (or existing "Resolutor") column shows "Bot" in green when `closed_by === 'bot'`, or advisor full name otherwise.

## Constraints
- Button only visible when `variant === 'assigned'` (asesor owns the conversation).
- Admin (`role === 'admin'`) always gets `variant === 'monitoring'` — button is never shown.
- `onClose` prop in `ClientPanel` is already used for mobile panel close — must not be reused; new prop needed.
- Must follow Zustand rules (sections 15–16 of CLAUDE.md): no store as dep, no written value in deps.
- No `localStorage`, no `fetch` directly, no inline schemas outside `types/`.
- `npx tsc --noEmit` must pass after changes.
- Mock fallback: if `conversationId.startsWith('conv-') || === 'demo'`, simulate close locally without calling the backend.

## Priority
High — conversations accumulate without a close mechanism, making the history useless and the advisors' workload appear inflated.
