# Clarifications: Advisors Management Integration

## Questions & Answers

**Q1: The task references `src/components/gestion/AdvisorsTable.tsx` and `src/components/gestion/AdvisorModal.tsx`, but these files don't exist. The actual files are at `src/components/management/AdvisorsTable.tsx` and `src/components/management/AdvisorModal.tsx`. `GestionPage.tsx` already imports from `management/`. Which path should be modified?**

A: The user confirmed to proceed with the task as-is. Interpreting as: modify the existing files at `src/components/management/`. Renaming the folder would require updating all imports and provides no functional benefit. Noted in design.

**Q2: The `Advisor` interface in `src/types/index.ts` lacks a `specialty` field, but the API returns it and the modal needs to show it. Should `src/types/index.ts` be modified even though it's not listed in the task's "ARCHIVOS QUE SE MODIFICAN"?**

A: Yes. Adding `specialty?: string | null` to `Advisor` is required for the modal to work and for TypeScript to pass. The file list in the task is the minimum set; `types/index.ts` is an implicit dependency.

**Q3: When the admin changes the `area` field in the modal, should `specialty` auto-reset to null?**

A: Yes. When `area` changes via user interaction (not on initial load), `specialty` is reset to `null` to avoid sending an invalid combination. Implemented via `useEffect` watching `area` with a `setValue('specialty', null)` call guarded by a ref that skips the initial render.

**Q4: Should the `active_conversations` column appear before or after `max_conversations`?**

A: After `max_conversations`, since both are capacity-related. Column header: "Conv. Activas". Format: show just the number, styled as the existing `max_conversations` cell.

**Q5: The `DeactivateModal` currently hardcodes "Este asesor tiene conversaciones asignadas activas." — but that's not always true (the admin can deactivate an idle advisor too). Should this copy change?**

A: Yes. The warning copy should be generic: "Al desactivar a este asesor, quedará sin acceso al panel. Las conversaciones activas asignadas quedarán sin asesor." This covers both cases without assuming there are active conversations.

## Open Decisions

- None — all ambiguities resolved.
