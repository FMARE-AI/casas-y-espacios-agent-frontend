# Design: Notification Scope Fix (escalation.new sound)

## Overview

Add an eligibility check for the `escalation.new` WebSocket event handler in
`src/hooks/useWebSocket.ts`, gating both the notification sound and the
`EscalationToast` (currently ungated) behind the rules resolved in
`02-clarification.md`. No backend changes, no new store fields — the
`Advisor` object already in `authStore` carries every field needed
(`area`, `active_conversations`, `max_conversations`, `availability_status`).

## Components

### New / Modified Files

| File | Role | Change type |
|------|------|-------------|
| `src/hooks/useWebSocket.ts` | Add `isEligibleForEscalation()` helper; use it to gate `playNotificationSound()` and `setPendingEscalation()` inside the `escalation.new` case | Modify |

### Key Abstractions

**`isEligibleForEscalation(advisor: Advisor | null, escData: WSEscalationNew): boolean`**
— module-level pure function (no side effects, easily unit-testable), placed
near `playNotificationSound()` in `useWebSocket.ts`.

Logic:
1. `advisor === null` → `false` (defensive default — no session info yet).
2. `advisor.role === 'admin'` → `false` (unconditional, preserves existing rule).
3. `escData.advisor_id !== null` (already assigned) → `advisor.id === escData.advisor_id`. No area/capacity/availability check — the backend already decided the recipient.
4. `escData.advisor_id === null` (queued) → all of:
   - `advisor.area === escData.channel || advisor.area === 'ambas'`
   - `advisor.active_conversations < advisor.max_conversations`
   - `advisor.availability_status === 'available'`

### Data Flow

1. `escalation.new` event arrives over the socket.
2. `ws.onmessage` reads `advisor = useAuthStore.getState().advisor`.
3. Compute `eligible = isEligibleForEscalation(advisor, escData)`.
4. If `eligible`:
   - `playNotificationSound()`
   - `useWSStore.getState().setPendingEscalation({...})` (unchanged payload)
5. If not `eligible`: neither runs.
6. `_handlers.onEscalationNew?.(escData)` (used by `BandejaPage` to refresh
   the conversation list/counts) **keeps firing unconditionally**, regardless
   of eligibility — the bandeja's queue counts are cross-area information,
   not a personal "this is for you" signal, and gating it was explicitly
   scoped out (only sound + toast per Q3 in `02-clarification.md`).

### API / Interface Contracts

No public signatures change. `isEligibleForEscalation` is internal to
`useWebSocket.ts` (not exported) — it has no reason to be used elsewhere per
today's scope.

### Edge Cases & Error Handling

- `advisor` is `null` (race: WS event arrives before `getMe()` resolves on
  page load) → not eligible, fails closed (no sound/toast). Matches existing
  defensive pattern already used for `isAdmin` checks in this file.
- `escData.channel` holds an unexpected string not in `AdvisorArea` (backend
  sends a value the frontend doesn't recognize) → `advisor.area === escData.channel`
  is `false` for every advisor except those with `area === 'ambas'`, so it
  fails closed rather than throwing.
- Capacity exactly at the limit (`active_conversations === max_conversations`)
  → not eligible (strict `<`, matching the backend's own `MAX_CONVERSATIONS_REACHED` semantics).
- `availability_status` holds any value other than `'available'` (including
  future values not yet in the union) → not eligible, fails closed.
- Admin check stays first in the function so admin exclusion can never be
  bypassed by any combination of the other conditions.

## Open Questions for Implementation

None — all ambiguities were resolved in `02-clarification.md`.
