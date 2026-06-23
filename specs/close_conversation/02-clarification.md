# Clarifications: Close Conversation

## Questions & Answers

**Q1: `ClientPanel` already has `onClose?: () => void` — is that for mobile (close the panel) or for closing the conversation?**
A: It is for closing the **mobile side panel** (the X button on small screens). The new close-conversation action needs a separate prop, e.g. `onCloseConversation?: () => void`. The existing `onClose` must not be repurposed.

**Q2: Should the modal trap keyboard focus (Escape closes it)?**
A: No. Consistent with `ReturnBotModal`, Escape is suppressed — the advisor must explicitly click "Cancelar" or "Confirmar cierre".

**Q3: What happens on `id === 'demo'` or mock IDs when close is called?**
A: Simulate the close locally (update the mock conversation status to `'cerrada'`) and navigate to `/` — same fallback pattern as `assign` and `returnToBot`.

**Q4: Does `Conversation` type need new fields?**
A: Yes. `resolution_type`, `resolution_notes`, and `closed_by` are returned by the backend in closed conversations and need to be added to the `Conversation` interface in `types/index.ts` so HistorialPage can read them without casting.

**Q5: Should HistorialPage's "Resolutor" column be renamed to "Cerrado por"?**
A: Keep the existing column header "Resolutor" — avoid a visible rename to not break auditors' muscle memory. Internally, the logic changes to check `closed_by` first.

**Q6: `HistorialPage` currently reads `conv.intent` for the Motivo column. Should `intent` be replaced entirely or kept as fallback?**
A: Replace with `resolution_type` as primary. Fall back to `conv.intent` if `resolution_type` is absent (for old closed conversations that pre-date this feature).

**Q7: Which toast (if any) to show after a successful close?**
A: No explicit toast — navigating to the bandeja is the success confirmation. A `toast.error` is shown on failure (consistent with `handleTake` / `handleReturnBot`).

**Q8: Should `handleClose` in ChatPage also reload the conversation or just navigate away?**
A: Just navigate away — the conversation is closed, the advisor has no reason to stay on that screen.

## Open Decisions
None — all ambiguities resolved above.
