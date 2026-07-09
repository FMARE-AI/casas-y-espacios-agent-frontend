# Implementation Plan: Advisors Management Integration

## Tasks

- [x] **Task 1**: Add `specialty?: string | null` to `Advisor` interface — `src/types/index.ts`
- [x] **Task 2**: Implement `list()`, `create()`, `update()` in advisors service — `src/services/advisors.ts`
- [x] **Task 3**: Add `active_conversations` column to table — `src/components/management/AdvisorsTable.tsx`
- [x] **Task 4**: Add `specialty` field with dynamic options and validation — `src/components/management/AdvisorModal.tsx`
- [x] **Task 5**: Wire specialty into submit flow; handle warning; fix deactivate modal copy — `src/pages/GestionPage.tsx`
- [x] **Task 6**: Verify `npx tsc --noEmit` passes

## Execution Log

### Task 1 — Add specialty to Advisor type
Status: ✅ Done
Notes: Added `specialty?: string | null` to `Advisor` interface in `src/types/index.ts`.

### Task 2 — Implement service methods
Status: ✅ Done
Notes: Implemented `list()` (GET with optional params), `create()` (POST, 201), `update()` (PATCH, returns warning). Types updated to include `specialty`.

### Task 3 — active_conversations column
Status: ✅ Done
Notes: Added "Conv. Activas" column after "Límite Conv."; skeleton row updated; colSpan bumped to 7.

### Task 4 — Specialty field in modal
Status: ✅ Done
Notes: Added SPECIALTY_OPTIONS_BY_AREA constant; specialty select with dynamic options; .superRefine() validation on both schemas; useRef guard prevents specialty reset on initial load; disabled state for area=ambas.

### Task 5 — GestionPage wiring
Status: ✅ Done
Notes: AdvisorSubmitData gains specialty; handleCreate/handleEdit pass specialty; handleDeactivate reads warning and shows toast.warning; extractErrorCode helper extracted; DeactivateModal copy fixed; ModalState simplified (removed unused checkbox field).

### Task 6 — TypeScript check
Status: ✅ Done
Notes: `npx tsc --noEmit` — no errors.
