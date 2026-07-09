# Design: Perfil Page Integration

## Overview

Two files require changes. `advisors.ts` gets `updateAvailability` implemented (one HTTP call). `PerfilPage.tsx` gets three targeted fixes: the mount loading strategy, the `status_until` timezone bug, and the `passwordError` field placement. No new files, no new abstractions.

## Components

### New / Modified Files

| File | Role | Change type |
|------|------|-------------|
| `src/services/advisors.ts` | Implement `updateAvailability` | Modify |
| `src/pages/PerfilPage.tsx` | Fix loading strategy, fix timezone, fix error placement, fix `selectedMinutes` init | Modify |

### Key Abstractions

No new abstractions. All changes are targeted fixes to existing functions.

**`advisorsService.updateAvailability(status, minutes?)`**
- Calls `PATCH /api/v1/panel/advisors/me/availability`
- Body: `{ availability_status: status, minutes: minutes ?? null }`
- Returns `{ availability_status }` from `response.data.data`
- Throws on 400 `INVALID_STATUS` or network errors

**`formatStatusUntil(statusUntil: string): string`** (fix existing)
- Appends `-05:00` to the naive string before `new Date()`
- Formats with `Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", ... })`

## Data Flow

### Mount

1. `PerfilPage` mounts → check `storeAdvisor` from `useAuthStore((s) => s.advisor)`.
2. If non-null → hydrate `advisor`, `nameValue`, `selectedStatus`, `selectedMinutes` from `storeAdvisor` synchronously → set `isLoading(false)`.
3. If null → call `advisorsService.getMe()`, show skeleton, hydrate on success.

### Inline name save (blur / Enter)

1. User blurs or presses Enter → `handleNameBlur`.
2. Guard: if `nameValue.trim() === advisor?.full_name` → no-op.
3. `setIsSavingName(true)` → call `advisorsService.updateMe({ full_name: nameValue.trim() })`.
4. On success → `setAdvisor(updated)`, `setNameValue(updated.full_name)`, `setStoreAdvisor(updated)`.
5. On error → `setNameValue(advisor?.full_name ?? "")`.
6. Always → `setIsSavingName(false)`.

*(Already implemented. No changes unless type errors surface.)*

### Password change

1. Form submit → `onPasswordSubmit`.
2. `advisorsService.updateMe({ current_password, new_password })`.
3. On success → `setPasswordSuccess(true)`, `reset()`, auto-dismiss after 3 s.
4. On `INVALID_CURRENT_PASSWORD` → `setPasswordError("La contraseña actual es incorrecta")`.
5. `passwordError` passed as `error` prop to the "Contraseña actual" `PasswordInput` (priority over client-side validation error).
6. Remove the standalone `{passwordError && <p>...}` paragraph that currently sits below both inputs.

### Availability change

1. User clicks status pill or "Aplicar" button → `handleApplyStatusDirectly(status, minutes)`.
2. `setIsSavingStatus(true)`.
3. Call `advisorsService.updateAvailability(status, minutes)`.
4. On success → call `advisorsService.getMe()` → update `advisor` and `storeAdvisor`.
5. `setSelectedStatus(refreshed.availability_status)`.
6. `setSelectedMinutes` according to: available→null, has `status_until`→30, no `status_until` & not available→null.
7. `toast.success("Disponibilidad actualizada")`.
8. On error → `toast.error("No se pudo actualizar la disponibilidad")`.
9. Always → `setIsSavingStatus(false)`.
10. Sidebar dot updates independently via WS `advisor.status_changed`.

## API / Interface Contracts

```ts
// advisors.ts — updateAvailability
async updateAvailability(
  status: AvailabilityStatus,
  minutes?: number | null
): Promise<{ availability_status: AvailabilityStatus }>

// PATCH /api/v1/panel/advisors/me/availability
// Body: { availability_status: status, minutes: minutes ?? null }
// Response 200: { "data": { "availability_status": "break" } }
// Error 400: { "detail": { "code": "INVALID_STATUS", ... } }
```

## Edge Cases & Error Handling

- **Empty name on blur** → guard `!nameValue.trim()` → revert to original, no save.
- **Name unchanged on blur** → guard `nameValue.trim() === advisor?.full_name` → no-op.
- **Availability error** → toast error, leave `selectedStatus` at the visually-selected value (user sees what they selected but it wasn't saved — acceptable UX).
- **`status_until` null or undefined** → `formatStatusUntil` never called (guarded by `{advisor?.status_until && ...}`).
- **`status_until` malformed** → `formatStatusUntil` try/catch returns `"--:--"`.
- **`getMe()` fails after availability update** → toast still shows success (availability was updated); `status_until` display may be stale.
- **`storeAdvisor` null on mount** → shows skeleton, fetches profile; if fetch also fails, silently hides skeleton (current behavior preserved).
- **`INVALID_STATUS` from availability** → treated as generic error (toast), not surfaced as field error (no field for that in the UI).

## Open Questions for Implementation

None.
