# Design: BehaviorAlertsPanel

## Overview

A new `BehaviorAlertsPanel` component is mounted inside `GestionPage` below the
advisors table. It reads `role` from `useAuthStore` and renders nothing if the
user is not an admin. It fetches unreviewed alerts on mount, supports two
client-side filters (advisor, severity), renders each alert as a glassmorphism
card, and lets the admin mark alerts reviewed. It registers a `onBehaviorAlert`
WS handler (via `useWebSocket`) to reload the list when new alerts arrive.
One supporting change: `wsStore` gains a `decrementAlerts` action.

## Components

### New / Modified Files

| File | Role | Change type |
|------|------|-------------|
| `src/components/gestion/BehaviorAlertsPanel.tsx` | Full panel: state, filters, cards, WS handler | Create |
| `src/pages/GestionPage.tsx` | Mount `<BehaviorAlertsPanel advisors={advisors} />` | Modify |
| `src/store/wsStore.ts` | Add `decrementAlerts` action | Modify |

### Key Abstractions

**`BehaviorAlertsPanel`**
- Props: `{ advisors: Advisor[] }`
- Reads `role` from `useAuthStore` → returns `null` if not admin
- State: `alerts`, `isLoading`, `advisorFilter`, `severityFilter`, `reviewingIds: Set<string>`
- `loadAlerts()`: calls `alertsService.list({ reviewed: false, limit: 50 })`;
  on error falls back to `MOCK_ALERTS`
- `filteredAlerts` memo: filters by `alert.advisor.id` and `alert.severity`
- `handleMarkReviewed(id)`: adds id to `reviewingIds`, calls API, on success
  removes from list and calls `decrementAlerts()`; on failure removes from
  `reviewingIds` only
- WS: `useWebSocket({ onBehaviorAlert: handleBehaviorAlert })` where
  `handleBehaviorAlert` is a `useCallback(() => loadAlerts(), [])` — stable ref

**`formatBogota(utcString: string): string`**
- Module-level helper, no deps
- Uses `Intl.DateTimeFormat` with `timeZone: 'America/Bogota'`
- Returns "Hoy, HH:MM AM/PM", "Ayer, HH:MM AM/PM", or "DD/MM/YYYY HH:MM AM/PM"

**`MOCK_ALERTS: BehaviorAlert[]`**
- Three realistic mock entries covering all three `AlertType` values and all
  three `AlertSeverity` values, used as `.catch()` fallback in `loadAlerts`

**`decrementAlerts` in wsStore**
- `() => set((s) => ({ unreadAlerts: Math.max(0, s.unreadAlerts - 1) }))`

### Data Flow

1. `GestionPage` mounts → loads advisors list → passes `advisors` to
   `<BehaviorAlertsPanel advisors={advisors} />`
2. `BehaviorAlertsPanel` mounts → `useEffect` calls `loadAlerts()`
3. `loadAlerts` fetches from `alertsService.list({ reviewed: false, limit: 50 })`
4. On success: `setAlerts(result.alerts)` + `setIsLoading(false)`
5. On failure: `setAlerts(MOCK_ALERTS)` + `setIsLoading(false)`
6. `filteredAlerts` memo re-runs on filter change (no network call)
7. Admin clicks "Marcar revisada" → id added to `reviewingIds` → `alertsService.markReviewed(id)` called
8. On success: remove from `alerts`, call `useWSStore.getState().decrementAlerts()`
9. On failure: remove id from `reviewingIds`, leave `alerts` unchanged
10. WS `behavior.alert` event fires → `handleBehaviorAlert` callback → `loadAlerts()` re-fetches

### API / Interface Contracts

```typescript
// alertsService (existing — no changes)
alertsService.list({ reviewed: false, limit: 50 }): Promise<PaginatedAlerts>
// PaginatedAlerts = { alerts: BehaviorAlert[], total: number }

alertsService.markReviewed(id: string): Promise<{ alert: BehaviorAlert }>

// wsStore additions
decrementAlerts: () => void

// BehaviorAlertsPanel props
interface BehaviorAlertsPanelProps {
  advisors: Advisor[]
}
```

### Edge Cases & Error Handling

- API down on mount → fall back to `MOCK_ALERTS` so panel renders in dev
- `markReviewed` fails → button re-enabled, alert stays in list, no toast
  (silent fail per moderation fail-open policy)
- All alerts filtered out → show empty state (same as zero alerts)
- `reviewingIds` prevents double-clicking "Marcar revisada" on same alert
- `decrementAlerts` clamps at 0 to avoid negative badge counts
- WS handler is a stable `useCallback` with `[]` deps to satisfy CLAUDE.md §15 Regla 5

### Visual Spec

**Section wrapper** (`id="behavior-alerts-section"`):
```
bg-[#252522]/60 border border-[#3A3A37] rounded-xl p-6
```

**Alert card** (`id="behavior-alert-item"`):
```
bg-[#252522]/65 border border-[#3A3A37]/50 rounded-lg p-4
flex items-start gap-3
hover:border-[#FF5B5B]/30 transition
```

**Type chips** (`id="alert-type-chip"`):
```
lenguaje_inapropiado    → bg-[#FF5B5B]/15 text-[#FF5B5B]
tono_agresivo           → bg-[#FFB84D]/15 text-[#FFB84D]
comportamiento_inadecuado → bg-[#FFB84D]/10 text-[#FFB84D]/80
```

**Severity chips** (`id="alert-severity-chip"`):
```
alta  → bg-[#FF5B5B]/15 text-[#FF5B5B]
media → bg-[#FFB84D]/15 text-[#FFB84D]
baja  → bg-[#8B8FA8]/15 text-[#8B8FA8]
```

**Empty state** (`id="behavior-alerts-empty"`):
Green check icon, "No hay alertas pendientes de revisión"

**Skeleton**: 3 × `animate-pulse h-20` cards

**Alert list** (`id="behavior-alerts-list"`): `space-y-3`

## Open Questions for Implementation

None.
