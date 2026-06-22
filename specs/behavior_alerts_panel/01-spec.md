# Spec: BehaviorAlertsPanel

## Problem

The moderation module detects inappropriate advisor messages and stores them as
`BehaviorAlert` records. Admins have no UI surface to review these alerts,
dismiss them, or navigate to the conversation where they occurred.

## Goals

- Show all unreviewed behavior alerts in the admin section of GestionPage
- Allow the admin to mark alerts as reviewed (removes them from the list)
- Allow client-side filtering by advisor and by severity
- Keep the sidebar badge (`wsStore.unreadAlerts`) synchronized: decrement when
  an alert is marked reviewed, increment on `behavior.alert` WS event (already
  handled by `useWebSocket`)
- Reload the alert list automatically when a new `behavior.alert` WS event arrives

## Non-Goals

- Editing or deleting alerts (only mark-as-reviewed)
- Pagination beyond the initial 50-alert limit
- Showing already-reviewed alerts
- Mobile-only layout optimizations beyond Tailwind responsive utilities

## Expected Behavior

1. Admin opens GestionPage. Below the advisors table a new card appears:
   "Alertas de Comportamiento".
2. The card loads unreviewed alerts from the API. A skeleton shows while loading.
3. If no alerts exist (or all are filtered out), an empty state is shown.
4. The admin can filter by advisor (select) and by severity (select). Both
   filters apply on the client — no new API calls.
5. Each alert card shows: advisor initials avatar, advisor name, alert-type chip,
   severity chip, truncated message, Bogotá-formatted date, and two actions:
   "Ver conversación" (navigates to /chat/{id}) and "Marcar revisada".
6. Clicking "Marcar revisada" calls the API. On success the alert is removed from
   the list and `decrementAlerts()` is called on wsStore.
7. When a new `behavior.alert` WS event fires, the list is reloaded from the API.

## Constraints

- Only visible when `role === 'admin'` (read from `useAuthStore`)
- Must follow CLAUDE.md §12: all code in English; user-facing strings in Spanish
- Must follow CLAUDE.md §16: no store-as-dependency antipattern; stable WS handler
- Palette: `#FF5B5B`, `#FFB84D`, `#00D4AA`, `#01A4E3`, `#8B8FA8`, `#3A3A37`,
  `#2E2E2B`, `#252522`, `#1D1D1B`, `#F0F0F5`
- `date-fns-tz` is NOT installed — use `Intl.DateTimeFormat` for Bogotá timezone
- `BehaviorAlert.advisor` is a nested `Advisor` object (not flat `advisor_id`)
- `wsStore` needs a new `decrementAlerts()` action

## Priority

High — admins currently have no way to act on moderation findings.
