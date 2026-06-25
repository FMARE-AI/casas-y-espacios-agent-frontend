# Spec: Perfil Page Integration

## Problem

`PerfilPage` exists as a UI shell but is not wired to the real backend. Two service methods are stubs (`updateAvailability` throws), and the page has a timezone parsing bug for `status_until`. Advisors cannot manage their profile, password, or availability through the real API.

## Goals

- Load advisor profile data from `authStore` on mount (no redundant network call); fall back to `GET /advisors/me` only when `storeAdvisor` is null.
- Inline name editing: blur/Enter saves via `PATCH /advisors/me`; Escape cancels.
- Password change: `PATCH /advisors/me` with `current_password` + `new_password`; map `INVALID_CURRENT_PASSWORD` to an inline field error.
- Availability change: implement `advisorsService.updateAvailability()` via `PATCH /advisors/me/availability`; call `getMe()` afterwards to refresh `status_until`.
- Display `status_until` in Bogotá local time — NOT UTC (fix `formatStatusUntil`).
- Sidebar availability dot updates automatically via WebSocket `advisor.status_changed` — no manual store patch needed.

## Non-Goals

- Avatar upload changes — already working.
- Schedule manager changes — `ScheduleManager` component is out of scope.
- Any UI redesign beyond bug fixes and wiring.
- WebSocket connection management.

## Expected Behavior

### Loading
- If `authStore.advisor` is populated → hydrate page state immediately, skip fetch.
- If `authStore.advisor` is null → call `GET /advisors/me`, show skeleton during load.

### Inline name edit
- Click pencil icon → input becomes editable.
- Enter or blur → if name changed, call `PATCH /advisors/me { full_name }` with spinner; on success update `authStore.advisor.full_name`.
- Escape → revert to original without saving.
- On error → revert to original, no toast.

### Password change
- Submit form → call `PATCH /advisors/me { current_password, new_password }`.
- Success → green "Contraseña actualizada" for 3 s, form resets.
- `INVALID_CURRENT_PASSWORD` (either missing or wrong `current_password`) → error shown inline below the "Contraseña actual" field.

### Availability change
- Click status pill → if "Disponible", immediately apply + call `updateAvailability("available", null)`.
- For break/offline → show timer selector + "Aplicar" button → call `updateAvailability(status, minutes)`.
- After any successful update → call `getMe()` to refresh `status_until` in the profile.
- Sidebar dot updates independently via WS.

### `status_until` display
- Field is a naive ISO string in Bogotá local time (no TZ suffix). Treat it by appending `-05:00` before parsing to avoid UTC interpretation. Format in `es-CO` locale, `America/Bogota` TZ.

## Constraints

- All code in English (CLAUDE.md §3.12).
- API contract: `{ "data": { ... } }` envelope — access `response.data.data`.
- `updateAvailability` response only returns `{ availability_status }` — must call `getMe()` separately for `status_until`.
- Do not set `Content-Type` on FormData requests (already handled by avatar upload).
- `npx tsc --noEmit` must pass.

## Priority

High — PerfilPage is broken (throws on availability change) and ships with a timezone display bug.
