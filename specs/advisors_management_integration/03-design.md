# Design: Advisors Management Integration

## Overview

Five files are modified to wire the existing GestionPage UI to the real backend. The service layer gets three real HTTP implementations. The Advisor type gains `specialty`. The table gets an `active_conversations` column. The modal gets a dynamic specialty select with client-side validation. GestionPage gets the warning-toast flow on deactivation. No new files are created.

## Components

### New / Modified Files

| File | Role | Change type |
|------|------|-------------|
| `src/types/index.ts` | Add `specialty` to `Advisor` interface | Modify |
| `src/services/advisors.ts` | Implement `list()`, `create()`, `update()` | Modify |
| `src/components/management/AdvisorsTable.tsx` | Add `active_conversations` column | Modify |
| `src/components/management/AdvisorModal.tsx` | Add `specialty` field, dynamic options, area/specialty validation | Modify |
| `src/pages/GestionPage.tsx` | Add `specialty` to submit types; handle warning; fix deactivate copy | Modify |

### Key Abstractions

**`SPECIALTY_OPTIONS_BY_AREA`** (constant inside `AdvisorModal.tsx`)
- Maps `AdvisorArea` → allowed specialty values (strings) for building `<option>` list.
- `ambas` maps to `[]` (no specialty allowed — select disabled or shows "Ninguna").

**Schema refinement in `AdvisorModal`**
- Both `createSchema` and `editSchema` gain `.superRefine()` that validates `specialty` against `area`.
- Error path: `['specialty']` so react-hook-form shows the error under the specialty field.

**`advisorsService.update()` return type**
- Returns `{ advisor: Advisor; warning?: string | null }` so `GestionPage` can read the warning and pass it to a toast.

## Data Flow

### Create Advisor
1. Admin opens modal → fills `fullName`, `email`, `password`, `role`, `area`, optionally `specialty`, `maxConversations`.
2. Changing `area` resets `specialty` to `null` via controlled `onChange`.
3. On submit, zod `.superRefine()` validates specialty/area — error shown under specialty field if invalid.
4. `GestionPage.handleCreate()` calls `advisorsService.create(data)`.
5. On 201 → `toast.success` + `setModal({ type: 'none' })` + `loadAdvisors()`.
6. On 409 `EMAIL_ALREADY_EXISTS` → `setModalError('EMAIL_ALREADY_EXISTS')` (modal stays open, error shown under email field).
7. On other error → `setModalError(message)`.

### Edit Advisor
1. Admin clicks "Editar" → modal opens pre-filled with advisor data including `specialty`.
2. Admin edits fields → submits.
3. `GestionPage.handleEdit()` calls `advisorsService.update(id, data)`.
4. On 200 → `toast.success` + close + reload.
5. On 400 `INVALID_SPECIALTY_FOR_AREA` → `setModalError('Especialidad inválida para el área seleccionada.')`.
6. On 404 → generic error toast.

### Deactivate Advisor
1. Admin toggles switch off → `DeactivateModal` opens (generic warning copy — no assumption about active convs).
2. Admin confirms → `handleDeactivate(id)` calls `advisorsService.update(id, { is_active: false })`.
3. On success: read `response.warning`. If non-null → `toast.warning(response.warning)`.
4. `setModal({ type: 'none' })` + `loadAdvisors()`.
5. On any error → `toast.error(message)`.

## API / Interface Contracts

```typescript
// src/services/advisors.ts

type AdvisorListParams = { role?: string; area?: string; is_active?: boolean }

type CreateAdvisorData = {
  email: string
  password: string
  full_name: string
  role: string
  area: string
  specialty?: string | null
  max_conversations?: number
}

type UpdateAdvisorData = {
  full_name?: string
  role?: string
  area?: string
  specialty?: string | null
  max_conversations?: number
  is_active?: boolean
}

// Returns warning field for deactivation flow
advisorsService.list(params?: AdvisorListParams): Promise<{ advisors: Advisor[] }>
advisorsService.create(data: CreateAdvisorData): Promise<{ advisor: Advisor }>
advisorsService.update(id: string, data: UpdateAdvisorData): Promise<{ advisor: Advisor; warning?: string | null }>
```

```typescript
// AdvisorModal — AdvisorFormData gains specialty
interface AdvisorFormData {
  fullName: string
  email?: string
  password?: string
  role: 'asesor' | 'admin'
  area: 'administrativa' | 'comercial' | 'ambas'
  specialty: string | null
  maxConversations: number
}
```

```typescript
// GestionPage — AdvisorSubmitData gains specialty
interface AdvisorSubmitData {
  fullName: string
  email?: string
  password?: string
  role: 'asesor' | 'admin'
  area: 'administrativa' | 'comercial' | 'ambas'
  specialty: string | null
  maxConversations: number
}
```

## Edge Cases & Error Handling

- `active_conversations = 0` from API → render "0", no error, no special styling.
- Specialty select when `area = 'ambas'` → select is disabled, value forced to `null`.
- When `area` changes, specialty resets to `null` to avoid stale invalid values.
- `EMAIL_ALREADY_EXISTS` → modal stays open; error shows under email field (via `error` prop already wired, rendered by the "Error al guardar" banner; the banner is sufficient for email errors since email is read-only in edit mode).
- `CANNOT_EDIT_YOURSELF` (403) → should not happen if the edit button is hidden for the authenticated advisor. Handled defensively as a generic error toast.
- `ADVISOR_NOT_FOUND` (404) → generic error toast (race condition: advisor deleted by another session).
- Warning on deactivation → `toast.warning()` is distinct from `toast.success()` and uses Sonner's yellow/amber styling.

## Open Questions for Implementation

- None.
