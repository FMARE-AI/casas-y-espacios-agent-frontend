# Spec: Advisors Management Integration

## Problem

`GestionPage` exists with its table and modal components, but three service methods (`list`, `create`, `update`) currently throw `NOT IMPLEMENTED` errors. As a result, the admin cannot see real advisors, create new ones, or edit existing ones — the entire management flow is broken. Additionally, the table doesn't show `active_conversations` per advisor, and the modal lacks the `specialty` field required by the API.

## Goals

1. Implement `advisorsService.list()` → `GET /api/v1/panel/advisors/` with optional `role`, `area`, `is_active` filters.
2. Implement `advisorsService.create()` → `POST /api/v1/panel/advisors/` with `specialty` included.
3. Implement `advisorsService.update()` → `PATCH /api/v1/panel/advisors/{id}` with `warning` response support.
4. Add `active_conversations` column to `AdvisorsTable`.
5. Add a `specialty` select field to `AdvisorModal` with dynamic options that change based on the selected `area`.
6. Frontend validates specialty/area combination before sending to the API (backend doesn't validate on POST).
7. Surface `EMAIL_ALREADY_EXISTS` (409) as an inline error on the email field without closing the modal.
8. Surface `INVALID_SPECIALTY_FOR_AREA` (400) as an inline error without closing the modal.
9. Show deactivation `warning` (from API response) as a toast after a successful deactivate.

## Non-Goals

- `PATCH /advisors/me` (already implemented).
- Availability status toggle (separate feature — `updateAvailability` remains a stub).
- Password change flow.
- Advisor profile page.
- Paginating the advisors list.

## Expected Behavior

**List:** On mount, GestionPage calls `advisorsService.list()`. The table shows all advisors with their `active_conversations` count. Filters (search, role, area) are applied client-side. If the count is 0 (RPC may fail per API docs), it shows "0" without error.

**Create:** Admin clicks "Crear Nuevo" → modal opens → fills form including optional specialty → submits. If email already exists, modal stays open and shows an inline error on the email field. On success, table reloads.

**Edit:** Admin clicks "Editar" → modal opens pre-filled → makes changes including specialty → submits. On success, table reloads.

**Deactivate:** Admin toggles the active switch off → deactivate confirmation modal opens → admin confirms → `update(id, { is_active: false })` is called → if response has `warning`, show it as a toast → table reloads.

**Specialty validation (client-side):**
| Area | Allowed specialties |
|---|---|
| `comercial` | `'comercial'` or `null` |
| `administrativa` | `'financiera'`, `'mantenimiento_contratos'`, or `null` |
| `ambas` | `null` only |

## Constraints

- Backend `POST /advisors/` does NOT validate specialty against area (documented inconsistency in api-reference). Frontend must validate before sending.
- `PATCH /advisors/{id}` DOES validate specialty — frontend validation prevents this error, but must still handle `INVALID_SPECIALTY_FOR_AREA` (400) defensively.
- `active_conversations` may be `0` if the Supabase RPC fails per advisor — treat as valid data, not an error.
- CLAUDE.md 3.12: all code in English. User-facing strings (labels, error messages) in Spanish.
- The `Advisor` type in `src/types/index.ts` currently lacks `specialty` — it must be added.
- Existing files to modify are at `src/components/management/` (not `gestion/` — see clarifications).

## Priority

High — the advisors management page is fully non-functional for the admin role.
