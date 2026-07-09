# Clarifications: Connect GET /conversations (TASK-3)

**Q: How do we handle channel casing?**
A: In `FilterBar.tsx`, the UI displays options like `"Administrativa"` and `"Comercial"`. The backend expects lowercase query parameters (`"administrativa"`, `"comercial"`). We will update `FilterBar.tsx` to use lowercase values or normalize them to lowercase before calling `conversationsService.list`.

**Q: Do we need to modify TypeScript definitions?**
A: Yes. The `wait_seconds` field is returned inside the `escalation` object by the API, but is not present in `src/types/index.ts`. We will add `wait_seconds?: number` to the `Escalation` interface in `src/types/index.ts` to avoid typecheck compilation issues.

**Q: How should we fetch counts for the filter tabs?**
A: Advisors cannot access `GET /metrics` (admin only). Therefore, we will continue using the existing `refreshCounts` pattern in `BandejaPage.tsx` which calls `conversationsService.list` with a high limit (e.g. `limit: 200`) and no status filter, counting the occurrences of each status locally on the client.

**Q: How does `status=mine` work for admins?**
A: Although the backend supports `status=mine` for admins (returning only conversations assigned to that admin), by business rules the "Mis conversaciones" tab is hidden for admins (they monitor the entire inbox). Thus, the tab will remain visible only to advisors (`role === 'asesor'`).
