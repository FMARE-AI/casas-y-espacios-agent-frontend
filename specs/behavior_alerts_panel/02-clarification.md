# Clarifications: BehaviorAlertsPanel

## Questions & Answers

**Q1: The spec mentions `alert.advisor_id` and `alert.advisor_name` for
filtering and display. But `BehaviorAlert` in `src/types/index.ts` defines
`advisor` as a nested `Advisor` object. Which is correct?**
A: The TypeScript type is the source of truth. Use `alert.advisor.id` for the
advisor filter and `alert.advisor.full_name` for display and initials.

**Q2: The spec calls `decrementAlerts()` on `wsStore`, but that action does not
exist. `wsStore` only has `incrementAlerts()` and `resetAlerts()`. How to handle
dismissal count?**
A: Add `decrementAlerts: () => set((s) => ({ unreadAlerts: Math.max(0, s.unreadAlerts - 1) }))`
to `wsStore`. This is a one-line change to the existing store.

**Q3: The spec references `alert.created_at`, but the type definition uses
`detected_at`. Which field name should be used?**
A: Use `alert.detected_at` — that is the field defined in `BehaviorAlert`.

**Q4: The spec uses `registerWSHandlers({ onBehaviorAlert: ... })`, but that
function does not exist in `useWebSocket.ts`. How should the WS handler be wired?**
A: Use the existing handler pattern: `useWebSocket({ onBehaviorAlert: fn })`.
The hook already registers and cleans up handlers via the `_handlers` registry.
The handler must be wrapped in `useCallback` to avoid re-registering on every render
(see CLAUDE.md §15 Regla 5).

**Q5: `date-fns-tz` is not in `package.json`. Can it be installed?**
A: No — avoid adding a new dependency for a simple timezone display. Use
`Intl.DateTimeFormat` with `timeZone: 'America/Bogota'` plus day comparison
via native `Date` arithmetic. This is zero-dep and sufficient for the use case.

**Q6: GestionPage does not currently check for `role === 'admin'` before
rendering. Should the guard be added at the page level or in the panel?**
A: The panel itself will read `role` from `useAuthStore` and return `null` if
`role !== 'admin'`. This keeps GestionPage unchanged except for mounting
`<BehaviorAlertsPanel advisors={advisors} />`.

**Q7: Should "Marcar revisada" show a loading/disabled state while the API call
is in-flight?**
A: Yes — track a `Set<string>` of in-flight alert IDs (`reviewingIds`) so the
button goes disabled while the call is pending. No spinner needed — just disabled.

**Q8: What mock data should be used when the backend is unavailable?**
A: Use a `MOCK_ALERTS` constant (same pattern as `MOCK_SCHEDULES`) caught in the
`.catch()` of `loadAlerts`. This ensures the panel renders visually during
development without a live backend.

## Open Decisions

None — all ambiguities resolved above.
