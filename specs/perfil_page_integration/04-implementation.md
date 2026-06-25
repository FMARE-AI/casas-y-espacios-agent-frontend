# Implementation Plan: Perfil Page Integration

## Tasks

- [x] **Task 1**: Implement `advisorsService.updateAvailability()` — `src/services/advisors.ts`
- [x] **Task 2**: Fix mount loading strategy (read authStore first, fetch only as fallback) + fix `selectedMinutes` init — `src/pages/PerfilPage.tsx`
- [x] **Task 3**: Fix `formatStatusUntil` timezone bug (append `-05:00`) — `src/pages/PerfilPage.tsx`
- [x] **Task 4**: Fix `passwordError` placement (inline on "Contraseña Actual" field) — `src/pages/PerfilPage.tsx`
- [x] **Task 5**: TypeScript check — `npx tsc --noEmit`

## Execution Log

### Task 1 — Implement `updateAvailability`
Status: ✅ Done

### Task 2 — Fix mount loading strategy + `selectedMinutes` init
Status: ✅ Done
Notes: Uses `useAuthStore.getState().advisor` imperatively inside the effect (empty deps array, per CLAUDE.md §16 Regla 1). `selectedMinutes` init now distinguishes indefinite (`status_until === null`, non-available) → null vs has timer → 30.

### Task 3 — Fix `formatStatusUntil` timezone
Status: ✅ Done
Notes: Appended `-05:00` to the naive string before `new Date()`. Colombia is always UTC-5 (no DST). Added a one-line comment explaining the non-obvious invariant.

### Task 4 — Fix `passwordError` placement
Status: ✅ Done
Notes: `error={passwordError ?? errors.currentPassword?.message}` — server error takes priority over client-side validation. Removed the standalone `{passwordError && <p>...}` paragraph that was sitting below both inputs.

### Task 5 — TypeScript check
Status: ✅ Done
Notes: `npx tsc --noEmit` — zero errors.
