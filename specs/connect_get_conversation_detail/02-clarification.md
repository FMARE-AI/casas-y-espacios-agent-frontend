# Clarifications: Connect GET /conversations/{id} (TASK-4)

**Q: How should we render the transcription of an audio message?**
A: According to `docs/panel_api_reference.md`, the transcription must NOT be displayed as the message text. We will hide it by default and provide a collapsible "Ver transcripción" button below the audio player for advisors who wish to read it.

**Q: How do we determine the chat variant?**
A: We follow these rules in order:
1. If the current advisor's role is `admin`, the variant is always `monitoring` (readonly mode).
2. If the conversation has `bot_activo = true`, the variant is `bot` (readonly mode).
3. If `bot_activo = false`, and the conversation's active escalation has an advisor, and that advisor's ID matches the logged-in advisor's ID, the variant is `assigned` (active chat with input enabled).
4. Otherwise (if `bot_activo = false` and either the escalation has no advisor or it is assigned to someone else), the variant is `unassigned` (readonly mode, banner "Debes tomar la conversación").

**Q: How will the scroll position be preserved when fetching older messages?**
A: In `loadMoreMessages`, before updating the state, we capture `container.scrollHeight`. After React updates the DOM with the prepended messages, we calculate the difference in `scrollHeight` and adjust `container.scrollTop` accordingly. This will be wrapped in a React effect or scheduled via `requestAnimationFrame` to ensure the DOM has completed layout.

**Q: Should we update the TypeScript typings?**
A: Yes, we need to add `transcription: string | null` to the `Message` interface in `src/types/index.ts`.
