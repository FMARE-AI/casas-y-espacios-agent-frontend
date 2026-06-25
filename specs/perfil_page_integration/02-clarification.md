# Clarifications: Perfil Page Integration

## Questions & Answers

**Q1: Should `getMe()` be called on mount if `storeAdvisor` is already populated?**
A: No. Read from `authStore.advisor` directly and skip the fetch. Only fetch if `storeAdvisor` is null (direct navigation).

**Q2: After `updateAvailability`, should we update `authStore.advisor.availability_status` manually?**
A: No manual patch. Call `getMe()` to get the full updated advisor (including `status_until`), then update both local state and `authStore.advisor`. The WS `advisor.status_changed` event updates the sidebar dot independently.

**Q3: `WSAdvisorStatusChanged` only has `advisor_id` and `availability_status` — no `status_until`. How do we refresh `status_until` in the profile?**
A: Call `getMe()` after every successful `updateAvailability()` call. This is the explicit fallback since the WS event carries no `status_until`.

**Q4: How do we parse `status_until` correctly?**
A: Append `-05:00` (Colombia is always UTC-5, no DST) to the naive string before passing to `new Date()`. Then format with `Intl.DateTimeFormat` + `timeZone: "America/Bogota"`.

**Q5: Where does the `INVALID_CURRENT_PASSWORD` error appear in the UI?**
A: Inline below the "Contraseña Actual" input field — as the `error` prop of that `PasswordInput`. Remove the separate paragraph that currently shows `passwordError` below both inputs.

**Q6: What is the correct `selectedMinutes` initial value after profile load?**
A: 
- `availability_status === "available"` → `null`
- `availability_status !== "available"` AND `status_until !== null` → `30` (default timer; exact minutes cannot be back-calculated)
- `availability_status !== "available"` AND `status_until === null` → `null` (indefinite)

**Q7: Is `avatar_url` included in the `PATCH /advisors/me` body?**
A: Yes. The spec includes `avatar_url` as optional. This is already implemented in `updateMe()` and the avatar upload flow — no changes needed there.

**Q8: Does `PATCH /advisors/me/availability` accept `minutes: null` explicitly?**
A: Yes. `minutes` is `integer | null`. Passing `null` (or omitting it) means indefinite. Passing `null` for `available` has no effect since `status_until` is always cleared.

## Open Decisions

None — all decisions resolved by user's spec and `docs/panel_api_reference.md`.
