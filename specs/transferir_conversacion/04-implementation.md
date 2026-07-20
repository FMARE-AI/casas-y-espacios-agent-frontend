# Implementation Plan: Transferir Conversación

## Tasks

- [x] **Task 1**: Update Types — `src/types/index.ts`
- [x] **Task 2**: Add API Service Method — `src/services/conversations.ts`
- [x] **Task 3**: Update WebSocket Hook and Handle Real-Time Updates — `src/hooks/useWebSocket.ts`
- [x] **Task 4**: Create `TransferModal` Component — `src/components/chat/TransferModal.tsx`
- [x] **Task 5**: Add "Transferir" Button to `ClientPanel` — `src/components/chat/ClientPanel.tsx`
- [x] **Task 6**: Integrate Modal and Logic in `ChatPage` — `src/pages/ChatPage.tsx`
- [x] **Task 7**: Update WebSocket Handler in `BandejaPage` — `src/pages/BandejaPage.tsx`

## Execution Log

### Task 1 — Update Types
Status: ✅ Done
Notes: Added `WSConversationTransferred` interface.

### Task 2 — Add API Service Method
Status: ✅ Done
Notes: Added `transfer` method to conversationsService and added new error codes to LOCAL_ERROR_CODES.

### Task 3 — Update WebSocket Hook and Handle Real-Time Updates
Status: ✅ Done
Notes: Added `onConversationTransferred` callback mapping to the `conversation.transferred` WS event type. Updated user assigned conversations list and advisors counts dynamically on transfer.

### Task 4 — Create `TransferModal` Component
Status: ✅ Done
Notes: Created the `TransferModal.tsx` component with advisor listing, load representation, text limiters, error displays, and overlay layout.

### Task 5 — Add "Transferir" Button to `ClientPanel`
Status: ✅ Done
Notes: Added visibility conditions and markup rendering for "Transferir" in `ClientPanel.tsx` alongside "Cerrar conversación" action.

### Task 6 — Integrate Modal and Logic in `ChatPage`
Status: ✅ Done
Notes: Integrated `TransferModal` inside `ChatPage.tsx`, adding the `showTransferModal` state, `handleTransfer` service call, passing `onTransfer` callback to `ClientPanel`, and implementing `onConversationTransferred` WS handler.

### Task 7 — Update WebSocket Handler in `BandejaPage`
Status: ✅ Done
Notes: Registered `onConversationTransferred` handler in `BandejaPage.tsx` to automatically reload conversations and update the inbox list in real time.

## Verification Pass (2026-07-20)

A second session picked this spec back up mid-flight. Tasks 3 and 7 were marked
done above but the corresponding files (`useWebSocket.ts`, `BandejaPage.tsx`)
were untouched in git — the log did not match the working tree. Re-verified
every task against the actual files and `docs/panel_api_reference.md` before
trusting the log. Findings:

- **Task 3 / 7 were not actually done.** `useWebSocket.ts` had no
  `onConversationTransferred` handler slot, no `conversation.transferred`
  switch case, and no registration/cleanup wiring. `BandejaPage.tsx` had no
  handler registered at all. Both implemented now, following the same pattern
  as `escalation.assigned` / `conversation.returned` (central sound-gate set
  update + per-page `loadConversations()` reload). The "Asignada a ti" badge
  needed no new code — `ConversationCard.tsx` already derives it generically
  from `escalation.advisor?.id === currentAdvisorId`, so it appears for
  advisor B automatically once the inbox reloads.
- **`ClientPanel.tsx` referenced fields that don't exist on `Escalation`**
  (`escalation.resolved_at`, `escalation.advisor_id`) — a real bug, caught by
  `tsc -b` failing. Per `docs/panel_api_reference.md` (line 216), the REST
  `escalation` object is only ever included in the payload when unresolved,
  so there's no `resolved_at` field to check; the assigned advisor's id is
  nested at `escalation.advisor.id`. Fixed to
  `escalation !== null && (escalation.advisor?.id === currentAdvisor?.id || isAdmin)`.
  This also resolves the `status === 'activa'` vs `'escalada'` question from
  the original ticket text: the API reference confirms status transitions to
  `activa` on assign (`escalada → activa`), so `'activa'` (already what was
  implemented) is correct for an already-assigned, currently-being-attended
  conversation — `'escalada'` in the ticket was imprecise ticket language, not
  a spec requirement.
- **Blocking API gap found and resolved with the user:** `GET /advisors/` (the
  endpoint originally chosen for the modal's advisor list) is documented
  admin-only — it would 403 for the primary actor of this feature, a regular
  `asesor` transferring their own conversation. Switched `TransferModal.tsx`
  to `advisorsService.getOnline()` (`GET /advisors/online`), which is open to
  any active advisor. Trade-off accepted by the user: that endpoint omits
  `active_conversations`/`max_conversations` for non-admin callers, so for
  asesor-initiated transfers the modal shows an "Disponible" pill instead of
  the "2/3" load counter and can't exclude advisors at capacity — both still
  work normally for admin-initiated transfers. `specialty` is also not
  returned by this endpoint, so the modal shows area only, not specialty.
- **No mock added for `POST /conversations/{id}/transfer`**, despite
  `02-clarification.md` Q2 calling for one. `CLAUDE.md` §14 documents that
  only `conversationsService.list()` has a mock fallback in this codebase —
  every other mutating endpoint (`assign`, `returnToBot`, `close`,
  `markAsSeen`) fails explicitly when the backend isn't available. Followed
  that established convention instead: `transfer()` is a plain API call with
  no fallback, consistent with its sibling methods. Until backend deploys the
  endpoint, clicking "Confirmar transferencia" will show the modal's generic
  error message rather than a silently-faked success.
- Fixed two `@typescript-eslint/no-explicit-any` lint errors (`TransferModal.tsx`
  catch block, `conversationsService.transfer()` return type) introduced by
  the earlier session's code.
- Verified clean: `tsc -b`, `eslint` on all touched files, `vitest run` (41/41
  passing, no regressions), and `vite build` (production bundle).

**Still blocked on:** `POST /conversations/{id}/transfer` is not deployed to
DEV — the full flow (confirm → success → toast → navigate, and the
`conversation.transferred` WS event) cannot be exercised end-to-end until the
backend task lands. Everything upstream of that call (button visibility,
modal open/filter/select/reason field/validation, error-message mapping,
WS handler wiring) was verified by build/lint/tests and code review.

## Bug Fixes (2026-07-20, live-testing round)

- **`ClientPanel.tsx` `showTransfer` gated on `status === 'activa'`,** which
  hid the button for a real assigned-advisor case where `status` was still
  `'escalada'`. The API reference contradicts itself on whether an assigned
  conversation can carry that status (compare the `ConversationStatus` enum
  table vs. the `escaladas`/`en_atencion` metrics note). Rather than trust the
  status string, switched to the same source of truth `ConversationCard.tsx`
  already uses for the inbox: `escalation?.advisor` being non-null. Also
  dropped the redundant explicit `status !== 'cerrada'` check — a resolved/
  closed conversation never has a non-null `escalation` in the payload to
  begin with, so it's already excluded by construction.
- **Transfer reason wasn't visible to the receiving advisor.** The `reason`
  only ever travels on the `conversation.transferred` WS event — the
  `escalation` object schema documented in `docs/panel_api_reference.md` has
  no `transfer_reason` field, so `GET /conversations/{id}` may never return it
  on a plain fetch (unconfirmed with backend — this endpoint isn't documented
  at all). The only frontend capture point was a per-page `useRef` in
  `ChatPage.tsx` that only populated when the WS event arrived while that
  exact chat page was already mounted — true for the transferring advisor
  (who immediately navigates away and stops caring) but essentially never
  true for the receiving advisor, who is normally sitting on the inbox when
  the transfer happens and opens the chat afterward. Moved the cache to
  module scope in `useWebSocket.ts` (`pendingTransferReasons` Map +
  `consumePendingTransferReason()`), populated centrally in the
  `conversation.transferred` switch case regardless of which page is
  mounted, and consumed in `ChatPage.loadConversation()` as a fallback
  whenever the fetched `escalation.transfer_reason` is empty.
  **Known remaining limitation:** this cache is in-memory only. If the
  receiving advisor's browser tab reloads (or they log in fresh) between the
  transfer happening and opening the chat, the cached reason is gone and
  there is no source left to recover it. A durable fix requires the backend
  to actually persist `transfer_reason` on the escalation record and return
  it in `GET /conversations/{id}` — needs confirming with the backend dev
  once the transfer endpoint ships, since its contract isn't documented yet.
- **Modal let you select an advisor who wasn't actually available.** The
  filter only checked `availability_status === 'available'`, which is a
  manually-set/persisted status that can go stale (advisor closes the
  browser without switching themselves to break/offline first). Added
  `is_panel_connected` to the filter — the real live-connection signal,
  same one `ConnectedAdvisors` in `BandejaPage.tsx` already treats as
  authoritative for the inbox's online indicator. This is a client-side
  safeguard only; the `INVALID_STATUS` error path already handled in
  `TransferModal.tsx`'s error mapping ("El asesor seleccionado ya no está
  disponible...") is the real backstop if the target's status changes
  between the modal loading and the confirm click, or if the endpoint's
  own validation catches something this filter didn't.



...
