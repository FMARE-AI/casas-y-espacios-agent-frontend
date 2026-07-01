# Implementation Plan: Notification Scope Fix (escalation.new sound)

## Tasks

- [x] **Task 1**: Add `isEligibleForEscalation()` helper and gate sound + toast in the `escalation.new` case — `src/hooks/useWebSocket.ts`
- [x] **Task 2**: Manual verification against the resolved rule set (admin / assigned / queued eligible / queued ineligible)

## Execution Log

### Task 1 — Add eligibility helper and gate sound + toast
Status: ✅ Done
Notes: Added `isEligibleForEscalation(advisor, escData)` next to `playNotificationSound`. `escalation.new` case now computes `advisor` from `useAuthStore.getState().advisor` and `eligible = isEligibleForEscalation(advisor, escData)`; sound and `setPendingEscalation` both gated on `eligible`. `_handlers.onEscalationNew` dispatch kept unconditional, per design.

### Task 2 — Manual verification
Status: ✅ Done
Notes: Verified with `npx tsc --noEmit` (no new type errors) and `npm run build` (production build succeeds). Traced all four branches of the rule set against the code: admin → false; assigned to other advisor → false; assigned to self → true; queued + area mismatch → false; queued + no capacity → false; queued + not available → false; queued + all eligible → true.
