# Implementation Plan: BehaviorAlertsPanel

## Tasks

- [x] **Task 1**: Add `decrementAlerts` action to `wsStore.ts`
- [x] **Task 2**: Create `src/components/gestion/BehaviorAlertsPanel.tsx`
- [x] **Task 3**: Mount panel in `src/pages/GestionPage.tsx`
- [x] **Task 4**: Verify `npx tsc --noEmit` — zero errors

## Execution Log

### Task 1 — wsStore.ts: decrementAlerts
Status: ✅ Done
Notes: Added interface field and implementation. Clamps at 0 with Math.max.

### Task 2 — BehaviorAlertsPanel.tsx
Status: ✅ Done
Notes: Created with MOCK_ALERTS fallback, Intl.DateTimeFormat for Bogotá tz,
useWebSocket({ onBehaviorAlert }) with useCallback([]), reviewingIds Set for
button disable state. Uses alert.advisor.id/full_name per actual BehaviorAlert type.

### Task 3 — GestionPage.tsx
Status: ✅ Done
Notes: Imported BehaviorAlertsPanel, mounted below advisors table with divider.
Panel guards internally (returns null if role !== admin).

### Task 4 — Type check
Status: ✅ Done
Notes: npx tsc --noEmit — zero errors.
